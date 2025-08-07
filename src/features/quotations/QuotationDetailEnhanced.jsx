import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Enhanced Icons with smaller sizes
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PDFIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
);

const ExcelIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M6,4H13V9H18V20H6V4Z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const QuotationDetailEnhanced = ({ quotation, isOpen, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedQuotation, setEditedQuotation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

  const token = localStorage.getItem('token');
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken?.user?.role;
  const canEdit = ['admin', 'central_store_admin'].includes(userRole);

  // Initialize edited quotation
  useEffect(() => {
    if (quotation) {
      setEditedQuotation(JSON.parse(JSON.stringify(quotation)));
    }
  }, [quotation]);

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
      case 'approved': return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-300';
      case 'draft': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'allocated': return 'bg-purple-100 text-purple-800 border border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // Submit message to discussion
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSubmittingMessage(true);
    try {
      await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/comments`,
        { comments: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      onRefresh();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  // Save edited quotation
  const handleSaveEdits = async () => {
    setIsLoading(true);
    try {
      // Update chemicals with remarks
      if (editedQuotation.chemicals) {
        const chemicalUpdates = editedQuotation.chemicals.map((chem, index) => ({
          index,
          remarks: chem.remarks || ''
        }));
        
        await axios.patch(
          `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/chemicals/batch-remarks`,
          { chemicalUpdates },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setEditMode(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving edits:', error);
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced PDF Generation
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // College Header
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('PYDAH COLLEGE OF ENGINEERING & TECHNOLOGY', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Laboratory Quotation Report', pageWidth / 2, 22, { align: 'center' });
    
    let yPos = 40;
    
    // Quotation Details
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Quotation Details', margin, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`ID: ${quotation._id.slice(-8).toUpperCase()}`, margin, yPos);
    doc.text(`Status: ${quotation.status.toUpperCase()}`, margin + 80, yPos);
    yPos += 6;
    doc.text(`Type: ${quotation.quotationType?.toUpperCase() || 'MIXED'}`, margin, yPos);
    doc.text(`Created: ${new Date(quotation.createdAt).toLocaleDateString()}`, margin + 80, yPos);
    yPos += 15;

    // Tables for each item type
    if (quotation.chemicals && quotation.chemicals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('CHEMICALS', margin, yPos);
      yPos += 8;
      
      const chemicalData = quotation.chemicals.map((chem, index) => [
        index + 1,
        chem.chemicalName,
        chem.quantity,
        chem.unit,
        chem.pricePerUnit || 0,
        ((chem.pricePerUnit || 0) * chem.quantity).toFixed(2),
        chem.remarks || ''
      ]);
      
      autoTable(doc, {
        head: [['#', 'Chemical Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Remarks']],
        body: chemicalData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 50 }
        }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    if (quotation.equipment && quotation.equipment.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('EQUIPMENT', margin, yPos);
      yPos += 8;
      
      const equipmentData = quotation.equipment.map((eq, index) => [
        index + 1,
        eq.equipmentName,
        eq.quantity,
        eq.unit,
        eq.pricePerUnit || 0,
        ((eq.pricePerUnit || 0) * eq.quantity).toFixed(2),
        `${eq.specifications || ''}${eq.remarks ? ` | ${eq.remarks}` : ''}`
      ]);
      
      autoTable(doc, {
        head: [['#', 'Equipment Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Specifications/Remarks']],
        body: equipmentData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 50 }
        }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    if (quotation.glassware && quotation.glassware.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('GLASSWARE', margin, yPos);
      yPos += 8;
      
      const glasswareData = quotation.glassware.map((glass, index) => [
        index + 1,
        glass.glasswareName,
        glass.quantity,
        glass.unit,
        glass.pricePerUnit || 0,
        ((glass.pricePerUnit || 0) * glass.quantity).toFixed(2),
        `${glass.condition || ''}${glass.remarks ? ` | ${glass.remarks}` : ''}`
      ]);
      
      autoTable(doc, {
        head: [['#', 'Glassware Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Condition/Remarks']],
        body: glasswareData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 50 }
        }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Summary Section
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SUMMARY', margin, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (chemicalTotal > 0) {
      doc.text(`Chemical Total: ₹${chemicalTotal.toFixed(2)}`, margin, yPos);
      yPos += 6;
    }
    if (equipmentTotal > 0) {
      doc.text(`Equipment Total: ₹${equipmentTotal.toFixed(2)}`, margin, yPos);
      yPos += 6;
    }
    if (glasswareTotal > 0) {
      doc.text(`Glassware Total: ₹${glasswareTotal.toFixed(2)}`, margin, yPos);
      yPos += 6;
    }
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, margin, yPos);
    
    // Signature Section
    yPos += 30;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Authorized Signature: ________________________', margin, yPos);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos + 20);
    
    doc.save(`Quotation_${quotation._id.slice(-8).toUpperCase()}.pdf`);
  };

  // Tab configuration
  const tabs = [
    { id: 'summary', label: 'Summary', count: null },
    ...(quotation.chemicals?.length > 0 ? [{ id: 'chemicals', label: 'Chemicals', count: quotation.chemicals.length }] : []),
    ...(quotation.equipment?.length > 0 ? [{ id: 'equipment', label: 'Equipment', count: quotation.equipment.length }] : []),
    ...(quotation.glassware?.length > 0 ? [{ id: 'glassware', label: 'Glassware', count: quotation.glassware.length }] : []),
    { id: 'discussion', label: 'Discussion', count: quotation.comments?.length || 0 }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-white">
                <h2 className="text-lg font-semibold">Quotation #{quotation._id.slice(-8).toUpperCase()}</h2>
                <p className="text-blue-100 text-sm">{quotation.quotationType?.toUpperCase() || 'MIXED'} • {quotation.itemCounts?.totalItems || 0} items</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                {quotation.status.toUpperCase()}
              </span>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={generatePDF}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <PDFIcon />
                </button>
                
                {canEdit && (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      editMode ? 'bg-green-500 text-white' : 'text-white hover:bg-white/20'
                    }`}
                    title={editMode ? 'Save Changes' : 'Edit Mode'}
                  >
                    {editMode ? <SaveIcon /> : <EditIcon />}
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Compact Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-1 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto max-h-[calc(95vh-120px)]">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created By:</span>
                    <p className="font-medium">{quotation.createdBy?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created Date:</span>
                    <p className="font-medium">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Financial Summary</h3>
                  <div className="space-y-2 text-sm">
                    {chemicalTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Chemicals ({quotation.chemicals?.length || 0} items):</span>
                        <span className="font-medium">₹{chemicalTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {equipmentTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Equipment ({quotation.equipment?.length || 0} items):</span>
                        <span className="font-medium">₹{equipmentTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {glasswareTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Glassware ({quotation.glassware?.length || 0} items):</span>
                        <span className="font-medium">₹{glasswareTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between text-base font-semibold text-blue-600">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chemicals Tab */}
            {activeTab === 'chemicals' && quotation.chemicals && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Chemical Name</th>
                        <th className="text-left p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Unit</th>
                        <th className="text-left p-3 font-medium">Price/Unit</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.chemicals.map((chem, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium">{chem.chemicalName}</td>
                          <td className="p-3">{chem.quantity}</td>
                          <td className="p-3">{chem.unit}</td>
                          <td className="p-3">₹{chem.pricePerUnit || 0}</td>
                          <td className="p-3 font-medium">₹{((chem.pricePerUnit || 0) * chem.quantity).toFixed(2)}</td>
                          <td className="p-3">
                            {editMode ? (
                              <input
                                type="text"
                                value={editedQuotation?.chemicals[index]?.remarks || ''}
                                onChange={(e) => {
                                  const updated = { ...editedQuotation };
                                  updated.chemicals[index].remarks = e.target.value;
                                  setEditedQuotation(updated);
                                }}
                                className="w-full p-1 border rounded text-xs"
                                placeholder="Add remarks..."
                              />
                            ) : (
                              <span className="text-gray-600">{chem.remarks || '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'equipment' && quotation.equipment && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Equipment Name</th>
                        <th className="text-left p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Unit</th>
                        <th className="text-left p-3 font-medium">Price/Unit</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">Specifications</th>
                        <th className="text-left p-3 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.equipment.map((eq, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium">{eq.equipmentName}</td>
                          <td className="p-3">{eq.quantity}</td>
                          <td className="p-3">{eq.unit}</td>
                          <td className="p-3">₹{eq.pricePerUnit || 0}</td>
                          <td className="p-3 font-medium">₹{((eq.pricePerUnit || 0) * eq.quantity).toFixed(2)}</td>
                          <td className="p-3 text-gray-600">{eq.specifications || '-'}</td>
                          <td className="p-3">
                            {editMode ? (
                              <input
                                type="text"
                                value={editedQuotation?.equipment[index]?.remarks || ''}
                                onChange={(e) => {
                                  const updated = { ...editedQuotation };
                                  if (!updated.equipment[index]) updated.equipment[index] = {};
                                  updated.equipment[index].remarks = e.target.value;
                                  setEditedQuotation(updated);
                                }}
                                className="w-full p-1 border rounded text-xs"
                                placeholder="Add remarks..."
                              />
                            ) : (
                              <span className="text-gray-600">{eq.remarks || '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Glassware Tab */}
            {activeTab === 'glassware' && quotation.glassware && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Glassware Name</th>
                        <th className="text-left p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Unit</th>
                        <th className="text-left p-3 font-medium">Price/Unit</th>
                        <th className="text-left p-3 font-medium">Total</th>
                        <th className="text-left p-3 font-medium">Condition</th>
                        <th className="text-left p-3 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.glassware.map((glass, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium">{glass.glasswareName}</td>
                          <td className="p-3">{glass.quantity}</td>
                          <td className="p-3">{glass.unit}</td>
                          <td className="p-3">₹{glass.pricePerUnit || 0}</td>
                          <td className="p-3 font-medium">₹{((glass.pricePerUnit || 0) * glass.quantity).toFixed(2)}</td>
                          <td className="p-3 text-gray-600">{glass.condition || '-'}</td>
                          <td className="p-3">
                            {editMode ? (
                              <input
                                type="text"
                                value={editedQuotation?.glassware[index]?.remarks || ''}
                                onChange={(e) => {
                                  const updated = { ...editedQuotation };
                                  if (!updated.glassware[index]) updated.glassware[index] = {};
                                  updated.glassware[index].remarks = e.target.value;
                                  setEditedQuotation(updated);
                                }}
                                className="w-full p-1 border rounded text-xs"
                                placeholder="Add remarks..."
                              />
                            ) : (
                              <span className="text-gray-600">{glass.remarks || '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === 'discussion' && (
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {quotation.comments && quotation.comments.length > 0 ? (
                    quotation.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{comment.author?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">No messages yet</p>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t pt-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 p-2 border rounded-lg text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitMessage()}
                    />
                    <button
                      onClick={handleSubmitMessage}
                      disabled={isSubmittingMessage || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <MessageIcon />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button for Edit Mode */}
          {editMode && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  <SaveIcon />
                  <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuotationDetailEnhanced;
