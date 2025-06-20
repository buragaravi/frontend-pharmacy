import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AddChemicalForm from './AddChemicalForm';
import AllocateChemicalForm from './AllocateChemicalForm';
import CentralChemicalTable from './CentralChemicalTable';
import LabChemicalTable from './LabChemicalTable';
import ExpiredChemicalManager from './ExpiredChemicalManager';

const ChemicalDashboard = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [labId, setLabId] = useState('');
  const [view, setView] = useState('central');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { role, id, labId } = decoded.user;

        setUserRole(role);
        setUserId(id);
        setLabId(labId);

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
  }, []);

  const renderTabs = () => {
    if (userRole === 'admin' || userRole === 'central_lab_admin') {
      return (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setView('central')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'central' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            Central Chemicals
          </button>
          <button
            onClick={() => setView('add')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'add' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            Add Chemicals
          </button>
          <button
            onClick={() => setView('allocate')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'allocate' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            Allocate Chemicals
          </button>
          <button
            onClick={() => setView('labs')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'labs' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            Lab Stocks
          </button>
          <button
            onClick={() => setView('expired')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'expired' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            Expired Chemicals
          </button>


        </div>
      );
    }

    if (userRole === 'lab_assistant') {
      return (
        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setView('myLab')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              view === 'myLab' 
                ? 'bg-[#0B3861] text-white' 
                : 'bg-[#F5F9FD] text-[#0B3861] hover:bg-[#BCE0FD]'
            }`}
          >
            My Lab Stock
          </button>
        </div>
      );
    }

    return <p className="text-[#0B3861]">No access to this module.</p>;
  };

  const renderView = () => {
    switch (view) {
      case 'central':
        return <CentralChemicalTable />;
      case 'add':
        return <AddChemicalForm />;
      case 'allocate':
        return <AllocateChemicalForm />;
      case 'expired':
        return <ExpiredChemicalManager />;
      case 'labs': {
        const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];
        if (expandedLab) {
          return (
            <>
              <div className="flex flex-wrap gap-3 mb-6 justify-center">
                {labList.map((lab) => (
                  <button
                    key={lab}
                    className={`px-4 py-2 rounded-full font-bold shadow border-2 transition-all duration-200 text-sm md:text-base focus:outline-none ${
                      expandedLab === lab
                        ? 'bg-blue-700 text-white border-blue-700 scale-110'
                        : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:border-blue-400 scale-90 opacity-80'
                    }`}
                    onClick={() => setExpandedLab(lab)}
                  >
                    {lab}
                  </button>
                ))}
              </div>
              <div className="mb-8">
                <div className="flex justify-end max-w-5xl mx-auto">
                  <button
                    className="mb-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg border border-blue-300 hover:bg-blue-200 font-bold text-lg"
                    onClick={() => setExpandedLab(null)}
                  >
                    Close
                  </button>
                </div>
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-4 border border-blue-200 animate-fade-in">
                  <LabChemicalTable labId={expandedLab} />
                </div>
              </div>
            </>
          );
        }
        return (
          <div className="lab-grid">
            {labList.map((lab) => (
              <div
                key={lab}
                className="lab-card"
                onClick={() => setExpandedLab(lab)}
              >
                <span className="lab-name">{lab}</span>
                <span className="lab-label">Lab Inventory</span>
                <span className="view-button">View</span>
              </div>
            ))}
          </div>
        );
      }
      case 'myLab':
        return (
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-[#BCE0FD]">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3861] mb-2 sm:mb-3">Your Lab Inventory ({labId})</h3>
            <LabChemicalTable labId={labId} />
          </div>
        );
      default:
        return <p className="text-[#0B3861]">Select a view to continue.</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B3861]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-[#BCE0FD]">
        <div className="flex items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B3861]">Chemical Management Dashboard</h2>
        </div>
        
        {renderTabs()}
        
        <div className="border-t border-[#BCE0FD] my-3 sm:my-4"></div>
        
        {renderView()}
      </div>

      <style jsx>{`
        .lab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .lab-card {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F5F9FD 0%, #E1F1FF 100%);
          border: 2px solid #BCE0FD;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .lab-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .lab-name {
          font-size: 2rem;
          font-weight: 800;
          color: #0B3861;
          margin-bottom: 0.5rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .lab-label {
          font-size: 1.25rem;
          font-weight: 600;
          color: #64B5F6;
          margin-bottom: 1rem;
        }

        .view-button {
          background-color: rgba(255, 255, 255, 0.8);
          color: #0B3861;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease-in-out;
        }

        .lab-card:hover .view-button {
          background-color: #0B3861;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ChemicalDashboard;