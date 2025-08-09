import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import useLabs from '../../hooks/useLabs';

const CreateOtherProductRequestForm = () => {
  const [labId, setLabId] = useState('');
  const [products, setProducts] = useState([
    { productName: '', quantity: '', unit: '', productId: '', suggestions: [], showSuggestions: false, availableQuantity: null }
  ]);
  
  // Fetch labs dynamically
  const { labs, loading: labsLoading } = useLabs();

  const createRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://backend-pharmacy-5541.onrender.com/api/other/requests', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Request created successfully!');
      setLabId('');
      setProducts([{ productName: '', quantity: '', unit: '', productId: '', suggestions: [], showSuggestions: false, availableQuantity: null }]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create request');
    },
  });

  const handleProductSearch = async (index, searchTerm) => {
    const token = localStorage.getItem('token');
    setProducts((prev) => {
      const updated = [...prev];
      updated[index].productName = searchTerm;
      return updated;
    });
    if (!searchTerm.trim()) return;
    try {
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/other/central/available?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const suggestions = response.data.map(item => ({
        name: item.productName,
        unit: item.unit,
        id: item._id,
        availableQuantity: item.quantity,
      }));
      setProducts((prev) => {
        const updated = [...prev];
        updated[index].suggestions = suggestions;
        updated[index].showSuggestions = true;
        return updated;
      });
    } catch (err) {
      toast.error('Failed to search product');
    }
  };

  const handleProductSelect = (index, suggestion) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = {
        productName: suggestion.name,
        unit: suggestion.unit,
        productId: suggestion.id,
        quantity: '',
        suggestions: [],
        showSuggestions: false,
        availableQuantity: suggestion.availableQuantity,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index].quantity = value;
      return updated;
    });
  };

  const addProduct = () => {
    setProducts((prev) => ([...prev, { productName: '', quantity: '', unit: '', productId: '', suggestions: [], showSuggestions: false, availableQuantity: null }]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!labId) return toast.error('Please select a lab');
    if (products.length === 0) return toast.error('Please add at least one product');
    for (const p of products) {
      if (!p.productName || !p.quantity || !p.unit) return toast.error('Please fill in all product details');
      if (isNaN(p.quantity) || Number(p.quantity) <= 0) return toast.error('Please enter a valid quantity');
    }
    const formatted = {
      labId,
      products: products.map(p => ({
        productId: p.productId,
        productName: p.productName,
        quantity: Number(p.quantity),
        unit: p.unit,
      })),
    };
    createRequestMutation.mutate(formatted);
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl shadow-lg p-4 md:p-6 bg-white border border-blue-800">
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6">Request Other Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Lab ID</label>
              <select 
                value={labId} 
                onChange={(e) => setLabId(e.target.value)} 
                required 
                disabled={labsLoading}
                className="w-full px-3 py-2 text-sm md:text-base border border-blue-900 rounded-lg focus:ring-blue-900 focus:border-blue-900 transition-colors disabled:opacity-50"
              >
                <option value="">{labsLoading ? 'Loading labs...' : 'Select Lab'}</option>
                {labs.map((lab) => (
                  <option key={lab.labId} value={lab.labId}>{lab.labId} - {lab.labName}</option>
                ))}
              </select>
            </div>
            {products.map((product, index) => (
              <div key={`product-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-blue-900 mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="Search product"
                    value={product.productName}
                    onChange={(e) => handleProductSearch(index, e.target.value)}
                    onFocus={() => setProducts((prev) => { const updated = [...prev]; updated[index].showSuggestions = true; return updated; })}
                    onBlur={() => setTimeout(() => setProducts((prev) => { const updated = [...prev]; updated[index].showSuggestions = false; return updated; }), 200)}
                    required
                    className="w-full px-3 py-2 text-sm md:text-base border border-blue-900 rounded-lg focus:ring-blue-900 focus:border-blue-900 transition-colors"
                  />
                  {product.showSuggestions && product.suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full border border-gray-300 rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
                      {product.suggestions.map((sug, idx) => (
                        <li
                          key={`suggestion-${index}-${idx}`}
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-300 last:border-b-0"
                          onClick={() => handleProductSelect(index, sug)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{sug.name}</span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Available: {sug.availableQuantity} {sug.unit}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm md:text-base border border-blue-900 rounded-lg focus:ring-blue-900 focus:border-blue-900 transition-colors"
                    max={product.availableQuantity || undefined}
                  />
                  {product.availableQuantity !== null && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>Available: {product.availableQuantity} {product.unit}</span>
                      {product.quantity > product.availableQuantity && (
                        <span className="ml-2 text-red-500 font-medium">(Exceeds available quantity)</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="Unit"
                    value={product.unit}
                    readOnly
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={addProduct} className="w-full py-2 text-blue-900 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">+ Add Another Product</button>
            <div className="flex justify-end">
              <button type="submit" disabled={createRequestMutation.isLoading} className="px-4 py-2 md:px-6 md:py-2 bg-blue-900 text-white rounded-lg text-sm md:text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {createRequestMutation.isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOtherProductRequestForm;
