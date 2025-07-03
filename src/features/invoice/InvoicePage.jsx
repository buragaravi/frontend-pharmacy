// InvoicePage.jsx
import React, { useState } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';

const InvoicePage = () => {
  const [activeModule, setActiveModule] = useState('create');

  const handleModuleSwitch = (module) => {
    setActiveModule(module);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Breadcrumb Navigation */}
      <div className="w-full bg-white/70 backdrop-blur-sm border-b border-gray-200/30">
        <div className="w-full px-4 py-2">
          <nav className="flex items-center space-x-1.5 text-xs">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-gray-500">Admin Dashboard</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-600 font-medium">Invoice Management</span>
            {activeModule && (
              <>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-700 capitalize">{activeModule === 'create' ? 'Create Invoice' : 'Invoice List'}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Enhanced Header Section */}
      <div className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Page Title & Description */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">Invoice Management</h1>
                <p className="text-gray-600 text-sm">Create, manage, and track all your inventory invoices</p>
              </div>
            </div>

            {/* Enhanced Navigation Tabs */}
            <div className="flex bg-white rounded-xl p-1.5 shadow-lg border border-gray-200 w-full sm:w-auto">
              <button
                onClick={() => handleModuleSwitch('create')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 transform flex-1 sm:flex-none text-sm ${
                  activeModule === 'create'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => handleModuleSwitch('list')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 transform flex-1 sm:flex-none text-sm ${
                  activeModule === 'list'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Invoice List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="w-full">
        {activeModule === 'create' && (
          <div className="w-full animate-fade-in">
            <InvoiceForm />
          </div>
        )}
        {activeModule === 'list' && (
          <div className="w-full animate-fade-in">
            <InvoiceList />
          </div>
        )}
      </div>

      {/* Quick Stats Dashboard (Optional Enhancement) */}
      <div className="fixed bottom-4 right-4 hidden lg:block z-30">
        <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 p-3 min-w-[180px]">
          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="truncate">Quick Stats</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 truncate">Active Module:</span>
              <span className="text-xs font-medium text-blue-600 capitalize ml-1.5">{activeModule}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Status:</span>
              <div className="flex items-center gap-1 ml-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles for Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Custom scrollbar for better UX */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
