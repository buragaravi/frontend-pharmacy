import React, { useState } from 'react';
import axios from 'axios';

// Icon components
const FlaskIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.618v.786a2 2 0 002 2h12a2 2 0 002-2v-.786c0-.824-.393-1.596-1.072-2.19z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 11-12 0 6 6 0 0112 0zM8 14v.01M12 14v.01M16 14v.01" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const statusOptions = [
  { value: 'allocated', label: 'Allocate (Fulfilled)' },
  { value: 'partially_fulfilled', label: 'Partially Fulfill' },
  { value: 'rejected', label: 'Reject' }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'allocated': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
    case 'pending': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
    case 'partially_fulfilled': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300';
    case 'rejected': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
    default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
  }
};

const IndentCard = ({ indent, userRole, userId, labId, refreshList, canUpdateStatus }) => {
  const [showComments, setShowComments] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const handleStatusUpdate = async () => {
    if (!statusUpdate) {
      setError('Please select a status');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const endpoint = 'https://backend-pharmacy-5541.onrender.com/api/indents/central/allocate';
      await axios.patch(
        endpoint,
        {
          indentId: indent._id,
          status: statusUpdate,
          comments: comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusUpdate('');
      setComment('');
      refreshList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white backdrop-blur-sm border border-[#0B3861]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-4 hover:scale-[1.02]">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-[#0B3861] to-[#1E88E5] text-white p-2 rounded-lg">
            {indent.chemicals && indent.chemicals.length > 0 ? <FlaskIcon /> :
             indent.equipment && indent.equipment.length > 0 ? <EquipmentIcon /> :
             indent.glassware && indent.glassware.length > 0 ? <GlasswareIcon /> : <FlaskIcon />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Indent #{indent._id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600">
              {indent.chemicals && indent.chemicals.length > 0 ? 'Chemical' : ''}
              {indent.equipment && indent.equipment.length > 0 ? (indent.chemicals?.length > 0 ? ', Equipment' : 'Equipment') : ''}
              {indent.glassware && indent.glassware.length > 0 ? 
                (indent.chemicals?.length > 0 || indent.equipment?.length > 0 ? ', Glassware' : 'Glassware') : ''} Request
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(indent.status)}`}>
          {indent.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
      </div>

      {/* Info Summary */}
      <div className="bg-gradient-to-r from-[#0B3861]/5 to-[#1E88E5]/5 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-[#0B3861] mb-2">Request Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-[#0B3861]/70">Created By:</span>
            <p className="text-sm text-[#0B3861] font-medium capitalize">
              {indent.createdByRole?.replace('_', ' ') || 'N/A'}
            </p>
          </div>
          {indent.labId && (
            <div>
              <span className="text-xs text-[#0B3861]/70">Lab ID:</span>
              <p className="text-sm text-[#0B3861] font-medium">{indent.labId}</p>
            </div>
          )}
        </div>
        {indent.vendorName && (
          <div className="mt-2">
            <span className="text-xs text-[#0B3861]/70">Vendor:</span>
            <p className="text-sm text-[#0B3861] font-medium">{indent.vendorName}</p>
          </div>
        )}
      </div>

      {/* Items Sections */}
      <div className="mb-4">
        {/* Chemicals Section */}
        {indent.chemicals && indent.chemicals.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-[#0B3861] mb-3 flex items-center">
              <FlaskIcon className="mr-2" />
              Chemicals Requested ({indent.chemicals.length})
            </h4>
            <div className="space-y-2">
              {indent.chemicals.slice(0, 3).map((chem, index) => (
                <div key={index} className="bg-white border border-[#0B3861]/10 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{chem.chemicalName}</p>
                      <p className="text-xs text-gray-600">{chem.quantity} {chem.unit}</p>
                    </div>
                  </div>
                  {chem.remarks && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Remarks:</span> {chem.remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {indent.chemicals.length > 3 && (
                <p className="text-xs text-[#0B3861]/70 text-center py-2">
                  +{indent.chemicals.length - 3} more chemicals...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Equipment Section */}
        {indent.equipment && indent.equipment.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-[#0B3861] mb-3 flex items-center">
              <EquipmentIcon className="mr-2" />
              Equipment Requested ({indent.equipment.length})
            </h4>
            <div className="space-y-2">
              {indent.equipment.slice(0, 3).map((eq, index) => (
                <div key={index} className="bg-white border border-[#0B3861]/10 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{eq.equipmentName}</p>
                      <p className="text-xs text-gray-600">{eq.quantity} {eq.unit}</p>
                    </div>
                  </div>
                  {eq.specifications && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Specifications:</span> {eq.specifications}
                      </p>
                    </div>
                  )}
                  {eq.remarks && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Remarks:</span> {eq.remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {indent.equipment.length > 3 && (
                <p className="text-xs text-[#0B3861]/70 text-center py-2">
                  +{indent.equipment.length - 3} more equipment...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Glassware Section */}
        {indent.glassware && indent.glassware.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-[#0B3861] mb-3 flex items-center">
              <GlasswareIcon className="mr-2" />
              Glassware Requested ({indent.glassware.length})
            </h4>
            <div className="space-y-2">
              {indent.glassware.slice(0, 3).map((glass, index) => (
                <div key={index} className="bg-white border border-[#0B3861]/10 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{glass.glasswareName}</p>
                      <p className="text-xs text-gray-600">{glass.quantity} {glass.unit}</p>
                      <p className="text-xs text-gray-500">Condition: {glass.condition}</p>
                    </div>
                  </div>
                  {glass.remarks && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Remarks:</span> {glass.remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {indent.glassware.length > 3 && (
                <p className="text-xs text-[#0B3861]/70 text-center py-2">
                  +{indent.glassware.length - 3} more glassware...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Created:</span>
          <p className="font-medium text-gray-800">
            {new Date(indent.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Comments Section */}
      {(showComments || indent.comments?.length > 0) && (
        <div className="mb-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center text-sm text-[#0B3861] hover:text-[#1E88E5] transition-colors mb-2"
          >
            <CommentIcon className="mr-2" />
            {showComments ? 'Hide Comments' : `Show Comments (${indent.comments?.length || 0})`}
          </button>
          
          {showComments && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {indent.comments?.map((comment, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-semibold text-[#0B3861]">
                    {comment.role?.replace('_', ' ') || 'User'}:
                  </span>
                  <span className="ml-2 text-gray-700">{comment.text}</span>
                  {comment.createdAt && (
                    <span className="ml-2 text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )) || (
                <p className="text-xs text-gray-500">No comments yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Actions */}
      {canUpdateStatus && (
        <div className="border-t border-gray-200 pt-4">
          <h5 className="text-sm font-semibold text-[#0B3861] mb-3 flex items-center">
            <SettingsIcon className="mr-2" />
            Update Status
          </h5>
          
          <div className="space-y-3">
            <select
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              className="w-full px-3 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] text-sm"
            >
              <option value="">Select new status...</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-[#0B3861]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] text-sm"
              placeholder="Add a comment (optional)"
              rows={2}
            />
            
            <button
              onClick={handleStatusUpdate}
              disabled={isLoading || !statusUpdate}
              className="w-full bg-gradient-to-r from-[#0B3861] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#2196F3] text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Status'}
            </button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!canUpdateStatus && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowComments(!showComments)}
            className="bg-gradient-to-r from-[#0B3861] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#2196F3] text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg text-sm"
          >
            <CommentIcon />
            <span>View Details</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default IndentCard;
