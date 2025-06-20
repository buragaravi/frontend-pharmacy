import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RequestCard from './RequestCard';
import RequestDetailsModal from './RequestDetailsModal';
import { useNavigate } from 'react-router-dom';

// SVG Icons
const MyRequestsIcon = () => (
  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-4 md:p-8">
    <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-[#0B3861]"></div>
  </div>
);

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white',
  border: 'border-[#BCE0FD]',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-[#0B3861] focus:border-[#0B3861]'
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-200 text-gray-800',
};

const ITEMS_PER_PAGE = 6;

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Sort requests by date (newest first)
  const sortRequestsByDate = (requests) => {
    return [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/requests/faculty', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const sortedRequests = sortRequestsByDate(res.data);
      setRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching your requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchMyRequests();
    }
  }, [token, navigate]);

  useEffect(() => {
    let filtered = requests;
    if (selectedStatus !== 'all') {
      filtered = requests.filter(req => req.status === selectedStatus);
    }
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [selectedStatus, requests]);

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={`p-3 sm:p-4 min-h-screen ${THEME.background}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-6 ${THEME.card} ${THEME.border}`}>
          {/* Header with Status Filter */}
          <div className={`flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 rounded-xl px-4 py-3 ${THEME.border}`}> 
            <div className="flex items-center">
              <div className={`${THEME.primaryBg} p-1 sm:p-1.5 rounded-md mr-2`}>
                <MyRequestsIcon />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${THEME.primaryText}`}>
                My Requests
              </h2>
            </div>

            {/* Status Filter */}
            <div className="relative">
              {/* Mobile dropdown */}
              <select 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`md:hidden block w-full pl-7 pr-8 py-1.5 text-sm ${THEME.border} rounded-md ${THEME.card} appearance-none ${THEME.inputFocus}`}
                value={selectedStatus}
              >
                <option value="all">All Status</option>
                {Object.keys(STATUS_COLORS).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
              
              {/* Desktop filter buttons */}
              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedStatus === 'all'
                      ? `${THEME.primaryBg} text-white`
                      : `${THEME.card} ${THEME.primaryText} hover:bg-[#F5F9FD]`
                  }`}
                >
                  All
                </button>
                {Object.keys(STATUS_COLORS).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all ${STATUS_COLORS[status]} ${
                      selectedStatus === status ? 'ring-1 ring-[#0B3861]' : ''
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSpinner />
          ) : filteredRequests.length === 0 ? (
            <div className={`${THEME.background} p-4 rounded-lg ${THEME.border} text-center ${THEME.primaryText}`}>
              <p className="text-sm font-semibold">No requests found</p>
              <p className="text-xs mt-1">
                {selectedStatus === 'all' 
                  ? "You haven't made any requests yet"
                  : `No ${selectedStatus.replace('_', ' ')} requests`}
              </p>
            </div>
          ) : (
            <>
              {/* Request Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {paginatedRequests.map((req) => (
                  <RequestCard
                    key={req._id}
                    request={req}
                    showStatus
                    onClick={() => handleOpenDetails(req)}
                    className={`shadow ${THEME.border} ${THEME.card} hover:shadow-lg hover:border-[#1E88E5]`}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${THEME.inputFocus}`}
                    >
                      <svg className={`w-5 h-5 ${THEME.secondaryText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 text-sm rounded-md ${
                          currentPage === page 
                            ? `${THEME.primaryBg} text-white` 
                            : `${THEME.primaryText} hover:bg-[#F5F9FD]`
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${THEME.inputFocus}`}
                    >
                      <svg className={`w-5 h-5 ${THEME.secondaryText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}

          {/* Modal */}
          {selectedRequest && (
            <RequestDetailsModal 
              open={true} 
              request={selectedRequest} 
              onClose={handleCloseDetails} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequestsPage;