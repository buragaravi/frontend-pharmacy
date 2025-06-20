import React, { useEffect, useState } from 'react';
import axios from 'axios';
import printJS from 'print-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_BASE = 'https://backend-pharmacy-5541.onrender.com/api';

const VendorInvoices = () => {
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      d.setHours(0,0,0,0);
      return d;
    })(),
    to: (() => {
      const d = new Date();
      d.setHours(23,59,59,999);
      return d;
    })()
  });
  const [vendorNameFilter, setVendorNameFilter] = useState('');

  const vendorListRef = React.useRef();
  const vendorRefs = React.useRef({});
  const invoiceModalRef = React.useRef();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/vendors`),
      axios.get(`${API_BASE}/invoices`)
    ])
      .then(([vendorRes, invoiceRes]) => {
        setVendors(vendorRes.data.vendors || vendorRes.data.data || []);
        setInvoices(invoiceRes.data || []);
        setError('');
      })
      .catch(() => setError('Failed to load vendors or invoices'))
      .finally(() => setLoading(false));
  }, []);

  // Filter vendors by name
  let filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorNameFilter.toLowerCase()));
  // Filter invoices by date and vendor name
  const filteredInvoices = invoices.filter(inv => {
    const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
    const vendorName = inv.vendorName || (inv.vendorId && inv.vendorId.name) || '';
    return (
      (!invDate || (invDate >= dateRange.from && invDate <= dateRange.to)) &&
      (!vendorNameFilter || vendorName.toLowerCase().includes(vendorNameFilter.toLowerCase()))
    );
  });
  // Always sort vendors by most invoices (descending)
  filteredVendors.sort((a, b) => {
    const aCount = filteredInvoices.filter(inv => inv.vendorId && (inv.vendorId._id === a._id || inv.vendorId === a._id)).length;
    const bCount = filteredInvoices.filter(inv => inv.vendorId && (inv.vendorId._id === b._id || inv.vendorId === b._id)).length;
    return bCount - aCount;
  });
  // Now build vendorInvoicesMap after sorting
  const vendorInvoicesMap = filteredVendors.reduce((acc, vendor) => {
    acc[vendor._id] = filteredInvoices.filter(inv =>
      inv.vendorId && (inv.vendorId._id === vendor._id || inv.vendorId === vendor._id)
    );
    return acc;
  }, {});

  const handleRowClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedInvoice(null), 300); // Allow animation to complete
  };

  // Calculate business value for each vendor
  const vendorBusinessValue = (vendorId) => {
    const invoicesArr = vendorInvoicesMap[vendorId] || [];
    return invoicesArr.reduce((sum, inv) => {
      const invValue = typeof inv.totalInvoicePrice === 'number'
        ? inv.totalInvoicePrice
        : inv.lineItems.reduce((liSum, li) => liSum + (Number(li.totalPrice) || 0), 0);
      return sum + invValue;
    }, 0);
  };

  // Calculate total business value for all vendors
  const totalBusinessValue = vendors.reduce((sum, vendor) => sum + vendorBusinessValue(vendor._id), 0);

  // Helper to generate and print PDF for vendor invoices using QuotationCard's PDF logic
  const handlePrintVendorPDF = async (vendor) => {
    // Dynamically import jspdf-autotable and attach to window if needed
    if (typeof window !== 'undefined' && !window.jspdfAutotable) {
      const autotable = await import('jspdf-autotable');
      window.jspdfAutotable = autotable.default || autotable;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
    const pageWidth = 297;
    const pageHeight = 210;
    const leftMargin = 15;
    const rightMargin = 15;
    const availableWidth = pageWidth - leftMargin - rightMargin;
    // Colors
    const deepSeaBlue = [11, 56, 97]; // #0B3861
    const skyBlue = [33, 150, 243];   // #2196F3
    const white = [255, 255, 255];
    // Header Gradient
    const headerHeight = 22;
    doc.setFillColor(...deepSeaBlue);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setFillColor(...skyBlue);
    doc.rect(pageWidth / 2, 0, pageWidth / 2, headerHeight, 'F');
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...white);
    doc.text('VENDOR INVOICE REPORT', pageWidth / 2, 15, { align: 'center' });
    // Decorative line
    doc.setDrawColor(...deepSeaBlue);
    doc.setLineWidth(1.2);
    doc.line(leftMargin, headerHeight + 2, pageWidth - rightMargin, headerHeight + 2);
    // Vendor details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...deepSeaBlue);
    doc.text(`Vendor: ${vendor.name}`, leftMargin, headerHeight + 10);
    doc.text(`Code: ${vendor.vendorCode || ''}`, leftMargin, headerHeight + 16);
    if (vendor.email) doc.text(`Email: ${vendor.email}`, leftMargin, headerHeight + 22);
    // Table columns (PDF only)
    const columns = [
      { title: 'Invoice No', dataKey: 'invoiceNumber', minWidth: 30 },
      { title: 'Date', dataKey: 'invoiceDate', minWidth: 30 },
      { title: 'Created', dataKey: 'createdAt', minWidth: 30 },
      { title: 'ID', dataKey: 'invoiceId', minWidth: 40 },
      { title: 'No. of Products', dataKey: 'numProducts', minWidth: 25 },
      { title: 'Avg Price per Item', dataKey: 'avgPrice', minWidth: 30 },
      { title: 'Amount', dataKey: 'amount', minWidth: 30 }

    ];
    const invoicesArr = vendorInvoicesMap[vendor._id] || [];
    const tableData = invoicesArr.map(inv => {
      const numProducts = inv.lineItems?.length || 0;
      const totalPrice = typeof inv.totalInvoicePrice === 'number'
        ? inv.totalInvoicePrice
        : inv.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
      const avgPrice = numProducts > 0 ? (totalPrice / numProducts).toFixed(2) : '—';
      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-',
        createdAt: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-',
        invoiceId: inv.invoiceId,
        amount: totalPrice.toFixed(2),
        numProducts,
        avgPrice: avgPrice !== 'NaN' ? `${avgPrice}` : '—'
      };
    });
    // Table (styled like UI)
    if (typeof window !== 'undefined' && window.jspdfAutotable) {
      window.jspdfAutotable(doc, {
        head: [columns.map(col => col.title)],
        body: tableData.map(row => columns.map(col => row[col.dataKey])),
        startY: headerHeight + 28,
        margin: { left: leftMargin, right: rightMargin },
        tableWidth: 'auto', // Let autoTable fit the table to the page
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
          fontSize: 12
        },
        bodyStyles: {
          halign: 'center',
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [241, 249, 253]
        },
        columnStyles: columns.reduce((styles, col, i) => {
          styles[i] = {
            cellWidth: 'auto', // Let autoTable handle column width
            halign: ['invoiceNumber', 'amount'].includes(col.dataKey)
              ? 'center' : 'left'
          };
          return styles;
        }, {})
      });
    }
    // Total Business Value (big, bold, colorful, left-aligned)
    const total = vendorBusinessValue(vendor._id).toFixed(2);
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : headerHeight + 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...skyBlue);
    doc.text(
      `Total Business Value: ${total}`,
      leftMargin, // Align to left margin
      finalY + 12,
      { align: 'left' }
    );
    // Authorized Signature (bottom right, signature line and label centered below)
    const signatureLineWidth = 60;
    const signatureY = pageHeight - 32;
    const signatureX = pageWidth - rightMargin - signatureLineWidth;
    doc.setDrawColor(...deepSeaBlue);
    doc.setLineWidth(0.7);
    doc.line(signatureX, signatureY, signatureX + signatureLineWidth, signatureY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(...deepSeaBlue);
    doc.text(
      'Authorized Signature',
      signatureX + signatureLineWidth / 2,
      signatureY + 7,
      { align: 'center' }
    );
    // Footer: timestamp (bottom center)
    doc.setFontSize(10);
    doc.setTextColor(...skyBlue);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    // Open print dialog for PDF (no download)
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // Add print PDF function for selected invoice
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
    // Footer: timestamp
    doc.setFontSize(9);
    doc.setTextColor(...skyBlue);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 292, { align: 'center' });
    // Open print dialog for PDF (no download)
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl p-8 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-blue-800 font-medium">Loading vendor data...</span>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl p-8 shadow-lg text-red-500 text-center max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto" id="vendor-list-section" ref={vendorListRef}>
        <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Vendor Invoices</h1>
            <p className="text-blue-600">View and manage all vendor invoices in one place</p>
          </div>
        </div>

        {vendors.length === 0 ? (
          <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-8 text-center text-gray-500">
            No vendors found in the system.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters UI */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-xs text-blue-700 font-semibold mb-1">Vendor Name</label>
                <input
                  type="text"
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Search vendor name..."
                  value={vendorNameFilter}
                  onChange={e => setVendorNameFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 font-semibold mb-1">From</label>
                <input
                  type="date"
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={dateRange.from.toISOString().slice(0,10)}
                  onChange={e => setDateRange(r => ({...r, from: new Date(e.target.value)}))}
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 font-semibold mb-1">To</label>
                <input
                  type="date"
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={dateRange.to.toISOString().slice(0,10)}
                  onChange={e => setDateRange(r => ({...r, to: new Date(e.target.value)}))}
                />
              </div>
            </div>

            {vendors.map(vendor => (
              <div key={vendor._id} id={`vendor-section-${vendor._id}`} ref={el => vendorRefs.current[vendor._id] = el} className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
                <div className="p-6 border-b border-blue-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h2 className="text-xl font-bold text-blue-800">{vendor.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Code: {vendor.vendorCode}
                        </span>
                        {vendor.email && (
                          <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {vendor.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600">
                      {vendorInvoicesMap[vendor._id]?.length || 0} invoices
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-sm text-blue-800">Business Value: <span className="font-bold text-blue-900">₹{vendorBusinessValue(vendor._id).toFixed(2)}</span></span>
                  <button
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs"
                    onClick={() => handlePrintVendorPDF(vendor)}
                  >
                    Print Vendor Invoices (PDF)
                  </button>
                </div>

                {vendorInvoicesMap[vendor._id] && vendorInvoicesMap[vendor._id].length > 0 ? (
                  <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Invoice No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider hidden md:table-cell">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {vendorInvoicesMap[vendor._id].map(inv => {
                          const totalPrice = typeof inv.totalInvoicePrice === 'number'
                            ? inv.totalInvoicePrice
                            : inv.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
                          return (
                            <tr 
                              key={inv._id} 
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => handleRowClick(inv)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-blue-900">{inv.invoiceNumber}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">
                                  {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                <div className="text-sm text-gray-500">
                                  {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono text-blue-600">{inv.invoiceId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-semibold text-blue-900">
                                  ₹{totalPrice.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Total business value for this vendor at the bottom of their list */}
                  <div className="flex justify-start items-center p-4">
                    <span className="text-base font-bold text-blue-900">Total Business Value: ₹{vendorBusinessValue(vendor._id).toFixed(2)}</span>
                  </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    No invoices found for this vendor
                  </div>
                )}
              </div>
            ))}
            {/* Total business value at the bottom */}
            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:justify-start md:items-center mt-8 gap-4">
              <span className="text-xl font-bold text-blue-900">Total Business Value with All Vendors:</span>
              <span className="text-2xl font-bold text-blue-900">₹{totalBusinessValue.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal for invoice details */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-100 bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
          <div 
            ref={invoiceModalRef}
            id="invoice-modal-section"
            className="bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 p-6 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">Invoice Details</h3>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  onClick={() => handlePrintInvoicePDF(selectedInvoice)}
                >
                  Print Invoice (PDF)
                </button>
                <button 
                  onClick={closeModal}
                  className="text-blue-400 hover:text-blue-600 transition-colors ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Invoice Information</h4>
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
                      <span className="font-mono">{selectedInvoice.invoiceId}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Vendor Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedInvoice.vendorName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-blue-900">
                        ₹{typeof selectedInvoice.totalInvoicePrice === 'number' ? 
                          selectedInvoice.totalInvoicePrice.toFixed(2) : 
                          selectedInvoice.lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0).toFixed(2)}
                      </span>
                    </div>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">₹{li.pricePerUnit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-900 text-right">₹{li.totalPrice}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {li.expiryDate ? new Date(li.expiryDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white bg-opacity-90 backdrop-blur-sm border-t border-blue-100 p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoices;