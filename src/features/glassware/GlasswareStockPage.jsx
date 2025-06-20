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
    'central-lab': 'Central Lab',
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
    <div className="glass-card bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover-scale transition-all duration-300">
      {/* Header with status indicator */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: labColor }}
          />
          <h3 className="text-lg font-semibold text-gray-800 truncate flex-1">
            {item.name}
          </h3>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-col gap-1">
          {isExpired && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              Expired
            </span>
          )}
          {!isExpired && isNearExpiry && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
              Near Expiry
            </span>
          )}
          {item.quantity === 0 && (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-3">
        {/* Quantity */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Quantity:</span>
          <span className={`text-lg font-bold ${
            item.quantity === 0 ? 'text-red-600' : 
            item.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {item.quantity} {item.unit || ''}
          </span>
        </div>

        {/* Variant */}
        {item.variant && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Variant:</span>
            <span className="text-sm font-medium text-gray-800">{item.variant}</span>
          </div>
        )}

        {/* Batch ID */}
        {item.batchId && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Batch:</span>
            <span className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
              {item.batchId}
            </span>
          </div>
        )}

        {/* Expiry Date */}
        {item.expiryDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expires:</span>
            <span className={`text-sm font-medium ${
              isExpired ? 'text-red-600' : isNearExpiry ? 'text-yellow-600' : 'text-gray-800'
            }`}>
              {new Date(item.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* QR Code indicator */}
        {item.qrCodeImage && (
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
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
    <div className="mb-8">
      {/* Lab header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <div 
            className="w-6 h-6 rounded-full shadow-md"
            style={{ backgroundColor: labColor }}
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{labName}</h2>
            <p className="text-sm text-gray-600">{totalItems} items • Total: {totalQuantity} pieces</p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex gap-4">
          {outOfStockCount > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{outOfStockCount}</div>
              <div className="text-xs text-red-600">Out of Stock</div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{expiredCount}</div>
              <div className="text-xs text-orange-600">Expired</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{totalItems - outOfStockCount}</div>
            <div className="text-xs text-green-600">Available</div>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

const GlasswareStockPage = () => {
  const [allStock, setAllStock] = useState([]);
  const [groupedStock, setGroupedStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState('all');
  const navigate = useNavigate();

  const labList = [
    { id: 'all', name: 'All Labs' },
    { id: 'central-lab', name: 'Central Lab' },
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
    <div className="p-6 bg-gradient-to-br from-white to-green-50 min-h-screen"
         style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <GlobalPrintStyles />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="flex items-center gap-4" style={{ animation: 'slideIn 0.5s ease-out' }}>
          <div className="p-3 bg-green-100 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Glassware Stock Management
            </h1>
            <p className="text-gray-600 mt-1">
              {totalItems} items across {totalLabs} labs • Total quantity: {totalQuantity} pieces
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
             style={{ animation: 'scaleIn 0.5s ease-out' }}>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search glassware..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-64 bg-white border-2 border-green-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-green-400 hover:border-green-300 transition-colors"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Lab filter */}
          <select 
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-4 py-2.5 bg-white border-2 border-green-200 rounded-lg text-green-800 font-medium focus:outline-none focus:border-green-400 hover:border-green-300 transition-colors min-w-40"
          >
            {labList.map(lab => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </select>
          
          {/* Print button */}
          <button
            onClick={handlePrintQRCodes}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover-scale whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print QR Codes
          </button>
        </div>
      </div>

      <PrintableQRView groupedStock={filteredGroupedStock} />

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p className="text-gray-600">Loading glassware stock...</p>
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
          ) : (
            Object.entries(filteredGroupedStock)
              .sort(([a], [b]) => {
                // Sort labs: central-lab first, then LAB01-LAB08
                if (a === 'central-lab') return -1;
                if (b === 'central-lab') return 1;
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

      {/* Back to top button */}
      {!loading && Object.keys(filteredGroupedStock).length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 hover-scale"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default GlasswareStockPage;
