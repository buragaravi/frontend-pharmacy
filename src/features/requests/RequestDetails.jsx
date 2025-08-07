import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import UnifiedReturnDialog from './UnifiedReturnDialog';

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white',
  border: 'border-[#BCE0FD]',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-[#0B3861] focus:border-[#0B3861]'
};

const RequestDetails = ({ request, onClose, onStatusUpdate, userRole }) => {
  const canApprove = userRole === 'lab_assistant' || userRole === 'central_store_admin';
  const canReject = userRole === 'lab_assistant' || userRole === 'central_store_admin';
  const canComplete = userRole === 'lab_assistant' || userRole === 'central_store_admin';
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // Eligibility: status and at least one allocated item
  const eligibleStatuses = ['fulfilled', 'partially_fulfilled'];
  const hasAllocatedItems = eligibleStatuses.includes(request.status) && request.experiments.some(exp =>
    (exp.chemicals && exp.chemicals.some(chem => chem.isAllocated && chem.allocatedQuantity > 0)) ||
    (exp.glassware && exp.glassware.some(glass => glass.isAllocated && glass.allocatedQuantity > 0)) ||
    (exp.equipment && exp.equipment.some(eq => {
      if (Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
        const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
        return Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0;
      }
      return eq.isAllocated && Array.isArray(eq.itemIds) && eq.itemIds.length > 0;
    }))
  );

  const handleStatusUpdate = (status) => {
    if (window.confirm(`Are you sure you want to ${status} this request?`)) {
      onStatusUpdate(request._id, status);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[99999]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#BCE0FD]/30 shadow-xl rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto relative z-[99999]">
        <div className="flex justify-between items-start mb-6">
          <h3 className={`text-xl font-bold ${THEME.primaryText}`}>Request Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Request Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Request ID</p>
              <p className="text-sm text-gray-900">{request._id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                ${request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                ${request.status === 'partially_fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                ${request.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {request.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Faculty</p>
              <p className="text-sm text-gray-900">{request.facultyId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Lab</p>
              <p className="text-sm text-gray-900">{request.labId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="text-sm text-gray-900">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">{format(new Date(request.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>

          {/* Experiments */}
          <div>
            <h4 className={`text-lg font-medium ${THEME.primaryText} mb-4`}>Experiments</h4>
            <div className="space-y-4">
              {request.experiments.map((experiment, index) => (
                <div key={index} className="border border-[#E8D8E1] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className={`font-medium ${THEME.primaryText}`}>{experiment.experimentName}</h5>
                      <p className={`text-sm ${THEME.secondaryText}`}>
                        {format(new Date(experiment.date), 'MMM dd, yyyy')} | Course: {experiment.courseId?.courseName} ({experiment.courseId?.courseCode}) | Batch: {experiment.courseId?.batches?.find(batch => batch._id === experiment.batchId)?.batchName} ({experiment.courseId?.batches?.find(batch => batch._id === experiment.batchId)?.batchCode}) - {experiment.courseId?.batches?.find(batch => batch._id === experiment.batchId)?.academicYear}
                      </p>
                    </div>
                  </div>

                  {/* Chemicals */}
                  <div className="space-y-2">
                    <h6 className={`text-sm font-medium ${THEME.primaryText}`}>Chemicals</h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E8D8E1]">
                        <thead className="bg-[#F9F3F7]">
                          <tr>
                            <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText} uppercase`}>Chemical</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText} uppercase`}>Quantity</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText} uppercase`}>Unit</th>
                            <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText} uppercase`}>Status</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${THEME.border}`}>
                          {experiment.chemicals.map((chemical, chemIndex) => (
                            <tr key={chemIndex}>
                              <td className="px-4 py-2 text-sm text-gray-900">{chemical.chemicalName}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{chemical.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{chemical.unit}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${chemical.isAllocated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                `}>
                                  {chemical.isAllocated ? 'Allocated' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {request.status === 'pending' && canApprove && (
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => handleStatusUpdate('approved')}
                className={`px-4 py-2 ${THEME.primaryBg} text-white rounded-lg ${THEME.hoverBg}`}
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}

          {request.status === 'approved' && canComplete && (
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => handleStatusUpdate('fulfilled')}
                className={`px-4 py-2 ${THEME.primaryBg} text-white rounded-lg ${THEME.hoverBg}`}
              >
                Fulfill Request
              </button>
            </div>
          )}

          {request.status === 'fulfilled' && canComplete && (
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => handleStatusUpdate('completed')}
                className={`px-4 py-2 ${THEME.secondaryBg} text-white rounded-lg ${THEME.hoverBg}`}
              >
                Mark as Completed
              </button>
            </div>
          )}

          {/* Return Button for eligible requests */}
          {hasAllocatedItems && (
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                onClick={() => setShowReturnDialog(true)}
              >
                Return
              </button>
            </div>
          )}
          {showReturnDialog && (
            <UnifiedReturnDialog
              request={request}
              onClose={() => setShowReturnDialog(false)}
              onSuccess={() => setShowReturnDialog(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;