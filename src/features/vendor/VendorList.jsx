import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import VendorCard from './VendorCard';
import VendorForm from './VendorForm';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(8);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [modalVendor, setModalVendor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalInvoiceOpen, setModalInvoiceOpen] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const navigate = useNavigate();

  // Skeleton loader for vendor table rows
  const VendorSkeleton = ({ rows = 8 }) => (
    <tbody>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          {[...Array(4)].map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="shimmer h-4 w-full rounded" style={{ minWidth: 40, maxWidth: 120, margin: '0 auto' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  useEffect(() => {
    let ignore = false;
    const fetchVendors = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use AbortController for fast navigation
        const controller = new AbortController();
        const signal = controller.signal;
        // Start fetch
        const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/vendors?page=${currentPage}&limit=${vendorsPerPage}&search=${searchTerm}`, { 
          signal,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server did not return JSON. Check backend API URL and server status.');
        }
        const data = await response.json();
        if (!ignore) {
          if (response.ok) {
            setVendors(data.vendors);
          } else {
            throw new Error(data.message || 'Failed to fetch vendors');
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setVendors([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
      return () => { ignore = true; };
    };
    fetchVendors();
    // Cleanup for fast navigation
    return () => { ignore = true; };
  }, [currentPage, searchTerm]);

  // Fetch invoices for all vendors
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/invoices', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        setInvoices(res.data || []);
      } catch (err) {
        // ignore for now
      }
    };
    fetchInvoices();
  }, []);

  // Calculate total business for a vendor
  const getVendorBusiness = (vendorId) => {
    const vendorInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === vendorId || inv.vendorId === vendorId));
    return vendorInvoices.reduce((sum, inv) => {
      if (typeof inv.totalInvoicePrice === 'number') return sum + inv.totalInvoicePrice;
      return sum + (inv.lineItems?.reduce((s, li) => s + (Number(li.totalPrice) || 0), 0) || 0);
    }, 0);
  };

  // Print all invoices for all vendors (PDF)
  const handlePrintAllVendors = async () => {
    if (typeof window !== 'undefined' && !window.jspdfAutotable) {
      const autotable = await import('jspdf-autotable');
      window.jspdfAutotable = autotable.default || autotable;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
    const pageWidth = 297;
    const pageHeight = 210;
    const leftMargin = 15;
    const rightMargin = 15;
    const deepSeaBlue = [11, 56, 97];
    const skyBlue = [33, 150, 243];
    const white = [255, 255, 255];
    let y = 0;
    let vendorSummaryRows = [];
    let grandTotal = 0;
    // Only include vendors with at least one invoice
    const vendorsWithInvoices = vendors.filter(vendor => {
      const vendorInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === vendor._id || inv.vendorId === vendor._id));
      return vendorInvoices.length > 0;
    });
    vendorsWithInvoices.forEach((vendor, idx) => {
      if (idx > 0) doc.addPage();
      // Header
      doc.setFillColor(...deepSeaBlue);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setFillColor(...skyBlue);
      doc.rect(pageWidth / 2, 0, pageWidth / 2, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...white);
      doc.text('VENDOR INVOICE REPORT', pageWidth / 2, 14, { align: 'center' });
      doc.setDrawColor(...deepSeaBlue);
      doc.setLineWidth(1.2);
      doc.line(leftMargin, 24, pageWidth - rightMargin, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...deepSeaBlue);
      doc.text(`Vendor: ${vendor.name}`, leftMargin, 30);
      doc.text(`Phone: ${vendor.phone || ''}`, leftMargin, 36);
      // Table
      const columns = [
        { title: 'Invoice No', dataKey: 'invoiceNumber' },
        { title: 'Date', dataKey: 'invoiceDate' },
        { title: 'ID', dataKey: 'invoiceId' },
        { title: 'No. of Products', dataKey: 'numProducts' },
        { title: 'Amount', dataKey: 'amount' }
      ];
      const vendorInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === vendor._id || inv.vendorId === vendor._id));
      const tableData = vendorInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-',
        invoiceId: inv.invoiceId,
        numProducts: inv.lineItems?.length || 0,
        amount: (typeof inv.totalInvoicePrice === 'number' ? inv.totalInvoicePrice : inv.lineItems?.reduce((s, li) => s + (Number(li.totalPrice) || 0), 0) || 0).toFixed(2)
      }));
      if (typeof window !== 'undefined' && window.jspdfAutotable) {
        window.jspdfAutotable(doc, {
          head: [columns.map(col => col.title)],
          body: tableData.map(row => columns.map(col => row[col.dataKey])),
          startY: 42,
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: 'auto',
          styles: { fontSize: 10, cellPadding: 3, font: 'helvetica', textColor: [33, 37, 41], lineColor: skyBlue, fillColor: white },
          headStyles: { fillColor: deepSeaBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 12 },
          bodyStyles: { halign: 'center' },
          alternateRowStyles: { fillColor: [241, 249, 253] },
        });
      }
      const total = getVendorBusiness(vendor._id).toFixed(2);
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 42;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...skyBlue);
      doc.text(`Total Business Value: Rs.${total}`, leftMargin, finalY + 12, { align: 'left' });
      doc.setFontSize(10);
      doc.setTextColor(...skyBlue);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      // Collect summary row
      vendorSummaryRows.push([
        vendor.name,
        vendor.phone || '-',
        vendorInvoices.length,
        `Rs.${total}`
      ]);
      grandTotal += parseFloat(total);
    });
    // Add summary table at the end (only if there are vendors with invoices)
    if (vendorsWithInvoices.length > 0) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...deepSeaBlue);
      doc.text('VENDOR SUMMARY', pageWidth / 2, 18, { align: 'center' });
      doc.setDrawColor(...skyBlue);
      doc.setLineWidth(1.2);
      doc.line(leftMargin, 22, pageWidth - rightMargin, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(...deepSeaBlue);
      if (typeof window !== 'undefined' && window.jspdfAutotable) {
        window.jspdfAutotable(doc, {
          head: [['Vendor Name', 'Phone', 'No. of Invoices', 'Total Business']],
          body: vendorSummaryRows,
          startY: 30,
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: 'auto',
          styles: { fontSize: 12, cellPadding: 4, font: 'helvetica', textColor: [33, 37, 41], lineColor: skyBlue, fillColor: white },
          headStyles: { fillColor: deepSeaBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 13 },
          bodyStyles: { halign: 'center' },
          alternateRowStyles: { fillColor: [241, 249, 253] },
        });
      }
      // Grand total in bold
      const summaryFinalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 60;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...skyBlue);
      doc.text(`Grand Total Business Value: Rs.${grandTotal.toFixed(2)}`, leftMargin, summaryFinalY + 16, { align: 'left' });
      // Authorized signature
      const signatureLineWidth = 60;
      const signatureY = summaryFinalY + 40;
      const signatureX = pageWidth - rightMargin - signatureLineWidth;
      doc.setDrawColor(...deepSeaBlue);
      doc.setLineWidth(0.7);
      doc.line(signatureX, signatureY, signatureX + signatureLineWidth, signatureY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(...deepSeaBlue);
      doc.text('Authorized Signature', signatureX + signatureLineWidth / 2, signatureY + 7, { align: 'center' });
      // Footer: timestamp
      doc.setFontSize(10);
      doc.setTextColor(...skyBlue);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // Print single invoice (PDF, styled)
  const handlePrintInvoicePDF = async (invoice) => {
    if (typeof window !== 'undefined' && !window.jspdfAutotable) {
      const autotable = await import('jspdf-autotable');
      window.jspdfAutotable = autotable.default || autotable;
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    const pageWidth = 210;
    const leftMargin = 15;
    const rightMargin = 15;
    const deepSeaBlue = [11, 56, 97];
    const skyBlue = [33, 150, 243];
    const white = [255, 255, 255];
    doc.setFillColor(...deepSeaBlue);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.text('INVOICE', pageWidth / 2, 12, { align: 'center' });
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
        styles: { fontSize: 10, cellPadding: 3, font: 'helvetica', textColor: [33, 37, 41], lineColor: skyBlue, fillColor: white },
        headStyles: { fillColor: deepSeaBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 11 },
        bodyStyles: { halign: 'center' },
        alternateRowStyles: { fillColor: [241, 249, 253] },
      });
    }
    const totalPrice = typeof invoice.totalInvoicePrice === 'number' ? invoice.totalInvoicePrice : invoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
    const afterTableY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : y + 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...skyBlue);
    doc.text(`Total Invoice Price: Rs.${totalPrice.toFixed(2)}`, leftMargin, afterTableY + 12, { align: 'left' });
    doc.setFontSize(9);
    doc.setTextColor(...skyBlue);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 292, { align: 'center' });
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // Search logic (in-page, not separate component)
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Pagination logic (in-page, not separate component)
  const totalPages = Math.ceil(vendors.length / vendorsPerPage);
  const paginatedVendors = vendors.slice((currentPage - 1) * vendorsPerPage, currentPage * vendorsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowForm(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setShowForm(true);
  };

  const handleDeleteVendor = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/vendors/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setVendors(vendors.filter(vendor => vendor._id !== id));
        } else {
          throw new Error('Failed to delete vendor');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFormSubmit = async (vendorData) => {
    try {
      const url = editingVendor ? `https://backend-pharmacy-5541.onrender.com/api/vendors/${editingVendor._id}` : 'https://backend-pharmacy-5541.onrender.com/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendorData)
      });
      const data = await response.json();
      if (response.ok) {
        if (editingVendor) {
          setVendors(vendors.map(v => v._id === editingVendor._id ? data : v));
        } else {
          setVendors([data, ...vendors]);
        }
        setShowForm(false);
      } else {
        throw new Error(data.message || 'Failed to save vendor');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered vendors logic
  const filteredVendors = vendors.filter(vendor => {
    // Vendor name/phone search
    const searchMatch =
      (!searchTerm ||
        vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase()));
    // Vendor filter dropdown
    const vendorMatch = !selectedVendor || vendor.name === selectedVendor;
    // Invoice filters (date/amount)
    const vendorInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === vendor._id || inv.vendorId === vendor._id));
    // Date filter
    const dateMatch = !dateRange[0] || !dateRange[1] || vendorInvoices.some(inv => {
      const invDate = new Date(inv.invoiceDate);
      return invDate >= dateRange[0] && invDate <= dateRange[1];
    });
    // Amount filter
    const amountMatch = (!minAmount && !maxAmount) || vendorInvoices.some(inv => {
      const total = typeof inv.totalInvoicePrice === 'number' ? inv.totalInvoicePrice : (inv.lineItems?.reduce((s, li) => s + (Number(li.totalPrice) || 0), 0) || 0);
      return (!minAmount || total >= Number(minAmount)) && (!maxAmount || total <= Number(maxAmount));
    });
    // Only show vendors with at least one invoice in range if date/amount filter is set
    const hasInvoiceInRange = (!dateRange[0] && !dateRange[1] && !minAmount && !maxAmount) || vendorInvoices.some(inv => {
      const invDate = new Date(inv.invoiceDate);
      const total = typeof inv.totalInvoicePrice === 'number' ? inv.totalInvoicePrice : (inv.lineItems?.reduce((s, li) => s + (Number(li.totalPrice) || 0), 0) || 0);
      const dateOk = !dateRange[0] || !dateRange[1] || (invDate >= dateRange[0] && invDate <= dateRange[1]);
      const amountOk = (!minAmount || total >= Number(minAmount)) && (!maxAmount || total <= Number(maxAmount));
      return dateOk && amountOk;
    });
    return searchMatch && vendorMatch && dateMatch && amountMatch && hasInvoiceInRange;
  })
  .sort((a, b) => {
    // Sort by business value (desc), then by number of invoices (desc)
    const aBusiness = getVendorBusiness(a._id);
    const bBusiness = getVendorBusiness(b._id);
    if (bBusiness !== aBusiness) return bBusiness - aBusiness;
    // If business value is same, sort by invoice count (desc)
    const aInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === a._id || inv.vendorId === a._id)).length;
    const bInvoices = invoices.filter(inv => inv.vendorId && (inv.vendorId._id === b._id || inv.vendorId === b._id)).length;
    return bInvoices - aInvoices;
  });

  // Unique vendor names for dropdown
  const vendorNames = Array.from(new Set(vendors.map(v => v.name)));

  return (
    <>
      <div className="w-full">
        <div className="w-full max-w-none mx-auto  overflow-hidden relative">
          {/* Enhanced Header Section - Beautiful Gradient at Top */}
          <div className="relative bg-blue-600 p-2 text-white overflow-hidden rounded-b-3xl">
            <div className="absolute inset-0 bg-blue-800/20"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold mb-2">Vendor Management</h1>
                    <p className="text-blue-100 text-md">Manage vendors and track business relationships</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <button 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    onClick={handleAddVendor}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Vendor
                  </button>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
              <div className="w-40 h-40 bg-white/10 rounded-full"></div>
            </div>
            <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-32 h-32 bg-white/10 rounded-full"></div>
            </div>
          </div>

        {/* Enhanced Search and Filter Section */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-md">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800">Search & Filter</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Vendors</label>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="relative z-50">
                  <DatePicker
                    selectsRange={true}
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    onChange={update => setDateRange(update)}
                    isClearable={true}
                    placeholderText="Select date range"
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    popperClassName="react-datepicker-popper-high-z"
                    portalId="react-datepicker-portal"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Filter</label>
                <select
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Vendors</option>
                  {vendorNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {(searchTerm || dateRange[0] || dateRange[1] || minAmount || maxAmount || selectedVendor) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm(''); setDateRange([null, null]); setMinAmount(''); setMaxAmount(''); setSelectedVendor('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Enhanced Vendor Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 my-4">
              <VendorForm 
                vendor={editingVendor} 
                onSubmit={handleFormSubmit} 
                onCancel={() => setShowForm(false)} 
              />
            </div>
          </div>
        )}

        {/* Enhanced Vendor Table Section */}
        <div className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-md">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800">Vendors ({filteredVendors.length})</h3>
              </div>
              
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={handlePrintAllVendors}
                title="Export all vendor invoices to PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Vendor Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Business</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <VendorSkeleton rows={vendorsPerPage} />
                  ) : filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor, index) => (
                      <tr 
                        key={vendor._id} 
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        onClick={e => { if (e.target.nodeName !== 'BUTTON' && e.target.nodeName !== 'svg' && e.target.nodeName !== 'path') { setModalVendor(vendor); setModalOpen(true); } }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                              <div className="text-sm text-gray-500">
                                {invoices.filter(inv => inv.vendorId && (inv.vendorId._id === vendor._id || inv.vendorId === vendor._id)).length} invoices
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.phone || '-'}</div>
                          <div className="text-sm text-gray-500">{vendor.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-blue-900">₹{getVendorBusiness(vendor._id).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Total business</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200" 
                              onClick={e => { e.stopPropagation(); handleEditVendor(vendor); }} 
                              title="Edit Vendor"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200" 
                              onClick={e => { e.stopPropagation(); handleDeleteVendor(vendor._id); }} 
                              title="Delete Vendor"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">No vendors found</p>
                          <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === i + 1 
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                          : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 hover:scale-105'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium">Error occurred</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        </div>
      </div>

        {/* Enhanced Vendor Invoices Modal - Using Portal for Top-Level Rendering */}
        {modalOpen && modalVendor && createPortal(
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{modalVendor.name} - Invoice History</h3>
                    <p className="text-blue-100 mt-1">View and manage vendor invoices</p>
                  </div>
                  <button 
                    onClick={() => setModalOpen(false)} 
                    className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-blue-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Invoice No</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-blue-800 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {invoices.filter(inv => inv.vendorId && (inv.vendorId._id === modalVendor._id || inv.vendorId === modalVendor._id)).map((inv, index) => {
                        const totalPrice = typeof inv.totalInvoicePrice === 'number' ? inv.totalInvoicePrice : inv.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
                        return (
                          <tr 
                            key={inv._id} 
                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 cursor-pointer transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                            onClick={e => { if (e.target.nodeName !== 'BUTTON' && e.target.nodeName !== 'svg' && e.target.nodeName !== 'path') { setSelectedInvoice(inv); setModalInvoiceOpen(true); } }}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">{inv.invoiceId}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900 text-right">₹{totalPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button 
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200" 
                                onClick={e => { e.stopPropagation(); handlePrintInvoicePDF(inv); }} 
                                title="Print Invoice"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Enhanced Invoice Details Modal - Using Portal for Top-Level Rendering */}
        {modalInvoiceOpen && selectedInvoice && createPortal(
          <div 
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalInvoiceOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Invoice Details</h3>
                    <p className="text-blue-100 mt-1">Complete invoice information</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 border border-white/30"
                      onClick={() => handlePrintInvoicePDF(selectedInvoice)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print PDF
                    </button>
                    <button 
                      onClick={() => setModalInvoiceOpen(false)} 
                      className="text-white/80 hover:text-white transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Invoice Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number:</span>
                        <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono text-sm">{selectedInvoice.invoiceId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Vendor Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedInvoice.vendorName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-green-700 text-lg">₹{typeof selectedInvoice.totalInvoicePrice === 'number' ? selectedInvoice.totalInvoicePrice.toFixed(2) : selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                      </svg>
                      Product Line Items
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">Unit</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 uppercase tracking-wider">Price/Unit</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {selectedInvoice.lineItems.map((li, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{li.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{li.unit}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{li.quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">₹{li.pricePerUnit}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-900 text-right">₹{li.totalPrice}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{li.expiryDate ? new Date(li.expiryDate).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Custom Styles for DatePicker z-index fix and animations */}
      <style jsx global>{`
        /* DatePicker z-index fix */
        .react-datepicker__portal {
          z-index: 99999 !important;
        }
        
        .react-datepicker-popper,
        .react-datepicker-popper-high-z {
          z-index: 99999 !important;
        }
        
        .react-datepicker {
          z-index: 99999 !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          position: relative !important;
        }

        /* Ensure DatePicker wrapper has proper positioning */
        .react-datepicker-wrapper {
          position: relative !important;
          z-index: 50 !important;
        }
        
        .react-datepicker__header {
          background-color: #f8fafc !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }
        
        .react-datepicker__current-month {
          font-weight: 600 !important;
          color: #374151 !important;
        }
        
        .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        
        .react-datepicker__day--selected:hover {
          background-color: #2563eb !important;
        }
        
        .react-datepicker__day:hover {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
        }
        
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Animation for fade in */
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default VendorList;