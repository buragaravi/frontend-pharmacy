import React, { useState, useEffect } from 'react';
import axios from 'axios';

const labOptions = [
  { label: 'Lab 1', value: 'LAB01' },
  { label: 'Lab 2', value: 'LAB02' },
  { label: 'Lab 3', value: 'LAB03' },
  { label: 'Lab 4', value: 'LAB04' },
  { label: 'Lab 5', value: 'LAB05' },
  { label: 'Lab 6', value: 'LAB06' },
  { label: 'Lab 7', value: 'LAB07' },
  { label: 'Lab 8', value: 'LAB08' },
];

const AllocateGlasswareForm = () => {
  const [labId, setLabId] = useState('');
  const [glasswares, setGlasswares] = useState([{ glasswareName: '', quantity: 0, glasswareId: '', unit: '', description: '' }]);
  const [availableGlasswares, setAvailableGlasswares] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAvailableGlasswares = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/glassware/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableGlasswares(res.data.filter((g) => g.quantity > 0));
      } catch (err) {
        console.error('Failed to fetch glassware:', err);
      }
    };
    fetchAvailableGlasswares();
  }, [token]);

  const handleGlasswareNameChange = (index, name) => {
    const updated = [...glasswares];
    updated[index].glasswareName = name;
    updated[index].quantity = 0;
    updated[index].glasswareId = '';
    updated[index].unit = '';
    updated[index].description = '';
    const selected = availableGlasswares.find(
      (g) => {
        const gName = g.displayName || g.glasswareName || g.name;
        if (!gName || !name) return false;
        return gName.toLowerCase() === name.toLowerCase();
      }
    );
    if (selected) {
      updated[index].glasswareId = selected._id || selected.productId || '';
      updated[index].unit = selected.unit || '';
      updated[index].description = selected.description || '';
    }
    setGlasswares(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...glasswares];
    updated[index].quantity = value;
    setGlasswares(updated);
  };

  const addGlasswareRow = () => {
    setGlasswares([...glasswares, { glasswareName: '', quantity: 0, glasswareId: '', unit: '', description: '' }]);
  };

  const removeGlasswareRow = (index) => {
    const updated = [...glasswares];
    updated.splice(index, 1);
    setGlasswares(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!labId) return setMessage('Please select a lab.');
    const allocations = glasswares
      .filter((g) => g.glasswareId && g.quantity)
      .map((g) => ({ glasswareId: g.glasswareId, glasswareName: g.glasswareName, quantity: parseFloat(g.quantity), description: g.description }));
    if (allocations.length === 0) return setMessage('Please select at least one valid glassware and quantity.');
    setLoading(true);
    try {
      const response = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/glassware/allocate/lab',
        { labId, allocations },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Allocation response:', response.data);
      setMessage(response.data.message || 'Glassware allocated successfully!');
      setGlasswares([{ glasswareName: '', quantity: 0, glasswareId: '', unit: '', description: '' }]);
    } catch (err) {
      console.error('Allocation failed:', err);
      setMessage(err.response?.data?.message || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span>Dashboard</span>
          <span>›</span>
          <span>Glassware</span>
          <span>›</span>
          <span className="text-blue-600 font-medium">Allocate to Lab</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Allocate Glassware to Lab</h1>
            <p className="text-gray-600">Assign glassware from central store to lab units</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.includes('success') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 mr-2 ${
                message.includes('success') ? 'text-green-500' : 'text-red-500'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {message.includes('success') ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {message}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lab Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Lab</label>
            <select
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Lab</option>
              {labOptions.map((lab) => (
                <option key={lab.value} value={lab.value}>
                  {lab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Glassware Items */}
          <div className="space-y-4">
            {glasswares.map((glassware, index) => {
              const isOutOfStock = glassware.glasswareName && !availableGlasswares.some((g) => {
                const gName = g.displayName || g.glasswareName || g.name;
                if (!gName || !glassware.glasswareName) return false;
                return gName.toLowerCase() === glassware.glasswareName.toLowerCase() && g.quantity > 0;
              });

              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Glassware Name */}
                    <div className="flex-1 min-w-64">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Glassware Name</label>
                      <input
                        list={`glassware-list-${index}`}
                        value={glassware.glasswareName}
                        onChange={(e) => handleGlasswareNameChange(index, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search glassware..."
                        required
                      />
                      <datalist id={`glassware-list-${index}`}>
                        {availableGlasswares.map((g) => {
                          const gName = g.displayName || g.glasswareName || g.name;
                          return (
                            <option key={`${g._id || g.productId}-${gName}-${index}`} value={gName}>
                              {gName} ({g.unit}) - {g.quantity} in stock
                            </option>
                          );
                        })}
                      </datalist>
                    </div>

                    {/* Quantity */}
                    <div className="flex-none w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={glassware.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        required
                      />
                    </div>

                    {/* Unit Display */}
                    {glassware.unit && (
                      <div className="flex-none w-20">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                        <div className="px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm font-medium text-blue-600">
                          {glassware.unit}
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    {glasswares.length > 1 && (
                      <div className="flex-none">
                        <button
                          type="button"
                          onClick={() => removeGlasswareRow(index)}
                          className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {isOutOfStock && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-600">This glassware is currently out of stock.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={addGlasswareRow}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Glassware
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Allocating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Allocate Glassware
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocateGlasswareForm;
