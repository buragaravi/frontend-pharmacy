import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import QuotationList from './QuotationList';
import QuotationForm from './QuotationForm';
import { useNavigate } from 'react-router-dom';

// SVG Icons
const DocumentIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const QuotationPage = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshList, setRefreshList] = useState(false);
  const [showQuotationList, setShowQuotationList] = useState(false);
  const [showFormCard, setShowFormCard] = useState(false);
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
    setShowForm(false);
    setRefreshList(prev => !prev); // Toggle to trigger refresh
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B3861]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-[#BCE0FD]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center">
          <div className="bg-[#0B3861] p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
            <DocumentIcon />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B3861]">Quotation Management</h2>
        </div>
      </div>

      {/* Beautiful Square Toggle Cards */}
      <div className="flex gap-6 mb-6 justify-center">
        {(userRole === 'lab_assistant' || userRole === 'central_lab_admin') && (
          <div
            className={`flex flex-col items-center justify-center w-48 h-48 rounded-2xl shadow-xl border-2 border-[#BCE0FD] cursor-pointer transition-all duration-200 select-none
              ${showFormCard ? 'bg-[#BCE0FD] scale-90' : 'bg-[#F5F9FD] hover:bg-[#BCE0FD]'}
            `}
            onClick={() => {
              if (showFormCard) setShowFormCard(false);
              else {
                setShowFormCard(true);
                setShowQuotationList(false);
              }
            }}
          >
            <AddIcon className="mb-2 text-[#0B3861] w-8 h-8" />
            <span className="text-[#0B3861] font-bold text-base text-center">Create Quotation</span>
          </div>
        )}
        <div
          className={`flex flex-col items-center justify-center w-48 h-48 rounded-2xl shadow-xl border-2 border-[#BCE0FD] cursor-pointer transition-all duration-200 select-none
            ${showQuotationList ? 'bg-[#BCE0FD] scale-90' : 'bg-[#F5F9FD] hover:bg-[#BCE0FD]'}
          `}
          onClick={() => {
            if (showQuotationList) setShowQuotationList(false);
            else {
              setShowQuotationList(true);
              setShowFormCard(false);
            }
          }}
        >
          <DocumentIcon className="mb-2 text-[#0B3861] w-8 h-8" />
          <span className="text-[#0B3861] font-bold text-base text-center">Quotation List</span>
        </div>
      </div>

      {/* Render respective component below the cards */}
      {showFormCard && (
        <div className="bg-white rounded-xl shadow p-6 border border-[#BCE0FD] mb-6 animate-fade-in">
          <QuotationForm
            userRole={userRole}
            userId={userId}
            labId={labId}
            onSubmitSuccess={handleFormSubmitSuccess}
          />
        </div>
      )}
      {showQuotationList && (
        <div className="bg-white rounded-xl shadow p-6 border border-[#BCE0FD] mb-6 animate-fade-in">
          <div className="overflow-x-auto">
            <QuotationList
              userRole={userRole}
              userId={userId}
              labId={labId}
              refreshTrigger={refreshList}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationPage;