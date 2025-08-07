import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const RequirementDetailSmooth = ({ 
  requirement, 
  isOpen, 
  onClose, 
  loading = false, 
  error = '', 
  onUpdate 
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({ status: '', comment: '' });
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // Get user info from JWT token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.user.role);
        setUserId(decoded.userId || decoded.user.id);
        setUserInfo(decoded.user);
        console.log('🔐 User decoded from token:', {
          role: decoded.user.role,
          userId: decoded.userId || decoded.user.id,
          userName: decoded.user.name || decoded.user.username
        });
      } catch (error) {
        console.error('❌ Error decoding token:', error);
      }
    }
  }, []);

  if (!isOpen || !requirement) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approved':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'converted_to_quotation':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.medium}`}>
        {priority?.toUpperCase() || 'MEDIUM'}
      </span>
    );
  };

  const canUpdateStatus = () => {
    const canUpdate = ['admin', 'central_store_admin', 'hod', 'dean'].includes(userRole) && requirement.status === 'pending';
    console.log('Debug - canUpdateStatus:', {
      userRole,
      requirementStatus: requirement.status,
      canUpdate,
      allowedRoles: ['admin', 'central_store_admin', 'hod', 'dean']
    });
    return canUpdate;
  };

  const handleStatusUpdate = async (status = null, comment = null) => {
    const updateData = status && comment !== null 
      ? { status, comment } 
      : statusUpdate;

    if (!updateData.status) {
      alert('Please select a status');
      return;
    }

    if (updateData.status === 'rejected' && !updateData.comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/status`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Status updated successfully!');
        // Clear the form if using the custom form
        if (!status) {
          setStatusUpdate({ status: '', comment: '' });
        }
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/comments`,
        { comment: newComment },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setNewComment('');
        alert('Comment added successfully!');
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToQuotation = async () => {
    if (!window.confirm('Convert this requirement to quotation?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/convert-to-quotation`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert(`Requirement converted to quotation successfully! Quotation ID: ${response.data.quotationId}`);
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error converting to quotation:', error);
      alert('Failed to convert to quotation: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto w-11/12 max-w-5xl">
        <div className="bg-white shadow-2xl rounded-xl border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-bold">
                    {requirement.requirementId}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    {getStatusIcon(requirement.status)}
                    <span className="ml-2 capitalize">{requirement.status.replace('_', ' ')}</span>
                  </span>
                  {getPriorityBadge(requirement.priority)}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Raised by</p>
                      <p className="font-medium text-gray-900">{requirement.raisedBy?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{requirement.raisedBy?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lab/Department</p>
                      <p className="font-medium text-gray-900">{requirement.labId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium text-gray-900">{new Date(requirement.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{new Date(requirement.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  {requirement.remarks && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">General Remarks</p>
                      <p className="text-gray-900 bg-white p-3 rounded-lg border border-gray-200 mt-1">{requirement.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Required Items ({requirement.items?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {requirement.items?.map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Item Name</p>
                            <p className="font-medium text-gray-900">{item.itemName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-medium text-gray-900 capitalize">{item.itemType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-medium text-gray-900">{item.quantity} {item.unit}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Specifications</p>
                            <p className="text-gray-900">{item.specifications || 'None specified'}</p>
                          </div>
                        </div>
                        {item.remarks && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">Remarks</p>
                            <p className="text-gray-900">{item.remarks}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debug Info for Admins */}
                {['admin', 'central_store_admin'].includes(userRole) && (
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Debug Info (Admin Only)</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>User Role:</strong> {userRole}
                      </div>
                      <div>
                        <strong>Requirement Status:</strong> {requirement.status}
                      </div>
                      <div>
                        <strong>Can Update Status:</strong> {canUpdateStatus() ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>User ID:</strong> {userId}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Update Section for Authorized Users */}
                {['admin', 'central_store_admin', 'hod', 'dean'].includes(userRole) && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Admin Actions - Update Status
                    </h4>
                    
                    {requirement.status === 'pending' ? (
                      <>
                        {/* Quick Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <button
                            onClick={() => {
                              setStatusUpdate({ status: 'approved', comment: 'Approved by admin' });
                              handleStatusUpdate('approved', 'Approved by admin');
                            }}
                            disabled={actionLoading}
                            className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {actionLoading ? 'Processing...' : 'Approve Requirement'}
                          </button>
                          
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason && reason.trim()) {
                                setStatusUpdate({ status: 'rejected', comment: reason.trim() });
                                handleStatusUpdate('rejected', reason.trim());
                              } else if (reason !== null) {
                                alert('Rejection reason is required');
                              }
                            }}
                            disabled={actionLoading}
                            className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {actionLoading ? 'Processing...' : 'Reject Requirement'}
                          </button>
                        </div>

                        {/* Detailed Form for Custom Updates */}
                        <div className="border-t border-yellow-200 pt-6">
                          <h5 className="text-md font-medium text-gray-700 mb-4">Or use custom status update:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                              <select
                                value={statusUpdate.status}
                                onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              >
                                <option value="">Select Status</option>
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                              <textarea
                                value={statusUpdate.comment}
                                onChange={(e) => setStatusUpdate(prev => ({ ...prev, comment: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Add a comment (required for rejection)..."
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end space-x-3">
                            <button
                              onClick={() => handleStatusUpdate(statusUpdate.status, statusUpdate.comment)}
                              disabled={actionLoading || !statusUpdate.status}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              {actionLoading ? 'Updating...' : 'Update Status'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                        <p className="text-blue-800">
                          <strong>Status Update Unavailable:</strong> This requirement has status "{requirement.status}" and cannot be updated. 
                          Only pending requirements can be approved or rejected.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Convert to Quotation */}
                {['admin', 'central_store_admin'].includes(userRole) && requirement.status === 'approved' && !requirement.quotationId && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Convert to Quotation
                    </h4>
                    <p className="text-green-700 mb-4">This requirement has been approved and can be converted to a quotation for vendor quotes.</p>
                    <button
                      onClick={handleConvertToQuotation}
                      disabled={actionLoading}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200"
                    >
                      {actionLoading ? 'Converting...' : 'Convert to Quotation'}
                    </button>
                  </div>
                )}

                {/* Comments Section */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Comments & History ({requirement.comments?.length || 0})
                  </h4>
                  
                  {/* Add Comment */}
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a comment..."
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={actionLoading || !newComment.trim()}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200"
                      >
                        {actionLoading ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {requirement.comments?.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No comments yet</p>
                    ) : (
                      requirement.comments?.map((comment, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {comment.commentBy?.name || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetailSmooth;
