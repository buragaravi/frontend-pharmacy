import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QuotationCard from './QuotationCard';

const QuotationList = ({ userRole, userId, labId, onCreateNew, refreshTrigger, onViewDetails }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      const params = {};

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      if (userRole === 'lab_assistant') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/quotations/lab';
        if (labId) {
          params.labId = labId;
        }
      } else if (userRole === 'central_store_admin') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/quotations/central';
      } else if (userRole === 'admin') {
        endpoint = 'https://backend-pharmacy-5541.onrender.com/api/quotations/admin';
      }

      const token = localStorage.getItem('token');
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setQuotations(res.data);
    } catch (err) {
      setError(`Failed to load quotations: ${err.response?.data?.message || err.message}`);
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) fetchQuotations();
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

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2196F3]/30 border-t-[#2196F3]"></div>
        <p className="text-[#2196F3] font-medium text-sm">Loading...</p>
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
        onClick={fetchQuotations}
        className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-5 w-full">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#2196F3]/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 placeholder-[#2196F3]/60 text-sm"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#1976D2] mb-1">Filter</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full lg:w-40 px-3 py-2 border border-[#2196F3]/30 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:border-[#2196F3] transition-all duration-200 text-[#1976D2] font-medium text-sm"
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

      {/* Results Section */}
      {quotations.length === 0 ? (
        <div className="bg-[#E3F2FD] p-8 rounded-2xl text-center border border-[#2196F3]/20">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <svg className="w-8 h-8 text-[#2196F3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-md font-semibold text-[#1976D2] mb-1">No Quotations</h3>
              <p className="text-[#2196F3] text-sm mb-3">
                {statusFilter !== 'all' 
                  ? `No quotations with status "${statusFilter}"`
                  : 'No quotations found'
                }
              </p>
              {onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white rounded-2xl font-medium hover:from-[#1976D2] hover:to-[#1565C0] transition-all duration-200 shadow-sm text-sm"
                >
                  Create First Quotation
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-[#2196F3] font-medium text-sm">
              {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#2196F3]">
              <span>Sort:</span>
              <span className="font-medium text-[#1976D2]">Recent</span>
            </div>
          </div>

          {/* Quotation Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 w-full">
            {quotations.map((quotation) => (
              <div key={quotation._id} className="w-full">
                <QuotationCard
                  quotation={quotation}
                  onViewDetails={onViewDetails}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuotationList;