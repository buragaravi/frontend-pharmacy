import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Bar, Line, Pie, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale
);

// Custom theme with professional color palette
const customTheme = {
  primary: '#0B3861',      // Primary Blue
  secondary: '#64B5F6',    // Accent Blue
  accent: '#1E88E5',      // Hover Blue
  light: '#F5F9FD',       // Light Background Start
  background: '#E1F1FF',  // Light Background End
  success: '#4caf50',     // Success Green
  warning: '#ffc107',     // Warning Yellow
  danger: '#f44336',      // Danger Red
  info: '#64B5F6',        // Info Blue
  text: {
    primary: '#0B3861',    // Primary Text
    secondary: '#64B5F6',  // Secondary Text
    disabled: '#BCE0FD'    // Disabled Text
  }
};

// Status colors with better contrast
const statusColors = {
  safe: '#4caf50',
  warning: '#ffc107',
  caution: '#ff9800',
  alert: '#ff5722',
  critical: '#f44336',
  urgent: '#d32f2f',
  expired: '#9e9e9e',
  allocated: '#64B5F6'
};

// Enhanced theme with gradients
const enhancedTheme = {
  ...customTheme,
  gradients: {
    safe: `linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%)`,
    warning: `linear-gradient(135deg, ${statusColors.warning}20 0%, ${statusColors.warning}10 100%)`,
    caution: `linear-gradient(135deg, ${statusColors.caution}20 0%, ${statusColors.caution}10 100%)`,
    alert: `linear-gradient(135deg, ${statusColors.alert}20 0%, ${statusColors.alert}10 100%)`,
    critical: `linear-gradient(135deg, ${statusColors.critical}20 0%, ${statusColors.critical}10 100%)`,
    expired: `linear-gradient(135deg, ${statusColors.expired}20 0%, ${statusColors.expired}10 100%)`
  },
  borders: {
    safe: '#BCE0FD',
    warning: statusColors.warning,
    caution: statusColors.caution,
    alert: statusColors.alert,
    critical: statusColors.critical,
    expired: statusColors.expired
  }
};

const LabChemicalTable = ({ labId }) => {
  const [liveStock, setLiveStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('chemicalName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [chemicalDialogOpen, setChemicalDialogOpen] = useState(false);
  const [expandedExpiry, setExpandedExpiry] = useState(null);

  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    totalChemicals: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    totalValue: 0,
    criticalItems: 0,
    expiringSoon: 0,
    allocatedItems: 0
  });

  const expiryCategories = useMemo(() => {
    const now = new Date();
    return {
      warning: liveStock.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 30 && daysUntilExpiry <= 60;
      }),
      alert: liveStock.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 14 && daysUntilExpiry <= 30;
      }),
      urgent: liveStock.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
      }),
      expired: liveStock.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 0;
      })
    };
  }, [liveStock]);

  const usefulExpiryKeys = [
    { key: 'warning', label: 'Expiring in 31-60 days', color: 'from-yellow-400 to-yellow-200', icon: '⚠️' },
    { key: 'alert', label: 'Expiring in 15-30 days', color: 'from-orange-500 to-orange-200', icon: '⏰' },
    { key: 'urgent', label: 'Expiring in 1-14 days', color: 'from-red-500 to-red-200', icon: '🔥' },
    { key: 'expired', label: 'Expired', color: 'from-gray-700 to-gray-400', icon: '💀' },
  ];

  const usageData = useMemo(() => {
    const chemicalUsage = {};
    transactions.forEach(tx => {
      const chemName = tx.chemicalName || 'Unknown';
      if (!chemicalUsage[chemName]) {
        chemicalUsage[chemName] = {
          allocated: 0,
          transferred: 0
        };
      }
      switch(tx.transactionType) {
        case 'allocation':
          chemicalUsage[chemName].allocated += tx.quantity;
          break;
        case 'transfer':
          chemicalUsage[chemName].transferred += tx.quantity;
          break;
        default:
          break;
      }
    });
    return chemicalUsage;
  }, [transactions]);

  const filteredStock = useMemo(() => {
    return liveStock
      .filter(item => 
        (item.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.chemicalName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        switch(sortField) {
          case 'quantity':
            return direction * ((a.quantity || 0) - (b.quantity || 0));
          case 'expiryDate':
            return direction * (
              (new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0))
            );
          case 'chemicalName':
            return direction * (
              (a.displayName || a.chemicalName || '').localeCompare(b.displayName || b.chemicalName || '')
            );
          default:
            return 0;
        }
      });
  }, [liveStock, searchTerm, sortField, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stockRes = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/chemicals/live/${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiveStock(stockRes.data);

      const transactionsRes = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/transactions/lab/${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(transactionsRes.data);

      const totalValue = stockRes.data.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
      const criticalItems = stockRes.data.filter(item => item.quantity < 5).length;
      const expiringSoon = stockRes.data.filter(item => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length;
      
      setStats({
        totalChemicals: stockRes.data.length,
        lowStockItems: stockRes.data.filter(item => item.quantity < 10).length,
        recentTransactions: transactionsRes.data.filter(tx => 
          new Date(tx.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        totalValue,
        criticalItems,
        expiringSoon,
        allocatedItems: stockRes.data.filter(item => item.isAllocated).length
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (labId) fetchData();
  }, [labId, token]);

  const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: 'error', severity: 4 };
    if (quantity < threshold * 0.2) return { status: 'Critical', color: 'error', severity: 3 };
    if (quantity < threshold * 0.5) return { status: 'Low', color: 'warning', severity: 2 };
    return { status: 'Adequate', color: 'success', severity: 1 };
  };

  const getExpiryStatus = (expiryDate) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 0) return { status: 'Expired', color: 'error', severity: 4 };
    if (daysUntilExpiry <= 7) return { status: 'Urgent', color: 'error', severity: 3 };
    if (daysUntilExpiry <= 30) return { status: 'Expiring Soon', color: 'warning', severity: 2 };
    return { status: 'Valid', color: 'success', severity: 1 };
  };

  const handleChemicalClick = (chemical) => {
    setSelectedChemical(chemical);
    setChemicalDialogOpen(true);
  };

  const handleCloseChemicalDialog = () => {
    setChemicalDialogOpen(false);
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Chemical Name,Quantity,Unit,Status,Expiry Status,Expiry Date,Allocation Status\n"
      + filteredStock.map(item => {
        const stockStatus = getStockStatus(item.quantity, item.threshold || 10);
        const expiryStatus = getExpiryStatus(item.expiryDate);
        return `"${item.displayName || item.chemicalName}",${item.quantity},${item.unit},${stockStatus.status},${expiryStatus.status},"${new Date(item.expiryDate).toLocaleDateString()}",${item.isAllocated ? 'Allocated' : 'Available'}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chemical_inventory_${labId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const barData = {
    labels: filteredStock.map(item => item.displayName || item.chemicalName),
    datasets: [
      {
        label: 'Quantity',
        data: filteredStock.map(item => item.quantity),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const usageLabels = Object.keys(usageData).slice(0, 10);
  const usageBarData = {
    labels: usageLabels,
    datasets: [
      { label: 'Allocated', data: usageLabels.map(k => usageData[k].allocated), backgroundColor: '#3b82f6' },
      { label: 'Transferred', data: usageLabels.map(k => usageData[k].transferred), backgroundColor: '#22c55e' },
    ],
  };
  const usageRadarData = {
    labels: usageLabels,
    datasets: [
      { label: 'Allocated', data: usageLabels.map(k => usageData[k].allocated), backgroundColor: 'rgba(59,130,246,0.3)', borderColor: '#3b82f6' },
      { label: 'Transferred', data: usageLabels.map(k => usageData[k].transferred), backgroundColor: 'rgba(34,197,94,0.3)', borderColor: '#22c55e' },
    ],
  };

  const expiryPie = {
    labels: ['Valid', 'Expiring Soon', 'Expired'],
    datasets: [{
      data: [
        liveStock.filter(i => {
          const d = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return d > 30;
        }).length,
        liveStock.filter(i => {
          const d = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return d <= 30 && d > 0;
        }).length,
        liveStock.filter(i => {
          const d = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          return d <= 0;
        }).length,
      ],
      backgroundColor: ['#22c55e', '#f59e42', '#ef4444'],
    }],
  };

  const transferOverTime = useMemo(() => {
  const usageByDate = {};
  transactions.forEach(tx => {
    if (tx.transactionType === 'transfer') {
      const date = new Date(tx.timestamp).toLocaleDateString();
      if (!usageByDate[date]) usageByDate[date] = 0;
      usageByDate[date] += tx.quantity;
    }
  });
  const labels = Object.keys(usageByDate).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels,
    datasets: [{
      label: 'Transferred Quantity',
      data: labels.map(l => usageByDate[l]),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.2)',
      fill: true,
    }],
  };
}, [transactions]);

  const topChemicals = Object.entries(usageData)
    .sort((a, b) => (b[1].allocated + b[1].transferred) - (a[1].allocated + a[1].transferred))
    .slice(0, 5);
  const radarData = {
    labels: topChemicals.map(([k]) => k),
    datasets: [
      { label: 'Allocated', data: topChemicals.map(([_, v]) => v.allocated), backgroundColor: 'rgba(59,130,246,0.3)', borderColor: '#3b82f6' },
      { label: 'Transferred', data: topChemicals.map(([_, v]) => v.transferred), backgroundColor: 'rgba(34,197,94,0.3)', borderColor: '#22c55e' },
    ],
  };

  // --- Requests Data for Experiment Allocation/Transfer Visualizations ---
  const [requestData, setRequestData] = useState([]);
  useEffect(() => {
    if (!labId) return;
    axios.get(`https://backend-pharmacy-5541.onrender.com/api/requests/lab/${labId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setRequestData(res.data || []))
      .catch(() => setRequestData([]));
  }, [labId, token]);

  // --- Doughnut: Chemicals Allocated to Experiments ---
  const experimentAllocation = useMemo(() => {
    const chemExpMap = {};
    requestData.forEach(req => {
      req.experiments.forEach(exp => {
        exp.chemicals.forEach(chem => {
          if (!chemExpMap[chem.chemicalName]) chemExpMap[chem.chemicalName] = 0;
          chemExpMap[chem.chemicalName] += chem.allocatedQuantity || 0;
        });
      });
    });
    return {
      labels: Object.keys(chemExpMap),
      datasets: [{
        data: Object.values(chemExpMap),
        backgroundColor: Object.keys(chemExpMap).map((_, i) => `hsl(${(i * 360) / Object.keys(chemExpMap).length}, 70%, 60%)`),
      }],
    };
  }, [requestData]);

  // --- Radar: Chemicals Allocated/Transferred to Experiments ---
  
  const experimentPie = useMemo(() => {
    const usageMap = {};
    requestData.forEach(req => {
      req.experiments.forEach(exp => {
        exp.chemicals.forEach(chem => {
          if (!usageMap[chem.chemicalName]) usageMap[chem.chemicalName] = 0;
          usageMap[chem.chemicalName] += (chem.allocatedQuantity || 0) + (chem.transferredQuantity || 0);
        });
      });
    });
    return {
      labels: Object.keys(usageMap),
      datasets: [{
        data: Object.values(usageMap),
        backgroundColor: Object.keys(usageMap).map((_, i) => `hsl(${(i * 360) / Object.keys(usageMap).length}, 70%, 60%)`)
      }],
    };
  }, [requestData]);

  const experimentRadar = useMemo(() => {
  const chemExpMap = {};
  requestData.forEach(req => {
    req.experiments.forEach(exp => {
      exp.chemicals.forEach(chem => {
        if (!chemExpMap[chem.chemicalName]) chemExpMap[chem.chemicalName] = { allocated: 0, transferred: 0 };
        chemExpMap[chem.chemicalName].allocated += chem.allocatedQuantity || 0;
        chemExpMap[chem.chemicalName].transferred += chem.transferredQuantity || 0;
      });
    });
  });
  const labels = Object.keys(chemExpMap);
  return {
    labels,
    datasets: [
      {
        label: 'Allocated',
        data: labels.map(l => chemExpMap[l].allocated),
        backgroundColor: 'rgba(59,130,246,0.3)',
        borderColor: '#3b82f6',
      },
      {
        label: 'Transferred',
        data: labels.map(l => chemExpMap[l].transferred),
        backgroundColor: 'rgba(34,197,94,0.3)',
        borderColor: '#22c55e',
      },
    ],
  };
}, [requestData]);

  // --- Timeline Chart Data: Allocations and Transfers per Experiment Over Time ---
  const experimentTimelineData = useMemo(() => {
    const expMap = {};
    requestData.forEach(req => {
      req.experiments.forEach(exp => {
        const expName = exp.experimentName || 'Unknown';
        (exp.chemicals || []).forEach(chem => {
          (chem.allocationHistory || []).forEach(hist => {
            if (!hist.date) return;
            const date = new Date(hist.date).toLocaleDateString();
            if (!expMap[expName]) expMap[expName] = {};
            if (!expMap[expName][date]) expMap[expName][date] = { allocated: 0, transferred: 0 };
            expMap[expName][date].allocated += hist.quantity || 0;
          });
        });
      });
    });
    transactions.forEach(tx => {
      if (tx.transactionType === 'transfer') {
        let expName = tx.chemicalName || 'Unknown';
        let txDate = new Date(tx.createdAt).toLocaleDateString();
        if (!expMap[expName]) expMap[expName] = {};
        if (!expMap[expName][txDate]) expMap[expName][txDate] = { allocated: 0, transferred: 0 };
        expMap[expName][txDate].transferred += tx.quantity || 0;
      }
    });
    const allDates = new Set();
    Object.values(expMap).forEach(dateMap => Object.keys(dateMap).forEach(d => allDates.add(d)));
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
    const expNames = Object.keys(expMap);
    const datasets = [];
    expNames.forEach((expName, idx) => {
      datasets.push({
        label: `${expName} (Allocated)` ,
        data: sortedDates.map(date => expMap[expName][date]?.allocated || 0),
        borderColor: `hsl(${(idx * 360) / expNames.length}, 70%, 50%)`,
        backgroundColor: 'transparent',
        tension: 0.3,
        borderDash: [],
      });
      datasets.push({
        label: `${expName} (Transferred)` ,
        data: sortedDates.map(date => expMap[expName][date]?.transferred || 0),
        borderColor: `hsl(${(idx * 360) / expNames.length}, 70%, 80%)`,
        backgroundColor: 'transparent',
        borderDash: [6, 4],
        tension: 0.3,
      });
    });
    return {
      labels: sortedDates,
      datasets,
    };
  }, [requestData, transactions]);

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Usage Over Time Chart (Line) */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center lg:col-span-2">
        <div className="flex items-center mb-2 gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 7h-3m0 0l-3 3m3-3l-3-3" />
          </svg>
          <h2 className="text-lg font-semibold text-green-900">Transfer Over Time</h2>
        </div>
        <div className="w-full h-64"><Line data={transferOverTime} options={{ responsive: true }} /></div>
      </div>
      {/* Experiment Allocation Chart (Doughnut) */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
        <div className="flex items-center mb-2 gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-blue-900">Experiment Allocation (Doughnut)</h2>
        </div>
        <div className="w-full h-64"><Doughnut data={experimentAllocation} options={{ responsive: true }} /></div>
      </div>
      {/* Expiry Status Chart (Pie) */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
        <div className="flex items-center mb-2 gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          </svg>
          <h2 className="text-lg font-semibold text-blue-900">Expiry Status (Pie)</h2>
        </div>
        <div className="w-full h-64"><Pie data={expiryPie} options={{ responsive: true }} /></div>
      </div>
      {/* Quantity by Type (Bar) */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center lg:col-span-2">
        <div className="flex items-center mb-2 gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
          </svg>
          <h2 className="text-lg font-semibold text-blue-900">Quantity by Type (Bar)</h2>
        </div>
        <div className="w-full h-64"><Bar data={barData} options={{ responsive: true }} /></div>
      </div>
      {/* Attribute Comparison (Radar) */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center lg:col-span-2">
        <div className="flex items-center mb-2 gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5-9 5zm0-10V4m0 0L3 9m9-5l9 5" />
          </svg>
          <h2 className="text-lg font-semibold text-blue-900">Attribute Comparison (Radar)</h2>
        </div>
        <div className="w-full h-64"><Radar data={experimentRadar} options={{ responsive: true }} /></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          <p className="mt-4 text-blue-900">Loading chemical inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-200 text-red-800 rounded-lg hover:bg-red-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-[#0B3861] p-2 rounded-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0B3861]">Lab Chemical Inventory</h1>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#F5F9FD] text-[#0B3861] rounded-lg border border-[#BCE0FD] hover:bg-[#BCE0FD] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16m16-8H4" /></svg>
          Refresh
        </button>
      </div>

      {/* Vibrant Expiry Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {usefulExpiryKeys.map(({ key, label, color, icon }) => (
          <div
            key={key}
            className={`rounded-2xl p-5 shadow-xl cursor-pointer bg-gradient-to-br from-[#0B3861] to-[#1E88E5] transition-transform transform hover:scale-105 border-2 border-white relative`}
            onClick={() => setExpandedExpiry(expandedExpiry === key ? null : key)}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{icon}</span>
              <span className="font-bold text-lg text-white drop-shadow-lg">{label}</span>
            </div>
            <div className="text-4xl font-extrabold text-white drop-shadow-lg">{expiryCategories[key]?.length || 0}</div>
            {expandedExpiry === key && (
              <div className="absolute left-0 top-full mt-2 w-full z-20 bg-white rounded-xl shadow-2xl p-4 border border-[#BCE0FD] animate-fade-in">
                <h3 className="text-[#0B3861] font-bold mb-2">{label} Chemicals</h3>
                {expiryCategories[key]?.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto space-y-1">
                    {expiryCategories[key].map(chem => (
                      <li key={chem._id} className="flex justify-between items-center py-1 px-2 rounded hover:bg-[#F5F9FD]">
                        <span className="font-medium text-[#0B3861]">{chem.displayName || chem.chemicalName}</span>
                        <span className="text-xs text-[#64B5F6]">Qty: {chem.quantity} {chem.unit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[#64B5F6]">No chemicals in this category</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="my-8">
        {renderAnalytics()}
      </div>

      <div className="bg-white rounded-xl shadow p-4 border mb-8">
        <h2 className="text-lg font-semibold text-[#0B3861] mb-4">Live Stock</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Search chemicals..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-[#BCE0FD] rounded-lg focus:ring-2 focus:ring-[#64B5F6] focus:border-[#64B5F6]"
          />
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className="px-3 py-2 border border-[#BCE0FD] rounded-lg focus:ring-2 focus:ring-[#64B5F6] focus:border-[#64B5F6]"
            >
              <option value="chemicalName">Name</option>
              <option value="quantity">Quantity</option>
              <option value="expiryDate">Expiry Date</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-[#BCE0FD] rounded-lg bg-[#F5F9FD] hover:bg-[#BCE0FD] text-[#0B3861]"
            >
              {sortDirection === 'asc' ? 'Asc' : 'Desc'}
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-2 border border-[#BCE0FD] rounded-lg bg-[#F5F9FD] hover:bg-[#BCE0FD] text-[#0B3861] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#BCE0FD]">
            <thead className="bg-[#F5F9FD]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Chemical</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Unit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Allocation</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#BCE0FD]">
              {filteredStock.length > 0 ? (
                filteredStock.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(chemical => {
                  const stockStatus = getStockStatus(chemical.quantity, chemical.threshold || 10);
                  const expiryStatus = getExpiryStatus(chemical.expiryDate);
                  return (
                    <tr key={chemical._id} className="hover:bg-[#F5F9FD] cursor-pointer">
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-[#0B3861]">{chemical.displayName || chemical.chemicalName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{chemical.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{chemical.unit}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color === 'success' ? 'bg-green-100 text-green-800' : stockStatus.color === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{stockStatus.status}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expiryStatus.color === 'success' ? 'bg-green-100 text-green-800' : expiryStatus.color === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{expiryStatus.status}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${chemical.isAllocated ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{chemical.isAllocated ? 'Allocated' : 'Available'}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{chemical.updatedAt ? new Date(chemical.updatedAt).toLocaleDateString() : ''}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-[#64B5F6] py-4">No chemicals found matching your search</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-[#0B3861]">
            Showing {Math.min(filteredStock.length, rowsPerPage)} of {filteredStock.length} chemicals
          </div>
          <div className="flex gap-2">
            <button
              onClick={e => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-[#F5F9FD] text-[#0B3861] border border-[#BCE0FD] disabled:opacity-50 hover:bg-[#BCE0FD]"
            >Prev</button>
            <button
              onClick={e => setPage(Math.min(Math.ceil(filteredStock.length / rowsPerPage) - 1, page + 1))}
              disabled={page >= Math.ceil(filteredStock.length / rowsPerPage) - 1}
              className="px-3 py-1 rounded bg-[#F5F9FD] text-[#0B3861] border border-[#BCE0FD] disabled:opacity-50 hover:bg-[#BCE0FD]"
            >Next</button>
          </div>
        </div>
      </div>
      
      {/* Experiment-Based Visualizations Section */}
      <div className="bg-white rounded-xl shadow p-4 border mb-8 mt-12">
        <h2 className="text-lg font-semibold text-[#0B3861] mb-4">Experiment-Based Visualizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-md font-semibold text-blue-900 mb-2">Experiment Attribute Comparison (Radar)</h3>
            <div className="w-full h-64"><Radar data={experimentRadar} options={{ responsive: true }} /></div>
          </div>
          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-md font-semibold text-blue-900 mb-2">Experiment Usage Distribution (Pie)</h3>
            <div className="w-full h-64"><Pie data={experimentPie} options={{ responsive: true }} /></div>
          </div>
        </div>
      </div>

      {chemicalDialogOpen && selectedChemical && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 border border-[#BCE0FD]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0B3861]">Chemical Details</h2>
              <button onClick={handleCloseChemicalDialog} className="text-[#0B3861] hover:text-red-500 text-2xl">&times;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Chemical Name</div>
                <div className="text-base">{selectedChemical.chemicalName}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Display Name</div>
                <div className="text-base">{selectedChemical.displayName || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Quantity</div>
                <div className="text-base">{selectedChemical.quantity} {selectedChemical.unit}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Threshold</div>
                <div className="text-base">{selectedChemical.threshold || 'Not set'} {selectedChemical.unit}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Stock Status</div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockStatus(selectedChemical.quantity, selectedChemical.threshold || 10).color === 'success' ? 'bg-green-100 text-green-800' : getStockStatus(selectedChemical.quantity, selectedChemical.threshold || 10).color === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{getStockStatus(selectedChemical.quantity, selectedChemical.threshold || 10).status}</span>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Expiry Date</div>
                <div className="text-base">{new Date(selectedChemical.expiryDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Expiry Status</div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getExpiryStatus(selectedChemical.expiryDate).color === 'success' ? 'bg-green-100 text-green-800' : getExpiryStatus(selectedChemical.expiryDate).color === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{getExpiryStatus(selectedChemical.expiryDate).status}</span>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Allocation</div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedChemical.isAllocated ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{selectedChemical.isAllocated ? 'Allocated' : 'Available'}</span>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Price Per Unit</div>
                <div className="text-base">₹{selectedChemical.pricePerUnit?.toFixed(2) || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-[#0B3861] font-semibold">Total Value</div>
                <div className="text-base">₹{(selectedChemical.quantity * selectedChemical.pricePerUnit).toFixed(2)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-[#0B3861] font-semibold">Last Updated</div>
                <div className="text-base">{new Date(selectedChemical.updatedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleCloseChemicalDialog} className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabChemicalTable;