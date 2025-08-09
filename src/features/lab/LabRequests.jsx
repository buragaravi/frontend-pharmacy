import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import RequestDetails from '../requests/RequestDetails';

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-blue-50 to-blue-100',
  card: 'bg-white',
  border: 'border-blue-200',
  primaryText: 'text-blue-900',
  secondaryText: 'text-blue-500',
  primaryBg: 'bg-blue-900',
  secondaryBg: 'bg-blue-500',
  hoverBg: 'hover:bg-blue-600',
  inputFocus: 'focus:ring-blue-900 focus:border-blue-900'
};

const LabRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['labRequests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/requests/lab', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
  });

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `https://backend-pharmacy-5541.onrender.com/api/requests/${requestId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsDetailsModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const filteredRequests = requests?.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${THEME.border}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading requests: {error.message}
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 ${THEME.background}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`${THEME.card} rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 ${THEME.border}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${THEME.primaryText}`}>Lab Requests</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border ${THEME.border} rounded-lg ${THEME.inputFocus}`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="partially_fulfilled">Partially Fulfilled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${THEME.border}`}>
              <thead className="bg-blue-100">
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Request ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Faculty
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Experiments
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.primaryText} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${THEME.card} divide-y ${THEME.border}`}>
                {filteredRequests?.map((request) => (
                  <tr key={request._id} className="hover:bg-[#F5F9FD]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.facultyId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.experiments.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        ${request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                        ${request.status === 'partially_fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                        ${request.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {request.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsDetailsModalOpen(true);
                        }}
                        className={`${THEME.primaryText} ${THEME.hoverBg}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isDetailsModalOpen && selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          userRole="lab_assistant"
        />
      )}
    </div>
  );
};

export default LabRequests;