import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiPrinter, FiChevronLeft, FiCalendar, FiDollarSign } from 'react-icons/fi';
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

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/invoices`)
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
    if (typeof window !== 'undefined' && !window.jspdfAutotable) {
      const autotable = await import('jspdf-autotable');
      window.jspdfAutotable = autotable.default || autotable;
    }
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
    <div className="flex justify-center items-center min-h-[60vh] bg-white">
      {/* Shimmer keyframes and styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #e3f0fc 25%, #f5fafd 50%, #e3f0fc 75%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
      <div className="w-full max-w-4xl">
        {/* Skeleton header */}
        <div className="shimmer rounded-2xl h-16 mb-8" />
        {/* Skeleton filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="shimmer h-10 w-40 rounded-lg" />
          <div className="shimmer h-10 w-24 rounded-lg" />
          <div className="shimmer h-10 w-24 rounded-lg" />
          <div className="shimmer h-10 w-32 rounded-lg" />
        </div>
        {/* Skeleton table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead>
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="px-2 py-3">
                    <div className="shimmer h-4 w-20 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-2 py-3">
                      <div className="shimmer h-4 w-full rounded" style={{ minWidth: 40, maxWidth: 120, margin: '0 auto' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="opacity-90">View and manage all your invoices</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiFilter />
                Filters
                {(searchTerm || startDate || endDate || minAmount || maxAmount || selectedVendor) && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {[
                      searchTerm ? 1 : 0,
                      startDate || endDate ? 1 : 0,
                      minAmount ? 1 : 0,
                      maxAmount ? 1 : 0,
                      selectedVendor ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
              
              {(searchTerm || startDate || endDate || minAmount || maxAmount || selectedVendor) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FiX />
                  Clear
                </button>
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

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSelectedInvoice(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FiChevronLeft /> Back to list
                  </button>
                  <button
                    onClick={() => handlePrintInvoicePDF(selectedInvoice)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPrinter /> Print Invoice
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.invoiceId}
                      </h2>
                      <div className="text-gray-600">
                        <span className="font-medium">Vendor:</span> {selectedInvoice.vendorName || selectedInvoice.vendorId?.name || '-'}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <div className="text-gray-600">
                        <span className="font-medium">Invoice Date:</span> {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Created:</span> {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Line Items</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Unit
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Threshold
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price/Unit
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.lineItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.thresholdValue}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{item.pricePerUnit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                ₹{item.totalPrice}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-blue-50 p-4 rounded-lg w-full md:w-1/2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold text-gray-700">Subtotal</span>
                        <span className="text-lg font-medium text-gray-900">
                          {selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Total</span>
                        <span className="text-xl font-bold text-blue-600">
                          {typeof selectedInvoice.totalInvoicePrice === 'number'
                            ? selectedInvoice.totalInvoicePrice.toFixed(2)
                            : selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
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