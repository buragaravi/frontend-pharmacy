import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import RequestDetails from './RequestDetails';
import { useResponsiveColors } from '../../hooks/useResponsiveColors';
import SafeButton from '../../components/SafeButton';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const RequestList = ({ userRole, labId }) => {
  // Color utilities for cross-platform compatibility
  const { getSafeBackground, getSafeBackdrop } = useResponsiveColors();
  
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch requests based on user role
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['requests', userRole, labId],
    queryFn: async () => {
      let endpoint = '/requests';
      if (userRole === 'faculty') {
        endpoint = '/requests/faculty';
      } else if (userRole === 'lab_assistant' && labId) {
        endpoint = `/requests/lab/${labId}`;
      }
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  // Status update mutations
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, status }) => {
      const response = await api.put(`/requests/${requestId}/approve`, {
        requestId,
        status,
        force: false
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['requests']);
      toast.success('Request status updated successfully');
      setIsDetailsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update request status');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.put(`/requests/${requestId}/reject`, {
        requestId,
        status: 'rejected',
        force: false
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['requests']);
      toast.success('Request rejected successfully');
      setIsDetailsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.put(`/requests/${requestId}/complete`, {
        requestId,
        status: 'completed',
        force: false
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['requests']);
      toast.success('Request completed successfully');
      setIsDetailsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete request');
    },
  });

  const handleStatusUpdate = (requestId, status) => {
    if (status === 'rejected') {
      rejectMutation.mutate(requestId);
    } else if (status === 'completed') {
      completeMutation.mutate(requestId);
    } else {
      approveMutation.mutate({ requestId, status });
    }
  };

  const filteredRequests = requests?.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${THEME.border}`}></div>
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
    <div 
      className="p-4 md:p-6"
      style={getSafeBackground('background', '#f9fafb')}
    >
      <div className="max-w-7xl mx-auto">
        <div 
          className="rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200"
          style={getSafeBackground('light', '#ffffff')}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chemical Requests</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead 
                className="rounded-lg"
                style={getSafeBackground('light', '#f8fafc')}
              >
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Request ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Faculty
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Lab
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Experiments
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${THEME.secondaryText} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${THEME.card} divide-y ${THEME.border}`}>
                {filteredRequests?.map((request) => (
                  <tr key={request._id} className={`hover:bg-[#F9F3F7]`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.facultyId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.labId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.experiments.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'partially_fulfilled' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
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
                        className={`${THEME.secondaryText} ${THEME.hoverBg.replace('bg', 'text')}`}
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
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default RequestList;