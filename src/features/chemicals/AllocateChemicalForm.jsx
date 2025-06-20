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

const AllocateChemicalForm = () => {
  const [labId, setLabId] = useState('');
  const [chemicals, setChemicals] = useState([{ chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Helper: Merge chemicals by displayName, sum quantities, keep earliest expiry
  const mergeChemicalsByDisplayName = (chemList) => {
    const merged = {};
    chemList.forEach((chem) => {
      const displayName = chem.displayName || chem.chemicalName;
      if (!merged[displayName]) {
        merged[displayName] = {
          ...chem,
          quantity: Number(chem.quantity),
          expiryDate: chem.expiryDate,
        };
      } else {
        merged[displayName].quantity += Number(chem.quantity);
        // Keep the earliest expiry date
        if (
          chem.expiryDate &&
          (!merged[displayName].expiryDate ||
            new Date(chem.expiryDate) < new Date(merged[displayName].expiryDate))
        ) {
          merged[displayName].expiryDate = chem.expiryDate;
        }
      }
    });
    // Remove duplicate chemicalMasterId/unit if they differ (shouldn't happen, but safe)
    return Object.values(merged);
  };

  useEffect(() => {
    const fetchAvailableChemicals = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Merge by displayName, sum quantities, keep earliest expiry
        const merged = mergeChemicalsByDisplayName(
          res.data.filter((chem) => chem.quantity > 0)
        ).sort((a, b) => (a.displayName || a.chemicalName).localeCompare(b.displayName || b.chemicalName));

        setAvailableChemicals(merged);
      } catch (err) {
        console.error('Failed to fetch chemicals:', err);
      }
    };

    fetchAvailableChemicals();
  }, [token]);

  const handleChemicalNameChange = (index, name) => {
    const updated = [...chemicals];
    updated[index].chemicalName = name;
    updated[index].quantity = 0;
    updated[index].chemicalMasterId = '';
    updated[index].unit = '';
    updated[index].expiryDate = '';

    // Find the merged chemical by displayName
    const selected = availableChemicals.find(
      (chem) =>
        (chem.displayName || chem.chemicalName).toLowerCase() === name.toLowerCase()
    );

    if (selected) {
      updated[index].chemicalMasterId = selected.chemicalMasterId;
      updated[index].unit = selected.unit;
      updated[index].expiryDate = selected.expiryDate; // Earliest expiry
    }

    setChemicals(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...chemicals];
    updated[index].quantity = value;
    setChemicals(updated);
  };

  const addChemicalRow = () => {
    setChemicals([...chemicals, { chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
  };

  const removeChemicalRow = (index) => {
    const updated = [...chemicals];
    updated.splice(index, 1);
    setChemicals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!labId) {
      return setMessage('Please select a lab.');
    }

    const allocations = chemicals
      .filter((c) => c.chemicalMasterId && c.quantity)
      .map((c) => ({
        chemicalMasterId: c.chemicalMasterId,
        chemicalName: c.chemicalName,
        quantity: parseFloat(c.quantity),
        expiryDate: c.expiryDate, // Send earliest expiry
      }));

    if (allocations.length === 0) {
      return setMessage('Please select at least one valid chemical and quantity.');
    }

    setLoading(true);

    try {
      const res = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/chemicals/allocate',
        { labId, allocations },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Chemicals allocated successfully!');
      setChemicals([{ chemicalName: '', quantity: 0, chemicalMasterId: '', unit: '', expiryDate: '' }]);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#0B3861] mb-4">Allocate Chemicals to Lab</h3>
      
      {message && (
        <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-[#F5F9FD] text-[#0B3861]' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0B3861]">Select Lab</label>
          <select
            value={labId}
            onChange={(e) => setLabId(e.target.value)}
            className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
            required
          >
            <option value=""> Select Lab</option>
            {labOptions.map((lab) => (
              <option key={lab.value} value={lab.value} className="text-[#0B3861]">
                {lab.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {chemicals.map((chemical, index) => {
            const isOutOfStock =
              chemical.chemicalName &&
              !availableChemicals.some(
                (chem) =>
                  (chem.displayName || chem.chemicalName).toLowerCase() === chemical.chemicalName.toLowerCase() &&
                  chem.quantity > 0
              );

            return (
              <div key={index} className="bg-[#F5F9FD] p-4 rounded-xl border border-[#BCE0FD] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Chemical Name</label>
                    <input
                      list={`chemical-list-${index}`}
                      value={chemical.chemicalName}
                      onChange={(e) => handleChemicalNameChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                      placeholder="Search chemical..."
                      required
                    />
                    <datalist id={`chemical-list-${index}`}>
                      {availableChemicals.map((chem) => (
                        <option
                          key={`${chem.chemicalMasterId}-${chem.displayName || chem.chemicalName}-${index}`}
                          value={chem.displayName || chem.chemicalName}
                        >
                          {(chem.displayName || chem.chemicalName)} ({chem.unit}) - {chem.quantity} in stock
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={chemical.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                        placeholder="0.00"
                        required
                      />
                      {chemical.unit && (
                        <span className="text-sm text-[#0B3861] font-medium">{chemical.unit}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-end">
                    {chemicals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChemicalRow(index)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {isOutOfStock && (
                  <p className="text-sm text-red-600 mt-1">This chemical is currently out of stock.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={addChemicalRow}
            className="px-4 py-2 bg-[#F5F9FD] text-[#0B3861] rounded-lg font-medium hover:bg-[#BCE0FD] transition-colors"
          >
            + Add Another Chemical
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              loading
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
                Allocating...
              </span>
            ) : (
              'Allocate Chemicals'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AllocateChemicalForm;