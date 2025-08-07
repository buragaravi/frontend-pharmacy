import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import CommentSection from './CommentSection';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// SVG Icons
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FlaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const SummaryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const ExcelIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.8,3H9.2A1.2,1.2 0 0,0 8,4.2V19.8A1.2,1.2 0 0,0 9.2,21H21.8A1.2,1.2 0 0,0 23,19.8V4.2A1.2,1.2 0 0,0 21.8,3M14.34,14.3L12,11.96L9.66,14.3L8.3,12.94L10.64,10.6L8.3,8.26L9.66,6.9L12,9.24L14.34,6.9L15.7,8.26L13.36,10.6L15.7,12.94L14.34,14.3Z" />
  </svg>
);

const PDFIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
);

const QuotationDetail = ({ quotation, isOpen, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken?.user?.role;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !quotation) return null;

  // Calculate totals
  const calculateTotals = () => {
    const chemicalTotal = quotation.chemicals?.reduce((sum, chem) => sum + (chem.pricePerUnit * chem.quantity || 0), 0) || 0;
    const equipmentTotal = quotation.equipment?.reduce((sum, eq) => sum + (eq.pricePerUnit * eq.quantity || 0), 0) || 0;
    const glasswareTotal = quotation.glassware?.reduce((sum, glass) => sum + (glass.pricePerUnit * glass.quantity || 0), 0) || 0;
    const grandTotal = chemicalTotal + equipmentTotal + glasswareTotal;

    return { chemicalTotal, equipmentTotal, glasswareTotal, grandTotal };
  };

  const { chemicalTotal, equipmentTotal, glasswareTotal, grandTotal } = calculateTotals();

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      case 'pending': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
      case 'rejected': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'draft': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
      case 'allocated': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
    }
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'summary', 
      label: 'Summary', 
      icon: SummaryIcon,
      count: quotation.itemCounts?.totalItems || 0
    },
    ...(quotation.chemicals && quotation.chemicals.length > 0 ? [{
      id: 'chemicals',
      label: 'Chemicals',
      icon: FlaskIcon,
      count: quotation.chemicals.length
    }] : []),
    ...(quotation.equipment && quotation.equipment.length > 0 ? [{
      id: 'equipment',
      label: 'Equipment',
      icon: EquipmentIcon,
      count: quotation.equipment.length
    }] : []),
    ...(quotation.glassware && quotation.glassware.length > 0 ? [{
      id: 'glassware',
      label: 'Glassware',
      icon: GlasswareIcon,
      count: quotation.glassware.length
    }] : [])
  ];

  // Enhanced PDF Export
  const handlePDFExport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
    const pageWidth = 297;
    const pageHeight = 210;
    const leftMargin = 15;
    const rightMargin = 15;
    
    // Colors
    const vibrantBlue = [33, 150, 243];
    const darkBlue = [25, 118, 210];
    const white = [255, 255, 255];
    
    // Header
    const headerHeight = 25;
    doc.setFillColor(...vibrantBlue);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...white);
    doc.text('QUOTATION DETAILS', pageWidth / 2, 15, { align: 'center' });
    
    // Quotation info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...darkBlue);
    const startY = headerHeight + 10;
    
    doc.text(`Quotation ID: ${quotation._id.slice(-6).toUpperCase()}`, leftMargin, startY);
    doc.text(`Type: ${quotation.quotationType?.toUpperCase() || 'MIXED'}`, leftMargin, startY + 6);
    doc.text(`Status: ${quotation.status.toUpperCase()}`, leftMargin, startY + 12);
    doc.text(`Created: ${new Date(quotation.createdAt).toLocaleDateString()}`, pageWidth - rightMargin - 50, startY);
    doc.text(`Lab ID: ${quotation.labId || 'N/A'}`, pageWidth - rightMargin - 50, startY + 6);
    doc.text(`Total: ₹${grandTotal.toFixed(2)}`, pageWidth - rightMargin - 50, startY + 12);

    // Prepare data for table
    const allItems = [];
    let itemCounter = 1;

    // Add all items
    if (quotation.chemicals) {
      quotation.chemicals.forEach(chem => {
        allItems.push([
          itemCounter++,
          'Chemical',
          chem.chemicalName,
          chem.quantity,
          chem.unit,
          chem.pricePerUnit || 0,
          ((chem.pricePerUnit || 0) * chem.quantity).toFixed(2),
          chem.remarks || ''
        ]);
      });
    }

    if (quotation.equipment) {
      quotation.equipment.forEach(eq => {
        allItems.push([
          itemCounter++,
          'Equipment',
          eq.equipmentName,
          eq.quantity,
          eq.unit,
          eq.pricePerUnit || 0,
          ((eq.pricePerUnit || 0) * eq.quantity).toFixed(2),
          `${eq.specifications ? `Specs: ${eq.specifications} | ` : ''}${eq.remarks || ''}`
        ]);
      });
    }

    if (quotation.glassware) {
      quotation.glassware.forEach(glass => {
        allItems.push([
          itemCounter++,
          'Glassware',
          glass.glasswareName,
          glass.quantity,
          glass.unit,
          glass.pricePerUnit || 0,
          ((glass.pricePerUnit || 0) * glass.quantity).toFixed(2),
          `${glass.condition ? `Condition: ${glass.condition} | ` : ''}${glass.remarks || ''}`
        ]);
      });
    }

    // Create table
    autoTable(doc, {
      head: [['#', 'Type', 'Item Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Remarks']],
      body: allItems,
      startY: startY + 20,
      margin: { left: leftMargin, right: rightMargin },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: vibrantBlue,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [227, 242, 253]
      }
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...vibrantBlue);
    doc.text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, pageWidth - rightMargin, footerY - 10, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkBlue);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, footerY);
    doc.text('Authorized Signature: ________________________', pageWidth - 80, footerY);

    doc.save(`Quotation_${quotation._id.slice(-6).toUpperCase()}.pdf`);
  };

  // Enhanced Excel Export
  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Quotation Details'],
      ['ID', quotation._id.slice(-6).toUpperCase()],
      ['Type', quotation.quotationType?.toUpperCase() || 'MIXED'],
      ['Status', quotation.status.toUpperCase()],
      ['Created', new Date(quotation.createdAt).toLocaleString()],
      ['Lab ID', quotation.labId || 'N/A'],
      [],
      ['Item Summary'],
      ['Chemicals', quotation.chemicals?.length || 0],
      ['Equipment', quotation.equipment?.length || 0],
      ['Glassware', quotation.glassware?.length || 0],
      ['Total Items', quotation.itemCounts?.totalItems || 0],
      [],
      ['Price Summary'],
      ['Chemicals Total', `₹${chemicalTotal.toFixed(2)}`],
      ['Equipment Total', `₹${equipmentTotal.toFixed(2)}`],
      ['Glassware Total', `₹${glasswareTotal.toFixed(2)}`],
      ['Grand Total', `₹${grandTotal.toFixed(2)}`]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Individual sheets for each item type
    if (quotation.chemicals && quotation.chemicals.length > 0) {
      const chemData = quotation.chemicals.map((chem, idx) => ({
        '#': idx + 1,
        'Chemical Name': chem.chemicalName,
        'Quantity': chem.quantity,
        'Unit': chem.unit,
        'Price/Unit': chem.pricePerUnit || 0,
        'Total': ((chem.pricePerUnit || 0) * chem.quantity).toFixed(2),
        'Remarks': chem.remarks || ''
      }));
      const chemWs = XLSX.utils.json_to_sheet(chemData);
      XLSX.utils.book_append_sheet(wb, chemWs, 'Chemicals');
    }

    if (quotation.equipment && quotation.equipment.length > 0) {
      const equipData = quotation.equipment.map((eq, idx) => ({
        '#': idx + 1,
        'Equipment Name': eq.equipmentName,
        'Quantity': eq.quantity,
        'Unit': eq.unit,
        'Price/Unit': eq.pricePerUnit || 0,
        'Total': ((eq.pricePerUnit || 0) * eq.quantity).toFixed(2),
        'Specifications': eq.specifications || '',
        'Remarks': eq.remarks || ''
      }));
      const equipWs = XLSX.utils.json_to_sheet(equipData);
      XLSX.utils.book_append_sheet(wb, equipWs, 'Equipment');
    }

    if (quotation.glassware && quotation.glassware.length > 0) {
      const glassData = quotation.glassware.map((glass, idx) => ({
        '#': idx + 1,
        'Glassware Name': glass.glasswareName,
        'Quantity': glass.quantity,
        'Unit': glass.unit,
        'Price/Unit': glass.pricePerUnit || 0,
        'Total': ((glass.pricePerUnit || 0) * glass.quantity).toFixed(2),
        'Condition': glass.condition || 'new',
        'Remarks': glass.remarks || ''
      }));
      const glassWs = XLSX.utils.json_to_sheet(glassData);
      XLSX.utils.book_append_sheet(wb, glassWs, 'Glassware');
    }

    XLSX.writeFile(wb, `Quotation_${quotation._id.slice(-6).toUpperCase()}.xlsx`);
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] px-8 py-6 border-b border-[#2196F3]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Quotation #{quotation._id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="text-[#E3F2FD] text-sm font-medium">
                    {quotation.quotationType ? quotation.quotationType.replace('_', ' ').toUpperCase() : 'MULTI-ITEM'} Quotation
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(quotation.status)}`}>
                  {quotation.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            
            {/* Quick Info Bar */}
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-[#E3F2FD]">
              <div>
                <span className="font-medium">Created:</span> {new Date(quotation.createdAt).toLocaleDateString()}
              </div>
              {quotation.labId && (
                <div>
                  <span className="font-medium">Lab ID:</span> {quotation.labId}
                </div>
              )}
              <div>
                <span className="font-medium">Total Items:</span> {quotation.itemCounts?.totalItems || 0}
              </div>
              <div>
                <span className="font-medium">Grand Total:</span> ₹{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex h-full max-h-[calc(95vh-120px)]">
            
            {/* Sidebar - Tabs */}
            <div className="w-64 bg-[#F5F9FD] border-r border-[#2196F3]/20 p-6">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white shadow-lg'
                          : 'text-[#1976D2] hover:bg-[#E3F2FD]'
                      }`}
                    >
                      <IconComponent />
                      <span className="font-medium">{tab.label}</span>
                      <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-[#2196F3]/20 text-[#2196F3]'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold text-[#1976D2] mb-3">Actions</h3>
                
                <button
                  onClick={handlePDFExport}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-all duration-200 border border-red-200"
                >
                  <PDFIcon />
                  <span className="font-medium">Export PDF</span>
                </button>
                
                <button
                  onClick={handleExcelExport}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-all duration-200 border border-green-200"
                >
                  <ExcelIcon />
                  <span className="font-medium">Export Excel</span>
                </button>
                
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-[#E3F2FD] text-[#1976D2] rounded-2xl hover:bg-[#2196F3] hover:text-white transition-all duration-200 border border-[#2196F3]/30"
                >
                  <PrintIcon />
                  <span className="font-medium">Print</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#1976D2] mb-6">Quotation Summary</h3>
                    
                    {/* Item Type Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {quotation.chemicals && quotation.chemicals.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-500 rounded-xl">
                                <FlaskIcon />
                              </div>
                              <h4 className="font-semibold text-blue-900">Chemicals</h4>
                            </div>
                            <span className="text-2xl font-bold text-blue-700">{quotation.chemicals.length}</span>
                          </div>
                          <div className="text-sm text-blue-700">
                            <div>Total: ₹{chemicalTotal.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                      
                      {quotation.equipment && quotation.equipment.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-500 rounded-xl">
                                <EquipmentIcon />
                              </div>
                              <h4 className="font-semibold text-purple-900">Equipment</h4>
                            </div>
                            <span className="text-2xl font-bold text-purple-700">{quotation.equipment.length}</span>
                          </div>
                          <div className="text-sm text-purple-700">
                            <div>Total: ₹{equipmentTotal.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                      
                      {quotation.glassware && quotation.glassware.length > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-500 rounded-xl">
                                <GlasswareIcon />
                              </div>
                              <h4 className="font-semibold text-green-900">Glassware</h4>
                            </div>
                            <span className="text-2xl font-bold text-green-700">{quotation.glassware.length}</span>
                          </div>
                          <div className="text-sm text-green-700">
                            <div>Total: ₹{glasswareTotal.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grand Total Card */}
                    <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-2xl p-8 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Grand Total</h4>
                          <p className="text-[#E3F2FD] text-sm">Total value of all items in this quotation</p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold">₹{grandTotal.toFixed(2)}</div>
                          <div className="text-[#E3F2FD] text-sm mt-1">{quotation.itemCounts?.totalItems || 0} items</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chemicals' && quotation.chemicals && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#1976D2] mb-6">Chemicals ({quotation.chemicals.length})</h3>
                    
                    <div className="space-y-4">
                      {quotation.chemicals.map((chem, index) => (
                        <div key={index} className="bg-white border border-[#2196F3]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-[#1976D2] mb-2">{chem.chemicalName}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-[#64B5F6] font-medium">Quantity:</span>
                                  <div className="text-[#1976D2] font-semibold">{chem.quantity} {chem.unit}</div>
                                </div>
                                {chem.pricePerUnit && (
                                  <>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Price/Unit:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{chem.pricePerUnit}</div>
                                    </div>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Total:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{(chem.pricePerUnit * chem.quantity).toFixed(2)}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {chem.remarks && (
                            <div className="mt-4 p-4 bg-[#F5F9FD] rounded-xl border border-[#2196F3]/20">
                              <span className="text-sm font-medium text-[#64B5F6]">Remarks:</span>
                              <p className="text-sm text-[#1976D2] mt-1">{chem.remarks}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'equipment' && quotation.equipment && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#1976D2] mb-6">Equipment ({quotation.equipment.length})</h3>
                    
                    <div className="space-y-4">
                      {quotation.equipment.map((eq, index) => (
                        <div key={index} className="bg-white border border-[#2196F3]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-[#1976D2] mb-2">{eq.equipmentName}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-[#64B5F6] font-medium">Quantity:</span>
                                  <div className="text-[#1976D2] font-semibold">{eq.quantity} {eq.unit}</div>
                                </div>
                                {eq.pricePerUnit && (
                                  <>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Price/Unit:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{eq.pricePerUnit}</div>
                                    </div>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Total:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{(eq.pricePerUnit * eq.quantity).toFixed(2)}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {eq.specifications && (
                            <div className="mt-4 p-4 bg-[#F5F9FD] rounded-xl border border-[#2196F3]/20">
                              <span className="text-sm font-medium text-[#64B5F6]">Specifications:</span>
                              <p className="text-sm text-[#1976D2] mt-1">{eq.specifications}</p>
                            </div>
                          )}
                          
                          {eq.remarks && (
                            <div className="mt-4 p-4 bg-[#F5F9FD] rounded-xl border border-[#2196F3]/20">
                              <span className="text-sm font-medium text-[#64B5F6]">Remarks:</span>
                              <p className="text-sm text-[#1976D2] mt-1">{eq.remarks}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'glassware' && quotation.glassware && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#1976D2] mb-6">Glassware ({quotation.glassware.length})</h3>
                    
                    <div className="space-y-4">
                      {quotation.glassware.map((glass, index) => (
                        <div key={index} className="bg-white border border-[#2196F3]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-[#1976D2]">{glass.glasswareName}</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  glass.condition === 'new' ? 'bg-green-100 text-green-800' :
                                  glass.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {glass.condition}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-[#64B5F6] font-medium">Quantity:</span>
                                  <div className="text-[#1976D2] font-semibold">{glass.quantity} {glass.unit}</div>
                                </div>
                                {glass.pricePerUnit && (
                                  <>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Price/Unit:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{glass.pricePerUnit}</div>
                                    </div>
                                    <div>
                                      <span className="text-[#64B5F6] font-medium">Total:</span>
                                      <div className="text-[#1976D2] font-semibold">₹{(glass.pricePerUnit * glass.quantity).toFixed(2)}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {glass.remarks && (
                            <div className="mt-4 p-4 bg-[#F5F9FD] rounded-xl border border-[#2196F3]/20">
                              <span className="text-sm font-medium text-[#64B5F6]">Remarks:</span>
                              <p className="text-sm text-[#1976D2] mt-1">{glass.remarks}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-[#2196F3]/20 p-6 bg-[#F8FAFC]">
                <CommentSection
                  quotationId={quotation._id}
                  comments={quotation.comments || []}
                  onRefresh={onRefresh}
                  quotation={quotation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default QuotationDetail;
