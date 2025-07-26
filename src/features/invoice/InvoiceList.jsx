import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiX, FiPrinter, FiChevronLeft, FiCalendar, 
  FiDollarSign, FiArrowUp, FiDownload, FiEye, FiCheckCircle,
  FiRefreshCw, FiAlertCircle, FiClock
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toast, setToast] = useState(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

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
      if (event.key === 'Escape' && selectedInvoice) {
        setSelectedInvoice(null);
      }
      if (event.key === '/' && !selectedInvoice) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice]);

  // Focus management for modal
  useEffect(() => {
    if (selectedInvoice && modalRef.current) {
      modalRef.current.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedInvoice]);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    axios.get(`${API_BASE}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.invoices || res.data.data || []);
        setInvoices(data);
        setFilteredInvoices(data);
      })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let results = invoices;
    
    // Apply search term filter
    if (searchTerm) {
      results = results.filter(invoice => 
        invoice.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceId?.toString().includes(searchTerm)
      )
    }
    
    // Apply date range filter
    if (startDate && endDate) {
      results = results.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    }
    
    // Apply amount range filter
    if (minAmount) {
      results = results.filter(invoice => {
        const total = invoice.totalInvoicePrice || 
                     invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0, 0));
        return total >= Number(minAmount);
      });
    }
    
    if (maxAmount) {
      results = results.filter(invoice => {
        const total = invoice.totalInvoicePrice || 
                     invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
        return total <= Number(maxAmount);
      });
    }
    
    // Apply vendor filter
    if (selectedVendor) {
      results = results.filter(invoice => 
        invoice.vendorName === selectedVendor || 
        invoice.vendorId?.name === selectedVendor
      );
    }
    
    setFilteredInvoices(results);
  }, [invoices, searchTerm, startDate, endDate, minAmount, maxAmount, selectedVendor]);

  const handlePrintInvoicePDF = async (invoice) => {
    setIsPrinting(true);
    try {
      if (typeof window !== 'undefined' && !window.jspdfAutotable) {
        const autotable = await import('jspdf-autotable');
        window.jspdfAutotable = autotable.default || autotable;
      }
      
      // ...existing PDF generation code...
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
      const pageWidth = 210;
      const leftMargin = 15;
      const rightMargin = 15;
      const contentWidth = pageWidth - leftMargin - rightMargin;
      const deepSeaBlue = [11, 56, 97];
      const skyBlue = [33, 150, 243];
      const white = [255, 255, 255];
      
      // Header
      doc.setFillColor(...deepSeaBlue);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...white);
      doc.text('INVOICE', pageWidth / 2, 12, { align: 'center' });
      
      // Invoice & Vendor details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...deepSeaBlue);
      let y = 24;
      doc.text(`Invoice No: ${invoice.invoiceNumber || '-'}`, leftMargin, y);
      doc.text(`Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}`, leftMargin + 70, y);
      y += 7;
      doc.text(`Created: ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : '-'}`, leftMargin, y);
      doc.text(`ID: ${invoice.invoiceId || '-'}`, leftMargin + 70, y);
      y += 7;
      doc.text(`Vendor: ${invoice.vendorName || (invoice.vendorId?.name) || '-'}`, leftMargin, y);
      doc.text(`Total Amount: Rs.${typeof invoice.totalInvoicePrice === 'number' ? invoice.totalInvoicePrice.toFixed(2) : invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}`, leftMargin + 70, y);
      y += 7;
      if (invoice.vendorId?.email) doc.text(`Vendor Email: ${invoice.vendorId.email}`, leftMargin, y);
      
      // Table for line items
      const columns = [
        { title: 'Product', dataKey: 'name' },
        { title: 'Unit', dataKey: 'unit' },
        { title: 'Qty', dataKey: 'quantity' },
        { title: 'Price/Unit', dataKey: 'pricePerUnit' },
        { title: 'Total', dataKey: 'totalPrice' },
        { title: 'Expiry', dataKey: 'expiryDate' }
      ];
      const tableData = invoice.lineItems.map(li => ({
        name: li.name,
        unit: li.unit,
        quantity: li.quantity,
        pricePerUnit: `Rs.${li.pricePerUnit}`,
        totalPrice: `Rs.${li.totalPrice}`,
        expiryDate: li.expiryDate ? new Date(li.expiryDate).toLocaleDateString() : '-'
      }));
      
      if (typeof window !== 'undefined' && window.jspdfAutotable) {
        window.jspdfAutotable(doc, {
          head: [columns.map(col => col.title)],
          body: tableData.map(row => columns.map(col => row[col.dataKey])),
          startY: y + 6,
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: 'auto',
          styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak',
            font: 'helvetica',
            textColor: [33, 37, 41],
            lineColor: skyBlue,
            fillColor: white
          },
          headStyles: {
            fillColor: deepSeaBlue,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.5,
            fontSize: 11
          },
          bodyStyles: {
            halign: 'center',
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [241, 249, 253]
          },
          columnStyles: columns.reduce((styles, col, i) => {
            styles[i] = { cellWidth: 'auto', halign: i === 0 ? 'left' : 'center' };
            return styles;
          }, {})
        });
      }
      
      // Bold total price after the table
      const totalPrice = typeof invoice.totalInvoicePrice === 'number'
        ? invoice.totalInvoicePrice
        : invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
      const afterTableY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : y + 30;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...skyBlue);
      doc.text(`Total Invoice Price: Rs.${totalPrice.toFixed(2)}`, leftMargin, afterTableY + 12, { align: 'left' });
      
      // Print dialog
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
      showToast('Invoice PDF generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange([null, null]);
    setMinAmount('');
    setMaxAmount('');
    setSelectedVendor('');
  };

  const vendors = [...new Set(invoices.map(inv => inv.vendorName || inv.vendorId?.name).filter(Boolean))];

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced shimmer styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        .pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Enhanced skeleton header */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800 shimmer" />
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="shimmer h-12 w-80 rounded-xl" />
              <div className="flex gap-4">
                <div className="shimmer h-12 w-32 rounded-lg" />
                <div className="shimmer h-12 w-24 rounded-lg" />
              </div>
            </div>
            
            {/* Enhanced skeleton table */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[...Array(6)].map((_, i) => (
                      <th key={i} className="px-6 py-4">
                        <div className="shimmer h-4 w-20 rounded-full mx-auto" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div 
                            className="shimmer h-4 rounded-full mx-auto" 
                            style={{ 
                              width: j === 0 ? '80px' : j === 1 ? '120px' : j === 4 ? '100px' : '60px',
                              animationDelay: `${(i * 6 + j) * 0.1}s`
                            }} 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3 text-blue-600">
            <FiRefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg font-medium">Loading invoices...</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 text-center text-red-500"
    >
      {error}
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Global styles for smooth scrolling and animations */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          * {
            scroll-behavior: smooth;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full border border-white/20"
        >
          {/* Enhanced header with gradient and better typography */}
          <div className="relative p-8 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            <div className="relative z-10">
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl lg:text-4xl font-bold mb-2"
              >
                Invoice Management
              </motion.h1>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-blue-100 text-lg"
              >
                View and manage all your invoices with advanced filtering
              </motion.p>
              <div className="absolute top-4 right-4 text-blue-200">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <FiDollarSign className="h-12 w-12 opacity-20" />
                </motion.div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Enhanced search and filter section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Search invoices... (Press '/' to focus)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 relative"
                >
                  <FiFilter className="h-5 w-5" />
                  <span className="font-medium">Filters</span>
                  {(searchTerm || startDate || endDate || minAmount || maxAmount || selectedVendor) && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full"
                    >
                      {[
                        searchTerm ? 1 : 0,
                        startDate || endDate ? 1 : 0,
                        minAmount ? 1 : 0,
                        maxAmount ? 1 : 0,
                        selectedVendor ? 1 : 0
                      ].reduce((a, b) => a + b, 0)}
                    </motion.span>
                  )}
                </motion.button>
                
                {(searchTerm || startDate || endDate || minAmount || maxAmount || selectedVendor) && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 border border-red-200 rounded-xl shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 text-red-700"
                  >
                    <FiX className="h-5 w-5" />
                    <span className="font-medium">Clear</span>
                  </motion.button>
                )}
              </div>
            </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => setDateRange(update)}
                      isClearable={true}
                      placeholderText="Select date range"
                      className="block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="0.00"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="0.00"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <select
                      className="block w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                    >
                      <option value="">All Vendors</option>
                      {vendors.map(vendor => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No invoices found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <motion.tr 
                      key={invoice._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-blue-50 cursor-pointer"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{invoice.invoiceId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.vendorName || invoice.vendorId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{typeof invoice.totalInvoicePrice === 'number' 
                          ? invoice.totalInvoicePrice.toFixed(2) 
                          : invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintInvoicePDF(invoice);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FiPrinter className="inline" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-30 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <FiArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
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

      {/* Enhanced Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            {/* Backdrop with blur effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setSelectedInvoice(null)}
            />
            
            {/* Modal content */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              tabIndex={-1}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedInvoice(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <FiChevronLeft className="h-5 w-5" />
                    Back to list
                  </motion.button>
                  
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedInvoice(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FiEye className="h-4 w-4" />
                      View All
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePrintInvoicePDF(selectedInvoice)}
                      disabled={isPrinting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {isPrinting ? (
                        <FiRefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <FiPrinter className="h-4 w-4" />
                      )}
                      {isPrinting ? 'Generating...' : 'Print Invoice'}
                    </motion.button>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-6">
                    {/* Invoice Header */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.invoiceId}
                          </h2>
                          <div className="space-y-2 text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Vendor:</span>
                              <span>{selectedInvoice.vendorName || selectedInvoice.vendorId?.name || '-'}</span>
                            </div>
                            {selectedInvoice.vendorId?.email && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Email:</span>
                                <span className="text-blue-600">{selectedInvoice.vendorId.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="lg:text-right space-y-2">
                          <div className="flex lg:justify-end items-center gap-2">
                            <FiCalendar className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">Invoice Date:</span>
                            <span>{selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="flex lg:justify-end items-center gap-2">
                            <FiClock className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">Created:</span>
                            <span>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Line Items Table */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-8"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FiDollarSign className="h-5 w-5 text-blue-600" />
                        Line Items
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Product
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Unit
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Threshold
                                </th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Price/Unit
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Total Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {selectedInvoice.lineItems.map((item, index) => (
                                <motion.tr 
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + index * 0.05 }}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {item.unit}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-700">
                                    {item.thresholdValue || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">
                                    {item.quantity}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                                    ₹{Number(item.pricePerUnit).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                                    ₹{Number(item.totalPrice).toFixed(2)}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Total Summary */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl w-full lg:w-1/2 border border-blue-100">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-gray-700">
                            <span className="text-lg font-semibold">Subtotal:</span>
                            <span className="text-lg font-medium">
                              ₹{selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-blue-200 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                              <span className="text-2xl font-bold text-blue-600">
                                ₹{typeof selectedInvoice.totalInvoicePrice === 'number'
                                  ? selectedInvoice.totalInvoicePrice.toFixed(2)
                                  : selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceList;