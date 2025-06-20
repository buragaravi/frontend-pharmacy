import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddChemicalForm = () => {
  const [chemicals, setChemicals] = useState([
    { chemicalName: '', quantity: 0, unit: '', expiryDate: '', vendor: '', pricePerUnit: 0, department: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [usePreviousBatchId, setUsePreviousBatchId] = useState(false);
  const [chemicalProducts, setChemicalProducts] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch only products with category 'chemical' from backend
    const fetchChemicalProducts = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/products/category/chemical');
        setChemicalProducts(res.data?.data || []);
      } catch (err) {
        setChemicalProducts([]);
      }
    };
    fetchChemicalProducts();
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...chemicals];
    updated[index][field] = value;
    // If the field is 'chemicalName', auto-fill the unit from the selected product
    if (field === 'chemicalName') {
      const selectedProduct = chemicalProducts.find(prod => prod.name === value);
      if (selectedProduct) {
        updated[index].unit = selectedProduct.unit || '';
      } else {
        updated[index].unit = '';
      }
    }
    setChemicals(updated);
  };

  const addRow = () => {
    setChemicals([
      ...chemicals,
      { chemicalName: '', quantity: 0, unit: '', expiryDate: '', vendor: '', pricePerUnit: 0, department: '' },
    ]);
  };

  const removeRow = (index) => {
    const updated = [...chemicals];
    updated.splice(index, 1);
    setChemicals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/chemicals/add',
        { chemicals, usePreviousBatchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Chemicals added successfully!');
      setChemicals([
        { chemicalName: '', quantity: 0, unit: '', expiryDate: '', vendor: '', pricePerUnit: 0, department: '' },
      ]);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to add chemicals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#0B3861] mb-4">Add Chemicals</h3>
      
      {message && (
        <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-[#F5F9FD] text-[#0B3861]' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#0B3861] mb-1">Use Previous Batch ID</label>
          <input
            type="checkbox"
            checked={usePreviousBatchId}
            onChange={(e) => setUsePreviousBatchId(e.target.checked)}
            className="w-5 h-5 text-[#0B3861] focus:ring-[#0B3861] border-[#BCE0FD] rounded"
          />
        </div>

        {chemicals.map((chemical, index) => (
          <div key={index} className="bg-[#F5F9FD] p-4 rounded-xl border border-[#BCE0FD] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Chemical Name</label>
                <select
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.chemicalName}
                  onChange={(e) => handleChange(index, 'chemicalName', e.target.value)}
                  required
                >
                  <option value="">Select chemical</option>
                  {chemicalProducts.map((prod) => (
                    <option key={prod._id} value={prod.name}>{prod.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.quantity}
                  onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Unit</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.unit}
                  onChange={(e) => handleChange(index, 'unit', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.expiryDate}
                  onChange={(e) => handleChange(index, 'expiryDate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Vendor</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.vendor}
                  onChange={(e) => handleChange(index, 'vendor', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Price per Unit</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.pricePerUnit}
                  onChange={(e) => handleChange(index, 'pricePerUnit', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0B3861] mb-1">Department</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
                  value={chemical.department}
                  onChange={(e) => handleChange(index, 'department', e.target.value)}
                  required
                />
              </div>
            </div>
            
            {chemicals.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeRow(index)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        
        <div className="flex flex-wrap gap-4">
          <button 
            type="button" 
            onClick={addRow}
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
            {loading ? 'Submitting...' : 'Submit All Chemicals'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddChemicalForm;