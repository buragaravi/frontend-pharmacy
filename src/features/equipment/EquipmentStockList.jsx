import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipmentStock } from './equipmentApi';

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
              color: #1e40af;
            }
            .qr-id {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 6px;
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
      {items.map(item => item.qrCodeImage && (
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

const EquipmentStockList = () => {
  const [selectedLab, setSelectedLab] = useState('central-lab');
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const labList = [
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
    const fetchStock = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getEquipmentStock(selectedLab);
        setStock(data);
      } catch (err) {
        setError('Failed to fetch equipment stock. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [selectedLab]);

  const handlePrintQRCodes = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100" 
         style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <GlobalPrintStyles />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 tracking-tight flex items-center gap-3"
            style={{ animation: 'slideIn 0.5s ease-out' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          Equipment Stock
        </h2>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-800 font-medium focus:outline-none focus:border-blue-400 hover:border-blue-300 transition-colors"
            style={{ animation: 'scaleIn 0.5s ease-out' }}
          >
            {labList.map(lab => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={handlePrintQRCodes}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover-scale"
            style={{ animation: 'scaleIn 0.5s ease-out' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print QR Codes
          </button>
        </div>
      </div>

      <PrintableQRView items={stock} />

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      <div className="overflow-hidden rounded-xl shadow-sm border border-blue-100 bg-white"
           style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div className="overflow-x-auto" style={{ '@media print': { display: 'none' } }}>
          <table className="min-w-full text-sm divide-y divide-blue-100">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-4 py-3 text-left text-blue-900">Item ID</th>
                <th className="px-4 py-3 text-left text-blue-900">Name</th>
                <th className="px-4 py-3 text-left text-blue-900">Variant</th>
                <th className="px-4 py-3 text-left text-blue-900">Status</th>
                <th className="px-4 py-3 text-left text-blue-900">Location</th>
                <th className="px-4 py-3 text-left text-blue-900">Assigned To</th>
                <th className="px-4 py-3 text-left text-blue-900">Expiry Date</th>
                <th className="px-4 py-3 text-left text-blue-900">Warranty</th>
                <th className="px-4 py-3 text-left text-blue-900">Maintenance Cycle</th>
                <th className="px-4 py-3 text-left text-blue-900">QR</th>
                <th className="px-4 py-3 text-left text-blue-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {stock && stock.length > 0 ? stock.map((item, index) => (
                <tr 
                  key={item.itemId}
                  className="hover:bg-blue-50/50 transition-colors"
                  style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s` }}
                >
                  <td className="px-4 py-3">{item.itemId}</td>
                  <td className="px-4 py-3 font-medium text-blue-900">{item.name}</td>
                  <td className="px-4 py-3">{item.variant || '-'}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.location}</td>
                  <td className="px-4 py-3">{item.assignedTo || '-'}</td>
                  <td className="px-4 py-3">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">{item.warranty || '-'}</td>
                  <td className="px-4 py-3">{item.maintenanceCycle || '-'}</td>
                  <td className="px-4 py-3">
                    {item.qrCodeImage && (
                      <div className="hover-scale">
                        <img 
                          src={item.qrCodeImage} 
                          alt={`QR code for ${item.name}`}
                          className="w-12 h-12 rounded-lg border border-blue-100 p-1" 
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all duration-300 hover:shadow-md hover-scale"
                      onClick={() => navigate(`/equipment/item/${item.itemId}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No equipment found in {labList.find(lab => lab.id === selectedLab)?.name || selectedLab}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentStockList;
