import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiX, FiDownload, FiRefreshCw, FiArrowUp,
  FiCalendar, FiTrendingUp, FiActivity, FiCheckCircle, FiAlertCircle, FiPrinter
} from 'react-icons/fi';

const COLORS = ['#2563eb', '#3b82f6', '#1d4ed8', '#60a5fa', '#93c5fd', '#dbeafe'];

// Toast notification system
const ToastNotification = ({ toast, onClose }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={`fixed bottom-8 left-8 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {toast.type === 'success' ? (
            <FiCheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <FiAlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Loading component with shimmer effect
const LoadingSpinner = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-white">
    <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-200">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-700 animate-pulse" />
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="h-12 w-80 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6">
                <div className="h-8 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="h-64 w-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-3 text-blue-600">
          <FiRefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-base font-medium">Loading transactions...</span>
        </div>
      </div>
    </div>
  </div>
);

const PaginationButton = ({ active, children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 rounded-md mx-1 transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

const TransactionsPage = ({ labId: propLabId }) => {
  const [transactions, setTransactions] = useState([]);
  const [selectedLabFilter, setSelectedLabFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState('');
  const [labId, setLabId] = useState(propLabId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;
  
  // Dynamic labs state
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE());
  const [globalFilterApplied, setGlobalFilterApplied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const searchInputRef = useRef(null);

  // Per-graph filters
  const [typeChartRange, setTypeChartRange] = useState('7d');
  const [typeChartLab, setTypeChartLab] = useState('all');
  const [labChartRange, setLabChartRange] = useState('7d');
  const [labChartType, setLabChartType] = useState('all');
  const [labChartChemical, setLabChartChemical] = useState('all');
  const [entryChartRange, setEntryChartRange] = useState('7d');
  const [entryChartChemical, setEntryChartChemical] = useState('all');

  const token = localStorage.getItem('token');

  // Global smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Scroll to top detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toast notification system
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      
      // Only set labId from token if not provided as prop
      const effectiveLabId = propLabId || user.labId;
      if (!propLabId) {
        setLabId(user.labId);
      }
      
      // Fetch labs and transactions in parallel
      Promise.all([
        fetchLabs(),
        fetchTransactions(user.role, effectiveLabId)
      ]);
    } catch (err) {
      console.error(err);
      setError('Invalid token');
      setLoading(false);
    }
  }, [propLabId]);

  // Fetch dynamic labs
  const fetchLabs = async () => {
    try {
      setLabsLoading(true);
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/labs?includeInactive=false', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const labsData = response.data?.data || [];
      setLabs(labsData);
      return labsData;
    } catch (error) {
      console.error('Error fetching labs:', error);
      // Fallback to central-store if API fails
      const fallbackLabs = [{ 
        labId: 'central-store', 
        labName: 'Central Store', 
        isSystem: true, 
        isActive: true 
      }];
      setLabs(fallbackLabs);
      return fallbackLabs;
    } finally {
      setLabsLoading(false);
    }
  };

  // Helper function to get lab display name
  const getLabDisplayName = (labId) => {
    if (!labId) return '-';
    
    // Handle central-store specially
    if (labId === 'central-store') return 'Central Store';
    
    // Find lab in dynamic labs list
    const lab = labs.find(l => l.labId === labId);
    return lab ? lab.labName : labId;
  };

  const fetchTransactions = async (userRole, userLabId) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = '';

      if (userRole === 'lab_assistant') {
        url = `https://backend-pharmacy-5541.onrender.com/api/transactions/lab/${userLabId}`;
      } else if (userRole === 'admin' || userRole === 'central_store_admin') {
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
    setCurrentPage(1);
  };

  const handleLabFilterChange = (labFilter) => {
    setSelectedLabFilter(labFilter);
    setCurrentPage(1);
  };

  const filterTransactions = () => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      const inDateRange =
        txDate >= new Date(dateRange.from) && txDate <= new Date(dateRange.to + 'T23:59:59');

      const name = tx.chemicalName?.toLowerCase() || '';
      const nameMatch = name.includes(searchTerm);

      const labMatch =
        selectedLabFilter === 'all' ||
        (selectedLabFilter === 'central' && tx.fromLabId === 'central-store') ||
        tx.fromLabId === selectedLabFilter ||
        tx.toLabId === selectedLabFilter;

      return inDateRange && nameMatch && labMatch;
    });
  };

  const getTransactionTypeColor = (type) => {
    switch(type.toLowerCase()) {
      case 'allocation': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'transfer': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'consumption': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'entry': return 'bg-green-50 text-green-700 border border-green-200';
      case 'adjustment': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  // UI: Global Date Range Filter with Apply/Reset
  const handleApplyGlobalFilter = () => {
    setGlobalFilterApplied(true);
    setCurrentPage(1);
    showToast('Date filter applied successfully!', 'success');
  };
  
  const handleResetGlobalFilter = () => {
    setDateRange(DEFAULT_DATE_RANGE());
    setGlobalFilterApplied(false);
    setCurrentPage(1);
    showToast('Date filter reset to default', 'success');
  };

  // Download utility for chart containers with toast feedback
  const downloadChart = async (id, filename) => {
    try {
      const chartNode = document.getElementById(id);
      if (!chartNode) {
        showToast('Chart not found for download', 'error');
        return;
      }
      const canvas = await html2canvas(chartNode, { backgroundColor: null, useCORS: true });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
          showToast('Chart downloaded successfully!', 'success');
        } else {
          showToast('Failed to generate chart image', 'error');
        }
      });
    } catch (error) {
      console.error('Error downloading chart:', error);
      showToast('Failed to download chart', 'error');
    }
  };

  // Print all transactions to PDF
  const handlePrintAllTransactionsPDF = async () => {
    setIsPrinting(true);
    try {
      if (typeof window !== 'undefined' && !window.jspdfAutotable) {
        const autotable = await import('jspdf-autotable');
        window.jspdfAutotable = autotable.default || autotable;
      }
      
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
      const pageWidth = 297; // A4 landscape width
      const leftMargin = 15;
      const rightMargin = 15;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      const blue600 = [37, 99, 235]; // #2563eb (blue-600)
      const blue500 = [59, 130, 246]; // #3b82f6 (blue-500)
      const white = [255, 255, 255];
      
      // Header
      doc.setFillColor(...blue600);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...white);
      doc.text('TRANSACTIONS REPORT', pageWidth / 2, 12, { align: 'center' });
      
      // Report details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...blue600);
      let y = 24;
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, leftMargin, y);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, leftMargin + 100, y);
      y += 7;
      doc.text(`Date Range: ${dateRange.from} to ${dateRange.to}`, leftMargin, y);
      doc.text(`Lab Filter: ${selectedLabFilter === 'all' ? 'All Labs' : selectedLabFilter === 'central' ? 'Central Store' : selectedLabFilter}`, leftMargin + 100, y);
      
      // Table columns
      const columns = [
        { title: 'Chemical', dataKey: 'chemical' },
        { title: 'Quantity', dataKey: 'quantity' },
        { title: 'Unit', dataKey: 'unit' },
        { title: 'Type', dataKey: 'type' },
        { title: 'From Lab', dataKey: 'fromLab' },
        { title: 'To Lab', dataKey: 'toLab' },
        { title: 'Performed By', dataKey: 'performedBy' },
        { title: 'Date', dataKey: 'date' }
      ];
      
      // Table data with dynamic lab names
      const tableData = filteredTransactions.map(tx => ({
        chemical: tx.chemicalName || 'Unnamed Chemical',
        quantity: parseInt(tx.quantity).toString(),
        unit: tx.unit || '-',
        type: tx.transactionType || '-',
        fromLab: getLabDisplayName(tx.fromLabId),
        toLab: getLabDisplayName(tx.toLabId),
        performedBy: tx.createdBy?.name || 'admin',
        date: new Date(tx.createdAt).toLocaleDateString()
      }));
      
      if (typeof window !== 'undefined' && window.jspdfAutotable) {
        window.jspdfAutotable(doc, {
          head: [columns.map(col => col.title)],
          body: tableData.map(row => columns.map(col => row[col.dataKey])),
          startY: y + 6,
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: 'auto',
          styles: {
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak',
            font: 'helvetica',
            textColor: [33, 37, 41],
            lineColor: blue500,
            fillColor: white
          },
          headStyles: {
            fillColor: blue600,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.5,
            fontSize: 10
          },
          bodyStyles: {
            halign: 'center',
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [241, 249, 253]
          },
          columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' }, // Chemical name
            1: { cellWidth: 'auto', halign: 'center' }, // Quantity
            2: { cellWidth: 'auto', halign: 'center' }, // Unit
            3: { cellWidth: 'auto', halign: 'center' }, // Type
            4: { cellWidth: 'auto', halign: 'center' }, // From Lab
            5: { cellWidth: 'auto', halign: 'center' }, // To Lab
            6: { cellWidth: 'auto', halign: 'center' }, // Performed By
            7: { cellWidth: 'auto', halign: 'center' }  // Date
          }
        });
      }
      
      // Print dialog
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      showToast('Transactions PDF generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Get current transactions for pagination (sorted by latest first)
  const filteredTransactions = filterTransactions().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  // --- Summary ---
  const totalTransactions = filteredByDate.length;
  const totalQuantity = Math.round(
    filteredByDate
      .filter(tx => tx.transactionType !== 'entry')
      .reduce((sum, tx) => sum + (Number(tx.quantity) || 0), 0)
  );
  const mostActiveLab = (role === 'admin' || role === 'central_store_admin')
    ? (labChartData.sort((a, b) => b.count - a.count)[0]?.lab || '-')
    : null;

  // --- Dropdown options ---
  const allLabs = Array.from(
    new Set(transactions.flatMap(tx => [tx.fromLabId, tx.toLabId]).filter(Boolean))
  );
  const allChemicals = Array.from(new Set(transactions.map(tx => tx.chemicalName).filter(Boolean)));
  const allTypes = Array.from(new Set(transactions.map(tx => tx.transactionType)));

  // Unique IDs for each chart for download
  const typeChartId = "type-chart";
  const labChartId = "lab-chart";

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex items-center justify-center bg-white"
    >
      <div className="text-center p-8">
        <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Transactions</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full bg-white">
      <div className="w-full">
          {/* Enhanced header with blue-600 background */}
          <div className="relative p-4 rounded-b-3xl bg-blue-600 text-white overflow-hidden">
            <div className="relative z-10">
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base lg:text-lg font-bold mb-1"
              >
                Transaction Analytics
              </motion.h1>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-blue-100 text-sm"
              >
                Monitor and analyze all chemical transactions across your laboratory network
              </motion.p>
              <div className="absolute top-4 right-4 text-blue-200">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <FiActivity className="h-12 w-12 opacity-20" />
                </motion.div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Enhanced Global Date Range Filter */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400 h-5 w-5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full pl-12 pr-4 py-2 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-sm"
                    placeholder="Search transactions... (Press '/' to focus)"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setSearchTerm('')}
                    >
                      <FiX className="text-gray-400 hover:text-gray-600 h-5 w-5" />
                    </motion.button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200"
                  >
                    <FiFilter className="h-4 w-4" />
                    <span className="font-medium text-sm">Date Range</span>
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 p-6 border border-gray-200 rounded-xl bg-gray-50"
                  >
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="h-4 w-4 text-blue-600" />
                        <label className="font-medium text-gray-700 text-sm">From:</label>
                        <input
                          type="date"
                          value={dateRange.from}
                          max={dateRange.to}
                          onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="font-medium text-gray-700 text-sm">To:</label>
                        <input
                          type="date"
                          value={dateRange.to}
                          min={dateRange.from}
                          max={formatDate(new Date())}
                          onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg font-medium shadow transition text-sm ${
                            globalFilterApplied 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          onClick={handleApplyGlobalFilter}
                        >
                          {globalFilterApplied ? 'Applied' : 'Apply Filter'}
                        </motion.button>
                        
                        {globalFilterApplied && (
                          <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium shadow border border-gray-300 hover:bg-gray-200 transition text-sm"
                            onClick={handleResetGlobalFilter}
                          >
                            Reset
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Summary Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`mb-8 grid grid-cols-1 sm:grid-cols-2 ${role === 'admin' || role === 'central_store_admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4 md:gap-6`}
            >
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-blue-600 flex flex-col items-center"
              >
                <span className="text-2xl md:text-3xl font-bold text-blue-600">{totalTransactions}</span>
                <span className="text-blue-600 font-medium mt-1 text-center text-xs md:text-sm">Total Transactions</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-blue-500 flex flex-col items-center"
              >
                <span className="text-2xl md:text-3xl font-bold text-blue-500">{totalQuantity}</span>
                <span className="text-blue-500 font-medium mt-1 text-center text-xs md:text-sm">Total Drugs Moved</span>
              </motion.div>
              
              {(role === 'admin' || role === 'central_store_admin') && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-l-8 border-blue-500 flex flex-col items-center"
                >
                  <span className="text-lg md:text-xl font-bold text-blue-500">{mostActiveLab}</span>
                  <span className="text-blue-500 font-medium mt-1 text-center text-xs md:text-sm">Most Active Lab</span>
                </motion.div>
              )}
            </motion.div>

            {/* Charts with per-graph filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
              {/* Bar Chart: Transactions by Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 flex flex-col overflow-x-auto"
                id={typeChartId}
                style={{ minWidth: 0 }}
              >
                <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">Transactions by Type</h3>
                  <div className="flex gap-2 items-center">
                    <select
                      value={typeChartLab}
                      onChange={e => setTypeChartLab(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Labs</option>
                      <option value="central-store">Central Store</option>
                      {labs.map(lab => (
                        <option key={lab.labId} value={lab.labId}>{lab.labName}</option>
                      ))}
                    </select>
                    <select
                      value={typeChartRange}
                      onChange={e => setTypeChartRange(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="all">All Time</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                      onClick={() => downloadChart(typeChartId, "transactions_by_type.png")}
                      title="Download chart"
                    >
                      <FiDownload className="h-3 w-3" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px] min-w-[320px]">
                  <ResponsiveContainer width="100%" height={250} minWidth={320}>
                    <BarChart data={typeChartData}>
                      <XAxis dataKey="type" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6">
                        {typeChartData.map((entry, idx) => (
                          <Cell key={entry.type} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Pie Chart: Distribution by Lab */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 flex flex-col overflow-x-auto"
                id={labChartId}
                style={{ minWidth: 0 }}
              >
                <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">Distribution by Lab</h3>
                  <div className="flex gap-2 items-center">
                    <select
                      value={labChartType}
                      onChange={e => setLabChartType(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Types</option>
                      {allTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      value={labChartChemical}
                      onChange={e => setLabChartChemical(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Chemicals</option>
                      {allChemicals.map(chem => (
                        <option key={chem} value={chem}>{chem}</option>
                      ))}
                    </select>
                    <select
                      value={labChartRange}
                      onChange={e => setLabChartRange(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-gray-700 text-xs focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="all">All Time</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                      onClick={() => downloadChart(labChartId, "distribution_by_lab.png")}
                      title="Download chart"
                    >
                      <FiDownload className="h-3 w-3" />
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px] min-w-[320px]">
                  <ResponsiveContainer width="100%" height={250} minWidth={320}>
                    <PieChart>
                      <Pie
                        data={labChartData}
                        dataKey="count"
                        nameKey="lab"
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
              </motion.div>
            </div>

            {/* Table & Controls */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center mb-6 gap-4">
                {(role === 'admin' || role === 'central_store_admin') && (
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLabFilterChange('all')}
                      className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                        selectedLabFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 border border-gray-300'
                      }`}
                    >
                      All Labs
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLabFilterChange('central')}
                      className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                        selectedLabFilter === 'central'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 border border-gray-300'
                      }`}
                    >
                      Central Store
                    </motion.button>
                    {labs.map((lab) => (
                      <motion.button
                        key={lab.labId}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLabFilterChange(lab.labId)}
                        className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                          selectedLabFilter === lab.labId
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 border border-gray-300'
                        }`}
                      >
                        {lab.labName}
                      </motion.button>
                    ))}
                  </div>
                )}
                {/* Print All Transactions Button */}
              <div className="mb-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrintAllTransactionsPDF}
                  disabled={isPrinting || filteredTransactions.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                    isPrinting || filteredTransactions.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isPrinting ? (
                    <>
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FiPrinter className="h-4 w-4" />
                      Print All Transactions
                    </>
                  )}
                </motion.button>
              </div>

              </div>

              
              {/* Transaction Count */}
              <div className="mb-3 text-xs text-gray-600">
                Showing {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>

              {/* Table */}
              {filteredTransactions.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                  <FiSearch className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-base font-medium">No transactions found</p>
                  <p className="text-gray-500 text-xs mt-1">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">Chemical</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">Quantity</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">Unit</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">Type</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">From Lab</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">To Lab</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">By</th>
                          <th className="px-3 md:px-4 py-2 text-left font-medium text-gray-900 text-xs">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {currentTransactions.map((tx, index) => (
                          <motion.tr 
                            key={tx._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-3 md:px-4 py-3 text-gray-900 text-xs">
                              {tx.chemicalName || (
                                <span className="flex items-center">
                                  <span className="text-gray-500 italic">Unnamed Chemical</span>
                                  <span className="ml-2 px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
                                    Missing
                                  </span>
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-900 font-medium text-xs">{parseInt(tx.quantity)}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 text-xs">{tx.unit}</td>
                            <td className="px-3 md:px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.transactionType)}`}>
                                {tx.transactionType}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-900 text-xs">
                              <span className={`font-medium ${tx.fromLabId === 'central-store' ? 'text-blue-600' : 'text-gray-900'}`}>
                                {getLabDisplayName(tx.fromLabId)}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-900 text-xs">
                              <span className={`font-medium ${tx.toLabId === 'central-store' ? 'text-blue-600' : 'text-gray-900'}`}>
                                {getLabDisplayName(tx.toLabId)}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 text-xs">{tx.createdBy?.name || 'Admin or Central Store'}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 text-xs">
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                          </motion.tr>
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
            </motion.div>
          </div>
      </div>


      {/* Toast notifications */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default TransactionsPage;
