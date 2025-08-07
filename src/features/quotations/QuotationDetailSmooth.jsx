import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Smooth, soft icons with rounded styles
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
  </svg>
);

const PDFIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const EmojiIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AttachIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const OnlineIcon = () => (
  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const QuotationDetailSmooth = ({ quotation, isOpen, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedQuotation, setEditedQuotation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [localComments, setLocalComments] = useState([]); // Local state for real-time updates
  const messagesEndRef = useRef(null); // Reference to scroll to bottom

  const token = localStorage.getItem('token');
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken?.user?.role;
  const currentUser = decodedToken?.user;
  const canEdit = ['admin', 'central_store_admin'].includes(userRole);
  const canEditStatus = userRole === 'admin'; // Only admin can edit status

  // Initialize local comments when quotation changes
  useEffect(() => {
    if (quotation?.comments) {
      setLocalComments([...quotation.comments]);
    }
  }, [quotation]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localComments]);

  // Initialize edited quotation
  useEffect(() => {
    if (quotation) {
      setEditedQuotation({
        ...quotation,
        chemicals: quotation.chemicals?.map(chem => ({ ...chem })) || [],
        equipment: quotation.equipment?.map(eq => ({ ...eq })) || [],
        glassware: quotation.glassware?.map(glass => ({ ...glass })) || []
      });
    }
  }, [quotation]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (hasUnsavedChanges) {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, hasUnsavedChanges]);

  if (!isOpen || !quotation) return null;

  // Calculate totals
  const calculateTotals = () => {
    const chemicalTotal = editedQuotation?.chemicals?.reduce((sum, chem) => 
      sum + (Number(chem.pricePerUnit) * Number(chem.quantity) || 0), 0) || 0;
    const equipmentTotal = editedQuotation?.equipment?.reduce((sum, eq) => 
      sum + (Number(eq.pricePerUnit) * Number(eq.quantity) || 0), 0) || 0;
    const glasswareTotal = editedQuotation?.glassware?.reduce((sum, glass) => 
      sum + (Number(glass.pricePerUnit) * Number(glass.quantity) || 0), 0) || 0;
    const grandTotal = chemicalTotal + equipmentTotal + glasswareTotal;
    return { chemicalTotal, equipmentTotal, glasswareTotal, grandTotal };
  };

  const { chemicalTotal, equipmentTotal, glasswareTotal, grandTotal } = calculateTotals();

  // Soft status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'draft': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'allocated': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  // Update field helper
  const updateField = (section, index, field, value) => {
    const updated = { ...editedQuotation };
    if (index !== null && index !== undefined) {
      if (!updated[section][index]) updated[section][index] = {};
      updated[section][index][field] = value;
    } else {
      updated[field] = value;
    }
    setEditedQuotation(updated);
    setHasUnsavedChanges(true);
  };

  // Add new item
  const addNewItem = (section) => {
    const updated = { ...editedQuotation };
    const newItem = {
      [`${section.slice(0, -1)}Name`]: '',
      quantity: 1,
      unit: '',
      pricePerUnit: 0,
      remarks: '',
      ...(section === 'equipment' && { specifications: '' }),
      ...(section === 'glassware' && { condition: '' })
    };
    updated[section] = [...(updated[section] || []), newItem];
    setEditedQuotation(updated);
    setHasUnsavedChanges(true);
  };

  // Remove item
  const removeItem = (section, index) => {
    const updated = { ...editedQuotation };
    updated[section] = updated[section].filter((_, i) => i !== index);
    setEditedQuotation(updated);
    setHasUnsavedChanges(true);
  };

  // Helper function to get unique participants
  const getUniqueParticipants = () => {
    if (!localComments) return [];
    const participants = new Set();
    localComments.forEach(comment => {
      if (comment.author?._id) {
        participants.add(comment.author._id);
      }
    });
    return Array.from(participants);
  };

  // Format message time for chat display
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Update status separately (admin only) with real-time chat update
  const handleStatusUpdate = async (newStatus) => {
    setIsLoading(true);
    
    // Add optimistic status change message to chat
    const statusMessage = {
      _id: `status-temp-${Date.now()}`,
      text: `Status changing to "${newStatus}"...`,
      author: null, // System message
      createdAt: new Date().toISOString(),
      isTemp: true,
      isSystem: true
    };
    
    setLocalComments(prev => [...prev, statusMessage]);
    
    try {
      const response = await axios.patch(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local comments with real server response
      if (response.data.quotation?.comments) {
        setLocalComments(response.data.quotation.comments);
      }
      
      onRefresh();
      setError('');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
      
      // Remove optimistic message on error
      setLocalComments(prev => prev.filter(msg => msg._id !== statusMessage._id));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit message to discussion with real-time update
  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Create temporary message for immediate display
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      text: newMessage.trim(),
      author: {
        _id: currentUser?._id,
        name: currentUser?.name || 'You',
        role: currentUser?.role
      },
      createdAt: new Date().toISOString(),
      isTemp: true // Flag to identify temporary message
    };

    // Add message to local state immediately
    setLocalComments(prev => [...prev, tempMessage]);
    setNewMessage('');
    setIsSubmittingMessage(true);
    
    try {
      const response = await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/comments`,
        { text: tempMessage.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Replace temporary message with real one from server
      if (response.data.quotation?.comments) {
        setLocalComments(response.data.quotation.comments);
      }
      
      // Also update the parent component's quotation data
      onRefresh();
      setError('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      
      // Remove the temporary message on error
      setLocalComments(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      // Restore the message in input field
      setNewMessage(tempMessage.text);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  // Save complete quotation (excluding status for central_store_admin)
  const handleSaveEdits = async () => {
    setIsLoading(true);
    try {
      const updateData = {
        quotationType: editedQuotation.quotationType,
        chemicals: editedQuotation.chemicals,
        equipment: editedQuotation.equipment,
        glassware: editedQuotation.glassware,
        totalPrice: grandTotal,
        comments: `Updated quotation data - Grand Total: ₹${grandTotal.toFixed(2)}`
      };
      
      // Only include status if user is admin
      if (canEditStatus) {
        updateData.status = editedQuotation.status;
      }
      
      await axios.put(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}/complete`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditMode(false);
      setHasUnsavedChanges(false);
      onRefresh();
      setError('');
    } catch (error) {
      console.error('Error saving edits:', error);
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced PDF Generation with soft design
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    const pageWidth = 210;
    const margin = 20;
    
    // Soft blue header
    doc.setFillColor(59, 130, 246); // Blue-500
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // College name with soft typography
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('PYDAH COLLEGE OF ENGINEERING & TECHNOLOGY', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(219, 234, 254); // Blue-100
    doc.text('Laboratory Quotation System', pageWidth / 2, 25, { align: 'center' });
    
    let yPos = 50;
    
    // Quotation header with soft colors
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Quotation Details', margin, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`ID: ${quotation._id.slice(-8).toUpperCase()}`, margin, yPos);
    doc.text(`Status: ${quotation.status.toUpperCase()}`, margin + 80, yPos);
    yPos += 5;
    doc.text(`Type: ${quotation.quotationType?.toUpperCase() || 'MIXED'}`, margin, yPos);
    doc.text(`Created: ${new Date(quotation.createdAt).toLocaleDateString()}`, margin + 80, yPos);
    yPos += 15;

    // Generate tables for each section with soft styling
    const tableStyle = {
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        lineColor: [219, 234, 254], // Blue-100
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: [59, 130, 246], // Blue-500
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gray-50
      },
      margin: { left: margin, right: margin }
    };

    // Chemicals table
    if (editedQuotation.chemicals && editedQuotation.chemicals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246); // Blue-500
      doc.text('CHEMICALS', margin, yPos);
      yPos += 8;
      
      const chemicalData = editedQuotation.chemicals.map((chem, index) => [
        index + 1,
        chem.chemicalName || '',
        chem.quantity || 0,
        chem.unit || '',
        `₹${Number(chem.pricePerUnit || 0).toFixed(2)}`,
        `₹${(Number(chem.pricePerUnit || 0) * Number(chem.quantity || 0)).toFixed(2)}`,
        chem.remarks || ''
      ]);
      
      autoTable(doc, {
        head: [['#', 'Chemical Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Remarks']],
        body: chemicalData,
        startY: yPos,
        ...tableStyle
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Equipment table
    if (editedQuotation.equipment && editedQuotation.equipment.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 30; }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text('EQUIPMENT', margin, yPos);
      yPos += 8;
      
      const equipmentData = editedQuotation.equipment.map((eq, index) => [
        index + 1,
        eq.equipmentName || '',
        eq.quantity || 0,
        eq.unit || '',
        `₹${Number(eq.pricePerUnit || 0).toFixed(2)}`,
        `₹${(Number(eq.pricePerUnit || 0) * Number(eq.quantity || 0)).toFixed(2)}`,
        [eq.specifications, eq.remarks].filter(Boolean).join(' | ') || ''
      ]);
      
      autoTable(doc, {
        head: [['#', 'Equipment Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Specifications/Remarks']],
        body: equipmentData,
        startY: yPos,
        ...tableStyle
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Glassware table
    if (editedQuotation.glassware && editedQuotation.glassware.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 30; }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text('GLASSWARE', margin, yPos);
      yPos += 8;
      
      const glasswareData = editedQuotation.glassware.map((glass, index) => [
        index + 1,
        glass.glasswareName || '',
        glass.quantity || 0,
        glass.unit || '',
        `₹${Number(glass.pricePerUnit || 0).toFixed(2)}`,
        `₹${(Number(glass.pricePerUnit || 0) * Number(glass.quantity || 0)).toFixed(2)}`,
        [glass.condition, glass.remarks].filter(Boolean).join(' | ') || ''
      ]);
      
      autoTable(doc, {
        head: [['#', 'Glassware Name', 'Qty', 'Unit', 'Price/Unit', 'Total', 'Condition/Remarks']],
        body: glasswareData,
        startY: yPos,
        ...tableStyle
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Summary with soft styling
    if (yPos > 250) { doc.addPage(); yPos = 30; }
    
    yPos += 10;
    doc.setFillColor(248, 250, 252); // Gray-50
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text('FINANCIAL SUMMARY', margin + 5, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    yPos += 15;
    
    if (chemicalTotal > 0) {
      doc.text(`Chemical Total: ₹${chemicalTotal.toFixed(2)}`, margin + 5, yPos);
      yPos += 6;
    }
    if (equipmentTotal > 0) {
      doc.text(`Equipment Total: ₹${equipmentTotal.toFixed(2)}`, margin + 5, yPos);
      yPos += 6;
    }
    if (glasswareTotal > 0) {
      doc.text(`Glassware Total: ₹${glasswareTotal.toFixed(2)}`, margin + 5, yPos);
      yPos += 6;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, margin + 5, yPos + 5);
    
    // Signature section
    yPos += 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text('Authorized Signature: ________________________', margin, yPos);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos + 15);
    
    doc.save(`Quotation_${quotation._id.slice(-8).toUpperCase()}.pdf`);
  };

  // Tab configuration
  const tabs = [
    { id: 'summary', label: 'Overview', count: null, icon: '📊' },
    ...(editedQuotation?.chemicals?.length > 0 ? [{ id: 'chemicals', label: 'Chemicals', count: editedQuotation.chemicals.length, icon: '🧪' }] : []),
    ...(editedQuotation?.equipment?.length > 0 ? [{ id: 'equipment', label: 'Equipment', count: editedQuotation.equipment.length, icon: '🔬' }] : []),
    ...(editedQuotation?.glassware?.length > 0 ? [{ id: 'glassware', label: 'Glassware', count: editedQuotation.glassware.length, icon: '🧪' }] : []),
    { id: 'discussion', label: 'Chat', count: localComments?.length || 0, icon: '💬' }
  ];

  // Render editable field
  const renderEditableField = (value, onChange, placeholder = '', type = 'text', options = null) => {
    if (!editMode) {
      if (type === 'select' && options) {
        const option = options.find(opt => opt.value === value);
        return <span className="text-gray-700">{option?.label || value}</span>;
      }
      return <span className="text-gray-700">{value || '-'}</span>;
    }

    if (type === 'select' && options) {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <>
      {/* Soft backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"
        onClick={() => {
          if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              onClose();
            }
          } else {
            onClose();
          }
        }}
      />
      
      {/* Modal with soft shadows and rounded corners */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100">
          
          {/* Soft gradient header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Quotation #{quotation._id.slice(-8).toUpperCase()}
                  </h2>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-blue-100 text-sm font-medium">
                      {editedQuotation?.quotationType?.toUpperCase() || 'MIXED'} • {(editedQuotation?.chemicals?.length || 0) + (editedQuotation?.equipment?.length || 0) + (editedQuotation?.glassware?.length || 0)} items
                    </p>
                    <span className="text-blue-200 text-xs">•</span>
                    <span className="text-blue-200 text-xs">
                      {userRole === 'admin' ? '🔧 Full Access' : userRole === 'central_store_admin' ? '📝 Content Editor' : '👀 View Only'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(editedQuotation?.status || quotation.status)}`}>
                  {(editedQuotation?.status || quotation.status).toUpperCase()}
                </span>
                
                {/* Soft action buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={generatePDF}
                    className="p-2.5 text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                    title="Download PDF"
                  >
                    <PDFIcon />
                  </button>
                  
                  {canEdit && (
                    <button
                      onClick={() => {
                        if (editMode) {
                          handleSaveEdits();
                        } else {
                          setEditMode(true);
                        }
                      }}
                      disabled={isLoading}
                      className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
                        editMode 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg' 
                          : 'text-white hover:bg-white/20'
                      }`}
                      title={editMode ? 'Save Changes' : 'Edit Mode'}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs hidden sm:block">Saving...</span>
                        </>
                      ) : editMode ? (
                        <>
                          <SaveIcon />
                          <span className="text-xs hidden sm:block">Save</span>
                        </>
                      ) : (
                        <>
                          <EditIcon />
                          <span className="text-xs hidden sm:block">Edit</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                          onClose();
                        }
                      } else {
                        onClose();
                      }
                    }}
                    className="p-2.5 text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
            </div>
            
            {hasUnsavedChanges && (
              <div className="mt-3 px-3 py-2 bg-amber-100/20 rounded-lg border border-amber-300/30">
                <p className="text-amber-100 text-xs font-medium">You have unsaved changes</p>
              </div>
            )}
          </div>

          {/* Soft tabs */}
          <div className="bg-white border-b border-gray-100 px-8">
            <div className="flex space-x-1 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  } rounded-t-lg`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content area with soft scrolling */}
          <div className={`flex-1 overflow-hidden ${activeTab === 'discussion' ? 'h-[calc(95vh-220px)]' : 'overflow-y-auto max-h-[calc(95vh-140px)]'} bg-gray-50/30`}>
            
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="p-8 space-y-8">
                {/* Basic Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Quotation Type</label>
                      {renderEditableField(
                        editedQuotation?.quotationType,
                        (value) => updateField(null, null, 'quotationType', value),
                        'Select type',
                        'select',
                        [
                          { value: 'chemicals', label: 'Chemicals' },
                          { value: 'equipment', label: 'Equipment' },
                          { value: 'glassware', label: 'Glassware' },
                          { value: 'mixed', label: 'Mixed' }
                        ]
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Current Status</label>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(editedQuotation?.status || quotation.status)}`}>
                        {(editedQuotation?.status || quotation.status).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Status Controls */}
                {canEditStatus && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center space-x-2">
                      <StarIcon />
                      <span>Status Management (Admin Only)</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <button
                        onClick={() => handleStatusUpdate('pending')}
                        disabled={isLoading || quotation.status === 'pending'}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        <ClockIcon />
                        <span className="text-sm font-medium">Pending</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate('approved')}
                        disabled={isLoading || quotation.status === 'approved'}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        <CheckIcon />
                        <span className="text-sm font-medium">Approve</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={isLoading || quotation.status === 'rejected'}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        <XIcon />
                        <span className="text-sm font-medium">Reject</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate('allocated')}
                        disabled={isLoading || quotation.status === 'allocated'}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        <StarIcon />
                        <span className="text-sm font-medium">Allocate</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate('draft')}
                        disabled={isLoading || quotation.status === 'draft'}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        <EditIcon />
                        <span className="text-sm font-medium">Draft</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-600 mt-3 bg-indigo-50 rounded-lg p-2">
                      💡 Only main administrators can change quotation status. Changes are logged automatically.
                    </p>
                  </div>
                )}

                {/* Financial Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Financial Summary</h3>
                  <div className="space-y-3">
                    {chemicalTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Chemicals ({editedQuotation?.chemicals?.length || 0} items):</span>
                        <span className="font-semibold text-blue-800">₹{chemicalTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {equipmentTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Equipment ({editedQuotation?.equipment?.length || 0} items):</span>
                        <span className="font-semibold text-blue-800">₹{equipmentTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {glasswareTotal > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Glassware ({editedQuotation?.glassware?.length || 0} items):</span>
                        <span className="font-semibold text-blue-800">₹{glasswareTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-blue-200" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-blue-800">Grand Total:</span>
                      <span className="font-bold text-blue-900">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Metadata</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Created By:</span>
                      <p className="font-medium text-gray-800">{quotation.createdBy?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created Date:</span>
                      <p className="font-medium text-gray-800">{new Date(quotation.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Item Tables - Chemicals */}
            {activeTab === 'chemicals' && (
              <div className="p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Chemical Items</h3>
                    {editMode && (
                      <button
                        onClick={() => addNewItem('chemicals')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <PlusIcon />
                        <span>Add Chemical</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-700">#</th>
                          <th className="text-left p-4 font-medium text-gray-700">Chemical Name</th>
                          <th className="text-left p-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-left p-4 font-medium text-gray-700">Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Price/Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Total</th>
                          <th className="text-left p-4 font-medium text-gray-700">Remarks</th>
                          {editMode && <th className="text-left p-4 font-medium text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(editedQuotation?.chemicals || []).map((chem, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-4 text-gray-600">{index + 1}</td>
                            <td className="p-4">
                              {renderEditableField(
                                chem.chemicalName,
                                (value) => updateField('chemicals', index, 'chemicalName', value),
                                'Chemical name'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                chem.quantity,
                                (value) => updateField('chemicals', index, 'quantity', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                chem.unit,
                                (value) => updateField('chemicals', index, 'unit', value),
                                'Unit'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                chem.pricePerUnit,
                                (value) => updateField('chemicals', index, 'pricePerUnit', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4 font-medium text-gray-800">
                              ₹{((Number(chem.pricePerUnit) || 0) * (Number(chem.quantity) || 0)).toFixed(2)}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                chem.remarks,
                                (value) => updateField('chemicals', index, 'remarks', value),
                                'Add remarks...'
                              )}
                            </td>
                            {editMode && (
                              <td className="p-4">
                                <button
                                  onClick={() => removeItem('chemicals', index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Similar structure for Equipment and Glassware tabs */}
            {activeTab === 'equipment' && (
              <div className="p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Equipment Items</h3>
                    {editMode && (
                      <button
                        onClick={() => addNewItem('equipment')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <PlusIcon />
                        <span>Add Equipment</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-700">#</th>
                          <th className="text-left p-4 font-medium text-gray-700">Equipment Name</th>
                          <th className="text-left p-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-left p-4 font-medium text-gray-700">Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Price/Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Total</th>
                          <th className="text-left p-4 font-medium text-gray-700">Specifications</th>
                          <th className="text-left p-4 font-medium text-gray-700">Remarks</th>
                          {editMode && <th className="text-left p-4 font-medium text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(editedQuotation?.equipment || []).map((eq, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-4 text-gray-600">{index + 1}</td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.equipmentName,
                                (value) => updateField('equipment', index, 'equipmentName', value),
                                'Equipment name'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.quantity,
                                (value) => updateField('equipment', index, 'quantity', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.unit,
                                (value) => updateField('equipment', index, 'unit', value),
                                'Unit'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.pricePerUnit,
                                (value) => updateField('equipment', index, 'pricePerUnit', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4 font-medium text-gray-800">
                              ₹{((Number(eq.pricePerUnit) || 0) * (Number(eq.quantity) || 0)).toFixed(2)}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.specifications,
                                (value) => updateField('equipment', index, 'specifications', value),
                                'Specifications...'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                eq.remarks,
                                (value) => updateField('equipment', index, 'remarks', value),
                                'Add remarks...'
                              )}
                            </td>
                            {editMode && (
                              <td className="p-4">
                                <button
                                  onClick={() => removeItem('equipment', index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'glassware' && (
              <div className="p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Glassware Items</h3>
                    {editMode && (
                      <button
                        onClick={() => addNewItem('glassware')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <PlusIcon />
                        <span>Add Glassware</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-700">#</th>
                          <th className="text-left p-4 font-medium text-gray-700">Glassware Name</th>
                          <th className="text-left p-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-left p-4 font-medium text-gray-700">Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Price/Unit</th>
                          <th className="text-left p-4 font-medium text-gray-700">Total</th>
                          <th className="text-left p-4 font-medium text-gray-700">Condition</th>
                          <th className="text-left p-4 font-medium text-gray-700">Remarks</th>
                          {editMode && <th className="text-left p-4 font-medium text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(editedQuotation?.glassware || []).map((glass, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-4 text-gray-600">{index + 1}</td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.glasswareName,
                                (value) => updateField('glassware', index, 'glasswareName', value),
                                'Glassware name'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.quantity,
                                (value) => updateField('glassware', index, 'quantity', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.unit,
                                (value) => updateField('glassware', index, 'unit', value),
                                'Unit'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.pricePerUnit,
                                (value) => updateField('glassware', index, 'pricePerUnit', Number(value)),
                                '0',
                                'number'
                              )}
                            </td>
                            <td className="p-4 font-medium text-gray-800">
                              ₹{((Number(glass.pricePerUnit) || 0) * (Number(glass.quantity) || 0)).toFixed(2)}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.condition,
                                (value) => updateField('glassware', index, 'condition', value),
                                'Condition...'
                              )}
                            </td>
                            <td className="p-4">
                              {renderEditableField(
                                glass.remarks,
                                (value) => updateField('glassware', index, 'remarks', value),
                                'Add remarks...'
                              )}
                            </td>
                            {editMode && (
                              <td className="p-4">
                                <button
                                  onClick={() => removeItem('glassware', index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Chat-Style Discussion Tab */}
            {activeTab === 'discussion' && (
              <div className="h-full flex flex-col bg-gradient-to-b from-blue-50 to-indigo-50">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <MessageIcon />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <OnlineIcon />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Quotation Discussion</h3>
                      <p className="text-sm text-gray-500">
                        {localComments?.length || 0} messages • {getUniqueParticipants().length} participants
                      </p>
                    </div>
                  </div>
                  
                  {/* Chat Actions */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      ID: #{quotation._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-[400px] max-h-[500px]">
                  {localComments && localComments.length > 0 ? (
                    localComments.map((comment, index) => {
                      const isCurrentUser = comment.author?._id === currentUser?._id;
                      const isSystemMessage = !comment.author || comment.text.includes('Status changed') || comment.isSystem;
                      const isTemporary = comment.isTemp;
                      
                      if (isSystemMessage) {
                        return (
                          <div key={comment._id || index} className="flex justify-center">
                            <div className={`px-4 py-2 rounded-full text-xs font-medium border ${
                              isTemporary 
                                ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse' 
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>
                              {comment.text}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={comment._id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            
                            {/* Message Bubble */}
                            <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                              isCurrentUser 
                                ? isTemporary
                                  ? 'bg-blue-400 text-white rounded-br-sm opacity-70 animate-pulse'
                                  : 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                            }`}>
                              
                              {/* Sender Name (only for others) */}
                              {!isCurrentUser && (
                                <div className="text-xs font-medium text-blue-600 mb-1">
                                  {comment.author?.name || 'Unknown User'}
                                  {comment.author?.role && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                      {comment.author.role.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Message Text */}
                              <p className={`text-sm leading-relaxed ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                {comment.text}
                              </p>
                              
                              {/* Message Time and Status */}
                              <div className={`text-xs mt-1 flex items-center justify-between ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                                <span>{formatMessageTime(comment.createdAt)}</span>
                                {isCurrentUser && isTemporary && (
                                  <span className="ml-2 text-xs">Sending...</span>
                                )}
                                {isCurrentUser && !isTemporary && (
                                  <span className="ml-2 text-xs">✓</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Avatar (only for others) */}
                            {!isCurrentUser && (
                              <div className="flex items-center mt-1">
                                <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-white font-semibold text-xs">
                                    {(comment.author?.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageIcon />
                        </div>
                        <h4 className="text-lg font-medium text-gray-600 mb-2">No messages yet</h4>
                        <p className="text-gray-500 text-sm">Start the conversation about this quotation</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-2xl px-4 py-3 rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-end space-x-3">
                    
                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 hover:bg-white transition-colors"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitMessage();
                          }
                        }}
                        style={{
                          minHeight: '44px',
                          maxHeight: '120px',
                          height: 'auto'
                        }}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                      />
                      
                      {/* Character Count */}
                      {newMessage.length > 0 && (
                        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                          {newMessage.length}/500
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Add emoji"
                      >
                        <EmojiIcon />
                      </button>
                      
                      <button
                        type="button"
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Attach file"
                      >
                        <AttachIcon />
                      </button>
                      
                      {/* Send Button */}
                      <button
                        onClick={handleSubmitMessage}
                        disabled={isSubmittingMessage || !newMessage.trim()}
                        className={`p-2.5 rounded-full transition-all duration-200 ${
                          newMessage.trim() 
                            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Send message"
                      >
                        {isSubmittingMessage ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <SendIcon />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Input Helper Text */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                    {newMessage.trim() && (
                      <p className="text-xs text-blue-500 font-medium">
                        Ready to send
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Error/Success display */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-200 flex items-center space-x-3">
              <div className="w-5 h-5 text-red-500">
                <XIcon />
              </div>
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuotationDetailSmooth;
