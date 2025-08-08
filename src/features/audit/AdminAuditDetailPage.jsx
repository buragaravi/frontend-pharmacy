import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const AdminAuditDetailPage = ({ onBack, assignmentId }) => {
  const [assignment, setAssignment] = useState(null);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats from assignment execution data
  const calculateExecutionStats = () => {
    if (!execution || !execution.checklistItems) {
      return {
        totalItems: 0,
        checkedItems: 0,
        foundItems: 0,
        missingItems: 0,
        damagedItems: 0,
        completionPercentage: 0
      };
    }

    const totalItems = execution.checklistItems.length;
    const checkedItems = execution.checklistItems.filter(item => 
      ['checked', 'present', 'quantity_mismatch', 'missing'].includes(item.status)
    ).length;
    const foundItems = execution.checklistItems.filter(item => 
      ['present', 'quantity_mismatch', 'checked'].includes(item.status)
    ).length;
    const missingItems = execution.checklistItems.filter(item => 
      item.status === 'missing'
    ).length;
    const damagedItems = execution.checklistItems.filter(item => item.isDamaged).length;
    const completionPercentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      checkedItems,
      foundItems,
      missingItems,
      damagedItems,
      completionPercentage
    };
  };

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    } else {
      setError('No assignment ID provided');
      setLoading(false);
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignment details
      const assignmentRes = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/audit/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setAssignment(assignmentRes.data.data);

      // Try to fetch execution details if assignment is in progress or completed
      if (assignmentRes.data.data?.status === 'in_progress' || assignmentRes.data.data?.status === 'completed') {
        try {
          const executionRes = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/audit/executions/assignment/${assignmentId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setExecution(executionRes.data.data);
        } catch (executionError) {
          console.log('No execution found for this assignment');
          setExecution(null);
        }
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setError('Failed to load assignment details. Please try again.');
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklistItems = execution?.checklistItems || [];

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'critical': 'bg-red-500 text-white'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading audit data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white hover:shadow-lg rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Audit Detailed Report</h1>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAssignmentDetails}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white hover:shadow-lg rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {assignment?.title || 'Audit Assignment Details'}
              </h1>
              <p className="text-gray-600">Complete details and execution status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(assignment?.status)}`}>
              {assignment?.status?.replace('_', ' ').toUpperCase()}
            </span>
            <button
              onClick={fetchAssignmentDetails}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Assignment Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{assignment?.assignedTo?.name || 'Unassigned'}</p>
                  <p className="text-sm text-gray-500">{assignment?.assignedTo?.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
              <p className="font-medium text-gray-900">{assignment ? formatDate(assignment.dueDate) : 'N/A'}</p>
              <p className="text-sm text-gray-500">{assignment?.estimatedDuration} hours estimated</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(assignment?.priority)}`}>
                {assignment?.priority?.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Progress</h3>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${assignment?.progress || 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">{assignment?.progress || 0}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{assignment?.description || 'No description available'}</p>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Labs</h3>
            <div className="flex flex-wrap gap-2">
              {assignment?.labs?.map((lab, index) => (
                <span key={index} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {lab.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {assignment?.categories?.map((category, index) => (
                <span key={index} className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Statistics (if execution exists) */}
        {execution && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-blue-600">{calculateExecutionStats().totalItems}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Checked</p>
                  <p className="text-3xl font-bold text-green-600">{calculateExecutionStats().checkedItems}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Found</p>
                  <p className="text-3xl font-bold text-blue-600">{calculateExecutionStats().foundItems}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Missing</p>
                  <p className="text-3xl font-bold text-red-600">{calculateExecutionStats().missingItems}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Damaged</p>
                  <p className="text-3xl font-bold text-orange-600">{calculateExecutionStats().damagedItems}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs for different sections */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'checklist', label: 'Checklist Items', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { id: 'timeline', label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Created Date</h4>
                      <p className="text-gray-900">{assignment ? formatDate(assignment.createdAt) : 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h4>
                      <p className="text-gray-900">{assignment ? formatDate(assignment.updatedAt) : 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Recurring</h4>
                      <p className="text-gray-900">{assignment?.isRecurring ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Recurring Pattern</h4>
                      <p className="text-gray-900">
                        {assignment?.recurringPattern 
                          ? (typeof assignment.recurringPattern === 'string' 
                              ? assignment.recurringPattern 
                              : `${assignment.recurringPattern.frequency} ${assignment.recurringPattern.interval}`)
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {execution && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Started On</h4>
                        <p className="text-gray-900">{formatDate(execution.startedAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Completed On</h4>
                        <p className="text-gray-900">{execution.completedAt ? formatDate(execution.completedAt) : 'Not completed'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Execution Status</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}>
                          {execution.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Completion Percentage</h4>
                        <p className="text-gray-900">{calculateExecutionStats().completionPercentage}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Checklist Items ({filteredChecklistItems.length})
                </h3>
                
                {filteredChecklistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Checklist Items</h3>
                    <p className="text-gray-600">
                      {execution ? 'No checklist items found for this execution.' : 'This assignment has not been executed yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredChecklistItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-gray-900">{item.itemId || item.name}</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === 'checked' || item.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : item.status === 'quantity_mismatch'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : item.status === 'missing'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status === 'quantity_mismatch' 
                                  ? 'Quantity Mismatch' 
                                  : item.status === 'present'
                                  ? 'Present'
                                  : item.status === 'missing'
                                  ? 'Missing'
                                  : item.status === 'checked'
                                  ? 'Checked'
                                  : (item.status || 'Pending')
                                }
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Expected Quantity:</span>
                                <p className="text-gray-600">{item.expectedQuantity || item.quantity || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Actual Quantity:</span>
                                <p className="text-gray-600">{item.actualQuantity || item.foundQuantity || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Location:</span>
                                <p className="text-gray-600">{item.location || assignment?.labs?.map(lab => lab.name).join(', ') || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  item.status === 'present' || item.status === 'quantity_mismatch' || item.status === 'checked' 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.status === 'missing' 
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.status === 'present' 
                                    ? 'Found' 
                                    : item.status === 'quantity_mismatch' 
                                    ? 'Found (Qty Mismatch)' 
                                    : item.status === 'missing' 
                                    ? 'Missing' 
                                    : item.status === 'checked'
                                    ? 'Found'
                                    : 'Pending'
                                  }
                                </span>
                              </div>
                              {item.isDamaged && (
                                <span className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                  Damaged
                                </span>
                              )}
                            </div>

                            {(item.notes || item.remarks || item.description || item.comments) && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-700">Details:</span>
                                <div className="text-sm text-gray-600 mt-1 space-y-1">
                                  {item.notes && (
                                    <div>
                                      <span className="font-medium">Notes:</span> {item.notes}
                                    </div>
                                  )}
                                  {item.remarks && (
                                    <div>
                                      <span className="font-medium">Remarks:</span> {item.remarks}
                                    </div>
                                  )}
                                  {item.description && (
                                    <div>
                                      <span className="font-medium">Description:</span> {item.description}
                                    </div>
                                  )}
                                  {item.comments && (
                                    <div>
                                      <span className="font-medium">Comments:</span> {item.comments}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Assignment Created</h4>
                      <p className="text-sm text-gray-600">{assignment ? formatDate(assignment.createdAt) : 'N/A'}</p>
                    </div>
                  </div>

                  {execution && (
                    <>
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Execution Started</h4>
                          <p className="text-sm text-gray-600">{formatDate(execution.startedAt)}</p>
                        </div>
                      </div>

                      {execution.completedAt && (
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Execution Completed</h4>
                            <p className="text-sm text-gray-600">{formatDate(execution.completedAt)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditDetailPage;
