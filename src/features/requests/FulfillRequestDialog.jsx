import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-blue-50 to-blue-100',
  card: 'bg-white',
  border: 'border-blue-200',
  primaryText: 'text-blue-800',
  secondaryText: 'text-blue-600',
  primaryBg: 'bg-blue-800',
  secondaryBg: 'bg-blue-600',
  hoverBg: 'hover:bg-blue-700',
  inputFocus: 'focus:ring-blue-800 focus:border-blue-800'
};

const FulfillRequestDialog = ({ request, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [partialQuantities, setPartialQuantities] = useState({});
  const [showPartialFulfillment, setShowPartialFulfillment] = useState(false);
  const [partialFulfillmentData, setPartialFulfillmentData] = useState(null);

  // Create axios instance with auth token
  const api = axios.create({
    baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Mutation for approving/fulfilling requests
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, force = false }) => {
      const response = await api.put('/requests/approve', {
        requestId,
        status,
        force
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['requests']);
      // Check both possible response structures
      const successStatus = data.request?.status || data.status;
      toast.success(`Request ${successStatus} successfully`);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 206) {
        // Handle partial fulfillment case
        setPartialFulfillmentData(error.response.data);
        setShowPartialFulfillment(true);
        // Initialize partial quantities for insufficient chemicals
        const initialQuantities = {};
        error.response.data.unavailable.forEach(chem => {
          if (chem.availableQuantity > 0) {
            initialQuantities[chem.chemicalName] = chem.availableQuantity;
          }
        });
        setPartialQuantities(initialQuantities);
      } else {
        toast.error(error.response?.data?.msg || 'Failed to update request status');
      }
    },
  });

  // Mutation for fulfilling remaining chemicals
  const fulfillRemainingMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.post('/requests/fulfill-remaining', { requestId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['requests']);
      // Check both possible response structures
      const successStatus = data.request?.status || data.status;
      toast.success(`Request ${successStatus} successfully`);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || 'Failed to fulfill remaining chemicals');
    }
  });

  const handleAction = async (status) => {
    try {
      if (status === 'fulfilled') {
        // Check if this is a partially fulfilled request that needs remaining fulfillment
        if (request.status === 'partially_fulfilled') {
          await fulfillRemainingMutation.mutateAsync(request._id);
        } else {
          // For new fulfillment, check availability first
          await updateRequestMutation.mutateAsync({ 
            requestId: request._id, 
            status: 'fulfilled',
            force: true
          });
        }
      } else {
        // For approve/reject, proceed normally
        await updateRequestMutation.mutateAsync({ 
          requestId: request._id, 
          status
        });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      if (error.response?.status === 206) {
        setPartialFulfillmentData(error.response.data);
        setShowPartialFulfillment(true);
      }
    }
  };

  const handlePartialFulfillment = async () => {
    try {
      // Prepare the partial quantities data for the backend
      const chemicalsToFulfill = partialFulfillmentData.partiallyAvailable.map(chem => ({
        chemicalName: chem.chemicalName,
        quantity: chem.quantity,
        unit: chem.unit,
        experimentName: chem.experimentName,
        chemicalMasterId: chem.chemicalMasterId
      }));

      // Add the partial quantities for unavailable chemicals
      Object.entries(partialQuantities).forEach(([chemicalName, quantity]) => {
        if (quantity > 0) {
          const chem = partialFulfillmentData.unavailable.find(c => c.chemicalName === chemicalName);
          if (chem) {
            chemicalsToFulfill.push({
              chemicalName,
              quantity,
              unit: chem.unit,
              experimentName: chem.experimentName,
              chemicalMasterId: chem.chemicalMasterId
            });
          }
        }
      });

      // Send the fulfillment request with force=true
      await updateRequestMutation.mutateAsync({
        requestId: request._id,
        status: 'fulfilled',
        force: true
      });
    } catch (error) {
      console.error('Error processing partial fulfillment:', error);
    }
  };

  const handleQuantityChange = (chemicalName, value) => {
    const newValue = parseFloat(value) || 0;
    const chemical = partialFulfillmentData.unavailable.find(c => c.chemicalName === chemicalName);

    if (chemical && newValue > chemical.availableQuantity) {
      toast.warning(`Quantity cannot exceed available amount (${chemical.availableQuantity} ${chemical.unit})`);
      return;
    }

    setPartialQuantities(prev => ({
      ...prev,
      [chemicalName]: newValue
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`${THEME.card} rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-6">
          <h3 className={`text-xl font-bold ${THEME.primaryText}`}>Request Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Partial Fulfillment Content */}
        {showPartialFulfillment ? (
          <div className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Partial Fulfillment Required</h4>
              <p className="text-sm text-yellow-700">
                {partialFulfillmentData?.msg || 'Some chemicals are unavailable or insufficient. You can proceed with partial fulfillment.'}
              </p>
            </div>

            {/* Available Chemicals */}
            {partialFulfillmentData?.partiallyAvailable?.length > 0 && (
              <div className="space-y-4">
                <h4 className={`font-medium ${THEME.primaryText}`}>Available Chemicals</h4>
                {partialFulfillmentData.partiallyAvailable.map((chem, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded">
                    <p className="font-medium">{chem.chemicalName}</p>
                    <p className="text-sm text-gray-600">
                      {chem.quantity} {chem.unit} - {chem.experimentName}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Unavailable Chemicals */}
            {partialFulfillmentData?.unavailable?.length > 0 && (
              <div className="space-y-4">
                <h4 className={`font-medium ${THEME.primaryText}`}>Unavailable Chemicals</h4>
                {partialFulfillmentData.unavailable.map((chem, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded">
                    <p className="font-medium">{chem.chemicalName}</p>
                    <p className="text-sm text-gray-600">
                      Required: {chem.requiredQuantity} {chem.unit}
                      {chem.availableQuantity > 0 && (
                        <span className="ml-2">
                          Available: {chem.availableQuantity} {chem.unit}
                        </span>
                      )}
                    </p>
                    {chem.availableQuantity > 0 && (
                      <div className="mt-2">
                        <label className="text-sm text-gray-600">Allocate Quantity:</label>
                        <input
                          type="number"
                          min="0"
                          max={chem.availableQuantity}
                          step="0.01"
                          value={partialQuantities[chem.chemicalName] || ''}
                          onChange={(e) => handleQuantityChange(chem.chemicalName, e.target.value)}
                          className={`ml-2 p-1 border ${THEME.border} rounded ${THEME.inputFocus}`}
                        />
                        <span className="text-xs text-gray-500 ml-2">
                          (Max: {chem.availableQuantity} {chem.unit})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handlePartialFulfillment}
                disabled={updateRequestMutation.isLoading}
                className={`px-4 py-2 ${THEME.primaryBg} text-white rounded-lg ${THEME.hoverBg} disabled:opacity-50`}
              >
                {updateRequestMutation.isLoading ? 'Processing...' : 'Proceed with Partial Fulfillment'}
              </button>
              <button
                onClick={() => setShowPartialFulfillment(false)}
                className={`px-4 py-2 border ${THEME.border} ${THEME.primaryText} rounded-lg hover:bg-blue-50`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Request Info */}
            <div className={`${THEME.background} p-4 rounded-lg`}>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Experiments and Chemicals */}
            {request.experiments.map((experiment, index) => (
              <div key={index} className={`border ${THEME.border} rounded-lg p-4`}>
                <h4 className={`font-medium ${THEME.primaryText} mb-4`}>{experiment.experimentName}</h4>
                <div className="space-y-2">
                  {experiment.chemicals.map((chemical, chemIndex) => (
                    <div key={chemIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{chemical.chemicalName}</p>
                        <p className="text-sm text-gray-500">
                          {chemical.quantity} {chemical.unit}
                          {chemical.isAllocated && (
                            <span className="ml-2 text-green-600">
                              (Allocated: {chemical.allocatedQuantity} {chemical.unit})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              {request.status === 'partially_fulfilled' ? (
                <button
                  onClick={() => handleAction('fulfilled')}
                  disabled={fulfillRemainingMutation.isLoading}
                  className={`px-4 py-2 ${THEME.primaryBg} text-white rounded-lg ${THEME.hoverBg} disabled:opacity-50`}
                >
                  {fulfillRemainingMutation.isLoading ? 'Processing...' : 'Fulfill Remaining Chemicals'}
                </button>
              ) : (
                <button
                  onClick={() => handleAction('fulfilled')}
                  disabled={updateRequestMutation.isLoading}
                  className={`px-4 py-2 ${THEME.primaryBg} text-white rounded-lg ${THEME.hoverBg} disabled:opacity-50`}
                >
                  {updateRequestMutation.isLoading ? 'Processing...' : 'Fulfill Request'}
                </button>
              )}
              <button
                onClick={() => handleAction('rejected')}
                disabled={updateRequestMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updateRequestMutation.isLoading ? 'Processing...' : 'Reject Request'}
              </button>
              <button
                onClick={onClose}
                className={`px-4 py-2 border ${THEME.border} ${THEME.primaryText} rounded-lg hover:bg-blue-50`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FulfillRequestDialog;