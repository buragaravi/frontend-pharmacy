import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ChemicalAddToDraftModal = ({
  isOpen,
  onClose,
  labQuotationChemicals = [],
  draftQuotations = [],
  onSuccess,
}) => {
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [selectedChemicals, setSelectedChemicals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Verify user role (optional)
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken?.user?.role;

  const handleCheckboxChange = (chemical) => {
    setSelectedChemicals((prev) =>
      prev.find((c) => c._id === chemical._id)
        ? prev.filter((c) => c._id !== chemical._id)
        : [...prev, chemical]
    );
  };

  const handleSubmit = async () => {
    if (!selectedDraftId || selectedChemicals.length === 0) {
      setError('Please select a draft and at least one chemical');
      return;
    }

    // Verify user has permission (central_lab_admin)
    if (userRole !== 'central_lab_admin') {
      setError('Only central lab admins can add to drafts');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare request data
      const requestData = selectedChemicals.map(chem => ({
        chemicalName: chem.chemicalName,
        quantity: chem.quantity,
        unit: chem.unit,
        pricePerUnit: chem.pricePerUnit || 0, // Default if not provided
        description: chem.description || ''
      }));

      // Make API call
      await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/quotations/central/draft/add-chemical',
        {
          quotationId: selectedDraftId,
          chemicals: requestData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess(); // Refresh parent component
      onClose(); // Close modal
    } catch (err) {
      console.error('Failed to add chemicals to draft:', err);
      setError(err.response?.data?.message || 'Failed to add chemicals to draft');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-3">Add Chemicals to Draft Quotation</h3>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Draft selection */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Select Draft Quotation:</label>
          <select
            value={selectedDraftId}
            onChange={(e) => setSelectedDraftId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            disabled={isLoading}
          >
            <option value="">-- Select Draft --</option>
            {draftQuotations
              .filter(draft => draft.status === 'draft')
              .map((draft) => (
                <option key={draft._id} value={draft._id}>
                  {draft.vendorName || 'Unnamed Vendor'} (Draft #{draft._id.slice(-4)})
                </option>
              ))}
          </select>
        </div>

        {/* Chemical selection */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Select Chemicals to Add:</label>
          <div className="border rounded px-3 py-2 max-h-60 overflow-y-auto">
            {labQuotationChemicals.length === 0 ? (
              <p className="text-gray-500 text-sm">No chemicals available</p>
            ) : (
              labQuotationChemicals.map((chem) => (
                <div key={chem._id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                  <input
                    type="checkbox"
                    id={`chem-${chem._id}`}
                    onChange={() => handleCheckboxChange(chem)}
                    checked={selectedChemicals.some(c => c._id === chem._id)}
                    className="h-4 w-4"
                    disabled={isLoading}
                  />
                  <label htmlFor={`chem-${chem._id}`} className="flex-1">
                    <span className="font-medium">{chem.chemicalName}</span>
                    <span className="block text-sm text-gray-600">
                      {chem.quantity} {chem.unit} • {chem.description || 'No description'}
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
            disabled={!selectedDraftId || selectedChemicals.length === 0 || isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChemicalAddToDraftModal;