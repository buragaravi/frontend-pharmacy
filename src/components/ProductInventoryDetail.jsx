import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductInventoryDetail = ({ productId, onClose }) => {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventoryDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/products/${productId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory details');
      setInventoryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchInventoryDetails();
    }
  }, [productId]);

  if (loading) {
    return (
      <tr className="animate-fadeInUp">
        <td colSpan="4" className="px-4 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 text-sm font-medium">Loading inventory details...</span>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr className="animate-fadeInUp">
        <td colSpan="4" className="px-4 py-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-red-600 text-sm font-medium">{error}</span>
              </div>
              <button
                onClick={onClose}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  if (!inventoryData) return null;

  const { summary, labDistribution, batchDetails, product } = inventoryData;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLabIcon = (labId) => {
    if (labId === 'central-store') {
      return (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      chemical: 'bg-blue-100 text-blue-700',
      equipment: 'bg-purple-100 text-purple-700',
      glassware: 'bg-green-100 text-green-700',
      others: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.others;
  };

  const getStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-700',
      Issued: 'bg-yellow-100 text-yellow-700',
      Assigned: 'bg-blue-100 text-blue-700',
      Maintenance: 'bg-orange-100 text-orange-700',
      Discarded: 'bg-red-100 text-red-700',
      good: 'bg-green-100 text-green-700',
      damaged: 'bg-yellow-100 text-yellow-700',
      broken: 'bg-red-100 text-red-700',
      under_maintenance: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || colors.good;
  };

  return (
    <tr className="animate-fadeInUp">
      <td colSpan="4" className="px-4 py-4">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getCategoryColor(product.category)}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                <p className="text-xs text-gray-600">Complete Inventory Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Stock</p>
                  <p className="text-sm font-bold text-gray-900">
                    {summary.totalStock} {product.unit || (product.category === 'equipment' ? 'items' : 'units')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-green-100 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">
                    {product.category === 'chemical' ? 'Active Batches' : 'Items/Batches'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{summary.activeBatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-purple-100 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Labs</p>
                  <p className="text-sm font-bold text-gray-900">{summary.labsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded-lg ${summary.belowThreshold ? 'bg-red-100' : 'bg-green-100'}`}>
                  <svg className={`w-4 h-4 ${summary.belowThreshold ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className={`text-xs font-bold ${summary.belowThreshold ? 'text-red-600' : 'text-green-600'}`}>
                    {summary.belowThreshold ? 'Below Threshold' : 'Stock OK'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lab Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Lab Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(labDistribution).map(([labId, data]) => (
                  <div key={labId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getLabIcon(labId)}
                      <span className="text-xs font-medium text-gray-900">
                        {labId === 'central-store' ? 'Central Lab' : labId.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900">
                        {data.quantity} {product.unit || (product.category === 'equipment' ? 'items' : 'units')}
                      </p>
                      {data.batches && (
                        <p className="text-xs text-gray-500">{data.batches} batches</p>
                      )}
                      {data.items && (
                        <p className="text-xs text-gray-500">{data.items} items</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch/Item Details */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {product.category === 'chemical' ? 'Batch Details' : 
                 product.category === 'equipment' ? 'Equipment Items' : 'Item Details'}
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                {batchDetails.map((item, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getLabIcon(item.labId)}
                          <span className="text-xs font-medium text-gray-900">
                            {item.batchId || item.itemId || 'N/A'}
                          </span>
                          {item.status && (
                            <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          )}
                          {item.condition && (
                            <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.condition)}`}>
                              {item.condition}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <div>Lab: {item.labId === 'central-store' ? 'Central Lab' : item.labId.toUpperCase()}</div>
                          <div>
                            Qty: {item.quantity || '1'} {item.unit || (product.category === 'equipment' ? 'item' : 'units')}
                          </div>
                          {item.expiryDate && (
                            <div>Expiry: {formatDate(item.expiryDate)}</div>
                          )}
                          {item.warranty && (
                            <div>Warranty: {formatDate(item.warranty)}</div>
                          )}
                          {item.assignedTo && (
                            <div>Assigned: {item.assignedTo}</div>
                          )}
                          {item.vendor && (
                            <div>Vendor: {item.vendor}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ProductInventoryDetail;
