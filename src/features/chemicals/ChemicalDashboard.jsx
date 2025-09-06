import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AllocateChemicalForm from './AllocateChemicalForm';
import CentralChemicalTable from './CentralChemicalTable';
import LabChemicalTable from './LabChemicalTable';
import ExpiredChemicalManager from './ExpiredChemicalManager';
import useLabs from '../../hooks/useLabs';

const ChemicalDashboard = ({ labId: propLabId }) => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState(propLabId || '');
  const [view, setView] = useState('central');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);
  
  const { labs, loading: labsLoading, error: labsError } = useLabs();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { role, id, labId: tokenLabId } = decoded.user;

        setUserRole(role);
        setUserId(id);
        
        if (!propLabId && tokenLabId) {
          setLabId(tokenLabId);
        }

        if (role === 'lab_assistant') {
          setView('myLab');
        } else {
          setView('central');
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [propLabId]);

  const renderTabs = () => {
    const commonTabClass = "px-4 py-2.5 -mb-px font-semibold text-sm sm:text-base transition-all duration-300 ease-in-out rounded-t-lg focus:outline-none";
    const activeTabClass = "border-b-2 border-blue-600 text-blue-600 bg-blue-50";
    const inactiveTabClass = "text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-b-2 border-transparent";

    if (userRole === 'admin' || userRole === 'central_store_admin') {
      const tabs = [
        { key: 'central', label: 'Central Chemicals' },
        { key: 'add', label: 'Add Chemicals' },
        { key: 'allocate', label: 'Allocate Chemicals' },
        { key: 'labs', label: 'Lab Stocks' },
        { key: 'expired', label: 'Expired Chemicals' },
      ];

      return (
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`${commonTabClass} ${view === tab.key ? activeTabClass : inactiveTabClass}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );
    }

    if (userRole === 'lab_assistant') {
      return (
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setView('myLab')}
            className={`${commonTabClass} ${view === 'myLab' ? activeTabClass : inactiveTabClass}`}
          >
            My Lab Stock
          </button>
        </div>
      );
    }

    return <p className="text-gray-600 font-medium">You do not have permission to view this module.</p>;
  };

  const renderView = () => {
    switch (view) {
      case 'central':
        return <CentralChemicalTable />;
      case 'add':
        return (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <p className="text-gray-600 font-medium">Add Chemicals form will be here.</p>
          </div>
        );
      case 'allocate':
        return <AllocateChemicalForm />;
      case 'expired':
        return <ExpiredChemicalManager />;
      case 'labs': {
        if (expandedLab) {
          return (
            <div className="animate-fade-in">
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                {labs.map((lab) => (
                  <button
                    key={lab.labId}
                    className={`px-4 py-2 rounded-full font-semibold shadow-md border transition-all duration-200 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      expandedLab === lab.labId
                        ? 'bg-blue-600 text-white border-blue-600 scale-105'
                        : 'bg-white text-blue-600 border-gray-200 hover:bg-blue-50 hover:border-blue-600'
                    }`}
                    onClick={() => setExpandedLab(lab.labId)}
                  >
                    {lab.labName || lab.labId}
                  </button>
                ))}
              </div>
              <div className="mb-8">
                <div className="flex justify-end max-w-6xl mx-auto">
                  <button
                    className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-500 font-semibold text-base shadow-sm transition-all duration-200"
                    onClick={() => setExpandedLab(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to All Labs
                  </button>
                </div>
                <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <LabChemicalTable labId={expandedLab} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="lab-grid">
            {labs.map((lab) => (
              <div
                key={lab.labId}
                className="lab-card"
                onClick={() => setExpandedLab(lab.labId)}
              >
                <span className="lab-name">{lab.labName || lab.labId}</span>
                <span className="lab-label">Lab Inventory</span>
                <span className="view-button">View Details</span>
              </div>
            ))}
          </div>
        );
      }
      case 'myLab':
        return (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Lab Inventory: <span className="text-blue-600">{labId}</span></h3>
            <LabChemicalTable labId={labId} />
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
            <p className="text-gray-500 font-medium">Select a category to get started.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[400px]">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">Chemical Management</h2>
          </div>
          
          <div className="p-6">
            {renderTabs()}
            {renderView()}
          </div>
        </div>
      </div>

      <style jsx>{`
        .lab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 2rem;
          padding: 1rem 0;
        }

        .lab-card {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .lab-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: #2563EB; /* blue-600 */
        }
        
        .lab-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .lab-card:hover::before {
          opacity: 1;
        }

        .lab-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e3a8a; /* blue-900 */
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .lab-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569; /* slate-600 */
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .view-button {
          background-color: #2563EB; /* blue-600 */
          color: white;
          font-weight: 600;
          padding: 0.6rem 1.5rem;
          border-radius: 9999px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.15);
        }

        .lab-card:hover .view-button {
          background-color: #1d4ed8; /* blue-700 */
          transform: scale(1.05);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChemicalDashboard;