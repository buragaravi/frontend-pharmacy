import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AuditAssignmentForm from './AuditAssignmentForm';
import AuditExecutionPage from './AuditExecutionPage';
import AuditAnalyticsDashboard from './AuditAnalyticsDashboard';
import AuditNotificationCenter from './AuditNotificationCenter';
import AdminAuditDetailPage from './AdminAuditDetailPage';

const AdminAuditDashboard = ({ userRole = 'admin' }) => {
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDetailPage, setShowDetailPage] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const isFaculty = user.role === 'faculty';

  // Calculate stats from assignments data
  const calculateStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'in_progress').length;
    const completed = assignments.filter(a => a.status === 'completed').length;
    const overdue = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      return a.status !== 'completed' && dueDate < now;
    }).length;

    return {
      totalAssignments: total,
      activeAssignments: active,
      completedAssignments: completed,
      overdueAssignments: overdue
    };
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/audit/assignments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedAssignment) {
    return (
      <AuditExecutionPage
        assignment={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
        onUpdate={fetchAssignments}
      />
    );
  }

  if (showDetailPage) {
    return (
      <AdminAuditDetailPage
        onBack={() => {
          setShowDetailPage(false);
          setSelectedAssignmentId(null);
        }}
        assignmentId={selectedAssignmentId}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Audit Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isAdmin ? 'Manage and assign audit tasks to faculty members' : 'Complete your assigned audit tasks'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2 sm:p-3 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a1.5 1.5 0 0 1-1.5 2.25h-13.5a1.5 1.5 0 0 1-1.5-2.25L6 14.25V9.75a6 6 0 0 1 6-6z" />
              </svg>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAssignmentForm(true)}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New Assignment</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z' },
                { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Render content based on active tab */}
        {activeTab === 'analytics' ? (
          <AuditAnalyticsDashboard />
        ) : (
          <>
            {/* Dashboard Stats */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <motion.div
              className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Total</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{calculateStats().totalAssignments}</p>
                </div>
                <div className="bg-blue-100 p-2 sm:p-2.5 lg:p-3 rounded-full flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Active</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-600">{calculateStats().activeAssignments}</p>
                </div>
                <div className="bg-yellow-100 p-2 sm:p-2.5 lg:p-3 rounded-full flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Done</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600">{calculateStats().completedAssignments}</p>
                </div>
                <div className="bg-green-100 p-2 sm:p-2.5 lg:p-3 rounded-full flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Overdue</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600">{calculateStats().overdueAssignments}</p>
                </div>
                <div className="bg-red-100 p-2 sm:p-2.5 lg:p-3 rounded-full flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
            )}

        {/* Detailed Report Button */}
        {activeTab === 'dashboard' && isAdmin && assignments.length > 0 && (
          <div className="mb-4 sm:mb-6 lg:mb-8 flex justify-center px-4">
            <motion.button
              onClick={() => {
                setSelectedAssignmentId(assignments[0]._id);
                setShowDetailPage(true);
              }}
              className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm lg:text-base"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">View Sample Audit Report</span>
              <span className="sm:hidden">Sample Report</span>
            </motion.button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {['all', 'assigned', 'in_progress', 'completed', 'overdue'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
              Audit Assignments ({filteredAssignments.length})
            </h2>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="block lg:hidden">
            {filteredAssignments.map(assignment => (
              <div key={assignment._id} className="border-b border-gray-200 last:border-b-0">
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-gray-500">{assignment.assignmentId}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(assignment.priority)}`}>
                        {assignment.priority.charAt(0).toUpperCase()}
                      </span>
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Faculty:</span>
                      <div className="text-gray-900 truncate">{assignment.assignedTo?.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Labs:</span>
                      <div className="text-gray-900">{assignment.labs?.length} lab(s)</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Due:</span>
                      <div className="text-gray-900">{formatDate(assignment.dueDate)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <div className="flex items-center">
                        <div className="w-8 bg-gray-200 rounded h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded"
                            style={{ width: `${assignment.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="ml-1 text-xs text-gray-600">{assignment.progress || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {assignment.auditTasks?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {assignment.auditTasks.slice(0, 2).map((task, index) => (
                        <span
                          key={index}
                          className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800"
                        >
                          {task.category}
                        </span>
                      ))}
                      {assignment.auditTasks.length > 2 && (
                        <span className="text-xs text-gray-500">+{assignment.auditTasks.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="pt-1">
                    {(isFaculty && assignment.assignedTo?._id === user._id) && (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >
                        {assignment.status === 'assigned' ? 'Start' : 'Continue'}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Labs</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map(assignment => (
                  <tr key={assignment._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{assignment.title}</div>
                        <div className="text-xs text-gray-500">{assignment.assignmentId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs sm:text-sm text-gray-900">{assignment.assignedTo?.name}</div>
                      <div className="text-xs text-gray-500 truncate">{assignment.assignedTo?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {assignment.labs?.length} lab(s)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {assignment.auditTasks?.slice(0, 2).map((task, index) => (
                          <span
                            key={index}
                            className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800"
                          >
                            {task.category}
                          </span>
                        ))}
                        {assignment.auditTasks?.length > 2 && (
                          <span className="text-xs text-gray-500">+{assignment.auditTasks.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">
                      {formatDate(assignment.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(assignment.priority)}`}>
                        {assignment.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${assignment.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="ml-1.5 text-xs text-gray-600">{assignment.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(isFaculty && assignment.assignedTo?._id === user._id) && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          {assignment.status === 'assigned' ? 'Start' : 'Continue'}
                        </button>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="px-2 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                          >
                            Execute
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssignmentId(assignment._id);
                              setShowDetailPage(true);
                            }}
                            className="px-2 py-1 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded text-xs font-medium transition-colors"
                          >
                            Report
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignment Form Modal */}
        {showAssignmentForm && (
          <AuditAssignmentForm
            onClose={() => setShowAssignmentForm(false)}
            onSuccess={() => {
              fetchAssignments();
              fetchDashboardData();
            }}
          />
        )}
          </>
        )}

        {/* Notification Center */}
        <AuditNotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </div>
    </div>
  );
};

export default AdminAuditDashboard;
