import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Line, Radar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Dialog } from '@headlessui/react';
import { ChartBarIcon, ChartPieIcon, ChevronDownIcon, TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

const CentralChemicalTable = () => {
  const [view, setView] = useState('live');
  const [allLabData, setAllLabData] = useState([]);
  const [centralData, setCentralData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('chemicalName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [timeRange, setTimeRange] = useState('7days');
  const [stats, setStats] = useState({
    totalChemicals: 0,
    totalQuantity: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalLabs: 0,
    activeLabs: 0,
    totalValue: 0,
  });
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [visualizationType, setVisualizationType] = useState('bar');
  const [selectedLab, setSelectedLab] = useState(null);
  const [labDetailsOpen, setLabDetailsOpen] = useState(false);  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [visualizationTab, setVisualizationTab] = useState(0);
  const [labStats, setLabStats] = useState({});
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeStats: true,
    includeDetails: true,
    format: 'pdf',
    dateRange: true,
    open: false,
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    quantityRange: [0, 1000],
    expiryRange: [0, 365],
    includeExpired: false,
    includeLowStock: true,
    stockThreshold: 20,
  });
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [chemicalDetails, setChemicalDetails] = useState([]);
  const [loadingChemicals, setLoadingChemicals] = useState(false);
  const [chemicalError, setChemicalError] = useState(null);
  const [labDistribution, setLabDistribution] = useState([]);
  const [labDistributionView, setLabDistributionView] = useState('bar');
  const [isLabDistributionLoading, setIsLabDistributionLoading] = useState(false);
  const [showQuantity, setShowQuantity] = useState(true);
  const [showExpiring, setShowExpiring] = useState(false);

  const token = localStorage.getItem('token');
  const LAB_IDS = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

  // Add fetch function
  const fetchChemicalDetails = async () => {
    try {
      setLoadingChemicals(true);
      setChemicalError(null);
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChemicalDetails(response.data || []);
    } catch (error) {
      console.error('Error fetching chemical details:', error);
      setChemicalError(error.message || 'Failed to fetch chemical details');
      setChemicalDetails([]);
    } finally {
      setLoadingChemicals(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchChemicalDetails();
    fetchLabDistribution();
  }, [token]);

  useEffect(() => {
    if (showHistoricalData) {
      fetchHistoricalData();
    }
  }, [showHistoricalData]);

  useEffect(() => {
    if (selectedLab) {
      fetchLabDetails(selectedLab);
    }
  }, [selectedLab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Central Store data
      const centralRes = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch data from all labs
      const labPromises = LAB_IDS.map(labId => 
        axios.get(`https://backend-pharmacy-5541.onrender.com/api/chemicals/live/${labId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const labResponses = await Promise.all(labPromises);
      const labData = labResponses.map((response, index) => ({
        ...response.data,
        labId: LAB_IDS[index]
      }));

      // Process and combine the data
      const combinedData = processAndCombineData(centralRes.data, labData);
      
      setCentralData(centralRes.data);
      setAllLabData(labData);
      calculateStats(combinedData);
    } catch (err) {
      console.error('Failed to fetch chemical data:', err);
      setError('Failed to load chemical data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabDistribution = async () => {
    setIsLabDistributionLoading(true);
    try {
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/distribution', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we have valid data before setting it
      if (response.data && Array.isArray(response.data)) {
        // Transform the data if needed
        const processedData = response.data.map(lab => ({
          ...lab,
          labId: lab.labId || 'unknown',
          totalChemicals: lab.totalChemicals || 0,
          totalQuantity: lab.totalQuantity || 0,
          totalValue: lab.totalValue || 0,
          expiringCount: lab.expiringCount || 0,
          chemicals: Array.isArray(lab.chemicals) ? lab.chemicals : []
        }));
        setLabDistribution(processedData);
      } else {
        console.error('Invalid distribution data structure:', response.data);
        setError('Invalid data received from server');
      }
    } catch (error) {
      console.error('Error fetching lab distribution:', error.response || error);
      setError(error.response?.data?.message || 'Failed to fetch lab distribution data');
    } finally {
      setIsLabDistributionLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) {
      return {
        status: 'Unknown',
        style: 'bg-gray-100 text-gray-800',
        label: 'No expiry date'
      };
    }
  
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    try {
      if (days <= 0) {
        return { 
          status: 'Expired', 
          style: 'bg-red-100 text-red-800',
          label: 'Expired'
        };
      }
      if (days <= 30) {
        return { 
          status: 'Critical', 
          style: 'bg-red-500 text-white',
          label: `Expires in ${days} days`
        };
      }
      if (days <= 60) {
        return { 
          status: 'Warning', 
          style: 'bg-yellow-500 text-white',
          label: `Warning (${days} days left)`
        };
      }
      if (days <= 90) {
        return { 
          status: 'Attention', 
          style: 'bg-orange-500 text-white',
          label: `Attention (${days} days left)`
        };
      }
      return { 
        status: 'Good', 
        style: 'bg-green-100 text-green-800',
        label: `Good (${days} days left)`
      };
    } catch (error) {
      console.error('Error calculating expiry status:', error);
      return {
        status: 'Error',
        style: 'bg-gray-100 text-gray-800',
        label: 'Invalid date'
      };
    }
  };

  const processAndCombineData = (centralData, labData) => {
    const chemicalMap = new Map();
  
    try {
      // Process Central Store data first
      if (Array.isArray(centralData)) {
        centralData.forEach(chem => {
          if (chem && chem.chemicalName) {
            chemicalMap.set(chem.chemicalName.toLowerCase(), {
              chemicalName: chem.chemicalName,
              totalQuantity: Number(chem.quantity) || 0,
              unit: chem.unit || 'N/A',
              expiryDate: chem.expiryDate,
              labDistribution: { 'central-store': Number(chem.quantity) || 0 },
              threshold: Number(chem.threshold) || 10,
              category: chem.category || 'Uncategorized',
              supplier: chem.supplier || 'Unknown',
              lastUpdated: chem.lastUpdated || new Date().toISOString(),
            });
          }
        });
      }
  
      // Process individual lab data
      labData.forEach(lab => {
        if (!lab || !lab.labId) return;
  
        // Convert lab data to array if it's not already
        const labChemicals = Array.isArray(lab) 
          ? lab 
          : Object.values(lab).filter(item => item && typeof item === 'object' && item.displayName);
        
        labChemicals.forEach(chem => {
          if (chem && chem.displayName) {
            const chemicalName = chem.displayName.toLowerCase();
            const existing = chemicalMap.get(chemicalName);
            const quantity = Number(chem.originalQuantity) || 0;
  
            if (existing) {
              // Update existing chemical
              existing.totalQuantity = (existing.totalQuantity || 0) + quantity;
              existing.labDistribution[lab.labId] = (existing.labDistribution[lab.labId] || 0) + quantity;
              
              // Update other properties if they're missing
              if (!existing.unit && chem.unit) existing.unit = chem.unit;
              if (!existing.expiryDate && chem.expiryDate) existing.expiryDate = chem.expiryDate;
              if (!existing.threshold && chem.threshold) existing.threshold = Number(chem.threshold);
              if (!existing.category && chem.category) existing.category = chem.category;
              if (!existing.supplier && chem.supplier) existing.supplier = chem.supplier;
              if (!existing.lastUpdated && chem.lastUpdated) existing.lastUpdated = chem.lastUpdated;
            }
          }
        });
      });
  
      // Convert map to array and add status information
      return Array.from(chemicalMap.values()).map(chem => ({
        ...chem,
        status: getStockStatus(chem.totalQuantity, chem.threshold),
        expiryStatus: getExpiryStatus(chem.expiryDate),
        lowStockPercentage: chem.threshold ? (chem.totalQuantity / chem.threshold) * 100 : 100,
        daysUntilExpiry: chem.expiryDate ? 
          Math.ceil((new Date(chem.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
          null
      }));
    } catch (error) {
      console.error('Error processing chemical data:', error);
      return [];
    }
  };

  const calculateStats = (combinedData) => {
    const stats = {
      totalChemicals: combinedData.length,
      totalQuantity: combinedData.reduce((sum, chem) => sum + chem.totalQuantity, 0),
      lowStockItems: combinedData.filter(chem => {
        const threshold = chem.threshold || 10;
        return chem.totalQuantity < threshold;
      }).length,
      expiringSoon: combinedData.filter(chem => {
        if (!chem.expiryDate) return false;
        const daysUntilExpiry = Math.ceil((new Date(chem.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      }).length,
      totalLabs: new Set(combinedData.flatMap(chem => Object.keys(chem.labDistribution))).size,
      labDistribution: {},
      categoryDistribution: {},
      supplierDistribution: {},
    };

    // Calculate lab distribution
    combinedData.forEach(chem => {
      Object.entries(chem.labDistribution).forEach(([labId, quantity]) => {
        stats.labDistribution[labId] = (stats.labDistribution[labId] || 0) + quantity;
      });
    });

    // Calculate category distribution
    combinedData.forEach(chem => {
      stats.categoryDistribution[chem.category] = (stats.categoryDistribution[chem.category] || 0) + chem.totalQuantity;
    });

    // Calculate supplier distribution
    combinedData.forEach(chem => {
      stats.supplierDistribution[chem.supplier] = (stats.supplierDistribution[chem.supplier] || 0) + chem.totalQuantity;
    });

    setStats(stats);
  };

  const getAggregatedData = () => {
    let data = processAndCombineData(centralData, allLabData);

    // Apply advanced filters if they are open
    if (advancedFiltersOpen) {
      data = data.filter(chem => {
        // Filter by quantity range
        const quantity = Number(chem.totalQuantity) || 0;
        if (quantity < advancedFilters.quantityRange[0] || 
            quantity > advancedFilters.quantityRange[1]) {
          return false;
        }

        // Filter by expiry range
        if (chem.expiryDate) {
          const daysUntilExpiry = moment(chem.expiryDate).diff(moment(), 'days');
          
          if (daysUntilExpiry < advancedFilters.expiryRange[0] || 
              daysUntilExpiry > advancedFilters.expiryRange[1]) {
            return false;
          }

          // Filter expired items unless specifically included
          if (!advancedFilters.includeExpired && daysUntilExpiry <= 0) {
            return false;
          }
        }

        // Filter by stock level
        const threshold = chem.threshold || 10;
        const stockPercentage = (quantity / threshold) * 100;
        if (advancedFilters.includeLowStock && stockPercentage > advancedFilters.stockThreshold) {
          return false;
        }

        return true;
      });
    }

    return data;
  };

  const getStockStatus = (quantity, threshold = 10) => {
    if (quantity <= 0) return { label: 'Out of Stock', color: 'error' };
    if (quantity < threshold) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoricalData(response.data);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      setError('Failed to load historical data');
    }
  };

  const handleLabFilter = (event) => {
    const { value } = event.target;
    setSelectedLabs(value);
  };

  const exportWithOptions = () => {
    const data = getAggregatedData();
    
    switch (exportOptions.format) {
      case 'pdf':
        exportToPDF();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
      default:
        exportToCSV();
    }
    
    // Close the export options dialog
    setExportOptions({ ...exportOptions, open: false });
  };

  const exportToCSV = () => {
    const data = getAggregatedData();
    const headers = ['Chemical Name', 'Total Quantity', 'Unit', 'Stock Status', 'Expiry Status', 'Lab Distribution'];
    const csvContent = [
      headers.join(','),
      ...data.map(chem => [
        chem.chemicalName,
        chem.totalQuantity,
        chem.unit,
        chem.status.label,
        chem.expiryStatus.label,
        Object.entries(chem.labDistribution)
          .map(([lab, qty]) => `${lab}: ${qty}`)
          .join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chemical-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    const data = getAggregatedData();
    
    doc.text('Chemical Inventory Report', 14, 15);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    
    const tableData = data.map(chem => [
      chem.chemicalName,
      chem.totalQuantity,
      chem.unit,
      chem.status.label,
      chem.expiryStatus.label,
      Object.entries(chem.labDistribution)
        .map(([lab, qty]) => `${lab}: ${qty}`)
        .join('; ')
    ]);

    doc.autoTable({
      head: [['Chemical Name', 'Quantity', 'Unit', 'Status', 'Expiry Status', 'Lab Distribution']],
      body: tableData,
      startY: 35
    });

    doc.save(`chemical-inventory-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  const exportToExcel = () => {
    const data = getAggregatedData();
    const ws = XLSX.utils.json_to_sheet(data.map(chem => ({
      'Chemical Name': chem.chemicalName,
      'Total Quantity': chem.totalQuantity,
      'Unit': chem.unit,
      'Status': chem.status.label,
      'Expiry Status': chem.expiryStatus.label,
      'Lab Distribution': Object.entries(chem.labDistribution)
        .map(([lab, qty]) => `${lab}: ${qty}`)
        .join('; ')
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chemical Inventory');
    XLSX.writeFile(wb, `chemical-inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fetchLabDetails = async (labId) => {
    try {
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/chemicals/live/${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabStats(response.data);
    } catch (err) {
      console.error('Failed to fetch lab details:', err);
    }
  };

  const getChartData = () => {
    return {
      labels: labDistribution.map(lab => 
        lab.labId === 'central-store' ? 'Central Lab' : lab.labId
      ),
      datasets: [
        showQuantity && {
          label: 'Total Quantity',
          data: labDistribution.map(lab => lab.totalQuantity),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          yAxisID: 'quantity'
        },
        {
          label: 'Total Chemicals',
          data: labDistribution.map(lab => lab.totalChemicals),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          yAxisID: 'quantity'
        },
        showExpiring && {
          label: 'Expiring Items',
          data: labDistribution.map(lab => lab.expiringCount),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          yAxisID: 'quantity'
        }
      ].filter(Boolean)
    };
  };

  const renderDetailedLabCard = (lab) => {
    const percentages = {
      chemicals: ((lab.totalChemicals / totals.chemicals) * 100).toFixed(1),
      quantity: ((lab.totalQuantity / totals.quantity) * 100).toFixed(1),
      expiring: ((lab.expiringCount / lab.totalChemicals) * 100).toFixed(1)
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {lab.labId === 'central-store' ? 'Central Lab' : lab.labId}
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {showQuantity && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">Total Quantity</div>
                <div className="text-xl font-semibold">{lab.totalQuantity}</div>
                <div className="text-xs text-blue-500">{percentages.quantity}% of total</div>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Chemical Distribution</h4>
            <div className="space-y-2">
              {lab.chemicals.slice(0, 5).map((chem, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{chem.name}</div>
                  <div className="text-sm font-medium">
                    {chem.quantity} {chem.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showExpiring && lab.expiringCount > 0 && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">
                Expiring Items: {lab.expiringCount}
              </div>
              <div className="text-xs text-red-500">
                {percentages.expiring}% of lab inventory
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLabDistributionFilters = () => (
    <div className="mb-6 flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">View Type</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={labDistributionView}
          onChange={(e) => setLabDistributionView(e.target.value)}
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="detailed">Detailed View</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            const sorted = [...labDistribution].sort((a, b) => {
              if (e.target.value === 'totalQuantity') {
                return b.totalQuantity - a.totalQuantity;
              } else if (e.target.value === 'totalChemicals') {
                return b.totalChemicals - a.totalChemicals;
              }
              return 0;
            });
            setLabDistribution(sorted);
          }}
        >
          <option value="totalQuantity">Total Quantity</option>
          <option value="totalChemicals">Number of Chemicals</option>
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Show Metrics
        </label>
        <div className="space-y-2">
          <label className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600"
              checked={showQuantity}
              onChange={(e) => setShowQuantity(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700">Quantity</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600"
              checked={showExpiring}
              onChange={(e) => setShowExpiring(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700">Expiring Items</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderLabDistribution = (labDistribution, unit) => {
    const totalQuantity = Object.values(labDistribution).reduce((sum, qty) => sum + qty, 0);
    
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-2">
          Total: {totalQuantity} {unit}
        </div>
        <div className="space-y-3">
          {Object.entries(labDistribution).map(([lab, qty]) => {
            const percentage = (qty / totalQuantity) * 100;
            return (
              <div
                key={lab}
                className="group cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => {
                  setSelectedLab(lab);
                  setLabDetailsOpen(true);
                }}
                title="Click to view detailed lab information"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {lab === 'central-store' ? 'Central Lab' : lab}
                  </span>
                  <span className="text-sm text-gray-600">
                    {qty} {unit} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      lab === 'central-store' ? 'bg-blue-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLabDetails = () => (
    <Dialog
      open={labDetailsOpen}
      onClose={() => setLabDetailsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold">
              Lab Details - {selectedLab === 'central-store' ? 'Central Lab' : `Lab ${selectedLab}`}
            </Dialog.Title>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
                  <div className="h-[300px]">
                    <Line
                      data={{
                        labels: labStats.usageHistory?.map(h => new Date(h.date).toLocaleDateString()) || [],
                        datasets: [{
                          label: 'Chemical Usage',
                          data: labStats.usageHistory?.map(h => h.quantity) || [],
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Capacity Utilization</h3>
                  <div className="h-[300px]">
                    <Pie
                      data={{
                        labels: ['Used', 'Available'],
                        datasets: [{
                          data: [
                            labStats.usedCapacity || 0,
                            (labStats.totalCapacity || 0) - (labStats.usedCapacity || 0)
                          ],
                          backgroundColor: ['#60A5FA', '#E5E7EB']
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setLabDetailsOpen(false)}
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const renderExportOptions = () => (
    <Dialog
      open={exportOptions.open}
      onClose={() => setExportOptions({ ...exportOptions, open: false })}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 px-6 py-4 border-b border-gray-200">
            Export Options
          </Dialog.Title>

          <div className="px-6 py-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Format</h4>
                <div className="space-y-2">
                  {['pdf', 'excel', 'csv'].map((format) => (
                    <label key={format} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-600 border-gray-300"
                        checked={exportOptions.format === format}
                        onChange={() => setExportOptions({ ...exportOptions, format })}
                      />
                      <span className="text-sm text-gray-700 capitalize">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Content</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        includeCharts: e.target.checked
                      })}
                    />
                    <span className="text-sm text-gray-700">Include Charts</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={exportOptions.includeStats}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        includeStats: e.target.checked
                      })}
                    />
                    <span className="text-sm text-gray-700">Include Statistics</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
                      checked={exportOptions.includeDetails}
                      onChange={(e) => setExportOptions({
                        ...exportOptions,
                        includeDetails: e.target.checked
                      })}
                    />
                    <span className="text-sm text-gray-700">Include Detailed Data</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setExportOptions({ ...exportOptions, open: false })}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={exportWithOptions}
            >
              Export
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <h3 className="text-lg font-semibold mb-2">Total Chemicals</h3>
        <p className="text-3xl font-bold">{stats.totalChemicals}</p>
        <p className="mt-2 text-sm opacity-80">Across {stats.totalLabs} labs</p>
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
        <h3 className="text-lg font-semibold mb-2">Total Quantity</h3>
        <p className="text-3xl font-bold">{stats.totalQuantity}</p>
        <p className="mt-2 text-sm opacity-80">Units in circulation</p>
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
        <h3 className="text-lg font-semibold mb-2">Low Stock Items</h3>
        <p className="text-3xl font-bold">{stats.lowStockItems}</p>
        <p className="mt-2 text-sm opacity-80">Require attention</p>
      </div>

      <div className="p-6 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
        <h3 className="text-lg font-semibold mb-2">Expiring Soon</h3>
        <p className="text-3xl font-bold">{stats.expiringSoon}</p>
        <p className="mt-2 text-sm opacity-80">Within 30 days</p>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        />
      </div>
        <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className={`bg-white rounded-lg shadow-lg p-4 mb-4 ${advancedFiltersOpen ? '' : 'hidden'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              value={advancedFilters.quantityRange[0]}
              onChange={(e) => setAdvancedFilters({
                ...advancedFilters,
                quantityRange: [Number(e.target.value), advancedFilters.quantityRange[1]]
              })}
              className="w-24 px-2 py-1 border rounded-md"
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              value={advancedFilters.quantityRange[1]}
              onChange={(e) => setAdvancedFilters({
                ...advancedFilters,
                quantityRange: [advancedFilters.quantityRange[0], Number(e.target.value)]
              })}
              className="w-24 px-2 py-1 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days Until Expiry Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              value={advancedFilters.expiryRange[0]}
              onChange={(e) => setAdvancedFilters({
                ...advancedFilters,
                expiryRange: [Number(e.target.value), advancedFilters.expiryRange[1]]
              })}
              className="w-24 px-2 py-1 border rounded-md"
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              value={advancedFilters.expiryRange[1]}
              onChange={(e) => setAdvancedFilters({
                ...advancedFilters,
                expiryRange: [advancedFilters.expiryRange[0], Number(e.target.value)]
              })}
              className="w-24 px-2 py-1 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Level Settings
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={advancedFilters.includeLowStock}
                onChange={(e) => setAdvancedFilters({
                  ...advancedFilters,
                  includeLowStock: e.target.checked
                })}
              />
              <span className="ml-2 text-sm text-gray-700">Show Low Stock Only</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Threshold:</span>
              <input
                type="number"
                min="0"
                value={advancedFilters.stockThreshold}
                onChange={(e) => setAdvancedFilters({
                  ...advancedFilters,
                  stockThreshold: Number(e.target.value)
                })}
                className="w-16 px-2 py-1 border rounded-md"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Options
          </label>
          <div className="space-y-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={advancedFilters.includeExpired}
                onChange={(e) => setAdvancedFilters({
                  ...advancedFilters,
                  includeExpired: e.target.checked
                })}
              />
              <span className="ml-2 text-sm text-gray-700">Include Expired Items</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={() => setAdvancedFilters({
            quantityRange: [0, 1000],
            expiryRange: [0, 365],
            includeExpired: false,
            includeLowStock: true,
            stockThreshold: 20,
          })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset Filters
        </button>
        <button
          onClick={() => setAdvancedFiltersOpen(false)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  const renderDetailedTable = () => {
    const data = getAggregatedData();
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Chemical Name</th>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Total Quantity</th>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Unit</th>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Stock Status</th>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Expiry Status</th>
              <th className="px-4 py-2 border-b border-gray-200 text-left text-sm font-medium text-gray-700">Lab Distribution</th>
            </tr>
          </thead>
          <tbody>
            {data.map((chem, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">{chem.chemicalName}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">{chem.totalQuantity}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">{chem.unit}</td>
                <td className="px-4 py-2 border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${chem.status.label === 'In Stock' ? 'bg-green-100 text-green-800' : chem.status.label === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {chem.status.label}
                  </span>
                </td>
                <td className="px-4 py-2 border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${chem.expiryStatus.style}`}>
                    {chem.expiryStatus.label}
                  </span>
                </td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700">
                  {Object.entries(chem.labDistribution)
                    .map(([lab, qty]) => (
                      <span key={lab} className="inline-block px-2 py-1 mr-1 mb-1 bg-blue-50 text-blue-700 rounded">
                        {lab === 'central-store' ? 'Central' : lab}: {qty}
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChemicalDetailsTable = () => {
    if (loadingChemicals) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (chemicalError) {
      return (
        <div className="text-red-600 p-4 text-center">
          Error: {chemicalError}
        </div>
      );
    }

    // Process the data to combine quantities and get distributions
    const processedData = chemicalDetails.map(chemical => {
      // Get total quantity including central and all labs
      const labDistribution = chemical.labDistribution || {};
      const totalQuantity = Object.values(labDistribution).reduce((sum, qty) => sum + qty, 0);

      return {
        ...chemical,
        totalQuantity: totalQuantity || chemical.quantity || 0
      };
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chemical Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lab Distribution
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedData.map((chemical, index) => {
              const expiryStatus = getExpiryStatus(chemical.expiryDate);
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.chemicalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.totalQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${expiryStatus.style}`}>
                      {expiryStatus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {chemical.labDistribution && Object.entries(chemical.labDistribution).map(([lab, qty]) => (
                        <div key={lab} className="flex justify-between items-center">
                          <span className="font-medium">{lab === 'central-store' ? 'Central Lab' : lab}:</span>
                          <span className="ml-2">{qty} {chemical.unit}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const labColors = {
    'central-store': '#0B3861', // Primary blue
    'LAB01': '#64B5F6', // Accent blue
    'LAB02': '#1E88E5', // Hover blue
    'LAB03': '#0B3861', // Primary blue
    'LAB04': '#64B5F6', // Accent blue
    'LAB05': '#1E88E5', // Hover blue
    'LAB06': '#0B3861', // Primary blue
    'LAB07': '#64B5F6', // Accent blue
    'LAB08': '#1E88E5'  // Hover blue
  };

  const renderVisualizationOptions = () => {
    return (
      <div className="mb-6">
        <div className="border-b border-[#BCE0FD]">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 border-b-2 ${
                visualizationTab === 0
                  ? 'border-[#0B3861] text-[#0B3861]'
                  : 'border-transparent text-gray-500 hover:text-[#1E88E5] hover:border-[#BCE0FD]'
              }`}
              onClick={() => setVisualizationTab(0)}
            >
              <span className="flex items-center space-x-2">
                Overview
              </span>
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${
                visualizationTab === 1
                  ? 'border-[#0B3861] text-[#0B3861]'
                  : 'border-transparent text-gray-500 hover:text-[#1E88E5] hover:border-[#BCE0FD]'
              }`}
              onClick={() => setVisualizationTab(1)}
            >
              <span className="flex items-center space-x-2">
                <ChartPieIcon className="h-5 w-5" />
                <span>Pie Chart</span>
              </span>
            </button>

            <button
              className={`px-4 py-2 border-b-2 ${
                visualizationTab === 2
                  ? 'border-[#0B3861] text-[#0B3861]'
                  : 'border-transparent text-gray-500 hover:text-[#1E88E5] hover:border-[#BCE0FD]'
              }`}
              onClick={() => setVisualizationTab(2)}
            >
              <span className="flex items-center space-x-2">
                <TableCellsIcon className="h-5 w-5" />
                <span>Detailed Table</span>
              </span>
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${
                visualizationTab === 3
                  ? 'border-[#0B3861] text-[#0B3861]'
                  : 'border-transparent text-gray-500 hover:text-[#1E88E5] hover:border-[#BCE0FD]'
              }`}
              onClick={() => setVisualizationTab(3)}
            >
              <span className="flex items-center space-x-2">
                <span>Radar Graph</span>
              </span>
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${
                visualizationTab === 4
                  ? 'border-[#0B3861] text-[#0B3861]'
                  : 'border-transparent text-gray-500 hover:text-[#1E88E5] hover:border-[#BCE0FD]'
              }`}
              onClick={() => setVisualizationTab(4)}
            >
              <span className="flex items-center space-x-2">
                <span>Doughnut Graph</span>
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          {visualizationTab === 0 && (
            <div className="h-[400px]">
              <Bar
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          )}
          {visualizationTab === 1 && (
            <div className="h-[400px]">
              <Pie
                data={{
                  labels: getAggregatedData().map(chem => chem.chemicalName),
                  datasets: [{
                    data: getAggregatedData().map(chem => chem.totalQuantity),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.6)',
                      'rgba(16, 185, 129, 0.6)',
                      'rgba(239, 68, 68, 0.6)',
                      'rgba(245, 158, 11, 0.6)',
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(239, 68, 68)',
                      'rgb(245, 158, 11)',
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    }
                  }
                }}
              />
            </div>
          )}
          {visualizationTab === 2 && renderDetailedTable()}
          {visualizationTab === 3 && (
            <div className="h-[400px]">
              <Radar
                data={{
                  labels: getAggregatedData().map(chem => chem.chemicalName),
                  datasets: [
                    {
                      label: 'Quantity',
                      data: getAggregatedData().map(chem => chem.totalQuantity),
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      borderColor: 'rgba(33, 150, 243, 1)',
                      pointBackgroundColor: 'rgba(33, 150, 243, 1)'
                    },
                    {
                      label: 'Stock Threshold',
                      data: getAggregatedData().map(chem => chem.threshold || 0),
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      borderColor: 'rgba(245, 158, 11, 1)',
                      pointBackgroundColor: 'rgba(245, 158, 11, 1)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Chemical Quantities vs Thresholds' }
                  }
                }}
              />
            </div>
          )}
          {visualizationTab === 4 && (
            <div className="h-[400px]">
              <Doughnut
                data={{
                  labels: getAggregatedData().map(chem => chem.chemicalName),
                  datasets: [
                    {
                      label: 'Stock',
                      data: getAggregatedData().map(chem => chem.totalQuantity),
                      backgroundColor: getAggregatedData().map((_, i) =>
                        `hsl(${(i * 360) / getAggregatedData().length}, 70%, 60%)`
                      ),
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Chemical Stock Distribution' }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLabDistributionSection = () => {
    if (isLabDistributionLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (!labDistribution || labDistribution.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No distribution data available
        </div>
      );
    }

    const totals = {
      chemicals: labDistribution.reduce((sum, lab) => sum + lab.totalChemicals, 0),
      quantity: labDistribution.reduce((sum, lab) => sum + lab.totalQuantity, 0),
      expiring: labDistribution.reduce((sum, lab) => sum + lab.expiringCount, 0)
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lab Distribution</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setLabDistributionView('bar')}
              className={`p-2 rounded ${labDistributionView === 'bar' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              Bar
            </button>
            <button
              onClick={() => setLabDistributionView('pie')}
              className={`p-2 rounded ${labDistributionView === 'pie' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              Pie
            </button>
            <button
              onClick={() => setLabDistributionView('cards')}
              className={`p-2 rounded ${labDistributionView === 'cards' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              Cards
            </button>
          </div>
        </div>

        <div>
          {labDistributionView === 'bar' ? (
            <div className="h-[400px]">
              <Bar
                data={getChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Chemical Distribution by Lab'
                    }
                  }
                }}
              />
            </div>
          ) : labDistributionView === 'pie' ? (
            <div className="h-[400px]">
              <Pie
                data={{
                  labels: labDistribution.map(lab => 
                    lab.labId === 'central-store' ? 'Central Lab' : lab.labId
                  ),
                  datasets: [{
                    data: labDistribution.map(lab => lab.totalQuantity),
                    backgroundColor: labDistribution.map(lab => labColors[lab.labId]),
                    hoverOffset: 4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: true,
                      text: 'Chemical Distribution'
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labDistribution.map(lab => (
                <div key={lab.labId} className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-lg font-semibold mb-3">
                    {lab.labId === 'central-store' ? 'Central Lab' : lab.labId}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Chemicals</div>
                      <div className="text-xl font-semibold">{lab.totalChemicals}</div>
                      <div className="text-xs text-blue-500">
                        {((lab.totalChemicals / totals.chemicals) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Total Quantity</div>
                      <div className="text-xl font-semibold">{lab.totalQuantity}</div>
                      <div className="text-xs text-green-500">
                        {((lab.totalQuantity / totals.quantity) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Recent Chemicals</div>
                    <div className="space-y-2">
                      {lab.chemicals.slice(0, 3).map((chem, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{chem.name}</span>
                          <span>{chem.quantity} {chem.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {lab.expiringCount > 0 && (
                    <div className="mt-3 bg-red-50 p-2 rounded">
                      <span className="text-red-600 text-sm">
                        {lab.expiringCount} chemicals expiring soon ({((lab.expiringCount / lab.totalChemicals) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderStatsCards()}
      {renderFilters()}
      {renderAdvancedFilters()}
      {renderVisualizationOptions()}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">Lab Distribution Overview</h2>
        {renderLabDistributionFilters()}
        {renderLabDistributionSection()}
      </div>
      {renderLabDetails()}
      {renderExportOptions()}
    </div>
  );
};

export default CentralChemicalTable;