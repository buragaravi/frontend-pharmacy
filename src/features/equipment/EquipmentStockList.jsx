import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GlobalPrintStyles = () => (
  <style>
    {`
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-qr-view,
        .printable-qr-view *,
        .printable-sticker-view,
        .printable-sticker-view * {
          visibility: visible;
        }
        .printable-qr-view {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .printable-sticker-view {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        /* Hide everything else when printing */
        .no-print {
          display: none !important;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      .hover-scale {
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }

      .hover-scale:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
    `}
  </style>
);

const PrintableQRView = ({ items }) => {
  return (
    <div style={{ display: 'none' }} className="printable-qr-view">
      <style>
        {`
          @media print {
            .printable-qr-view {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              padding: 16px;
              background: white;
            }
            .qr-item {
              display: flex !important;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 12px;
              border-radius: 8px;
              background: white;
              border: 1px solid #e2e8f0;
              page-break-inside: avoid;
              min-height: 200px;
            }
            .qr-name {
              font-size: 14px;
              font-weight: 600;
              margin: 8px 0 4px 0;
              text-align: center;
              color: #1e40af;
              line-height: 1.2;
            }
            .qr-id {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 4px;
              text-align: center;
            }
            .qr-image {
              width: 120px;
              height: 120px;
              object-fit: contain;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        `}
      </style>
      {items.filter(item => item.qrCodeImage).map(item => (
        <div key={item.itemId} className="qr-item">
          <img src={item.qrCodeImage} alt={`QR Code for ${item.name}`} className="qr-image" />
          <div className="qr-name">{item.name}</div>
          <div className="qr-id">ID: {item.itemId}</div>
          {item.variant && <div className="qr-id">Variant: {item.variant}</div>}
        </div>
      ))}
    </div>
  );
};

// Individual sticker printing component for bill printers
const PrintableStickerView = ({ item }) => {
  if (!item) return null;
  
  return (
    <div style={{ display: 'none' }} className="printable-sticker-view">
      <style>
        {`
          @media print {
            .printable-sticker-view {
              display: block !important;
              width: 58mm;
              height: 32mm;
              padding: 2mm;
              background: white;
              overflow: hidden;
            }
            .sticker-content {
              display: flex !important;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              height: 100%;
            }
            .sticker-qr {
              width: 26mm;
              height: 26mm;
              object-fit: contain;
            }
            .sticker-info {
              flex: 1;
              margin-left: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .sticker-name {
              font-size: 8px;
              font-weight: 600;
              color: #1e40af;
              line-height: 1.1;
              margin-bottom: 1mm;
              word-wrap: break-word;
            }
            .sticker-id {
              font-size: 6px;
              color: #64748b;
              line-height: 1;
            }
            @page {
              size: 58mm 32mm;
              margin: 0;
            }
          }
        `}
      </style>
      <div className="sticker-content">
        <img src={item.qrCodeImage} alt={`QR Code for ${item.name}`} className="sticker-qr" />
        <div className="sticker-info">
          <div className="sticker-name">{item.name}</div>
          <div className="sticker-id">ID: {item.itemId}</div>
          {item.variant && <div className="sticker-id">Variant: {item.variant}</div>}
        </div>
      </div>
    </div>
  );
};

// Component for printing all stickers (one QR per page)
const PrintableAllStickersView = ({ items }) => {
  return (
    <div style={{ display: 'none' }} className="printable-all-stickers-view">
      <style>
        {`
          @media print {
            .printable-all-stickers-view {
              display: block !important;
            }
            .sticker-page {
              width: 58mm;
              height: 32mm;
              padding: 2mm;
              background: white;
              overflow: hidden;
              page-break-after: always;
              display: flex !important;
              align-items: center;
              justify-content: space-between;
            }
            .sticker-page:last-child {
              page-break-after: avoid;
            }
            .sticker-page-qr {
              width: 26mm;
              height: 26mm;
              object-fit: contain;
            }
            .sticker-page-info {
              flex: 1;
              margin-left: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .sticker-page-name {
              font-size: 8px;
              font-weight: 600;
              color: #1e40af;
              line-height: 1.1;
              margin-bottom: 1mm;
              word-wrap: break-word;
            }
            .sticker-page-id {
              font-size: 6px;
              color: #64748b;
              line-height: 1;
            }
            @page {
              size: 58mm 32mm;
              margin: 0;
            }
          }
        `}
      </style>
      {items.filter(item => item.qrCodeImage).map(item => (
        <div key={item.itemId} className="sticker-page">
          <img src={item.qrCodeImage} alt={`QR Code for ${item.name}`} className="sticker-page-qr" />
          <div className="sticker-page-info">
            <div className="sticker-page-name">{item.name}</div>
            <div className="sticker-page-id">ID: {item.itemId}</div>
            {item.variant && <div className="sticker-page-id">Variant: {item.variant}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};



const EquipmentStockList = () => {
  const [selectedLab, setSelectedLab] = useState('all');
  const [equipmentData, setEquipmentData] = useState(null);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stickerPrintItem, setStickerPrintItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch equipment data from central/available endpoint with pagination
  const fetchEquipmentData = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 100, // Start with smaller chunks
        search: debouncedSearchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        labId: selectedLab !== 'all' ? selectedLab : ''
      };

      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/equipment/central/available', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        setEquipmentData(response.data);
        setFilteredEquipment(response.data.data);
        setPagination(response.data.pagination);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        setError('Failed to fetch equipment data');
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to fetch equipment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchEquipmentData(1);
    }
  }, [token, debouncedSearchTerm, statusFilter, selectedLab]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEquipmentData(page);
  };

  // Server-side filtering is now handled in the API call above
  // Remove client-side filtering to improve performance

  // Get unique labs from data
  const getLabOptions = () => {
    if (!equipmentData?.groupedByLab) return [];
    return Object.keys(equipmentData.groupedByLab).map(labId => ({
      id: labId,
      name: labId === 'central-store' ? 'Central Store' : `Lab ${labId.replace('LAB', '')}`,
      count: equipmentData.groupedByLab[labId].length
    }));
  };

  const handlePrintQRCodes = () => {
    // Hide sticker view if open
    setStickerPrintItem(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintSticker = (item) => {
    setStickerPrintItem(item);
    setTimeout(() => {
      window.print();
      // Reset after printing
      setTimeout(() => setStickerPrintItem(null), 500);
    }, 100);
  };

  const handlePrintAllStickers = () => {
    setStickerPrintItem('all');
    setTimeout(() => {
      window.print();
      // Reset after printing
      setTimeout(() => setStickerPrintItem(null), 500);
    }, 100);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full relative">
      {/* Floating bubbles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-none mx-auto bg-white/20 overflow-hidden">
        {/* Enhanced Header Section */}
        <div className="relative rounded-b-3xl bg-blue-600 p-4 mb-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-blue-800/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold mb-1">Equipment Stock Management</h1>
                  <p className="text-blue-100 text-base">Monitor and manage equipment inventory across all laboratories</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 bg-white/10 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6">
          <PrintableQRView items={filteredEquipment} />
          {stickerPrintItem && <PrintableStickerView item={stickerPrintItem} />}
          
          {/* Summary Cards */}
          {equipmentData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Equipment</p>
                    <p className="text-2xl font-bold text-blue-600">{equipmentData.summary.total?.items || 0}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{equipmentData.summary.total?.byStatus?.available || 0}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Issued</p>
                    <p className="text-2xl font-bold text-blue-600">{equipmentData.summary.total?.byStatus?.issued || 0}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-600">{equipmentData.summary.total?.byStatus?.maintenance || 0}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm w-64"
                  />
                </div>
                
                <select
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  className="px-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="all">All Labs ({totalItems || 0})</option>
                  {getLabOptions().map(lab => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.count})
                    </option>
                  ))}
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Issued">Issued</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handlePrintQRCodes}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-all duration-300 hover:shadow-lg"
                  disabled={filteredEquipment.filter(item => item.qrCodeImage).length === 0}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print All QR Codes (A4)
                </button>
                <button
                  onClick={handlePrintAllStickers}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2 transition-all duration-300 hover:shadow-lg"
                  disabled={filteredEquipment.filter(item => item.qrCodeImage).length === 0}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Print All Stickers ({filteredEquipment.filter(item => item.qrCodeImage).length})
                </button>
                <div className="text-xs text-slate-500 flex items-center">
                  Individual sticker prints available in table rows
                </div>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Showing {filteredEquipment.length} of {equipmentData?.data?.length || 0} equipment items
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {/* Equipment Table */}
          {!loading && !error && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-white/30">
                  <thead className="bg-blue-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Item ID</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Variant</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Lab</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Location</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Assigned To</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Warranty</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">QR Code</th>
                      <th className="px-4 py-3 text-left text-blue-900 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {filteredEquipment && filteredEquipment.length > 0 ? (
                      filteredEquipment.map((item, index) => (
                        <tr 
                          key={item.itemId}
                          className="hover:bg-white/50 transition-colors"
                          style={{ animation: `fadeIn 0.5s ease-out ${index * 0.05}s` }}
                        >
                          <td className="px-4 py-3 font-mono text-xs">{item.itemId}</td>
                          <td className="px-4 py-3 font-medium text-blue-900">{item.name}</td>
                          <td className="px-4 py-3">{item.variant || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {item.labId === 'central-store' ? 'Central Store' : `Lab ${item.labId?.replace('LAB', '') || 'N/A'}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">{item.location || '-'}</td>
                          <td className="px-4 py-3">{item.assignedTo || '-'}</td>
                          <td className="px-4 py-3">{item.warranty || '-'}</td>
                          <td className="px-4 py-3">
                            {item.qrCodeImage && (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={item.qrCodeImage} 
                                  alt={`QR code for ${item.name}`}
                                  className="w-10 h-10 rounded border border-white/30 hover:scale-110 transition-transform cursor-pointer" 
                                  onClick={() => {
                                    // Open QR code in modal or new window
                                    const win = window.open('', '_blank');
                                    win.document.write(`
                                      <html>
                                        <head><title>QR Code - ${item.name}</title></head>
                                        <body style="margin:0;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
                                          <div style="text-align:center;">
                                            <img src="${item.qrCodeImage}" style="max-width:400px;height:auto;border:1px solid #e2e8f0;border-radius:8px;"/>
                                            <h3 style="margin-top:20px;color:#1e40af;">${item.name}</h3>
                                            <p style="color:#64748b;">ID: ${item.itemId}</p>
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }}
                                />
                                <button
                                  onClick={() => handlePrintSticker(item)}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                  title="Print Sticker"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs transition-all duration-300 hover:shadow-md"
                              onClick={() => navigate(`/equipment/item/${item.itemId}`)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <p className="text-lg font-medium">No equipment found</p>
                            <p className="text-sm">Try adjusting your search criteria or filters</p>
                            {equipmentData?.data?.length === 0 && (
                              <p className="text-xs text-red-500 mt-2">No equipment data available from the server</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination && totalPages > 1 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 100) + 1} to {Math.min(currentPage * 100, totalItems)} of {totalItems} items
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Print Views */}
      <PrintableQRView items={filteredEquipment} />
      {stickerPrintItem && stickerPrintItem !== 'all' && (
        <PrintableStickerView item={stickerPrintItem} />
      )}
      {stickerPrintItem === 'all' && (
        <PrintableAllStickersView items={filteredEquipment} />
      )}
    </div>
  );
};

export default EquipmentStockList;
