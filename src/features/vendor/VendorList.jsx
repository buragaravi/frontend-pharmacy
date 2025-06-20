import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/vendors?page=${currentPage}&limit=${vendorsPerPage}&search=${searchTerm}`, { signal });
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
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/invoices');
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
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900 mb-4 sm:mb-0">Vendor Management</h1>
        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition" onClick={handleAddVendor}>
            + Add New Vendor
          </button>
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-6 py-2 rounded-lg shadow transition border border-blue-300" onClick={handlePrintAllVendors}>
            Print All Invoices (PDF)
          </button>
        </div>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2 items-center">
          <DatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={update => setDateRange(update)}
            isClearable={true}
            placeholderText="Date range"
            className="px-2 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
            className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
            className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={selectedVendor}
            onChange={e => setSelectedVendor(e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Vendors</option>
            {vendorNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {(searchTerm || dateRange[0] || dateRange[1] || minAmount || maxAmount || selectedVendor) && (
            <button
              onClick={() => {
                setSearchTerm(''); setDateRange([null, null]); setMinAmount(''); setMaxAmount(''); setSelectedVendor('');
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-blue-700 hover:bg-blue-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white bg-opacity-40 backdrop-blur-md transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
            <VendorForm 
              vendor={editingVendor} 
              onSubmit={handleFormSubmit} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow">
        <table className="min-w-full divide-y divide-blue-100">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Total Business</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {loading ? (
              <VendorSkeleton rows={vendorsPerPage} />
            ) : filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={e => { if (e.target.nodeName !== 'BUTTON' && e.target.nodeName !== 'svg' && e.target.nodeName !== 'path') { setModalVendor(vendor); setModalOpen(true); } }}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-900">{vendor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700">{vendor.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-blue-900">Rs.{getVendorBusiness(vendor._id).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button className="text-blue-600 hover:text-blue-900 mr-2" onClick={e => { e.stopPropagation(); handleEditVendor(vendor); }} title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3zm0 0v3a1 1 0 001 1h3" /></svg></button>
                    <button className="text-red-500 hover:text-red-700" onClick={e => { e.stopPropagation(); handleDeleteVendor(vendor._id); }} title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center text-gray-500 py-12">No vendors found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="flex justify-center mt-8">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`mx-1 px-4 py-2 rounded-lg border ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-300'} transition`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {error && <div className="text-red-500 text-center mt-4">Error: {error}</div>}

      {/* Modal for vendor invoices */}
      {modalOpen && modalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-100 bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 p-6 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">{modalVendor.name} - Invoices</h3>
              <button onClick={() => setModalOpen(false)} className="text-blue-400 hover:text-blue-600 transition-colors ml-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Invoice No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-blue-800 uppercase tracking-wider">Print</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {invoices.filter(inv => inv.vendorId && (inv.vendorId._id === modalVendor._id || inv.vendorId === modalVendor._id)).map(inv => {
                      const totalPrice = typeof inv.totalInvoicePrice === 'number' ? inv.totalInvoicePrice : inv.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
                      return (
                        <tr key={inv._id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={e => { if (e.target.nodeName !== 'BUTTON' && e.target.nodeName !== 'svg' && e.target.nodeName !== 'path') { setSelectedInvoice(inv); setModalInvoiceOpen(true); } }}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">{inv.invoiceId}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900 text-right">Rs.{totalPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button className="text-blue-600 hover:text-blue-900" onClick={e => { e.stopPropagation(); handlePrintInvoicePDF(inv); }} title="Print Invoice"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal for single invoice details (reuse logic from VendorInvoices) */}
      {modalInvoiceOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-100 bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 p-6 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">Invoice Details</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm" onClick={() => handlePrintInvoicePDF(selectedInvoice)}>
                  Print Invoice (PDF)
                </button>
                <button onClick={() => setModalInvoiceOpen(false)} className="text-blue-400 hover:text-blue-600 transition-colors ml-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Invoice Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Number:</span><span className="font-medium">{selectedInvoice.invoiceNumber}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Date:</span><span>{selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Created:</span><span>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">ID:</span><span className="font-mono">{selectedInvoice.invoiceId}</span></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Vendor Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-medium">{selectedInvoice.vendorName || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total Amount:</span><span className="font-bold text-blue-900">Rs.{typeof selectedInvoice.totalInvoicePrice === 'number' ? selectedInvoice.totalInvoicePrice.toFixed(2) : selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-blue-800 mb-4">Line Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Unit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Price/Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {selectedInvoice.lineItems.map((li, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{li.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{li.unit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{li.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">Rs.{li.pricePerUnit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-900 text-right">Rs.{li.totalPrice}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{li.expiryDate ? new Date(li.expiryDate).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white bg-opacity-90 backdrop-blur-sm border-t border-blue-100 p-4 flex justify-end">
              <button onClick={() => setModalInvoiceOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;