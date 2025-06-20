import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EquipmentQRScanner from './EquipmentQRScanner';

const EquipmentQRScanPage = () => {
  const [scannerOpen, setScannerOpen] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle the extracted itemId from scanner
  const handleScan = (itemId) => {
    if (!itemId) {
      setError('Invalid equipment ID');
      return;
    }
    
    setLoading(true);
    setError('');
  
    // Navigate directly to equipment page
    navigate(`/equipment/item/${itemId}`);
    setScannerOpen(false);
  };

 

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Scan Equipment QR Code</h2>
        <p className="text-gray-600 mb-6 text-center">
          Scan using your camera or upload a QR image to view equipment details.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg w-full text-center">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading equipment...</span>
          </div>
        )}

        {scannerOpen && (
          <EquipmentQRScanner
            onScan={handleScan}
            onError={setError}
            onClose={() => setScannerOpen(false)}
          />
        )}

        {!scannerOpen && (
          <button
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            onClick={() => {
              setError('');
              setScannerOpen(true);
            }}
          >
            Scan Another QR Code
          </button>
        )}
      </div>
    </div>
  );
};

export default EquipmentQRScanPage;