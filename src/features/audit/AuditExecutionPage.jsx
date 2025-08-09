import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import QRScanner from './QRScanner';
import PDFReportGenerator from './PDFReportGenerator';
import EquipmentQRScanner from '../equipment/EquipmentQRScanner';

const AuditExecutionPage = ({ assignment, onBack, onUpdate }) => {
  const [execution, setExecution] = useState(null);
  const [currentLab, setCurrentLab] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actualQuantity, setActualQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCamera, setShowCamera] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showEquipmentQR, setShowEquipmentQR] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  
  // Pagination and performance optimization
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    if (assignment.labs.length > 0) {
      setCurrentLab(assignment.labs[0].labId);
    }
    if (assignment.auditTasks.length > 0) {
      setCurrentCategory(assignment.auditTasks[0].category);
    }
  }, [assignment]);

  // Reset modal fields when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setActualQuantity(selectedItem.actualQuantity || selectedItem.expectedQuantity || '');
      setRemarks(selectedItem.remarks || '');
    }
  }, [selectedItem]);

  const startExecution = async () => {
    if (!currentLab || !currentCategory) {
      console.log('Missing currentLab or currentCategory:', { currentLab, currentCategory });
      return;
    }

    console.log('Starting execution with:', { 
      assignmentId: assignment._id, 
      currentLab, 
      currentCategory,
      assignmentLabs: assignment.labs 
    });

    setLoading(true);
    try {
      const response = await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/audit/assignments/${assignment._id}/start`,
        { labId: currentLab, category: currentCategory },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      console.log('Execution started successfully:', response.data);
      setExecution(response.data.data);
      setChecklistItems(response.data.data.checklistItems);
    } catch (error) {
      console.error('Error starting execution:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to start audit execution: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, status, actualQuantity, remarks) => {
    console.log('Updating item status:', { itemId, status, actualQuantity, remarks });
    
    // Validate itemId before making API call
    if (!itemId || itemId === 'undefined') {
      console.error('Invalid itemId:', itemId);
      alert('Error: Invalid item ID. Please refresh the page and try again.');
      return;
    }
    
    try {
      const response = await axios.put(
        `https://backend-pharmacy-5541.onrender.com/api/audit/executions/${execution._id}/items/${itemId}`,
        {
          status,
          actualQuantity: actualQuantity || 0,
          actualLocation: currentLab,
          remarks: remarks || ''
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('Update response:', response.data);

      // Update local state
      setChecklistItems(prev => 
        prev.map(item => 
          item.itemId === itemId 
            ? { ...item, ...response.data.data }
            : item
        )
      );

      setSelectedItem(null);
      setActualQuantity('');
      setRemarks('');
      
      console.log('Item status updated successfully');
    } catch (error) {
      console.error('Error updating item status:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to update item status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusUpdate = (status) => {
    if (!selectedItem) return;
    
    console.log('Selected item structure:', selectedItem);
    console.log('Selected item itemId:', selectedItem.itemId);
    
    // Try to get a valid ID from the selected item
    let itemId = selectedItem.itemId;
    
    // If itemId is missing or undefined, try using _id as fallback
    if (!itemId || itemId === 'undefined') {
      itemId = selectedItem._id;
      console.log('Using fallback _id:', itemId);
    }
    
    // If still no valid ID, show error
    if (!itemId || itemId === 'undefined') {
      console.error('No valid ID found for item:', selectedItem);
      alert('Error: Cannot update item - invalid ID. This item may need to be recreated in a new audit execution.');
      return;
    }
    
    const finalQuantity = status === 'quantity_mismatch' ? actualQuantity : selectedItem.expectedQuantity;
    updateItemStatus(itemId, status, finalQuantity, remarks);
  };

  const completeExecution = async () => {
    const observations = prompt('Enter general observations (optional):');
    const recommendations = prompt('Enter recommendations (optional):');

    console.log('Starting audit completion...');
    console.log('Execution ID:', execution._id);
    console.log('Current stats:', stats);

    try {
      const response = await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/audit/executions/${execution._id}/complete`,
        {
          generalObservations: observations || '',
          recommendations: recommendations || ''
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('Completion response:', response.data);
      alert('Audit execution completed successfully!');
      
      // Refresh the assignment data if onUpdate is provided
      if (onUpdate && typeof onUpdate === 'function') {
        console.log('Calling onUpdate to refresh parent data...');
        // Add a small delay to ensure backend has processed everything
        setTimeout(async () => {
          await onUpdate();
        }, 1000);
      }
      
      // Navigate back after a delay to ensure data is refreshed
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error('Error completing execution:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to complete audit execution: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleQRScan = (scannedData) => {
    console.log('Scanned:', scannedData);
    
    // Find item in checklist that matches scanned data
    const matchedItem = checklistItems.find(item => 
      item.itemId === scannedData || 
      item.qrCode === scannedData ||
      item.itemName.toLowerCase().includes(scannedData.toLowerCase())
    );

    if (matchedItem) {
      setSelectedItem(matchedItem);
      setScannedItems(prev => [...prev, scannedData]);
      alert(`Found item: ${matchedItem.itemName}`);
    } else {
      alert(`No matching item found for: ${scannedData}`);
    }
  };

  // Handle Equipment QR Scanner specifically for equipment itemId detection
  const handleEquipmentQRScan = useCallback((itemId) => {
    console.log('Equipment ID scanned:', itemId);
    
    // Find the equipment item in the checklist
    const foundItem = checklistItems.find(item => 
      item.itemId === itemId || 
      (item.itemType === 'equipment' && item.itemId === itemId)
    );
    
    if (foundItem) {
      setSelectedItem(foundItem);
      setShowEquipmentQR(false);
      
      // Auto-scroll to the item in the list
      setTimeout(() => {
        const itemElement = document.getElementById(`item-${foundItem.itemId}`);
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          itemElement.classList.add('bg-yellow-100', 'border-2', 'border-yellow-400');
          setTimeout(() => {
            itemElement.classList.remove('bg-yellow-100', 'border-2', 'border-yellow-400');
          }, 3000);
        }
      }, 100);
    } else {
      alert(`Equipment with ID "${itemId}" not found in this audit checklist.`);
      setShowEquipmentQR(false);
    }
  }, [checklistItems]);

  // Bulk selection toggle
  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Bulk update functionality
  const handleBulkUpdate = useCallback(async (status, quantity, remarks) => {
    if (selectedItems.size === 0) return;
    
    try {
      const updates = Array.from(selectedItems).map(itemId => 
        updateItemStatus(itemId, status, quantity, remarks)
      );
      
      await Promise.all(updates);
      setSelectedItems(new Set());
      setBulkUpdateMode(false);
      alert(`Successfully updated ${selectedItems.size} items`);
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert('Some items failed to update. Please try again.');
    }
  }, [selectedItems]);

  const generatePDFReport = () => {
    setShowPDFGenerator(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      not_checked: 'bg-gray-100 text-gray-800',
      present: 'bg-green-100 text-green-800',
      missing: 'bg-red-100 text-red-800',
      damaged: 'bg-orange-100 text-orange-800',
      location_mismatch: 'bg-yellow-100 text-yellow-800',
      quantity_mismatch: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Optimized filtering with useMemo for performance
  const filteredItems = useMemo(() => {
    let filtered = checklistItems;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.itemType?.toLowerCase().includes(searchLower) ||
        item.expectedLocation?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [checklistItems, statusFilter, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getCompletionStats = () => {
    const total = checklistItems.length;
    const checked = checklistItems.filter(item => item.status !== 'not_checked').length;
    const present = checklistItems.filter(item => item.status === 'present').length;
    const issues = checklistItems.filter(item => 
      ['missing', 'damaged', 'location_mismatch', 'quantity_mismatch'].includes(item.status)
    ).length;
    
    return { total, checked, present, issues, percentage: Math.round((checked / total) * 100) };
  };

  const stats = getCompletionStats();

  if (!execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
            </div>

            {/* Assignment Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Assignment Details</h3>
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Due Date:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(assignment.dueDate).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        assignment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start Execution</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Lab
                      </label>
                      <select
                        value={currentLab}
                        onChange={(e) => setCurrentLab(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {assignment.labs.map(lab => (
                          <option key={lab.labId} value={lab.labId}>
                            {lab.labName} ({lab.labId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Category
                      </label>
                      <select
                        value={currentCategory}
                        onChange={(e) => setCurrentCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {assignment.auditTasks.map(task => (
                          <option key={task.category} value={task.category}>
                            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={startExecution}
                      disabled={loading || !currentLab || !currentCategory}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Starting...' : 'Start Audit Execution'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                <p className="text-gray-600">
                  {currentLab} - {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRScanner(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                QR Scan
              </button>
              
              <button
                onClick={() => setShowPDFGenerator(true)}
                disabled={!execution}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF Report
              </button>
              
              <button
                onClick={completeExecution}
                disabled={stats.percentage < 100}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Complete Audit
              </button>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.percentage}%</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Checked</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.checked}/{stats.total}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Present</p>
                  <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Issues</p>
                  <p className="text-3xl font-bold text-red-600">{stats.issues}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search items by name, type, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="not_checked">Not Checked</option>
                  <option value="present">Present</option>
                  <option value="missing">Missing</option>
                  <option value="damaged">Damaged</option>
                  <option value="location_mismatch">Location Mismatch</option>
                  <option value="quantity_mismatch">Quantity Mismatch</option>
                </select>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {execution?.category === 'equipment' && (
                <button
                  onClick={() => setShowEquipmentQR(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan Equipment QR
                </button>
              )}
              
              <button
                onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  bulkUpdateMode 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {bulkUpdateMode ? 'Exit Bulk Mode' : 'Bulk Update'}
              </button>
              
              {bulkUpdateMode && selectedItems.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} items selected
                  </span>
                  <button
                    onClick={() => handleBulkUpdate('present', '', 'Bulk marked as present')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Mark Present
                  </button>
                  <button
                    onClick={() => handleBulkUpdate('missing', '', 'Bulk marked as missing')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Mark Missing
                  </button>
                </div>
              )}
              
              <span className="text-sm text-gray-500 ml-auto">
                Showing {paginatedItems.length} of {filteredItems.length} items
              </span>
            </div>
          </div>

          {/* Warning for invalid items */}
          {checklistItems.some(item => !item.itemId || item.itemId === 'undefined') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Some items have invalid IDs</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some items in this audit cannot be updated due to missing item IDs. 
                    You can try refreshing the page or start a new audit execution for this assignment.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Checklist Items ({filteredItems.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {bulkUpdateMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(new Set(paginatedItems.map(item => item.itemId)));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                          className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedItems.map(item => (
                    <tr 
                      key={item.itemId} 
                      id={`item-${item.itemId}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedItems.has(item.itemId) ? 'bg-blue-50' : ''
                      }`}
                    >
                      {bulkUpdateMode && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.itemId)}
                            onChange={() => toggleItemSelection(item.itemId)}
                            className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-500">{item.itemId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.itemType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.expectedQuantity}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedItem(item)}
                          disabled={!item.itemId || item.itemId === 'undefined'}
                          className={`text-sm font-medium ${
                            !item.itemId || item.itemId === 'undefined' 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                          title={!item.itemId || item.itemId === 'undefined' ? 'Item ID missing - cannot update' : 'Update Status'}
                        >
                          {!item.itemId || item.itemId === 'undefined' ? 'Invalid Item' : 'Update Status'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Update Status Modal */}
          {selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div 
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Update Item Status</h3>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                      <p className="text-sm text-gray-900">{selectedItem.itemName}</p>
                      <p className="text-xs text-gray-500">Expected Quantity: {selectedItem.expectedQuantity}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Quantity</label>
                      <input
                        type="number"
                        value={actualQuantity}
                        onChange={(e) => setActualQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter actual quantity found"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Enter any remarks or observations"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'present', label: 'Present', color: 'bg-green-600' },
                          { value: 'missing', label: 'Missing', color: 'bg-red-600' },
                          { value: 'damaged', label: 'Damaged', color: 'bg-orange-600' },
                          { value: 'location_mismatch', label: 'Location Issue', color: 'bg-yellow-600' },
                          { value: 'quantity_mismatch', label: 'Qty Issue', color: 'bg-purple-600' }
                        ].map(status => (
                          <button
                            key={status.value}
                            onClick={() => handleStatusUpdate(status.value)}
                            className={`px-3 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity ${status.color}`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
      
      {/* Equipment QR Scanner Modal */}
      <EquipmentQRScanner
        isOpen={showEquipmentQR}
        onScan={handleEquipmentQRScan}
        onClose={() => setShowEquipmentQR(false)}
      />
      
      {/* PDF Generator Modal */}
      <PDFReportGenerator
        isOpen={showPDFGenerator}
        assignment={assignment}
        execution={execution}
        onClose={() => setShowPDFGenerator(false)}
      />
    </div>
  );
};

export default AuditExecutionPage;
