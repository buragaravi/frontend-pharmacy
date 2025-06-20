import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExpiredChemicalManager = () => {
  const [expiredChemicals, setExpiredChemicals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [centralLiveChemicals, setCentralLiveChemicals] = useState([]);

  useEffect(() => {
    fetchExpiredChemicals();
  }, [refresh]);

  useEffect(() => {
    const fetchCentralLive = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCentralLiveChemicals(res.data || []);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCentralLive();
  }, [refresh]);

  const fetchExpiredChemicals = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/expired', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpiredChemicals(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expired chemicals');
    }
    setLoading(false);
  };

  const handleActionChange = (chemicalId, field, value) => {
    setActionState((prev) => ({
      ...prev,
      [chemicalId]: {
        ...prev[chemicalId],
        [field]: value,
      },
    }));
  };

  const handleSubmitAction = async (chemical) => {
    const state = actionState[chemical._id] || {};
    if (!state.action) {
      setError('Please select an action.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        chemicalLiveId: chemical._id, // Always send chemicalLiveId for backend compatibility
        action: state.action,
        reason: state.reason || '',
      };
      if (state.action === 'merge') {
        if (!state.mergeToId || state.mergeToId === 'undefined') {
          setError('Please select a valid chemical to merge into.');
          setLoading(false);
          return;
        }
        const selectedMerge = getMergeOptions(chemical.chemicalMasterId, chemical.displayName || chemical.chemicalName, chemical.expiryDate)
          .find(opt => String(opt._id) === String(state.mergeToId));
        if (!selectedMerge || !selectedMerge._id) {
          setError('Selected merge target is invalid.');
          setLoading(false);
          return;
        }
        payload.mergeToId = String(selectedMerge._id);
      }
      if (state.action === 'update_expiry') {
        if (!state.newExpiry) {
          setError('Please provide a new expiry date.');
          setLoading(false);
          return;
        }
        payload.newExpiryDate = state.newExpiry; // Use newExpiryDate for backend compatibility
      }
      // Debug: log payload
      // console.log('Submitting payload:', payload);
      await axios.post('https://backend-pharmacy-5541.onrender.com/api/chemicals/expired/action', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg('Action completed successfully.');
      setActionState((prev) => ({ ...prev, [chemical._id]: {} }));
      setRefresh((r) => !r);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
    setLoading(false);
  };

  const getMergeOptions = (currentId, currentName, currentExpiry) => {
    // Only show chemicals with the same name (case-insensitive, ignoring self) and expiry > currentExpiry
    // Return the full ChemicalLive object, not just masterId
    return centralLiveChemicals.filter(
      (chem) =>
        chem.chemicalMasterId !== currentId &&
        (chem.chemicalName || chem.displayName).toLowerCase() === currentName.toLowerCase() &&
        new Date(chem.expiryDate) > new Date(currentExpiry)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Expired Chemicals Management</h2>

          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              {successMsg}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reason (optional)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Submit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiredChemicals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No expired chemicals found.
                    </td>
                  </tr>
                ) : (
                  expiredChemicals.map((chem) => {
                    const state = actionState[chem._id] || {};
                    return (
                      <tr key={chem._id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {chem.displayName || chem.chemicalName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {chem.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {chem.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(chem.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            value={state.action || ''}
                            onChange={(e) => handleActionChange(chem._id, 'action', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="merge">Merge</option>
                            <option value="update_expiry">Update Expiry</option>
                            <option value="delete">Delete</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {state.action === 'merge' && (
                            <select
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              value={state.mergeToId && state.mergeToId !== 'undefined' ? state.mergeToId : ''}
                              onChange={(e) => handleActionChange(chem._id, 'mergeToId', e.target.value)}
                            >
                              <option value="">Select chemical</option>
                              {getMergeOptions(chem.chemicalMasterId, chem.displayName || chem.chemicalName, chem.expiryDate).map((opt, idx) => {
                                const mergeKey = `${opt._id}_${new Date(opt.expiryDate).getTime()}`;
                                return (
                                  <option key={mergeKey} value={String(opt._id)}>
                                    {(opt.chemicalName || opt.displayName) + ' (Qty: ' + opt.quantity + ', Exp: ' + new Date(opt.expiryDate).toLocaleDateString() + ')'}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                          {state.action === 'update_expiry' && (
                            <input
                              type="date"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              value={state.newExpiry || ''}
                              onChange={(e) => handleActionChange(chem._id, 'newExpiry', e.target.value)}
                            />
                          )}
                          {state.action === 'delete' && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            placeholder="Reason (optional)"
                            value={state.reason || ''}
                            onChange={(e) => handleActionChange(chem._id, 'reason', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSubmitAction(chem)}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirm
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Instructions</h3>
          <p className="text-gray-600 mb-4">
            Review each expired chemical and select an action:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="ml-2 text-gray-700">
                <b>Merge</b>: Add this chemical's quantity to another expired chemical (then delete this one).
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="ml-2 text-gray-700">
                <b>Update Expiry</b>: Change the expiry date for this chemical.
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="ml-2 text-gray-700">
                <b>Delete</b>: Remove this chemical from live stock. All deletions are logged, even if quantity is zero.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExpiredChemicalManager;