import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

const COLORS = ['#0B3861', '#64B5F6', '#1E88E5', '#BCE0FD', '#F5F9FD', '#E1F1FF'];

// SVG Icons
const SearchIcon = () => (
  <svg className="w-5 h-5 text-[#0B3861]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const TransactionIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B3861]"></div>
  </div>
);

const PaginationButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-md mx-1 ${
      active
        ? 'bg-[#0B3861] text-white'
        : 'bg-[#F5F9FD] text-[#64B5F6] hover:bg-[#BCE0FD] hover:text-[#1E88E5] transition-colors'
    }`}
  >
    {children}
  </button>
);

const getDaysArray = (start, end) => {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
};

const getWeeksArray = (start, end) => {
  const arr = [];
  let dt = new Date(start);
  dt.setDate(dt.getDate() - dt.getDay()); // start from Sunday
  while (dt <= end) {
    const weekStart = new Date(dt);
    const weekEnd = new Date(dt);
    weekEnd.setDate(weekEnd.getDate() + 6);
    arr.push({
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd > end ? end : weekEnd),
    });
    dt.setDate(dt.getDate() + 7);
  }
  return arr;
};

const getMonthsArray = (start, end) => {
  const arr = [];
  let dt = new Date(start.getFullYear(), start.getMonth(), 1);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setMonth(dt.getMonth() + 1);
  }
  return arr;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const DEFAULT_DATE_RANGE = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return {
    from: formatDate(d),
    to: formatDate(new Date()),
  };
};

// Download utility for chart containers
const downloadChart = async (id, filename) => {
  const chartNode = document.getElementById(id);
  if (!chartNode) return;
  const canvas = await html2canvas(chartNode, { backgroundColor: null, useCORS: true });
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, filename);
  });
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedLabFilter, setSelectedLabFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState('');
  const [labId, setLabId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE());
  const [globalFilterApplied, setGlobalFilterApplied] = useState(false);

  // Per-graph filters
  const [typeChartRange, setTypeChartRange] = useState('7d');
  const [typeChartLab, setTypeChartLab] = useState('all');
  const [labChartRange, setLabChartRange] = useState('7d');
  const [labChartType, setLabChartType] = useState('all');
  const [labChartChemical, setLabChartChemical] = useState('all');
  const [entryChartRange, setEntryChartRange] = useState('7d');
  const [entryChartChemical, setEntryChartChemical] = useState('all');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Unauthorized: No token found');
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const user = decoded.user;

      setRole(user.role);
      setLabId(user.labId);
      fetchTransactions(user.role, user.labId);
    } catch (err) {
      console.error(err);
      setError('Invalid token');
      setLoading(false);
    }
  }, []);

  const fetchTransactions = async (userRole, userLabId) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = '';

      if (userRole === 'lab_assistant') {
        url = `https://backend-pharmacy-5541.onrender.com/api/transactions/lab/${userLabId}`;
      } else if (userRole === 'admin' || userRole === 'central_lab_admin') {
        url = `https://backend-pharmacy-5541.onrender.com/api/transactions/all`;
      } else {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      const res = await axios.get(url, { headers });
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleLabFilterChange = (labFilter) => {
    setSelectedLabFilter(labFilter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const filterTransactions = () => {
    return transactions.filter((tx) => {
      // Date range filter
      const txDate = new Date(tx.createdAt);
      const inDateRange =
        txDate >= new Date(dateRange.from) && txDate <= new Date(dateRange.to + 'T23:59:59');

      // Search filter
      const name = tx.chemicalName?.toLowerCase() || '';
      const nameMatch = name.includes(searchTerm);

      // Lab filter
      const labMatch =
        selectedLabFilter === 'all' ||
        (selectedLabFilter === 'central' && tx.fromLabId === 'central-lab') ||
        tx.fromLabId === selectedLabFilter ||
        tx.toLabId === selectedLabFilter;

      return inDateRange && nameMatch && labMatch;
    });
  };

  const getTransactionTypeColor = (type) => {
    switch(type.toLowerCase()) {
      case 'allocation': return 'bg-[#F5F9FD] text-[#0B3861] border border-[#BCE0FD]';
      case 'transfer': return 'bg-[#E1F1FF] text-[#0B3861] border border-[#BCE0FD]';
      case 'consumption': return 'bg-[#64B5F6] text-white';
      case 'entry': return 'bg-[#1E88E5] text-white';
      case 'adjustment': return 'bg-[#BCE0FD] text-[#0B3861]';
      default: return 'bg-gray-100 text-[#0B3861]';
    }
  };

  // Get current transactions for pagination
  const filteredTransactions = filterTransactions();
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Date range filter for all graphs and table
  const filteredByDate = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt);
    return txDate >= new Date(dateRange.from) && txDate <= new Date(dateRange.to + 'T23:59:59');
  });

  // Helper to get date range from shortcut
  const getRangeDates = (shortcut) => {
    const to = new Date();
    let from = new Date();
    if (shortcut === '7d') from.setDate(to.getDate() - 6);
    else if (shortcut === '30d') from.setDate(to.getDate() - 29);
    else if (shortcut === '90d') from.setDate(to.getDate() - 89);
    else if (shortcut === 'all') from = new Date(Math.min(...transactions.map(tx => new Date(tx.createdAt))));
    from.setHours(0, 0, 0, 0);
    return { from: formatDate(from), to: formatDate(to) };
  };

  // Per-graph filtered data
  const getFilteredByRange = (range) => {
    const { from, to } = getRangeDates(range);
    return transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= new Date(from) && txDate <= new Date(to + 'T23:59:59');
    });
  };

  // --- Type Chart Data (with lab filter) ---
  const typeChartFiltered = getFilteredByRange(typeChartRange)
    .filter(tx =>
      typeChartLab === 'all'
        ? true
        : tx.fromLabId === typeChartLab || tx.toLabId === typeChartLab
    );
  const typeChartData = (() => {
    const counts = typeChartFiltered.reduce((acc, tx) => {
      acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  })();

  // --- Lab Pie Chart Data (with type and chemical filter) ---
  const labChartFiltered = getFilteredByRange(labChartRange)
    .filter(tx =>
      (labChartType === 'all' ? true : tx.transactionType === labChartType) &&
      (labChartChemical === 'all' ? true : tx.chemicalName === labChartChemical)
    );
  const labChartData = (() => {
    const counts = {};
    labChartFiltered.forEach(tx => {
      const lab = tx.fromLabId || 'Unknown';
      counts[lab] = (counts[lab] || 0) + 1;
    });
    return Object.entries(counts).map(([lab, count]) => ({ lab, count }));
  })();

  // --- Entry Chemicals Chart Data (with chemical filter) ---
  const entryChartFiltered = getFilteredByRange(entryChartRange)
    .filter(tx => tx.transactionType === 'entry' && (entryChartChemical === 'all' ? true : tx.chemicalName === entryChartChemical));
  const entryFromDate = new Date(getRangeDates(entryChartRange).from);
  const entryToDate = new Date(getRangeDates(entryChartRange).to);
  const entryDiffDays = Math.ceil((entryToDate - entryFromDate) / (1000 * 60 * 60 * 24)) + 1;

  let entryChemicalsGraphData = [];
  let entryXAxisKey = 'date';
  if (entryDiffDays >= 60) {
    entryXAxisKey = 'month';
    const months = getMonthsArray(entryFromDate, entryToDate);
    entryChemicalsGraphData = months.map(monthDate => {
      const monthStr = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const quantity = entryChartFiltered
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate.getFullYear() === monthDate.getFullYear() && txDate.getMonth() === monthDate.getMonth();
        })
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { month: monthStr, quantity: Math.round(quantity) };
    });
  } else if (entryDiffDays >= 14) {
    entryXAxisKey = 'week';
    const weeks = getWeeksArray(entryFromDate, entryToDate);
    entryChemicalsGraphData = weeks.map(({ weekStart, weekEnd }) => {
      const weekStr = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      const quantity = entryChartFiltered
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= weekStart && txDate <= weekEnd;
        })
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { week: weekStr, quantity: Math.round(quantity) };
    });
  } else {
    entryXAxisKey = 'date';
    const daysArr = getDaysArray(entryFromDate, entryToDate);
    entryChemicalsGraphData = daysArr.map(dayDate => {
      const dateStr = dayDate.toLocaleDateString();
      const quantity = entryChartFiltered
        .filter(tx => new Date(tx.createdAt).toLocaleDateString() === dateStr)
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { date: dateStr, quantity: Math.round(quantity) };
    });
  }

  // --- Analytics Data (filtered) ---
  // 1. Transactions per type
  const typeCounts = filteredByDate.reduce((acc, tx) => {
    acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  // 2. Transactions per day (last 14 days)
  const days = {};
  filteredByDate.forEach(tx => {
    const day = new Date(tx.createdAt).toLocaleDateString();
    days[day] = (days[day] || 0) + 1;
  });
  const dayData = Object.entries(days).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // 3. Top chemicals
  const chemCounts = {};
  filteredByDate.forEach(tx => {
    chemCounts[tx.chemicalName] = (chemCounts[tx.chemicalName] || 0) + 1;
  });
  const topChemicals = Object.entries(chemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Pie: Distribution by lab
  const labCounts = {};
  filteredByDate.forEach(tx => {
    const lab = tx.fromLabId || 'Unknown';
    labCounts[lab] = (labCounts[lab] || 0) + 1;
  });
  const labData = Object.entries(labCounts).map(([lab, count]) => ({ lab, count }));

  // --- Donut Chart Data for Lab Allocations (only for admin/central_lab_admin) ---
  // 1. Lab Allocation Quantities
  const labAllocationQuantities = {};
  filteredByDate.forEach(tx => {
    if (['allocation', 'transfer'].includes(tx.transactionType)) {
      const lab = tx.toLabId || 'Unknown';
      labAllocationQuantities[lab] = (labAllocationQuantities[lab] || 0) + Number(tx.quantity || 0);
    }
  });
  const labAllocationData = Object.entries(labAllocationQuantities).map(([lab, quantity]) => ({
    lab,
    quantity: Math.round(quantity),
  }));

  // 2. Chemical Allocation per Lab (nested donut: outer = lab, inner = chemical)
  const [selectedDonutLab, setSelectedDonutLab] = useState(labAllocationData[0]?.lab || '');
  useEffect(() => {
    if (labAllocationData.length && !selectedDonutLab) {
      setSelectedDonutLab(labAllocationData[0].lab);
    }
  }, [labAllocationData, selectedDonutLab]);

  const chemicalAllocationForLab = {};
  filteredByDate.forEach(tx => {
    if (
      ['allocation', 'transfer'].includes(tx.transactionType) &&
      tx.toLabId === selectedDonutLab
    ) {
      const chem = tx.chemicalName || 'Unknown';
      chemicalAllocationForLab[chem] = (chemicalAllocationForLab[chem] || 0) + Number(tx.quantity || 0);
    }
  });
  const chemicalAllocationData = Object.entries(chemicalAllocationForLab).map(([chem, quantity]) => ({
    chem,
    quantity: Math.round(quantity),
  }));

  // --- Entry Chemicals Graph Data (dynamic granularity) ---
  const entryTxs = filteredByDate.filter(tx => tx.transactionType === 'entry');
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const diffDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;


  if (diffDays >= 60) {
    // Monthly
    entryXAxisKey = 'month';
    const months = getMonthsArray(fromDate, toDate);
    entryChemicalsGraphData = months.map(monthDate => {
      const monthStr = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const quantity = entryTxs
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate.getFullYear() === monthDate.getFullYear() && txDate.getMonth() === monthDate.getMonth();
        })
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { month: monthStr, quantity: Math.round(quantity) };
    });
  } else if (diffDays >= 14) {
    // Weekly
    entryXAxisKey = 'week';
    const weeks = getWeeksArray(fromDate, toDate);
    entryChemicalsGraphData = weeks.map(({ weekStart, weekEnd }) => {
      const weekStr = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      const quantity = entryTxs
        .filter(tx => {
          const txDate = new Date(tx.createdAt);
          return txDate >= weekStart && txDate <= weekEnd;
        })
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { week: weekStr, quantity: Math.round(quantity) };
    });
  } else {
    // Daily (default)
    entryXAxisKey = 'date';
    const daysArr = getDaysArray(fromDate, toDate);
    entryChemicalsGraphData = daysArr.map(dayDate => {
      const dateStr = dayDate.toLocaleDateString();
      const quantity = entryTxs
        .filter(tx => new Date(tx.createdAt).toLocaleDateString() === dateStr)
        .reduce((sum, tx) => sum + Number(tx.quantity || 0), 0);
      return { date: dateStr, quantity: Math.round(quantity) };
    });
  }

  // --- Summary ---
  const totalTransactions = filteredByDate.length;
  const totalQuantity = Math.round(
    filteredByDate
      .filter(tx => tx.transactionType !== 'entry')
      .reduce((sum, tx) => sum + (Number(tx.quantity) || 0), 0)
  );
  const mostActiveLab = (role === 'admin' || role === 'central_lab_admin')
    ? (labData.sort((a, b) => b.count - a.count)[0]?.lab || '-')
    : null;

  // --- Dropdown options ---
  const allLabs = Array.from(
    new Set(transactions.flatMap(tx => [tx.fromLabId, tx.toLabId]).filter(Boolean))
  );
  const allChemicals = Array.from(new Set(transactions.map(tx => tx.chemicalName).filter(Boolean)));
  const allTypes = Array.from(new Set(transactions.map(tx => tx.transactionType)));

  // --- UI: Global Date Range Filter with Apply/Reset ---
  const handleApplyGlobalFilter = () => {
    setGlobalFilterApplied(true);
    setCurrentPage(1);
  };
  const handleResetGlobalFilter = () => {
    setDateRange(DEFAULT_DATE_RANGE());
    setGlobalFilterApplied(false);
    setCurrentPage(1);
  };

  // Unique IDs for each chart for download
  const typeChartId = "type-chart";
  const labChartId = "lab-chart";
  const entryChartId = "entry-chemicals-chart";
  const allocationLabChartId = "allocation-lab-donut";
  const allocationChemChartId = "allocation-chem-donut";

  return (
    <div className="p-2 sm:p-4 md:p-8 bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
      <div className="mx-auto">
        {/* Global Date Range Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">          <div className="flex items-center gap-2">
            <label className="font-semibold text-[#0B3861]">From:</label>
            <input
              type="date"
              value={dateRange.from}
              max={dateRange.to}
              onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
              className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] bg-[#F5F9FD]"
            />
          </div>          <div className="flex items-center gap-2">
            <label className="font-semibold text-[#0B3861]">To:</label>
            <input              type="date"
              value={dateRange.to}
              min={dateRange.from}
              max={formatDate(new Date())}
              onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
              className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] bg-[#F5F9FD]"
            />
          </div>          <button            className={`px-4 py-1 rounded font-semibold shadow transition ${
              globalFilterApplied 
                ? 'bg-[#64B5F6] text-white hover:bg-[#1E88E5]' 
                : 'bg-[#0B3861] text-white hover:bg-[#1E88E5]'
            }`}
            onClick={handleApplyGlobalFilter}
            disabled={globalFilterApplied}
          >
            Apply
          </button>
          {globalFilterApplied && (
            <button
              className="bg-[#F5F9FD] text-[#0B3861] px-4 py-1 rounded font-semibold shadow border border-[#BCE0FD] hover:bg-[#E1F1FF] transition"
              onClick={handleResetGlobalFilter}
            >
              Reset
            </button>
          )}
        </div>        {/* Summary Cards */}
        <div className={`mb-8 grid grid-cols-1 sm:grid-cols-2 ${role === 'admin' || role === 'central_lab_admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4 md:gap-6`}>
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-[#0B3861] flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold text-[#0B3861]">{totalTransactions}</span>
            <span className="text-[#0B3861] font-semibold mt-2 text-center text-sm md:text-base">Total Transactions</span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-[#64B5F6] flex flex-col items-center">            <span className="text-3xl md:text-4xl font-bold text-[#64B5F6]">{totalQuantity}</span>
            <span className="text-[#64B5F6] font-semibold mt-2 text-center text-sm md:text-base">Total Drugs Moved</span>
          </div>
          {(role === 'admin' || role === 'central_lab_admin') && (
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-[#1E88E5] flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-[#1E88E5]">{mostActiveLab}</span>
              <span className="text-[#1E88E5] font-semibold mt-2 text-center text-sm md:text-base">Most Active Lab</span>
            </div>
          )}
        </div>

        {/* Charts with per-graph filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
          {/* Bar Chart: Transactions by Type */}
          <div
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1] flex flex-col overflow-x-auto"
            id={typeChartId}
            style={{ minWidth: 0 }}
          >
            <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
              <h3 className="text-base md:text-lg font-bold text-[#0B3861]">Transactions by Type</h3>
              <div className="flex gap-2 items-center">
                <select
                  value={typeChartLab}                  onChange={e => setTypeChartLab(e.target.value)}
                  className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] text-xs bg-[#F5F9FD]"
                >
                  <option value="all">All Labs</option>
                  {allLabs.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
                <select
                  value={typeChartRange}
                  onChange={e => setTypeChartRange(e.target.value)}
                  className="border border-[#E8D8E1] rounded px-2 py-1 text-[#0B3861] text-xs"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All Time</option>
                </select>
                <button                  className="ml-2 px-2 py-1 rounded bg-[#0B3861] text-white text-xs hover:bg-[#1E88E5] transition"
                  onClick={() => downloadChart(typeChartId, "transactions_by_type.png")}
                  title="Download chart"
                >
                  ⬇️
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[200px] min-w-[320px]">
              <ResponsiveContainer width="100%" height={250} minWidth={320}>
                <BarChart data={typeChartData}>
                  <XAxis dataKey="type" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E88E5">ResponsiveContainer
                    {typeChartData.map((entry, idx) => (
                      <Cell key={entry.type} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Pie Chart: Distribution by Lab */}
          <div
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1] flex flex-col overflow-x-auto"
            id={labChartId}
            style={{ minWidth: 0 }}
          >
            <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
              <h3 className="text-base md:text-lg font-bold text-[#1E88E5]">Distribution by Lab</h3>
              <div className="flex gap-2 items-center">
                <select
                  value={labChartType}                  onChange={e => setLabChartType(e.target.value)}
                  className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] text-xs bg-[#F5F9FD]"
                >
                  <option value="all">All Types</option>
                  {allTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={labChartChemical}                  onChange={e => setLabChartChemical(e.target.value)}
                  className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] text-xs bg-[#F5F9FD]"
                >
                  <option value="all">All Chemicals</option>
                  {allChemicals.map(chem => (
                    <option key={chem} value={chem}>{chem}</option>
                  ))}
                </select>
                <select
                  value={labChartRange}
                  onChange={e => setLabChartRange(e.target.value)}
                  className="border border-[#E8D8E1] rounded px-2 py-1 text-[#1E88E5] text-xs"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All Time</option>
                </select>
                <button                  className="ml-2 px-2 py-1 rounded bg-[#0B3861] text-white text-xs hover:bg-[#1E88E5] transition"
                  onClick={() => downloadChart(labChartId, "distribution_by_lab.png")}
                  title="Download chart"
                >
                  ⬇️
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[200px] min-w-[320px]">
              <ResponsiveContainer width="100%" height={250} minWidth={320}>
                <PieChart>
                  <Pie
                    data={labChartData}
                    dataKey="count"
                    nameKey="lab"ResponsiveContainer
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {labChartData.map((entry, idx) => (
                      <Cell key={entry.lab} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Entry Chemicals Graph with chemical filter */}


        {(role === 'admin' || role === 'central_lab_admin') && (
          <div
            className="mb-8 bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1] flex flex-col overflow-x-auto"
            id={entryChartId}
            style={{ minWidth: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h3 className="text-base md:text-lg font-bold text-[#1E88E5]">
                Entry Chemicals ({entryXAxisKey === 'month' ? 'Monthly' : entryXAxisKey === 'week' ? 'Weekly' : 'Daily'})
              </h3>
              <div className="flex gap-2 items-center">
                <select
                  value={entryChartChemical}                  onChange={e => setEntryChartChemical(e.target.value)}
                  className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] text-xs bg-[#F5F9FD]"
                >
                  <option value="all">All Chemicals</option>
                  {allChemicals.map(chem => (
                    <option key={chem} value={chem}>{chem}</option>
                  ))}
                </select>
                <select
                  value={entryChartRange}                  onChange={e => setEntryChartRange(e.target.value)}
                  className="border border-[#BCE0FD] rounded px-2 py-1 text-[#0B3861] text-xs bg-[#F5F9FD]"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All Time</option>
                </select>
                <button                  className="ml-2 px-2 py-1 rounded bg-[#0B3861] text-white text-xs hover:bg-[#1E88E5] transition"
                  onClick={() => downloadChart(entryChartId, "entry_chemicals.png")}
                  title="Download chart"
                >
                  ⬇️
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[200px] min-w-[320px]">
              <ResponsiveContainer width="100%" height={250} minWidth={320}>
                <BarChart data={entryChemicalsGraphData}>
                  <XAxis dataKey={entryXAxisKey} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#3B82F6" />ResponsiveContainer
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Donut Charts for Allocation (only for admin/central_lab_admin) */}
        {(role === 'admin' || role === 'central_lab_admin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
            {/* Donut: Allocation by Lab */}
            <div
              className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1] flex flex-col overflow-x-auto"
              id={allocationLabChartId}
              style={{ minWidth: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base md:text-lg font-bold text-[#1E88E5]">Allocated Quantity by Lab</h3>
                <button                  className="ml-2 px-2 py-1 rounded bg-[#0B3861] text-white text-xs hover:bg-[#1E88E5] transition"
                  onClick={() => downloadChart(allocationLabChartId, "allocated_quantity_by_lab.png")}
                  title="Download chart"
                >
                  ⬇️
                </button>
              </div>
              <div className="flex-1 min-h-[320px] min-w-[320px]">
                <ResponsiveContainer width="100%" height={400} minWidth={320}>
                  <PieChart>
                    <Pie
                      data={labAllocationData.filter(entry => entry.lab && entry.lab.toLowerCase() !== 'faculty')}
                      dataKey="quantity"
                      nameKey="lab"
                      cx="50%"
                      cy="50%"  
                      innerRadius={70}
                      outerRadius={140}
                      label
                      onClick={(_, idx) => {
                        // Filtered index for correct lab selection
                        const filteredLabs = labAllocationData.filter(entry => entry.lab && entry.lab.toLowerCase() !== 'faculty');
                        setSelectedDonutLab(filteredLabs[idx]?.lab);
                      }}
                    >
                      {labAllocationData
                        .filter(entry => entry.lab && entry.lab.toLowerCase() !== 'faculty')
                        .map((entry, idx) => (
                          <Cell key={entry.lab} fill={COLORS[idx % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-[#1E88E5] text-center">
                Click on a lab segment to see its chemical breakdown.
              </div>
            </div>
            {/* Donut: Chemicals Allocated to Selected Lab */}
            <div
              className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1] flex flex-col overflow-x-auto"
              id={allocationChemChartId}
              style={{ minWidth: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base md:text-lg font-bold text-[#1E88E5]">
                  Chemicals Allocated to <span className="text-[#3B82F6]">{selectedDonutLab}</span>
                </h3>
                <button                  className="ml-2 px-2 py-1 rounded bg-[#0B3861] text-white text-xs hover:bg-[#1E88E5] transition"
                  onClick={() => downloadChart(allocationChemChartId, `chemicals_allocated_to_${selectedDonutLab}.png`)}
                  title="Download chart"
                >
                  ⬇️
                </button>
              </div>
              <div className="flex-1 min-h-[320px] min-w-[320px]">
                {chemicalAllocationData.length === 0 ? (
                  <div className="text-[#1E88E5] text-center">No allocations for this lab.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400} minWidth={320}>
                    <PieChart>
                      <Pie
                        data={chemicalAllocationData}
                        dataKey="quantity"
                        nameKey="chem"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={140}
                        label
                      >
                        {chemicalAllocationData.map((entry, idx) => (
                          <Cell key={entry.chem} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table & Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-[#E8D8E1]">
          <div className="flex flex-col md:flex-row items-start md:items-center mb-6 gap-4">              <div className="relative w-full md:w-1/3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search by chemical name..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E88E5] text-[#0B3861] text-sm bg-[#F5F9FD]"
                />
            </div>
            {(role === 'admin' || role === 'central_lab_admin') && (
              <div className="flex flex-wrap gap-2">
                <button                  onClick={() => handleLabFilterChange('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                    selectedLabFilter === 'all'
                      ? 'bg-[#0B3861] text-white'
                      : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD] border border-[#BCE0FD]'
                  }`}
                >
                  All Labs
                </button>
                <button
                  onClick={() => handleLabFilterChange('central')}
                  className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                    selectedLabFilter === 'central'
                      ? 'bg-[#0B3861] text-white'
                      : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD] border border-[#BCE0FD]'
                  }`}
                >
                  Central Lab
                </button>
                {[...Array(8)].map((_, i) => {
                  const lab = `LAB0${i + 1}`;
                  return (
                    <button
                      key={lab}
                      onClick={() => handleLabFilterChange(lab)}                  className={`px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors ${
                    selectedLabFilter === lab
                      ? 'bg-[#0B3861] text-white'
                      : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD] border border-[#BCE0FD]'
                  }`}
                    >
                      {lab}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction Count */}
          <div className="mb-4 text-xs md:text-sm text-[#1E88E5]">
            Showing {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>

          {/* Table */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-[#F9F3F7] p-8 rounded-xl border border-[#E8D8E1] text-center">
              <p className="text-[#1E88E5]">No transactions found</p>
            </div>
          ) : (
            <>
        <div className="overflow-x-auto rounded-xl border border-[#BCE0FD] mb-4">
                <table className="min-w-full text-xs md:text-sm">
                  <thead className="bg-[#F5F9FD]">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">Chemical</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">Quantity</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">Unit</th>                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">Type</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">From Lab</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">To Lab</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">By</th>
                      <th className="px-4 md:px-6 py-3 text-left font-semibold text-[#0B3861]">Date</th>
                    </tr>
                  </thead>                  <tbody className="divide-y divide-[#BCE0FD]">
                    {currentTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-[#F5F9FD]">
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">
                          {tx.chemicalName || (
                            <span className="flex items-center">
                              <span className="text-[#64B5F6] italic">Unnamed Chemical</span>
                              <span className="ml-2 px-2 py-1 text-xs bg-[#F5F9FD] text-[#0B3861] border border-[#BCE0FD] rounded-full">
                                Missing
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">{parseInt(tx.quantity)}</td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">{tx.unit}</td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.transactionType)}`}>
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">
                          {tx.fromLabId === 'central-lab' ? (
                            <span className="font-medium">Central Lab</span>
                          ) : tx.fromLabId || '-'}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">
                          {tx.toLabId === 'central-lab' ? (
                            <span className="font-medium">Central Lab</span>
                          ) : tx.toLabId || '-'}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">{tx.createdBy?.name || 'N/A'}</td>
                        <td className="px-4 md:px-6 py-4 text-[#0B3861]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-1 flex-wrap">
                    <PaginationButton
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                    >
                      «
                    </PaginationButton>
                    
                    <PaginationButton
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </PaginationButton>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationButton
                          key={pageNum}
                          active={currentPage === pageNum}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </PaginationButton>
                      );
                    })}

                    <PaginationButton
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </PaginationButton>
                    
                    <PaginationButton
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </PaginationButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;