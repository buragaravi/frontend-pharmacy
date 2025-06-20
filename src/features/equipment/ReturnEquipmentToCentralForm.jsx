import React, { useState } from 'react';
import { returnEquipmentToCentral } from './equipmentApi';
import EquipmentQRScanner from './EquipmentQRScanner';

// Animation styles
const AnimationStyles = () => (
  <style>
    {`
      @keyframes slideInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      .slide-in-up {
        animation: slideInUp 0.5s ease-out forwards;
      }

      .fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }

      .shake {
        animation: shake 0.5s ease-in-out;
      }

      .pulse {
        animation: pulse 2s infinite;
      }

      .hover-scale {
        transition: all 0.2s ease-in-out;
      }

      .hover-scale:hover {
        transform: scale(1.02);
      }

      .hover-lift {
        transition: all 0.2s ease;
      }

      .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .success-message {
        animation: slideInUp 0.5s ease-out forwards;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      }

      .error-message {
        animation: slideInUp 0.5s ease-out forwards;
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      }
    `}
  </style>
);

const ReturnEquipmentToCentralForm = () => {
  const [itemId, setItemId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [shake, setShake] = useState(false);

  const handleScan = (qrData) => {
    let scannedId = '';
    try {
      const parsed = JSON.parse(qrData);
      scannedId = parsed.itemId || parsed.id || '';
    } catch (e) {
      const match = qrData.match(/itemId\s*[:=]\s*([\w-]+)/i);
      if (match) scannedId = match[1];
      else scannedId = qrData;
    }
    setItemId(scannedId);
    setScannerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await returnEquipmentToCentral(itemId);
      setMessage(res.message || 'Equipment successfully returned to central!');
      setMessageType('success');
      setItemId('');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to return equipment');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <AnimationStyles />
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6 p-6 bg-white rounded-xl shadow-lg border border-blue-100 slide-in-up hover-lift"
        style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg 
              className="w-6 h-6 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Return Equipment to Central
          </h2>
        </div>

        <div className={`flex gap-3 ${shake ? 'shake' : ''}`}>
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Enter Equipment ID or scan QR" 
              value={itemId} 
              onChange={e => setItemId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              required 
            />
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 hover-scale"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 0h2m-6 0h-2M4 12h14M4 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z" 
              />
            </svg>
            Scan QR
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover-scale 
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg'
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Return Equipment
              </>
            )}
          </span>
        </button>

        {message && (
          <div
            className={`p-4 rounded-lg text-white font-medium flex items-center gap-2 fade-in
              ${messageType === 'success' ? 'success-message' : 'error-message'}`}
          >
            {messageType === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message}
          </div>
        )}
      </form>

      {scannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-xl p-4 max-w-lg w-full slide-in-up">
            <EquipmentQRScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnEquipmentToCentralForm;
