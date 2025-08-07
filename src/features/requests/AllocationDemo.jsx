import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import ExperimentDateBadge from './components/ExperimentDateBadge';
import AllocationStatusBadge from './components/AllocationStatusBadge';
import AdminOverrideDialog from './components/AdminOverrideDialog';
import { isAllocationAllowed, getExperimentDateStatus } from '../../utils/dateValidation';

const AllocationDemo = () => {
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  // Sample data to demonstrate the components
  const sampleExperiments = [
    {
      _id: '1',
      experimentName: 'Organic Chemistry Lab - Synthesis',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      allocationStatus: {
        adminOverride: null
      }
    },
    {
      _id: '2',
      experimentName: 'Physical Chemistry - Thermodynamics',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      allocationStatus: {
        adminOverride: null
      }
    },
    {
      _id: '3',
      experimentName: 'Analytical Chemistry - Spectroscopy',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (expired)
      allocationStatus: {
        adminOverride: null
      }
    },
    {
      _id: '4',
      experimentName: 'Biochemistry - Enzyme Kinetics',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired with override)
      allocationStatus: {
        adminOverride: {
          enabled: true,
          reason: 'Extended due to equipment maintenance delay',
          createdBy: 'Dr. Smith',
          createdAt: new Date()
        }
      }
    }
  ];

  const sampleAllocationStatus = {
    canAllocate: false,
    reason: 'Some experiments have date validation issues',
    reasonType: 'date_expired_partial',
    pendingItems: 15,
    reenabledItems: 3,
    itemBreakdown: {
      chemicals: { total: 8, allocated: 5, reenabled: 1 },
      glassware: { total: 6, allocated: 4, reenabled: 1 },
      equipment: { total: 4, allocated: 2, reenabled: 1 }
    },
    experimentStatuses: [
      {
        experimentId: '1',
        canAllocate: true,
        reason: 'Experiment is scheduled for the future',
        reasonType: 'date_valid'
      },
      {
        experimentId: '2',
        canAllocate: true,
        reason: 'Experiment is within valid allocation window',
        reasonType: 'date_valid'
      },
      {
        experimentId: '3',
        canAllocate: false,
        reason: 'Experiment date has passed - allocation blocked',
        reasonType: 'date_expired_completely'
      },
      {
        experimentId: '4',
        canAllocate: true,
        reason: 'Admin override active - allocation allowed despite expired date',
        reasonType: 'admin_override_active'
      }
    ]
  };

  const handleAdminOverride = async (experimentId, overrideData) => {
    console.log('Admin override saved:', { experimentId, overrideData });
    // In real implementation, this would call the API
    setShowAdminDialog(false);
    setSelectedExperiment(null);
  };

  const openAdminDialog = (experiment) => {
    setSelectedExperiment(experiment);
    setShowAdminDialog(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Date-Based Allocation System Demo</h1>
        <p className="text-gray-600">
          Showcase of the new date validation components with elegant design and robust functionality
        </p>
      </div>

      {/* Overall Allocation Status */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
          Overall Request Allocation Status
        </h2>
        <AllocationStatusBadge 
          status={sampleAllocationStatus}
          pendingItems={sampleAllocationStatus.pendingItems}
          reenabledItems={sampleAllocationStatus.reenabledItems}
          size="lg"
          showDetails={true}
        />
        
        {sampleAllocationStatus.reason && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Allocation Status Details</p>
                <p className="text-sm text-amber-700 mt-1">{sampleAllocationStatus.reason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Experiment Date Badges Demo */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-6 h-6 text-blue-600 mr-2" />
          Experiment Date Status Examples
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleExperiments.map((experiment) => {
            const dateStatus = getExperimentDateStatus(experiment.date);
            const allocationAllowed = isAllocationAllowed(experiment.date, true, experiment.allocationStatus?.adminOverride);
            
            return (
              <div key={experiment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{experiment.experimentName}</h3>
                    <p className="text-sm text-gray-500">
                      {experiment.date.toLocaleDateString()} at {experiment.date.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <ExperimentDateBadge 
                      date={experiment.date}
                      isAdmin={true}
                      adminOverride={experiment.allocationStatus?.adminOverride}
                      size="md"
                    />
                    
                    <button
                      onClick={() => openAdminDialog(experiment)}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-300 text-xs font-medium"
                      title="Manage Admin Override"
                    >
                      <Shield className="w-3 h-3" />
                      Override
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {allocationAllowed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={allocationAllowed ? 'text-green-700' : 'text-red-700'}>
                    {allocationAllowed ? 'Allocation Allowed' : 'Allocation Blocked'}
                  </span>
                </div>
                
                {experiment.allocationStatus?.adminOverride?.enabled && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="font-medium text-blue-800">Admin Override Active</p>
                    <p className="text-blue-700">{experiment.allocationStatus.adminOverride.reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Badge Sizes Demo */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-6 h-6 text-blue-600 mr-2" />
          Component Size Variations
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Date Badge Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <ExperimentDateBadge date={sampleExperiments[0].date} size="sm" />
                <span className="text-xs text-gray-500">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ExperimentDateBadge date={sampleExperiments[0].date} size="md" />
                <span className="text-xs text-gray-500">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ExperimentDateBadge date={sampleExperiments[0].date} size="lg" />
                <span className="text-xs text-gray-500">Large</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Allocation Status Badge Sizes</h3>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <AllocationStatusBadge status={sampleAllocationStatus} size="sm" showDetails={false} />
                <span className="text-xs text-gray-500">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AllocationStatusBadge status={sampleAllocationStatus} size="md" showDetails={false} />
                <span className="text-xs text-gray-500">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AllocationStatusBadge status={sampleAllocationStatus} size="lg" showDetails={true} />
                <span className="text-xs text-gray-500">Large (with details)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Override Dialog */}
      {showAdminDialog && selectedExperiment && (
        <AdminOverrideDialog
          experiment={selectedExperiment}
          isOpen={showAdminDialog}
          onClose={() => {
            setShowAdminDialog(false);
            setSelectedExperiment(null);
          }}
          onSave={handleAdminOverride}
        />
      )}
    </div>
  );
};

export default AllocationDemo;
