import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllGlasswareStock } from './glasswareApi';
import { generateLabColors } from '../../components/analytics/utils/colorPalette';

const GlobalPrintStyles = () => (
  <style>
    {`
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-qr-view,
        .printable-qr-view * {
          visibility: visible;
        }
        .printable-qr-view {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
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

      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(1deg); }
        66% { transform: translateY(5px) rotate(-1deg); }
      }

      @keyframes floatReverse {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(8px) rotate(-1deg); }
        66% { transform: translateY(-12px) rotate(1deg); }
      }

      @keyframes bubbleFloat {
        0% { transform: translateY(0px) scale(1); opacity: 0.7; }
        50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        100% { transform: translateY(0px) scale(1); opacity: 0.7; }
      }

      .hover-scale {
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      }

      .hover-scale:hover {
        transform: scale(1.02);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .glass-card {
        animation: fadeIn 0.5s ease-out forwards;
      }

      .glass-card:nth-child(odd) {
        animation-delay: 0.1s;
      }

      .glass-card:nth-child(even) {
        animation-delay: 0.2s;
      }

      .bubble-float-1 {
        animation: float 6s ease-in-out infinite;
      }

      .bubble-float-2 {
        animation: floatReverse 8s ease-in-out infinite;
        animation-delay: -2s;
      }

      .bubble-float-3 {
        animation: bubbleFloat 10s ease-in-out infinite;
        animation-delay: -4s;
      }

      .bubble-float-4 {
        animation: float 7s ease-in-out infinite;
        animation-delay: -1s;
      }
    `}
  </style>
);

const PrintableQRView = ({ groupedStock }) => {
  const allItems = Object.values(groupedStock).flat();
  
  return (
    <div style={{ display: 'none' }} className="printable-qr-view">
      <style>
        {`
          @media print {
            .printable-qr-view {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              padding: 24px;
              background: #f8fafc;
            }
            .qr-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              border-radius: 12px;
              background: white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              page-break-inside: avoid;
              border: 1px solid #e2e8f0;
            }
            .qr-name {
              font-size: 16px;
              font-weight: 600;
              margin: 12px 0;
              text-align: center;
              color: #059669;
            }
            .qr-details {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 6px;
              text-align: center;
            }
            .qr-image {
              width: 160px;
              height: 160px;
              object-fit: contain;
              padding: 8px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `}
      </style>
      {allItems.map(item => item.qrCodeImage && (
        <div key={item._id} className="qr-item">
          <img src={item.qrCodeImage} alt={`QR Code for ${item.name}`} className="qr-image" />
          <div className="qr-name">{item.name}</div>
          <div className="qr-details">Lab: {getLabDisplayName(item.labId)}</div>
          <div className="qr-details">Qty: {item.quantity} {item.unit}</div>
          {item.variant && <div className="qr-details">Variant: {item.variant}</div>}
          {item.batchId && <div className="qr-details">Batch: {item.batchId}</div>}
        </div>
      ))}
    </div>
  );
};

const getLabDisplayName = (labId) => {
  const labNames = {
    'central-store': 'Central Lab',
    'LAB01': 'Lab 01',
    'LAB02': 'Lab 02',
    'LAB03': 'Lab 03',
    'LAB04': 'Lab 04',
    'LAB05': 'Lab 05',
    'LAB06': 'Lab 06',
    'LAB07': 'Lab 07',
    'LAB08': 'Lab 08'
  };
  return labNames[labId] || labId;
};

const StockCard = ({ item, labColor }) => {
  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
  const isNearExpiry = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="glass-card bg-white rounded-lg shadow-lg border border-gray-200 p-3 sm:p-4 hover-scale transition-all duration-300">
      {/* Header with status indicator - Mobile Responsive */}
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm flex-shrink-0 mt-1"
            style={{ backgroundColor: labColor }}
          />
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate flex-1 leading-tight">
            {item.name}
          </h3>
        </div>
        
        {/* Status badges - Mobile Responsive */}
        <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
          {isExpired && (
            <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              Expired
            </span>
          )}
          {!isExpired && isNearExpiry && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              Near Expiry
            </span>
          )}
          {item.quantity === 0 && (
            <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Main content - Mobile Responsive */}
      <div className="space-y-2">
        {/* Quantity */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Quantity:</span>
          <span className={`text-sm sm:text-base font-bold ${
            item.quantity === 0 ? 'text-red-600' : 
            item.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {item.quantity} {item.unit || ''}
          </span>
        </div>

        {/* Variant */}
        {item.variant && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Variant:</span>
            <span className="text-xs font-medium text-gray-800 text-right break-words max-w-[60%]">{item.variant}</span>
          </div>
        )}

        {/* Batch ID */}
        {item.batchId && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Batch:</span>
            <span className="text-xs font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded max-w-[60%] truncate">
              {item.batchId}
            </span>
          </div>
        )}

        {/* Expiry Date */}
        {item.expiryDate && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Expires:</span>
            <span className={`text-xs font-medium ${
              isExpired ? 'text-red-600' : isNearExpiry ? 'text-yellow-600' : 'text-gray-800'
            }`}>
              {new Date(item.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* QR Code indicator */}
        {item.qrCodeImage && (
          <div className="flex justify-center pt-1">
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" clipRule="evenodd" />
              </svg>
              QR Available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LabSection = ({ labId, items, labColor }) => {
  const labName = getLabDisplayName(labId);
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const outOfStockCount = items.filter(item => item.quantity === 0).length;
  const expiredCount = items.filter(item => 
    item.expiryDate && new Date(item.expiryDate) < new Date()
  ).length;

  return (
    <div className="mb-4 sm:mb-6">
      {/* Lab header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md flex-shrink-0"
            style={{ backgroundColor: labColor }}
          />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">{labName}</h2>
            <p className="text-xs text-gray-600">
              <span className="block sm:inline">{totalItems} items</span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">Total: {totalQuantity} pieces</span>
            </p>
          </div>
        </div>
        
        {/* Quick stats - Mobile Responsive */}
        <div className="flex gap-3 sm:gap-4 justify-center sm:justify-end">
          {outOfStockCount > 0 && (
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-red-600">{outOfStockCount}</div>
              <div className="text-xs text-red-600">Out of Stock</div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-orange-600">{expiredCount}</div>
              <div className="text-xs text-orange-600">Expired</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-sm sm:text-base font-bold text-green-600">{totalItems - outOfStockCount}</div>
            <div className="text-xs text-green-600">Available</div>
          </div>
        </div>
      </div>

      {/* Items grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item, index) => (
          <StockCard 
            key={item._id || index} 
            item={item} 
            labColor={labColor}
          />
        ))}
      </div>
    </div>
  );
};

// Table View Component
const TableView = ({ groupedStock, labColorMap, searchTerm }) => {
  const allItems = Object.entries(groupedStock).reduce((acc, [labId, items]) => {
    return acc.concat(items.map(item => ({ ...item, labId })));
  }, []);

  // Sort items by lab, then by name
  const sortedItems = allItems.sort((a, b) => {
    if (a.labId === b.labId) {
      return (a.name || '').localeCompare(b.name || '');
    }
    return getLabDisplayName(a.labId).localeCompare(getLabDisplayName(b.labId));
  });

  const getStatusBadge = (item) => {
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const isNearExpiry = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (isExpired) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
    }
    if (!isExpired && isNearExpiry) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Near Expiry</span>;
    }
    if (item.quantity === 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Out of Stock</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Available</span>;
  };

  const getQuantityColor = (quantity) => {
    if (quantity === 0) return 'text-red-600';
    if (quantity < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200/50">
          <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                Lab & Item
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                Quantity
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                Details
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                Expiry Date
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider whitespace-nowrap">
                QR Code
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100/50 bg-white/30">
            {sortedItems.map((item, index) => (
              <tr key={item._id || index} className="hover:bg-blue-50/50 transition-colors duration-200">
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: labColorMap[item.labId] }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{item.name}</div>
                      <div className="text-xs text-blue-600 truncate">{getLabDisplayName(item.labId)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className={`text-xs sm:text-sm font-bold ${getQuantityColor(item.quantity)}`}>
                    {item.quantity} {item.unit || ''}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {item.variant && (
                      <div className="mb-1">
                        <span className="text-gray-600">Variant:</span> 
                        <span className="ml-1 truncate block sm:inline max-w-[80px] sm:max-w-none">{item.variant}</span>
                      </div>
                    )}
                    {item.batchId && (
                      <div>
                        <span className="text-gray-600">Batch:</span> 
                        <span className="ml-1 font-mono text-xs bg-blue-100 text-blue-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded block sm:inline mt-1 sm:mt-0 max-w-[80px] sm:max-w-none truncate">
                          {item.batchId}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                  {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  {getStatusBadge(item)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                  {item.qrCodeImage ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedItems.length === 0 && (
        <div className="text-center py-12 bg-white/30">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No glassware found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search term or filter.' : 'No glassware stock available.'}
          </p>
        </div>
      )}
    </div>
  );
};

const GlasswareStockPage = () => {
  const [allStock, setAllStock] = useState([]);
  const [groupedStock, setGroupedStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const navigate = useNavigate();

  const labList = [
    { id: 'all', name: 'All Labs' },
    { id: 'central-store', name: 'Central Lab' },
    { id: 'LAB01', name: 'Lab 01' },
    { id: 'LAB02', name: 'Lab 02' },
    { id: 'LAB03', name: 'Lab 03' },
    { id: 'LAB04', name: 'Lab 04' },
    { id: 'LAB05', name: 'Lab 05' },
    { id: 'LAB06', name: 'Lab 06' },
    { id: 'LAB07', name: 'Lab 07' },
    { id: 'LAB08', name: 'Lab 08' }
  ];

  useEffect(() => {
    const fetchAllStock = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllGlasswareStock();
        console.log('Fetched glassware stock:', data);
        setAllStock(data);
        
        // Group by lab
        const grouped = data.reduce((acc, item) => {
          const labId = item.labId || 'unknown';
          if (!acc[labId]) {
            acc[labId] = [];
          }
          acc[labId].push(item);
          return acc;
        }, {});
        
        // Sort each lab's items by name
        Object.keys(grouped).forEach(labId => {
          grouped[labId].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        
        setGroupedStock(grouped);
      } catch (err) {
        console.error('Failed to fetch glassware stock:', err);
        setError('Failed to fetch glassware stock. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllStock();
  }, []);

  // Filter based on search term and selected lab
  const filteredGroupedStock = React.useMemo(() => {
    let filtered = { ...groupedStock };
    
    // Filter by lab
    if (selectedLab !== 'all') {
      filtered = { [selectedLab]: filtered[selectedLab] || [] };
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(labId => {
        filtered[labId] = filtered[labId].filter(item =>
          (item.name || '').toLowerCase().includes(lowerSearchTerm) ||
          (item.variant || '').toLowerCase().includes(lowerSearchTerm) ||
          (item.batchId || '').toLowerCase().includes(lowerSearchTerm)
        );
      });
    }
    
    return filtered;
  }, [groupedStock, searchTerm, selectedLab]);

  const handlePrintQRCodes = () => {
    window.print();
  };

  const labColors = generateLabColors(Object.keys(groupedStock));
  const labColorMap = Object.keys(groupedStock).reduce((acc, labId, index) => {
    acc[labId] = labColors[index];
    return acc;
  }, {});

  // Calculate totals
  const totalItems = allStock.length;
  const totalQuantity = allStock.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalLabs = Object.keys(groupedStock).length;

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <GlobalPrintStyles />
      
      {/* Background floating bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-200/20 rounded-full blur-lg bubble-float-1"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-indigo-200/15 rounded-full blur-md bubble-float-2"></div>
        <div className="absolute top-60 left-1/4 w-20 h-20 bg-cyan-200/10 rounded-full blur-xl bubble-float-3"></div>
        <div className="absolute top-80 right-1/3 w-14 h-14 bg-purple-200/15 rounded-full blur-lg bubble-float-4"></div>
        <div className="absolute bottom-40 left-1/3 w-18 h-18 bg-blue-300/10 rounded-full blur-md bubble-float-1"></div>
        <div className="absolute bottom-60 right-10 w-16 h-16 bg-indigo-300/12 rounded-full blur-lg bubble-float-2"></div>
        <div className="absolute top-1/2 left-5 w-10 h-10 bg-cyan-300/8 rounded-full blur-sm bubble-float-3"></div>
        <div className="absolute top-1/3 right-5 w-8 h-8 bg-purple-300/10 rounded-full blur-sm bubble-float-4"></div>
      </div>
      
      <div className="w-full max-w-none mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      
      {/* Breadcrumb Navigation */}
      <div className="relative z-10 w-full bg-white/70 backdrop-blur-sm border-b border-gray-200/30">
        <div className="w-full px-4 py-2">
          <nav className="flex items-center space-x-1.5 text-xs">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-gray-500">Admin Dashboard</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-600 font-medium">Glassware Stock Management</span>
          </nav>
        </div>
      </div>

      {/* Enhanced Header Section - Mobile Responsive */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-2 sm:p-4 lg:p-6 text-white overflow-hidden rounded-t-3xl shadow-lg">
        <div className="absolute inset-0 bg-blue-800/20"></div>
        <div className="relative z-10">
          {/* Title and Controls Section */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 xl:gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <div className="p-1.5 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1">
                  Glassware Stock Management
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm opacity-90">
                  <span className="block sm:inline">{totalItems} items across {totalLabs} labs</span>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline">Total quantity: {totalQuantity} pieces</span>
                </p>
              </div>
            </div>
            
            {/* Controls Section - Mobile Responsive Layout */}
            <div className="flex flex-col gap-2 min-w-0 xl:min-w-max xl:flex-row xl:gap-4">
              {/* First line on small screens: View Mode, Lab Filter, Print QR */}
              <div className="flex gap-2 sm:gap-3 xl:contents">
                {/* View Mode Toggle */}
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded border border-white/30 min-w-0">
                  <div className="text-xs text-blue-100 mb-1 font-medium">View</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 flex-1 justify-center ${
                        viewMode === 'cards'
                          ? 'bg-white/30 text-white shadow-lg'
                          : 'text-blue-100 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 flex-1 justify-center ${
                        viewMode === 'table'
                          ? 'bg-white/30 text-white shadow-lg'
                          : 'text-blue-100 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>
                </div>
                
                {/* Lab Filter */}
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded border border-white/30 min-w-0 flex-1 xl:flex-initial">
                  <div className="text-xs text-blue-100 mb-1 font-medium">Lab</div>
                  <select 
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="px-2 py-1 w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/50 text-xs min-w-20 xl:min-w-28"
                  >
                    {labList.map(lab => (
                      <option key={lab.id} value={lab.id} className="bg-blue-800 text-white">
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Print Button */}
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded border border-white/30">
                  <div className="text-xs text-blue-100 mb-1 font-medium">Actions</div>
                  <button
                    onClick={handlePrintQRCodes}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 rounded transition-all duration-200 transform hover:scale-105 shadow hover:shadow-lg flex items-center justify-center gap-1 text-xs whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Print QR</span>
                  </button>
                </div>
              </div>
              
              {/* Second line on small screens: Search | Inline on XL screens */}
              <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded border border-white/30 flex-1 xl:w-56 xl:flex-none">
                <div className="text-xs text-blue-100 mb-1 font-medium">Search</div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search glassware..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-6 pr-3 py-1 w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded text-white placeholder-blue-100 focus:outline-none focus:ring-1 focus:ring-white/50 focus:border-white/50 text-xs"
                  />
                  <svg className="w-3 h-3 text-blue-100 absolute left-2 top-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-32 h-32 bg-indigo-300/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Main Content Section - Mobile Responsive */}
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">

      <PrintableQRView groupedStock={filteredGroupedStock} />

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading glassware stock...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg" 
             style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="space-y-8">
          {Object.keys(filteredGroupedStock).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No glassware found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search term or filter.' : 'No glassware stock available in the system.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <TableView 
              groupedStock={filteredGroupedStock}
              labColorMap={labColorMap}
              searchTerm={searchTerm}
            />
          ) : (
            Object.entries(filteredGroupedStock)
              .sort(([a], [b]) => {
                // Sort labs: central-store first, then LAB01-LAB08
                if (a === 'central-store') return -1;
                if (b === 'central-store') return 1;
                return a.localeCompare(b);
              })
              .map(([labId, items]) => (
                <LabSection
                  key={labId}
                  labId={labId}
                  items={items}
                  labColor={labColorMap[labId]}
                />
              ))
          )}
        </div>
      )}
      </div>
      </div>
      </div>
  );
};

export default GlasswareStockPage;
