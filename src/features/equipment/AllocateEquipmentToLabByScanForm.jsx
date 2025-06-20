import React, { useState } from 'react';
import { allocateEquipmentToLabByScan } from './equipmentApi';
import EquipmentQRScanner from './EquipmentQRScanner';

const AllocateEquipmentToLabByScanForm = () => {
  const [itemId, setItemId] = useState('');
  const [toLabId, setToLabId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId || !toLabId) {
      setMessage('Please provide both Equipment ID and Lab ID');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const res = await allocateEquipmentToLabByScan({ itemId, toLabId });
      setMessage(res.message || 'Equipment allocated successfully!');
      setItemId('');
      setToLabId('');
      setScannedData(null);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Allocation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (qrData) => {
    // Accepts either a plain itemId or a JSON string with itemId
    let scannedId = '';
    if (typeof qrData === 'string') {
      // If it's a valid UUID or itemId, use directly
      if (/^[\w-]{10,}$/.test(qrData)) {
        scannedId = qrData;
      } else {
        // Try to parse as JSON and extract itemId
        try {
          const parsed = JSON.parse(qrData);
          if (parsed && typeof parsed === 'object' && parsed.itemId) {
            scannedId = parsed.itemId;
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
    setItemId(scannedId);
    setScannerOpen(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-soft-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Allocate Equipment to Lab</h2>
          <p className="text-gray-500 mt-1">Scan or enter equipment details</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
              Equipment ID
            </label>
            <div className="flex gap-2">
              <input
                id="itemId"
                type="text"
                placeholder="Scan QR or enter ID manually"
                value={itemId}
                onChange={e => setItemId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                required
                readOnly={!!scannedData} // Make read-only if scanned
              />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="ml-2">Scan</span>
              </button>
            </div>
          </div>
          
          {scannedData && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-800">Scanned Equipment Details</h3>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{scannedData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Variant:</span>
                  <span className="ml-2 font-medium">{scannedData.variant}</span>
                </div>
                <div>
                  <span className="text-gray-600">Batch:</span>
                  <span className="ml-2 font-medium">{scannedData.batchId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Added:</span>
                  <span className="ml-2 font-medium">
                    {new Date(scannedData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="toLabId" className="block text-sm font-medium text-gray-700 mb-1">
              Destination Lab ID
            </label>
            <input
              id="toLabId"
              type="text"
              placeholder="e.g. LAB01"
              value={toLabId}
              onChange={e => setToLabId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-sm transition-all transform hover:scale-[1.01] ${loading ? 'opacity-80' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Allocating...
            </span>
          ) : 'Allocate Equipment'}
        </button>
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.toLowerCase().includes('fail') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}
      </form>
      
      {scannerOpen && (
        <EquipmentQRScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
};

export default AllocateEquipmentToLabByScanForm;