import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import QuotationForm from './QuotationForm';
import QuotationList from './QuotationList';
import QuotationDetailSmooth from './QuotationDetailSmooth';
import { useNavigate } from 'react-router-dom';

// Enhanced SVG Icons with improved styling
const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const QuotationPage = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const { role, userId, id, labId } = decoded.user;

      setUserRole(role);
      setUserId(userId || id);
      setLabId(labId);
    } catch (err) {
      console.error('Error decoding token:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleFormSubmitSuccess = () => {
    setActiveView('list');
    setRefreshTrigger(prev => !prev);
  };

  const handleViewDetails = async (quotation) => {
    console.log('handleViewDetails called with quotation:', quotation._id);
    setModalLoading(true);
    setModalError('');
    setIsModalOpen(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://backend-pharmacy-5541.onrender.com/api/quotations/${quotation._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Fetched quotation details:', response.data);
      setSelectedQuotation(response.data);
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      setModalError('Failed to load quotation details');
      setSelectedQuotation(quotation); // Fallback to the original quotation data
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuotation(null);
    setModalLoading(false);
    setModalError('');
  };

  const handleModalRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#2196F3]/30 border-t-[#2196F3]"></div>
          <p className="text-[#1976D2] font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      {/* Header Section */}
      <div className="w-full bg-blue-600 rounded-b-3xl p-4 shadow-lg">
        <div className="w-full max-w-full mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <DocumentIcon className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Quotation Management
                </h1>
                <p className="text-white/90 text-sm">
                  {userRole === 'lab_assistant' && 'Request chemicals'}
                  {userRole === 'central_store_admin' && 'Manage quotations'}
                  {userRole === 'admin' && 'Oversee processes'}
                </p>
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex bg-white/20 backdrop-blur-sm rounded-2xl p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeView === 'list'
                    ? 'bg-white text-[#1E88E5] shadow-md'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span>List</span>
              </button>
              
              {(userRole === 'lab_assistant' || userRole === 'central_store_admin') && (
                <button
                  onClick={() => setActiveView('form')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeView === 'form'
                      ? 'bg-white text-[#1E88E5] shadow-md'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <AddIcon className="w-4 h-4" />
                  <span>Create</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-full mx-auto p-6">
        <div className="w-full transition-all duration-300">
          {activeView === 'list' && (
            <div className="w-full">
              <QuotationList
                userRole={userRole}
                userId={userId}
                labId={labId}
                refreshTrigger={refreshTrigger}
                onCreateNew={() => setActiveView('form')}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}
          
          {activeView === 'form' && (
            <div className="w-full">
              <div className="bg-white rounded-3xl shadow-lg border border-[#2196F3]/10 w-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] p-6 rounded-t-3xl">
                  <h2 className="text-lg font-semibold text-white">
                    {userRole === 'lab_assistant' ? 'Request Chemicals' : 'Create Quotation'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {userRole === 'lab_assistant' 
                      ? 'Submit chemical requirements'
                      : 'Create vendor quotation'
                    }
                  </p>
                </div>
                <div className="p-6 w-full">
                  <QuotationForm
                    userRole={userRole}
                    userId={userId}
                    labId={labId}
                    onSubmitSuccess={handleFormSubmitSuccess}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QuotationDetail Modal */}
      {isModalOpen && (
        <>
          {modalLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-600">Loading quotation details...</p>
              </div>
            </div>
          )}
          
          {modalError && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 max-w-md">
                <div className="text-red-500 text-xl">⚠️</div>
                <p className="text-red-600 text-center">{modalError}</p>
                <button
                  onClick={handleCloseModal}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {selectedQuotation && !modalLoading && !modalError && (
            <QuotationDetailSmooth
              quotation={selectedQuotation}
              isOpen={true}
              onClose={handleCloseModal}
              onRefresh={handleModalRefresh}
            />
          )}
        </>
      )}
    </div>
  );
};

export default QuotationPage;