// IndentList.jsx - copied and adapted from QuotationList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import IndentCard from './IndentCard';

const IndentList = ({ userRole, userId, labId, refreshTrigger, onCreateNew }) => {
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIndents = async () => {
    try {
      setLoading(true);
      setError('');
      let endpoint = '';
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (userRole === 'lab_assistant') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/indents/lab';
        if (labId) params.labId = labId;
      } else if (userRole === 'central_store_admin') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/indents/central';
      } else if (userRole === 'admin') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/indents/admin';
      }
      const token = localStorage.getItem('token');
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setIndents(res.data);
    } catch (err) {
      setError(`Failed to load indents: ${err.response?.data?.message || err.message}`);
      console.error('Error fetching indents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) fetchIndents();
    // eslint-disable-next-line
  }, [userRole, statusFilter, searchTerm, refreshTrigger]);

  const getStatusFilters = () => {
    if (userRole === 'lab_assistant') {
      return [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'reviewed', label: 'Reviewed' },
        { value: 'allocated', label: 'Allocated' }
      ];
    } else if (userRole === 'central_store_admin') {
      return [
        { value: 'all', label: 'All' },
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'purchased', label: 'Purchased' }
      ];
    } else if (userRole === 'admin') {
      return [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'ordered', label: 'Ordered' }
      ];
    }
    return [];
  };

  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0B3861]/30 border-t-[#0B3861]"></div>
        <p className="text-[#0B3861] font-medium text-sm">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl" role="alert">
      <div className="flex items-center mb-2">
        <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <h3 className="font-medium text-sm">Error Loading</h3>
      </div>
      <p className="mb-3 text-sm">{error}</p>
      <button
        onClick={fetchIndents}
        className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-5 w-full">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#0B3861]/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[#0B3861]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search indents..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-[#0B3861]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] transition-all duration-200 placeholder-[#0B3861]/60 text-sm"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#0B3861] mb-1">Filter</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full lg:w-40 px-3 py-2 border border-[#0B3861]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] transition-all duration-200 text-[#0B3861] font-medium text-sm"
            >
              {getStatusFilters().map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indents Grid */}
      {indents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#0B3861]/10 p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-[#0B3861]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#0B3861]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0B3861] mb-2">No indents found</h3>
              <p className="text-[#0B3861]/60 text-sm mb-4">
                {statusFilter === 'all' ? 'No indents have been created yet.' : `No indents with status "${statusFilter}" found.`}
              </p>
              {(userRole === 'lab_assistant' || userRole === 'central_store_admin') && onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center px-4 py-2 bg-[#0B3861] text-white rounded-2xl hover:bg-[#1E88E5] transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create First Indent
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {indents.map(indent => (
            <IndentCard 
              key={indent._id} 
              indent={indent} 
              userRole={userRole}
              userId={userId}
              labId={labId}
              refreshList={fetchIndents}
              canUpdateStatus={userRole === 'central_store_admin'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IndentList;
