import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FixedSizeList as List } from 'react-window';

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Equipment row component for virtual scrolling
const EquipmentRow = React.memo(({ index, style, data }) => {
  const { items, onToggleSelection, selectedItems, onPrintSticker } = data;
  const item = items[index];

  if (!item) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
      </div>
    );
  }

  const isSelected = selectedItems.has(item.itemId);

  return (
    <div style={style} className="px-4 py-2">
      <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(item.itemId)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {item.name}
                </h3>
                {item.variant && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    {item.variant}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded ${
                  item.status === 'Available' ? 'bg-green-100 text-green-800' :
                  item.status === 'Issued' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'Maintenance' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span>ID: {item.itemId}</span>
                <span>Lab: {item.labId}</span>
                {item.vendor && <span>Vendor: {item.vendor}</span>}
                {item.warranty && (
                  <span>Warranty: {new Date(item.warranty).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {item.qrCodeImage && (
              <button
                onClick={() => onPrintSticker(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Print Sticker"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" 
                  />
                </svg>
              </button>
            )}
            <button
              className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
              title="View Details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const OptimizedEquipmentStockList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // State management
  const [equipmentData, setEquipmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(50);

  // Available labs for filtering
  const [availableLabs, setAvailableLabs] = useState([]);
  const [summary, setSummary] = useState(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch equipment data with pagination
  const fetchEquipmentData = useCallback(async (page = 1, resetData = true) => {
    if (resetData) {
      setLoading(true);
      setError('');
    }

    try {
      const params = {
        page,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        labId: labFilter !== 'all' ? labFilter : '',
        sortBy,
        sortOrder
      };

      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/equipment/central/available', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        const { data, pagination, summary: responseSummary, groupedByLab } = response.data;
        
        if (resetData) {
          setEquipmentData(data);
        } else {
          // For infinite scroll (future enhancement)
          setEquipmentData(prev => [...prev, ...data]);
        }
        
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalItems(pagination.totalItems);
        setSummary(responseSummary);
        
        // Extract available labs
        if (groupedByLab) {
          setAvailableLabs(Object.keys(groupedByLab).map(labId => ({
            id: labId,
            name: labId === 'central-store' ? 'Central Store' : labId,
            count: groupedByLab[labId].length
          })));
        }
      } else {
        setError('Failed to fetch equipment data');
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to fetch equipment data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearchTerm, statusFilter, labFilter, sortBy, sortOrder, itemsPerPage]);

  // Effect to fetch data when filters change
  useEffect(() => {
    if (token) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchEquipmentData(1, true);
    }
  }, [fetchEquipmentData, token]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEquipmentData(page, true);
  };

  // Selection handlers
  const handleToggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedItems.size === equipmentData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(equipmentData.map(item => item.itemId)));
    }
  };

  // Print handlers
  const handlePrintSelected = () => {
    const selectedEquipment = equipmentData.filter(item => 
      selectedItems.has(item.itemId) && item.qrCodeImage
    );
    if (selectedEquipment.length === 0) {
      alert('Please select equipment items with QR codes to print.');
      return;
    }
    // Implement print logic here
    window.print();
  };

  const handlePrintSticker = (item) => {
    // Implement individual sticker print logic
    console.log('Print sticker for:', item);
  };

  // Virtual list item data
  const listData = useMemo(() => ({
    items: equipmentData,
    onToggleSelection: handleToggleSelection,
    selectedItems,
    onPrintSticker: handlePrintSticker
  }), [equipmentData, handleToggleSelection, selectedItems]);

  // Pagination component
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border">
      <div className="text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, currentPage - 2) + i;
          if (pageNum > totalPages) return null;
          
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 text-sm border rounded ${
                currentPage === pageNum 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view equipment stock.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Stock Management</h1>
          <p className="text-gray-600">
            Manage and track equipment inventory across all laboratories
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{summary.total?.items || 0}</div>
              <div className="text-sm text-gray-600">Total Equipment</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{summary.total?.byStatus?.available || 0}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">{summary.total?.byStatus?.issued || 0}</div>
              <div className="text-sm text-gray-600">Issued</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{summary.total?.byStatus?.maintenance || 0}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, variant, or vendor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Issued">Issued</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            {/* Lab Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory</label>
              <select
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Labs</option>
                {availableLabs.map(lab => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="status-asc">Status A-Z</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {selectedItems.size === equipmentData.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedItems.size} item(s) selected
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {selectedItems.size > 0 && (
                <button
                  onClick={handlePrintSelected}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Print Selected QR Codes
                </button>
              )}
              <button
                onClick={() => fetchEquipmentData(currentPage, true)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading equipment...</span>
            </div>
          ) : error ? (
            <div className="text-center p-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => fetchEquipmentData(currentPage, true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : equipmentData.length === 0 ? (
            <div className="text-center p-12">
              <div className="text-gray-500 mb-4">No equipment found matching your criteria.</div>
            </div>
          ) : (
            <>
              {/* Virtual List */}
              <List
                height={600} // Fixed height for virtual scrolling
                itemCount={equipmentData.length}
                itemSize={100} // Height of each row
                itemData={listData}
              >
                {EquipmentRow}
              </List>
              
              {/* Pagination */}
              <PaginationControls />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizedEquipmentStockList;
