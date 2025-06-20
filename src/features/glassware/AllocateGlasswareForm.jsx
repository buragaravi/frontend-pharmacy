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
    let response;
    e.preventDefault();
    setMessage('');
    if (!labId) return setMessage('Please select a lab.');
    const allocations = glasswares
      .filter((g) => g.glasswareId && g.quantity)
      .map((g) => ({ glasswareId: g.glasswareId, glasswareName: g.glasswareName, quantity: parseFloat(g.quantity), description: g.description }));
    if (allocations.length === 0) return setMessage('Please select at least one valid glassware and quantity.');
    setLoading(true);
    try {
      // With this:
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
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#0B3861] mb-4">Allocate Glassware to Lab</h3>
      {message && (
        <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-[#F5F9FD] text-[#0B3861]' : 'bg-red-100 text-red-800'}`}>{message}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0B3861]">Select Lab</label>
          <select value={labId} onChange={(e) => setLabId(e.target.value)} className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]" required>
            <option value=""> Select Lab</option>
            {labOptions.map((lab) => (
              <option key={lab.value} value={lab.value} className="text-[#0B3861]">{lab.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-4">
          {glasswares.map((glassware, index) => {
            const isOutOfStock = glassware.glasswareName && !availableGlasswares.some((g) => {
              const gName = g.displayName || g.glasswareName || g.name;
              if (!gName || !glassware.glasswareName) return false;
              return gName.toLowerCase() === glassware.glasswareName.toLowerCase() && g.quantity > 0;
            });
            return (
              <div key={index} className="bg-[#F5F9FD] p-4 rounded-xl border border-[#BCE0FD] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Glassware Name</label>
                    <input list={`glassware-list-${index}`} value={glassware.glasswareName} onChange={(e) => handleGlasswareNameChange(index, e.target.value)} className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]" placeholder="Search glassware..." required />
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
                  <div>
                    <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" step="1" value={glassware.quantity} onChange={(e) => handleQuantityChange(index, e.target.value)} className="flex-1 px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]" placeholder="0" required />
                      {glassware.unit && (<span className="text-sm text-[#0B3861] font-medium">{glassware.unit}</span>)}
                    </div>
                  </div>
                  <div className="flex items-end">{glasswares.length > 1 && (<button type="button" onClick={() => removeGlasswareRow(index)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Remove</button>)}</div>
                </div>
                {isOutOfStock && (<p className="text-sm text-red-600 mt-1">This glassware is currently out of stock.</p>)}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={addGlasswareRow} className="px-4 py-2 bg-[#F5F9FD] text-[#0B3861] rounded-lg font-medium hover:bg-[#BCE0FD] transition-colors">+ Add Another Glassware</button>
          <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-300 text-gray-600' : 'bg-[#0B3861] text-white hover:bg-[#1E88E5]'}`}>{loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Allocating...</span>) : ('Allocate Glassware')}</button>
        </div>
      </form>
    </div>
  );
};

export default AllocateGlasswareForm;
