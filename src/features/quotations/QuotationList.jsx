import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QuotationCard from './QuotationCard';

const QuotationList = ({ userRole, userId, labId }) => {
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
      } else if (userRole === 'central_lab_admin') {
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
  }, [userRole, statusFilter, searchTerm]);

  const getStatusFilters = () => {
    if (userRole === 'lab_assistant') {
      return [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'reviewed', label: 'Reviewed' },
        { value: 'allocated', label: 'Allocated' }
      ];
    } else if (userRole === 'central_lab_admin') {
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
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6D123F]"></div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B3861]"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg" role="alert">
      <p>{error}</p>
      <button
        onClick={fetchQuotations}
        className="mt-2 px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#1E88E5] transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="md:w-1/2">
          <input
            type="text"
            placeholder="Search by vendor, chemical, or ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] transition-colors"
          />
        </div>
        <div className="w-full md:w-1/3">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861] transition-colors"
          >
            {getStatusFilters().map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="bg-[#F5F9FD] p-8 rounded-lg text-center border border-[#BCE0FD]">
          <p className="text-[#0B3861]/80 text-lg">No quotations found fo royur profile </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 grid-cols-1 ">
          {quotations.map((quotation) => (
            <div key={quotation._id} className='flex'>
              <QuotationCard
                quotation={quotation}
                userRole={userRole}
                userId={userId}
                labId={labId}
                refreshList={fetchQuotations}
              />
            </div>
          ))}
        </div>

      )}
    </div>
  );
};

export default QuotationList;