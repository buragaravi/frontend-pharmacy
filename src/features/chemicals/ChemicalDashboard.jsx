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
  
  // Fetch labs dynamically
  const { labs, loading: labsLoading, error: labsError } = useLabs();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { role, id, labId: tokenLabId } = decoded.user;

        setUserRole(role);
        setUserId(id);
        
        // Only set labId from token if not provided as prop
        if (!propLabId && tokenLabId) {
          setLabId(tokenLabId);
        }

        // Set initial view for lab assistant
        if (role === 'lab_assistant') {
          setView('myLab');
        }
      } catch (err) {
        console.error('Error decoding token:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [propLabId]);

  const renderTabs = () => {
    if (userRole === 'admin' || userRole === 'central_store_admin') {
      return (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setView('central')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'central' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            Central Chemicals
          </button>
          <button
            onClick={() => setView('add')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'add' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            Add Chemicals
          </button>
          <button
            onClick={() => setView('allocate')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'allocate' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            Allocate Chemicals
          </button>
          <button
            onClick={() => setView('labs')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'labs' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            Lab Stocks
          </button>
          <button
            onClick={() => setView('expired')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'expired' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            Expired Chemicals
          </button>
        </div>
      );
    }

    if (userRole === 'lab_assistant') {
      return (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('myLab')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              view === 'myLab' 
                ? 'bg-[#0066FF] text-white shadow-md' 
                : 'bg-white text-[#0066FF] border-b-2 border-[#0066FF] hover:bg-[#E6F0FF]'
            }`}
          >
            My Lab Stock
          </button>
        </div>
      );
    }

    return <p className="text-[#0066FF] font-medium">No access to this module.</p>;
  };

  const renderView = () => {
    switch (view) {
      case 'central':
        return <CentralChemicalTable />;
      case 'allocate':
        return <AllocateChemicalForm />;
      case 'expired':
        return <ExpiredChemicalManager />;
      case 'labs': {
        if (expandedLab) {
          return (
            <>
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                {labs.map((lab) => (
                  <button
                    key={lab.labId}
                    className={`px-4 py-2 rounded-full font-bold shadow-lg border-2 transition-all duration-200 text-sm md:text-base focus:outline-none ${
                      expandedLab === lab.labId
                        ? 'bg-[#0066FF] text-white border-[#0066FF] scale-105'
                        : 'bg-white text-[#0066FF] border-[#0066FF] hover:bg-[#E6F0FF]'
                    }`}
                    onClick={() => setExpandedLab(lab.labId)}
                  >
                    {lab.labName || lab.labId}
                  </button>
                ))}
              </div>
              <div className="mb-8">
                <div className="flex justify-end max-w-5xl mx-auto">
                  <button
                    className="mb-4 px-4 py-2 bg-white text-[#0066FF] rounded-lg border-2 border-[#0066FF] hover:bg-[#E6F0FF] font-bold text-lg shadow-md"
                    onClick={() => setExpandedLab(null)}
                  >
                    Back to All Labs
                  </button>
                </div>
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 border border-[#E6F0FF] animate-fade-in">
                  <LabChemicalTable labId={expandedLab} />
                </div>
              </div>
            </>
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
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#E6F0FF]">
            <h3 className="text-lg font-semibold text-[#0066FF] mb-4">Your Lab Inventory ({labId})</h3>
            <LabChemicalTable labId={labId} />
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#E6F0FF] text-center">
            <p className="text-[#0066FF] font-medium">Select a view to continue.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066FF]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 rounded-b-2xl">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header with bottom rounded corners */}
        <div className="bg-gradient-to-r from-[#0066FF] to-[#00A1FF] p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Chemical Management Dashboard</h2>
        </div>
        
        <div className="p-6">
          {renderTabs()}
          
          <div className="border-t border-[#E6F0FF] my-4"></div>
          
          {renderView()}
        </div>
      </div>

      <style jsx>{`
        .lab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 1rem;
        }

        .lab-card {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #FFFFFF 0%, #F5FAFF 100%);
          border: 2px solid #E6F0FF;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .lab-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 102, 255, 0.15);
          border-color: #0066FF;
        }

        .lab-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0066FF, #00A1FF);
        }

        .lab-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0066FF;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .lab-label {
          font-size: 1rem;
          font-weight: 500;
          color: #66A3FF;
          margin-bottom: 1.5rem;
        }

        .view-button {
          background-color: #0066FF;
          color: white;
          font-weight: 600;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.3);
        }

        .lab-card:hover .view-button {
          background-color: #0047CC;
          transform: scale(1.05);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChemicalDashboard;