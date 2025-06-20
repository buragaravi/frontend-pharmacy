// InvoicePage.jsx
import React, { useState } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';

const CARD_STYLE =
  'flex flex-col items-center justify-center cursor-pointer rounded-xl shadow-md border border-[#E8D8E1] p-6 m-2 transition-all duration-200 hover:shadow-lg hover:bg-blue-50 min-w-[160px] min-h-[120px]';

const InvoicePage = () => {
  const [activeModule, setActiveModule] = useState(null);

  const handleCardClick = (module) => {
    setActiveModule((prev) => (prev === module ? null : module));
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div
            className={CARD_STYLE + (activeModule === 'create' ? ' ring-2 ring-blue-400' : '')}
            onClick={() => handleCardClick('create')}
            aria-pressed={activeModule === 'create'}
            tabIndex={0}
            role="button"
          >
            <svg className="w-8 h-8 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold text-blue-900">Create Invoice</span>
          </div>
          <div
            className={CARD_STYLE + (activeModule === 'list' ? ' ring-2 ring-blue-400' : '')}
            onClick={() => handleCardClick('list')}
            aria-pressed={activeModule === 'list'}
            tabIndex={0}
            role="button"
          >
            <svg className="w-8 h-8 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-semibold text-blue-900">Invoice List</span>
          </div>
        </div>

        {/* Render selected module below cards */}
        <div className="mt-2">
          {activeModule === 'create' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6 animate-fade-in">
              <InvoiceForm />
            </div>
          )}
          {activeModule === 'list' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6 animate-fade-in">
              <InvoiceList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
