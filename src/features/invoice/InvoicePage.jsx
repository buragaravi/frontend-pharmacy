// InvoicePage.jsx
import React, { useState } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoiceOtherProductsForm from './InvoiceOtherProductsForm';
import InvoiceList from './InvoiceList';

const InvoicePage = () => {
  const [activeModule, setActiveModule] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState('chemicals');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModuleSwitch = (module) => {
    if (module === activeModule) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveModule(module);
      setIsTransitioning(false);
    }, 150); // Half of the transition duration
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const getCategoryDisplayName = () => {
    const categoryNames = {
      chemicals: 'Chemical',
      equipment: 'Equipment',
      glassware: 'Glassware',
      others: 'Other Products'
    };
    return categoryNames[selectedCategory] || 'Chemical';
  };

  return (
    <div className="w-full bg-white">
      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInFromRight {
          animation: slideInFromRight 0.4s ease-out forwards;
        }
        
        .animate-slideInFromLeft {
          animation: slideInFromLeft 0.4s ease-out forwards;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>

      {/* Enhanced Header Section */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Page Title & Description */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-gray-300 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">Invoice Management</h1>
                <p className="text-gray-600 text-sm">Create, manage, and track all your inventory invoices</p>
              </div>
            </div>

            {/* Enhanced Navigation - Category Dropdown and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Category Dropdown - Only show when creating, positioned first */}
              {activeModule === 'create' && (
                <div className="bg-white rounded-xl p-1.5 shadow-lg border border-gray-200 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium text-sm bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer"
                  >
                    <option value="chemicals">Chemical Invoice</option>
                    <option value="equipment">Equipment Invoice</option>
                    <option value="glassware">Glassware Invoice</option>
                  </select>
                </div>
              )}

              {/* Module Navigation Tabs - Enhanced Slider Style */}
              <div className="relative flex bg-gray-100 rounded-2xl p-1 shadow-lg border border-gray-200 w-full sm:w-auto overflow-hidden">
                {/* Sliding Background Indicator */}
                <div 
                  className={`absolute top-1 bottom-1 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-500 ease-out transform ${
                    activeModule === 'create' 
                      ? 'left-1 translate-x-0' 
                      : 'left-1 translate-x-full'
                  }`}
                  style={{ 
                    width: 'calc(50% - 4px)',
                    zIndex: 1 
                  }}
                />
                
                {/* Create Button */}
                <button
                  onClick={() => handleModuleSwitch('create')}
                  disabled={isTransitioning}
                  className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-500 ease-out transform flex-1 sm:flex-none text-sm z-10 ${
                    activeModule === 'create'
                      ? 'text-blue-600 scale-105'
                      : 'text-gray-600 hover:text-blue-500 hover:scale-102'
                  } ${isTransitioning ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <svg className={`w-4 h-4 flex-shrink-0 transition-all duration-500 ${
                    activeModule === 'create' ? 'rotate-0 scale-110' : 'rotate-12 scale-100'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className={`transition-all duration-300 ${
                    activeModule === 'create' ? 'font-bold' : 'font-medium'
                  }`}>Create Invoice</span>
                </button>
                
                {/* List Button */}
                <button
                  onClick={() => handleModuleSwitch('list')}
                  disabled={isTransitioning}
                  className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-500 ease-out transform flex-1 sm:flex-none text-sm z-10 ${
                    activeModule === 'list'
                      ? 'text-blue-600 scale-105'
                      : 'text-gray-600 hover:text-blue-500 hover:scale-102'
                  } ${isTransitioning ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <svg className={`w-4 h-4 flex-shrink-0 transition-all duration-500 ${
                    activeModule === 'list' ? 'rotate-0 scale-110' : 'rotate-12 scale-100'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className={`transition-all duration-300 ${
                    activeModule === 'list' ? 'font-bold' : 'font-medium'
                  }`}>Invoice List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width with Smooth Transitions */}
      <div className="w-full relative overflow-hidden">
        {/* Content Container with Slide Animation */}
        <div className={`transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 transform translate-x-2' : 'opacity-100 transform translate-x-0'
        }`}>
          {activeModule === 'create' && (
            <div className="w-full animate-slideInFromRight">
              {selectedCategory === 'chemicals' ? (
                <InvoiceForm />
              ) : (
                <InvoiceOtherProductsForm 
                  category={selectedCategory} 
                  onSuccess={() => {
                    // Handle success callback if needed
                    console.log(`${getCategoryDisplayName()} invoice created successfully`);
                  }}
                />
              )}
            </div>
          )}
          {activeModule === 'list' && (
            <div className="w-full animate-slideInFromLeft">
              <InvoiceList />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default InvoicePage;
