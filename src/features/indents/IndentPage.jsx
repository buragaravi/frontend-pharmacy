// IndentPage.jsx - Updated to match QuotationPage design
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import IndentList from './IndentList';
import IndentForm from './IndentForm';
import { useNavigate } from 'react-router-dom';

// Enhanced SVG Icons
const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const IndentPage = ({ labId: propLabId }) => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState(propLabId || '');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'form'
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const { role, userId, id, labId: tokenLabId } = decoded.user;
      setUserRole(role);
      setUserId(userId || id);
      
      // Only set labId from token if not provided as prop
      if (!propLabId && tokenLabId) {
        setLabId(tokenLabId);
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate, propLabId]);

  const handleFormSubmitSuccess = () => {
    setActiveView('list');
    setRefreshTrigger(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center w-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0B3861]/30 border-t-[#0B3861]"></div>
          <p className="text-[#0B3861] font-medium text-sm">Loading...</p>
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
                  Indent Management
                </h1>
                <p className="text-white/90 text-sm">
                  {userRole === 'lab_assistant' && 'Create indent requests'}
                  {userRole === 'central_store_admin' && 'Manage indents'}
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
                    ? 'bg-white text-[#0B3861] shadow-md'
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
                      ? 'bg-white text-[#0B3861] shadow-md'
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
              <IndentList
                userRole={userRole}
                userId={userId}
                labId={labId}
                refreshTrigger={refreshTrigger}
                onCreateNew={() => setActiveView('form')}
              />
            </div>
          )}
          
          {activeView === 'form' && (
            <div className="w-full">
              <div className="bg-white rounded-3xl shadow-lg border border-[#0B3861]/10 w-full overflow-hidden">
                <div className="bg-blue-600 p-6 rounded-t-3xl">
                  <h2 className="text-lg font-semibold text-white">
                    {userRole === 'lab_assistant' ? 'Create Indent Request' : 'Create Indent'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {userRole === 'lab_assistant' 
                      ? 'Submit chemical requirements'
                      : 'Create indent request'
                    }
                  </p>
                </div>
                <div className="p-6 w-full">
                  <IndentForm
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
    </div>
  );
};

export default IndentPage;
