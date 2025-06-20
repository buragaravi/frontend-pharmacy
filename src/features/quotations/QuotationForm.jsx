import React, { useState, useEffect } from 'react';
import axios from 'axios';

// SVG Icons
const FlaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CommentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const QuotationForm = ({ userRole, userId, labId }) => {
  const [vendorName, setVendorName] = useState('');
  const [chemicals, setChemicals] = useState([
    { chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' },
  ]);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [lowQuantityChemicals, setLowQuantityChemicals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [comments, setComments] = useState('');
  const [missingChemicalsLoaded, setMissingChemicalsLoaded] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAvailableChemicals = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sortedChemicals = res.data.sort((a, b) => a.chemicalName.localeCompare(b.chemicalName));
        setAvailableChemicals(sortedChemicals);
        
        // Filter chemicals with quantity below 100
        const lowQuantity = sortedChemicals.filter(chem => chem.quantity < 100);
        setLowQuantityChemicals(lowQuantity);
      } catch (err) {
        console.error('Failed to fetch available chemicals', err);
      }
    };

    fetchAvailableChemicals();
  }, [token]);

  useEffect(() => {
    // Load missing chemicals from localStorage only for lab assistants
    if (!missingChemicalsLoaded && userRole === 'lab_assistant') {
      const missingChemicals = JSON.parse(localStorage.getItem('quotationMissingChemicals')) || [];
      if (missingChemicals.length > 0) {
        const initialChemicals = missingChemicals.map(chem => ({
          chemicalName: chem.chemicalName,
          quantity: chem.requiredQuantity || 1,
          unit: chem.unit || '',
          pricePerUnit: 0,
          remarks: '',
          isMissingChemical: true
        }));

        setChemicals([...initialChemicals, { chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' }]);
        setMissingChemicalsLoaded(true);
        localStorage.removeItem('quotationMissingChemicals');
        
        setMessage({ 
          text: 'Missing chemicals have been pre-filled. Please complete the information.', 
          type: 'info' 
        });
      }
    }
  }, [userRole, missingChemicalsLoaded]);

  // Helper: get suggestions for chemical name
  const getChemicalSuggestions = (input) => {
    if (!input) return [];
    return availableChemicals.filter(chem =>
      chem.chemicalName.toLowerCase().includes(input.toLowerCase())
    );
  };

  const handleChemicalChange = (index, field, value) => {
    const updated = [...chemicals];
    updated[index][field] = value;
    // If user is typing chemicalName, try to auto-fill unit and price if available
    if (field === 'chemicalName') {
      const match = availableChemicals.find(c => c.chemicalName.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        updated[index].unit = match.unit;
        updated[index].pricePerUnit = match.pricePerUnit || 0;
      }
    }
    setChemicals(updated);
  };

  const handleSuggestionClick = (index, chemical) => {
    const updated = [...chemicals];
    // Find if this chemical already has pricing in our available chemicals
    const chemicalDetails = availableChemicals.find(c => c.chemicalName === chemical.chemicalName);
    
    updated[index] = {
      ...updated[index],
      chemicalName: chemical.chemicalName,
      unit: chemical.unit,
      quantity: updated[index].isMissingChemical ? updated[index].quantity : chemical.quantity,
      // Automatically fill price if available
      pricePerUnit: chemicalDetails?.pricePerUnit || updated[index].pricePerUnit || 0,
      // Add default remark for low quantity items
      remarks: chemical.quantity < 100 
        ? `Low stock alert: Only ${chemical.quantity} ${chemical.unit} remaining` 
        : updated[index].remarks
    };
    setChemicals(updated);
  };

  const addChemicalField = () => {
    setChemicals([
      ...chemicals,
      { chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' },
    ]);
  };

  const removeChemicalField = (index) => {
    if (chemicals.length === 1) return;
    const updated = chemicals.filter((_, i) => i !== index);
    setChemicals(updated);
  };

  const calculateTotalPrice = () => {
    return chemicals
      .reduce((sum, chem) => {
        const price = parseFloat(chem.pricePerUnit || 0);
        const qty = parseFloat(chem.quantity || 0);
        return sum + price * qty;
      }, 0)
      .toFixed(2);
  };

  const validateForm = () => {
    if (userRole === 'central_lab_admin' && !vendorName.trim()) {
      setMessage({ text: 'Vendor name is required', type: 'error' });
      return false;
    }

    if (chemicals.some(chem => !chem.chemicalName.trim())) {
      setMessage({ text: 'Chemical name is required for all items', type: 'error' });
      return false;
    }

    if (chemicals.some(chem => !chem.quantity || isNaN(parseFloat(chem.quantity)))) {
      setMessage({ text: 'Valid quantity is required for all items', type: 'error' });
      return false;
    }

    if (chemicals.some(chem => !chem.unit.trim())) {
      setMessage({ text: 'Unit is required for all items', type: 'error' });
      return false;
    }

    if (userRole === 'central_lab_admin' && chemicals.some(chem => 
      !chem.pricePerUnit || isNaN(parseFloat(chem.pricePerUnit)))) {
      setMessage({ text: 'Price per unit is required for all items', type: 'error' });
      return false;
    }

    return true;
  };

  const preparePayload = () => {
    return {
      createdBy: userId,
      createdByRole: userRole,
      chemicals: chemicals.map(chem => ({
        chemicalName: chem.chemicalName,
        quantity: parseInt(chem.quantity),
        unit: chem.unit,
        // Always send remarks as a string (even if empty)
        remarks: typeof chem.remarks === 'string' ? chem.remarks.trim() : '',
        ...(userRole === 'central_lab_admin' && { pricePerUnit: parseFloat(chem.pricePerUnit) })
      })),
      comments: comments || undefined,
      ...(userRole === 'central_lab_admin' && {
        vendorName,
        totalPrice: calculateTotalPrice()
      }),
      status: userRole === 'lab_assistant' ? 'pending' : 'draft',
      ...(userRole === 'lab_assistant' && { labId })
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = preparePayload();
      const endpoint = userRole === 'lab_assistant' 
        ? '/api/quotations/lab' 
        : '/api/quotations/central/draft';

      await axios.post(`https://backend-pharmacy-5541.onrender.com${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMessage({ 
        text: userRole === 'lab_assistant' 
          ? 'Quotation submitted for approval!' 
          : 'Draft quotation created successfully!', 
        type: 'success' 
      });

      // Reset form
      setChemicals([{ chemicalName: '', quantity: 0, unit: '', pricePerUnit: 0, remarks: '' }]);
      setVendorName('');
      setComments('');
      setMissingChemicalsLoaded(false);
    } catch (err) {
      console.error('Quotation creation failed:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to create quotation', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F5F9FD] p-6 rounded-xl border border-[#BCE0FD]">
      <h3 className="text-xl font-semibold text-[#0B3861] mb-6 flex items-center">
        <FlaskIcon className="mr-2" />
        {userRole === 'lab_assistant' ? 'Request Chemicals' : 'Create Vendor Quotation'}
      </h3>

      {/* Keep existing message alert styling */}
      {message.text && (
        <div className={`mb-6 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {userRole === 'central_lab_admin' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0B3861] mb-1">Vendor Name *</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
              required
              placeholder="Enter vendor name"
            />
          </div>
        )}

        <div className="space-y-6 mb-6">
          {chemicals.map((chem, index) => (
            <div key={index} className={`bg-white p-4 rounded-lg border ${
              chem.isMissingChemical ? 'border-2 border-[#64B5F6]' : 'border-[#BCE0FD]'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div style={{ position: 'relative' }}>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">Chemical Name *</label>
                  <input
                    type="text"
                    placeholder="Enter chemical name"
                    value={chem.chemicalName}
                    onChange={(e) => handleChemicalChange(index, 'chemicalName', e.target.value)}
                    className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                    required
                    autoComplete="off"
                  />
                  {/* Suggestion dropdown for chemical name and low quantity suggestions */}
                  <>
                  {(chem.chemicalName && getChemicalSuggestions(chem.chemicalName).length > 0) && (
                    <div className="absolute z-10 bg-white border border-[#BCE0FD] rounded shadow w-full mt-1 max-h-40 overflow-y-auto">
                      {getChemicalSuggestions(chem.chemicalName).map((suggestion) => (
                        <div
                          key={suggestion.chemicalName}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm flex justify-between"
                          onClick={() => handleSuggestionClick(index, suggestion)}
                        >
                          <span>{suggestion.chemicalName}</span>
                          <span className="text-xs text-gray-500">Qty: {suggestion.quantity} {suggestion.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {lowQuantityChemicals.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Suggested (low quantity):</p>
                      <div className="flex flex-wrap gap-2">
                        {lowQuantityChemicals.map((chemical) => (
                          <button
                            key={chemical._id}
                            type="button"
                            onClick={() => handleSuggestionClick(index, chemical)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            title={`Only ${chemical.quantity} remaining`}
                          >
                            {chemical.chemicalName} ({chemical.unit})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  </>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={chem.quantity}
                    onChange={(e) => handleChemicalChange(index, 'quantity', e.target.value)}
                    className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">Unit *</label>
                  <input
                    type="text"
                    placeholder="Unit (ml, g, etc.)"
                    value={chem.unit}
                    onChange={(e) => handleChemicalChange(index, 'unit', e.target.value)}
                    className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">
                    {userRole === 'central_lab_admin' ? 'Price/Unit *' : 'Price/Unit'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={chem.pricePerUnit}
                    onChange={(e) => handleChemicalChange(index, 'pricePerUnit', e.target.value)}
                    className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                    required={userRole === 'central_lab_admin'}
                    disabled={userRole === 'lab_assistant'}
                  />
                </div>
              </div>

              {/* Add remarks/comments field for each chemical */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-[#0B3861] mb-1 flex items-center">
                  <CommentIcon className="mr-1" />
                  Remarks for this chemical
                </label>
                <textarea
                  placeholder="Add any notes, instructions or comments specific to this chemical..."
                  value={chem.remarks}
                  onChange={(e) => handleChemicalChange(index, 'remarks', e.target.value)}
                  className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  rows="2"
                />
              </div>

              {chemicals.length > 1 && (
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => removeChemicalField(index)}
                    className="flex items-center text-red-600 text-sm hover:text-red-800"
                  >
                    <TrashIcon className="mr-1" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            type="button"
            onClick={addChemicalField}
            className="flex items-center px-4 py-2 bg-[#E1F1FF] text-[#0B3861] rounded-lg font-medium hover:bg-[#BCE0FD] transition-colors"
          >
            <AddIcon className="mr-2" />
            Add Another Chemical
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0B3861] mb-1">General Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-4 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
            placeholder="Any additional comments for the entire quotation..."
            rows="3"
          />
        </div>

        {userRole === 'central_lab_admin' && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-[#BCE0FD]">
            <h4 className="text-lg font-semibold text-[#0B3861] mb-2">Quotation Summary</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#0B3861]">Total Price:</span>
              <span className="text-xl font-bold text-[#0B3861]">₹{calculateTotalPrice()}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full md:w-auto px-6 py-3 rounded-lg font-medium transition-colors ${loading
            ? 'bg-gray-300 text-gray-600'
            : 'bg-[#0B3861] text-white hover:bg-[#1E88E5]'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            userRole === 'lab_assistant' ? 'Submit Request' : 'Create Draft Quotation'
          )}
        </button>
      </form>
    </div>
  );
};

export default QuotationForm;