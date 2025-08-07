import React, { useState } from 'react';
import { 
  FiX, 
  FiUser, 
  FiPackage, 
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiEdit3,
  FiSave,
  FiAlertTriangle
} from 'react-icons/fi';

const RequirementDetail = ({ requirement, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(requirement.status);
  const [newComment, setNewComment] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'converted_to_quotation':
        return <FiPackage className="w-5 h-5 text-blue-500" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted_to_quotation: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const canEditStatus = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (user.role === 'admin' || user.role === 'central_store_admin') && 
           requirement.status === 'pending';
  };

  const handleStatusUpdate = async () => {
    if (editStatus === requirement.status) {
      setIsEditing(false);
      return;
    }

    if (!statusComment.trim() && editStatus === 'rejected') {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: editStatus,
          comment: statusComment.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      const data = await response.json();
      
      if (data.quotation) {
        alert(`Requirement ${editStatus} and converted to quotation successfully!`);
      } else {
        alert(`Requirement ${editStatus} successfully!`);
      }
      
      setIsEditing(false);
      setStatusComment('');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      alert('Comment added successfully');
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualConvertToQuotation = async () => {
    if (!window.confirm('Convert this requirement to quotation? This will add items to an existing draft quotation or create a new one.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/requirements/${requirement._id}/convert-to-quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert to quotation');
      }

      const data = await response.json();
      alert(`Requirement converted to quotation successfully!\nQuotation Type: ${data.quotation.type}\nQuotation Status: ${data.quotation.status}`);
      onUpdate();
    } catch (error) {
      console.error('Error converting to quotation:', error);
      alert('Failed to convert to quotation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {requirement.requirementId}
            </h2>
            {getStatusBadge(requirement.status)}
            {getPriorityBadge(requirement.priority)}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <FiUser className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Raised by</p>
                  <p className="font-medium text-gray-900">
                    {requirement.raisedBy?.name || 'Unknown'}
                  </p>
                  {requirement.raisedBy?.department && (
                    <p className="text-sm text-gray-500">{requirement.raisedBy.department}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiCalendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(requirement.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(requirement.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {requirement.convertedAt && (
                <div className="flex items-center gap-3">
                  <FiPackage className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Converted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(requirement.convertedAt).toLocaleDateString()}
                    </p>
                    {requirement.quotationId && (
                      <p className="text-sm text-blue-600">To Quotation</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Status */}
          {requirement.status === 'converted_to_quotation' && requirement.quotationId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <FiPackage className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">✅ Converted to Quotation</p>
                  <p className="text-sm text-blue-700">
                    This requirement has been successfully converted to a quotation for procurement.
                  </p>
                  {requirement.quotationId && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600">
                        Type: {requirement.quotationId.quotationType || 'Mixed'}
                      </span>
                      <span className="text-xs text-blue-500">•</span>
                      <span className="text-xs font-medium text-blue-600">
                        Status: {requirement.quotationId.status || 'Draft'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Convert Button for Approved Requirements */}
          {requirement.status === 'approved' && !requirement.quotationId && canEditStatus() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Requirement Approved</p>
                    <p className="text-sm text-green-700">
                      Convert to quotation manually if auto-conversion failed.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManualConvertToQuotation}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <FiPackage className="w-4 h-4" />
                  {loading ? 'Converting...' : 'Convert to Quotation'}
                </button>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5" />
              Required Items ({requirement.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {requirement.items?.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {item.itemType}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                        </div>
                        {item.specifications && (
                          <div>
                            <span className="font-medium">Specifications:</span> {item.specifications}
                          </div>
                        )}
                        {item.remarks && (
                          <div>
                            <span className="font-medium">Remarks:</span> {item.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Management */}
          {canEditStatus() && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {getStatusIcon(requirement.status)}
                  Status Management
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Update Status
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved (Auto-convert to Quotation)</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment {editStatus === 'rejected' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder={
                          editStatus === 'approved' 
                            ? "Optional comment about approval..." 
                            : editStatus === 'rejected'
                            ? "Please provide reason for rejection..."
                            : "Add a comment about this status change..."
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {editStatus === 'rejected' && (
                        <p className="text-xs text-red-600 mt-1">Reason for rejection is required</p>
                      )}
                      {editStatus === 'approved' && (
                        <p className="text-xs text-green-600 mt-1">
                          ✨ Approving will automatically convert items to quotation
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <FiSave className="w-4 h-4" />
                        {loading ? 'Updating...' : 'Update Status'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditStatus(requirement.status);
                          setStatusComment('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">
                    Current status: {getStatusBadge(requirement.status)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMessageSquare className="w-5 h-5" />
              Comments & Discussion
            </h3>
            
            {/* Add Comment */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  {loading ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {requirement.comments?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                requirement.comments?.map((comment, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.commentBy?.name || 'Unknown'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approval History */}
          {requirement.approvals?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h3>
              <div className="space-y-3">
                {requirement.approvals.map((approval, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(approval.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {approval.approvedBy?.name || 'Unknown'}
                          </span>
                          {getStatusBadge(approval.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(approval.approvedAt).toLocaleString()}
                        </p>
                        {approval.comment && (
                          <p className="text-gray-700 mt-2">{approval.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementDetail;
