import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OutOfStockChemicals = () => {
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOutOfStock = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/out-of-stock', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOutOfStock(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch out-of-stock chemicals');
      }
      setLoading(false);
    };
    fetchOutOfStock();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Out-of-Stock Chemicals</h2>
          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">{error}</div>
          )}
          {(!loading && !error && outOfStock.length === 0) && (
            <div className="text-gray-500 text-center py-8">No chemicals are currently out of stock.</div>
          )}
          {outOfStock.length > 0 && (
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Out of Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {outOfStock.map((chem) => (
                  <tr key={chem._id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chem.displayName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chem.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chem.lastOutOfStock ? new Date(chem.lastOutOfStock).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutOfStockChemicals;
