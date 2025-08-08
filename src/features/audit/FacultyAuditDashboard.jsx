import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AuditExecutionPage from './AuditExecutionPage';
import AuditAnalyticsDashboard from './AuditAnalyticsDashboard';
import AuditNotificationCenter from './AuditNotificationCenter';

const FacultyAuditDashboard = () => {
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [facultyStats, setFacultyStats] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('assignments');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Decode JWT token to get user data
  const getDecodedUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Decode JWT token manually (split by . and decode base64)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Decoded token payload:', payload);
      
      // Get user data from payload
      const userData = payload.user || payload;
      
      // Ensure we have both id and _id for compatibility
      if (userData && !userData.id && userData._id) {
        userData.id = userData._id;
      }
      if (userData && !userData._id && userData.id) {
        userData._id = userData.id;
      }
      
      return userData;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const user = getDecodedUser();

  // Early return if no user is found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">
            Please log in to access your audit assignments.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user && user.id) {
      fetchFacultyAssignments();
      fetchFacultyStats();
    } else {
      console.error('No user found in token or missing user ID');
      setLoading(false);
    }
  }, []); // Remove user dependency to prevent infinite loop

  const fetchFacultyAssignments = async () => {
    if (!user || !user.id) {
      console.error('No user ID available for fetching assignments');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching assignments for user:', user);
      console.log('User ID:', user.id);
      console.log('User role:', user.role);
      console.log('API URL:', `https://backend-pharmacy-5541.onrender.com/api/audit/assignments/faculty/${user.id}`);
      
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/audit/assignments/faculty/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('API Response:', response.data);
      setFacultyAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching faculty assignments:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyStats = async () => {
    if (!user || !user.id) {
      console.error('No user ID available for fetching stats');
      return;
    }

    try {
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/audit/faculty-stats/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFacultyStats(response.data.data || {});
    } catch (error) {
      console.error('Error fetching faculty stats:', error);
    }
  };

  const getFilteredAssignments = () => {
    switch (filter) {
      case 'pending':
        return facultyAssignments.filter(a => a.status === 'pending' || a.status === 'assigned');
      case 'in_progress':
        return facultyAssignments.filter(a => a.status === 'in_progress');
      case 'completed':
        return facultyAssignments.filter(a => a.status === 'completed');
      case 'overdue':
        return facultyAssignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed');
      default:
        return facultyAssignments;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleStartAudit = async (assignment) => {
    try {
      console.log('Starting audit for assignment:', assignment._id);
      const response = await axios.patch(
        `https://backend-pharmacy-5541.onrender.com/api/audit/assignments/${assignment._id}/start`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Audit started successfully:', response.data);
      setSelectedAssignment(assignment);
      fetchFacultyAssignments(); // Refresh the list
    } catch (error) {
      console.error('Error starting audit:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to start audit: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatDueDate = (dueDate) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day(s)`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} day(s)`;
    }
  };

  if (selectedAssignment) {
    return (
      <AuditExecutionPage
        assignment={selectedAssignment}
        onBack={() => {
          setSelectedAssignment(null);
          fetchFacultyAssignments(); // Refresh after completing audit
        }}
        onUpdate={() => {
          // This function is called when the execution is updated
          fetchFacultyAssignments(); // Refresh the assignments list
        }}
      />
    );
  }

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Audit Analytics</h1>
              <p className="text-gray-600 mt-1">Personal audit performance and statistics</p>
            </div>
            <button
              onClick={() => setShowAnalytics(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Assignments
            </button>
          </div>
          
          <AuditAnalyticsDashboard facultyId={user?.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Audit Assignments</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name || 'Faculty'}! Manage your assigned audit tasks.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                title="Notifications"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 17h5l-5 5-5-5h5V3h5v14z" />
                </svg>
                {facultyStats?.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {facultyStats.unreadNotifications}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowAnalytics(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Faculty Statistics Cards */}
        {facultyStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">{facultyStats.totalAssigned || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{facultyStats.completed || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {facultyStats.totalAssigned > 0 
                      ? `${Math.round((facultyStats.completed / facultyStats.totalAssigned) * 100)}% completion rate`
                      : '0% completion rate'
                    }
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{facultyStats.inProgress || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{facultyStats.overdue || 0}</p>
                  {facultyStats.avgCompletionTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {facultyStats.avgCompletionTime} hours
                    </p>
                  )}
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Assignments', count: facultyAssignments.length },
                { key: 'pending', label: 'Pending', count: facultyAssignments.filter(a => a.status === 'pending' || a.status === 'assigned').length },
                { key: 'in_progress', label: 'In Progress', count: facultyAssignments.filter(a => a.status === 'in_progress').length },
                { key: 'completed', label: 'Completed', count: facultyAssignments.filter(a => a.status === 'completed').length },
                { key: 'overdue', label: 'Overdue', count: facultyAssignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            
            <button
              onClick={fetchFacultyAssignments}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading your assignments...</span>
            </div>
          ) : getFilteredAssignments().length === 0 ? (
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any audit assignments yet."
                  : `No assignments with status "${filter}".`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {getFilteredAssignments().map((assignment, index) => {
                const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed';
                
                return (
                  <motion.div
                    key={assignment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {assignment.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(assignment.status)}`}>
                            {assignment.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority?.toUpperCase()} PRIORITY
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full border border-red-200">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                            </svg>
                            <span>Labs: {assignment.labs?.map(lab => lab.labName).join(', ') || 'Not specified'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>Categories: {assignment.categories?.join(', ') || 'All'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {formatDueDate(assignment.dueDate)}
                            </span>
                          </div>
                          
                          {assignment.estimatedDuration && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Est. {assignment.estimatedDuration} hours</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        {(assignment.status === 'pending' || assignment.status === 'assigned') && (
                          <button
                            onClick={() => handleStartAudit(assignment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Start Audit</span>
                          </button>
                        )}
                        
                        {assignment.status === 'in_progress' && (
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Continue Audit</span>
                          </button>
                        )}
                        
                        {assignment.status === 'completed' && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">Completed</span>
                          </div>
                        )}
                        
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notification Center */}
      <AuditNotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
};

export default FacultyAuditDashboard;
