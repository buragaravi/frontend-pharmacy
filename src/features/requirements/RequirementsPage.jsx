import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import RequirementsList from './RequirementsList';
import RequirementForm from './RequirementForm';
import RequirementDetailSmooth from './RequirementDetailSmooth';

// Enhanced SVG Icons with improved styling
const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RequirementsPage = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.user.role);
      setUserId(decoded.userId);
      setLabId(decoded.labId);
      setLoading(false);
    } catch (error) {
      console.error('Error decoding token:', error);
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev);
  };

  const handleRequirementCreated = () => {
    setActiveView('list');
    handleRefresh();
  };

  const handleViewRequirement = async (requirement) => {
    setModalLoading(true);
    setModalError('');
    setSelectedRequirement(requirement);
    setIsModalOpen(true);
    setModalLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequirement(null);
    setModalError('');
  };

  const handleRequirementUpdate = () => {
    handleRefresh();
    closeModal();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        {/* Header with Navigation */}
        <div className="bg-blue-600 rounded-b-3xl shadow-md mb-4">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white bg-opacity-20 rounded-md">
                <DocumentIcon />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Requirements Management</h1>
                <p className="text-blue-100 text-xs">Manage laboratory requirements and quotation conversions</p>
              </div>
            </div>
            
            {/* Navigation Tabs with Smooth Animation */}
            <div className="relative flex bg-white bg-opacity-10 p-0.5 rounded-md backdrop-blur-sm">
              {/* Animated background slider */}
              <div 
                className={`absolute top-0.5 bottom-0.5 bg-white rounded-sm shadow-sm transition-all duration-300 ease-in-out ${
                  activeView === 'list' ? 'left-0.5 right-1/2 mr-0.5' : 'left-1/2 right-0.5 ml-0.5'
                }`}
              />
              
              <button
                onClick={() => setActiveView('list')}
                className={`relative z-10 flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-300 ease-in-out transform ${
                  activeView === 'list'
                    ? 'text-blue-600 scale-105'
                    : 'text-blue-100 hover:text-white hover:scale-105'
                }`}
              >
                <div className={`transition-transform duration-300 ${activeView === 'list' ? 'rotate-3' : 'hover:rotate-3'}`}>
                  <ListIcon />
                </div>
                <span className="font-medium">View Requirements</span>
              </button>
              
              <button
                onClick={() => setActiveView('form')}
                className={`relative z-10 flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-300 ease-in-out transform ${
                  activeView === 'form'
                    ? 'text-blue-600 scale-105'
                    : 'text-blue-100 hover:text-white hover:scale-105'
                }`}
              >
                <div className={`transition-transform duration-300 ${activeView === 'form' ? 'rotate-90' : 'hover:rotate-90'}`}>
                  <AddIcon />
                </div>
                <span className="font-medium">New Requirement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with Smooth Transitions */}
        <div className="py-3 px-6">
          <div className="relative overflow-hidden">
            {/* List View */}
            <div className={`transition-all duration-500 ease-in-out transform ${
              activeView === 'list' 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-full opacity-0 absolute top-0 left-0 w-full pointer-events-none'
            }`}>
              <RequirementsList
                userRole={userRole}
                userId={userId}
                labId={labId}
                refreshTrigger={refreshTrigger}
                onViewRequirement={handleViewRequirement}
                onRefresh={handleRefresh}
              />
            </div>
            
            {/* Form View */}
            <div className={`transition-all duration-500 ease-in-out transform ${
              activeView === 'form' 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-full opacity-0 absolute top-0 left-0 w-full pointer-events-none'
            }`}>
              <RequirementForm
                userRole={userRole}
                userId={userId}
                labId={labId}
                onRequirementCreated={handleRequirementCreated}
                onCancel={() => setActiveView('list')}
              />
            </div>
          </div>
        </div>

        {/* Requirement Detail Modal */}
        {isModalOpen && (
          <RequirementDetailSmooth
            requirement={selectedRequirement}
            isOpen={isModalOpen}
            onClose={closeModal}
            loading={modalLoading}
            error={modalError}
            onUpdate={handleRequirementUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default RequirementsPage;
