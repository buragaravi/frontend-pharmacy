import React, { useState } from 'react';
import axios from 'axios';

const statusOptions = [
  { value: 'allocated', label: 'Allocate (Fulfilled)' },
  { value: 'partially_fulfilled', label: 'Partially Fulfill' },
  { value: 'rejected', label: 'Reject' }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'allocated': return 'bg-teal-100 text-teal-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'partially_fulfilled': return 'bg-orange-100 text-orange-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
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
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full border border-[#BCE0FD]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#0B3861] truncate">
          Indent #{indent._id.slice(-6).toUpperCase()}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}
          style={{ minWidth: 80, textAlign: 'center' }}>
          {indent.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-[#0B3861] font-medium mb-0.5">Created By</p>
          <p className="text-xs text-[#0B3861] capitalize">{indent.createdByRole?.replace('_', ' ')}</p>
        </div>
        {indent.labId && (
          <div>
            <p className="text-xs text-[#0B3861] font-medium mb-0.5">Lab ID</p>
            <p className="text-xs text-[#0B3861]">{indent.labId}</p>
          </div>
        )}
        {indent.vendorName && (
          <div>
            <p className="text-xs text-[#0B3861] font-medium mb-0.5">Vendor</p>
            <p className="text-xs text-[#0B3861]">{indent.vendorName}</p>
          </div>
        )}
        {indent.createdAt && (
          <div>
            <p className="text-xs text-[#0B3861] font-medium mb-0.5">Created At</p>
            <p className="text-xs text-[#0B3861]">{new Date(indent.createdAt).toLocaleString()}</p>
          </div>
        )}
      </div>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-semibold text-[#0B3861]">Chemicals Requested</h4>
        </div>
        <ul className="space-y-1">
          {indent.chemicals.map((chem, index) => (
            <li key={index} className="bg-[#F5F9FD] p-2 rounded flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[#0B3861] text-xs">{chem.chemicalName}</p>
                  <p className="text-xs text-[#0B3861]">{chem.quantity} {chem.unit}</p>
                </div>
              </div>
              <div className="mt-1 pt-1 border-t border-[#BCE0FD]">
                <p className="text-[10px] font-medium text-[#0B3861]">Remarks:</p>
                <p className="text-xs text-gray-600 mt-0.5">{chem.remarks || 'No remarks added'}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-2">
        <button
          className="text-xs text-[#0B3861] underline mr-2"
          onClick={() => setShowComments((v) => !v)}
        >
          {showComments ? 'Hide Comments' : 'Show/Add Comments'}
        </button>
      </div>
      {showComments && (
        <div className="mb-2">
          <ul className="mb-2">
            {(indent.comments || []).map((c, idx) => (
              <li key={idx} className="text-xs text-gray-700 mb-1">
                <span className="font-semibold text-[#0B3861]">{c.role || 'User'}:</span> {c.text}
                <span className="ml-2 text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {canUpdateStatus && (
        <div className="mt-2 border-t pt-3">
          <label className="block text-xs font-medium text-[#0B3861] mb-1">Update Status</label>
          <select
            value={statusUpdate}
            onChange={e => setStatusUpdate(e.target.value)}
            className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] mb-2"
          >
            <option value="">Select status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] mb-2"
            placeholder="Add a comment (optional)"
            rows={2}
          />
          <button
            onClick={handleStatusUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] text-sm font-medium"
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </button>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default IndentCard;
