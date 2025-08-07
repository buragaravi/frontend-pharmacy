import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import RequestCard from './RequestCard';
import RequestDetailsModal from './RequestDetailsModal';
import { useNavigate } from 'react-router-dom';

// CSS Animations
const AnimationStyles = () => (
  <style>{`
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `}</style>
);

// SVG Icons
const MyRequestsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-6">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-800"></div>
  </div>
);

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-blue-50 to-blue-100',
  card: 'bg-white/95 backdrop-blur-md border border-blue-200/30 shadow-xl',
  border: 'border-blue-200/20',
  primaryText: 'text-blue-800',
  secondaryText: 'text-blue-600',
  mutedText: 'text-gray-600',
  primaryBg: 'bg-blue-800',
  secondaryBg: 'bg-blue-600',
  hoverBg: 'hover:bg-blue-700',
  inputBg: 'bg-gray-50/80',
  inputBorder: 'border-blue-200/30',
  inputFocus: 'focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800',
  cardHover: 'hover:bg-gray-50/50 transition-colors duration-200'
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-blue-100 text-blue-800',
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
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Get user role from token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.user.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [token]);

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

  const handleRequestUpdate = () => {
    fetchMyRequests(); // Refresh the data
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full relative z-30">
      <AnimationStyles />
      
      {/* Background Elements - Lower z-index */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`rounded-3xl shadow-2xl backdrop-blur-xl bg-white/98 border border-white/40 relative z-40`}>
            
            {/* Header Section */}
            <div className={`bg-gradient-to-r from-blue-50/90 to-blue-50/90 backdrop-blur-sm border-b border-blue-100/50 relative z-50`}>
              <div className="px-6 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  
                  {/* Title Section */}
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`bg-gradient-to-br from-blue-500 to-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center relative z-60`}>
                      <MyRequestsIcon />
                    </div>
                    <div>
                      <h1 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-700 bg-clip-text text-transparent leading-tight`}>
                        My Requests
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1">Manage and track your submitted requests</p>
                    </div>
                  </div>

                  {/* Status Filter Section */}
                  <div className="flex flex-col sm:flex-row gap-4 relative z-60">
                    
                    {/* Mobile Dropdown */}
                    <div className="lg:hidden w-full">
                      <select 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={`w-full pl-3 pr-8 py-3 text-sm border border-blue-200/60 rounded-xl bg-white/95 backdrop-blur-md appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg font-medium relative z-70`}
                        value={selectedStatus}
                      >
                        <option value="all">All Status</option>
                        {Object.keys(STATUS_COLORS).map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      {/* Dropdown Arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Desktop Filter Buttons */}
                    <div className="hidden lg:flex flex-wrap gap-3 relative z-70">
                      <button
                        onClick={() => setSelectedStatus('all')}
                        className={`px-4 py-2 text-xs rounded-xl font-semibold whitespace-nowrap transition-all duration-300 shadow-md relative z-80 ${
                          selectedStatus === 'all'
                            ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105 ring-2 ring-blue-300/50`
                            : `bg-white/95 backdrop-blur-md text-blue-700 hover:bg-blue-50 border border-blue-200/60 hover:shadow-lg hover:scale-105`
                        }`}
                      >
                        All Status
                      </button>
                      {Object.keys(STATUS_COLORS).map((status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-4 py-2 text-xs rounded-xl font-semibold whitespace-nowrap transition-all duration-300 shadow-md relative z-80 ${STATUS_COLORS[status]} border border-transparent ${
                            selectedStatus === status ? 'ring-2 ring-blue-500/70 shadow-lg transform scale-105' : 'hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 py-6 relative z-50">
              
              {/* Loading State */}
              {loading ? (
                <div className="flex flex-col justify-center items-center py-16 relative z-50">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 shadow-lg mb-4"></div>
                  <p className="text-base font-medium text-blue-700">Loading your requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                // Empty State
                <div className={`bg-gradient-to-br from-blue-50/80 to-blue-50/80 p-12 rounded-2xl border border-blue-100/60 text-center backdrop-blur-md shadow-lg relative z-50 mx-auto max-w-xl`}>
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-md">
                    <div className="w-8 h-8 text-blue-600">
                      <MyRequestsIcon />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">No requests found</h3>
                  <p className="text-sm text-blue-700 font-medium leading-relaxed">
                    {selectedStatus === 'all' 
                      ? "You haven't made any requests yet. Start by creating your first request!"
                      : `No ${selectedStatus.replace('_', ' ')} requests found. Try selecting a different status filter.`}
                  </p>
                  {selectedStatus === 'all' && (
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm"
                    >
                      Refresh Page
                    </button>
                  )}
                </div>
              ) : (
                // Content with Requests
                <div className="space-y-6">
                  
                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center border border-blue-200/50">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{requests.length}</div>
                      <div className="text-xs sm:text-sm text-blue-700">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl text-center border border-amber-200/50">
                      <div className="text-xl sm:text-2xl font-bold text-amber-600">{requests.filter(r => r.status === 'pending').length}</div>
                      <div className="text-xs sm:text-sm text-amber-700">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl text-center border border-green-200/50">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'approved').length}</div>
                      <div className="text-xs sm:text-sm text-green-700">Approved</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center border border-blue-200/50">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'fulfilled').length}</div>
                      <div className="text-xs sm:text-sm text-blue-700">Fulfilled</div>
                    </div>
                  </div>

                  {/* Request Cards Grid */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {selectedStatus === 'all' ? 'All Requests' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('_', ' ')} Requests`}
                      <span className="ml-2 text-xs font-normal text-gray-600">({filteredRequests.length} found)</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 relative z-50">
                      {paginatedRequests.map((req, index) => (
                        <div 
                          key={req._id} 
                          className="relative z-60"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <RequestCard
                            request={req}
                            showStatus
                            userRole={userRole}
                            onClick={() => handleOpenDetails(req)}
                            className={`shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-500 bg-white/98 backdrop-blur-md border border-white/40 rounded-2xl relative z-70 hover:-translate-y-1`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center pt-6 relative z-60">
                      <nav className="flex items-center space-x-2 sm:space-x-3 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-white/40 shadow-lg relative z-70">
                        
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-blue-600 hover:bg-blue-50 hover:shadow-md relative z-80 ${
                            currentPage === 1 ? 'bg-gray-100' : 'bg-white shadow-sm hover:scale-105'
                          }`}
                        >
                          <svg className={`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex space-x-1 sm:space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-10 h-10 sm:w-8 sm:h-8 text-xs rounded-lg font-semibold transition-all duration-300 relative z-80 ${
                                currentPage === page 
                                  ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-110 ring-2 ring-blue-300/50` 
                                  : `text-blue-700 bg-white hover:bg-blue-50 hover:shadow-md hover:scale-105 shadow-sm`
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-blue-600 hover:bg-blue-50 hover:shadow-md relative z-80 ${
                            currentPage === totalPages ? 'bg-gray-100' : 'bg-white shadow-sm hover:scale-105'
                          }`}
                        >
                          <svg className={`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Rendered outside main container for proper viewport centering */}
      {selectedRequest && (
        <RequestDetailsModal 
          open={true} 
          request={selectedRequest} 
          onClose={handleCloseDetails}
          onRequestUpdate={handleRequestUpdate}
        />
      )}
    </div>
  );
};

export default MyRequestsPage;