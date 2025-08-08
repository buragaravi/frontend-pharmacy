import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EquipmentQRScanner from './EquipmentQRScanner';
import useLabs from '../../hooks/useLabs';

// Glassmorphic theme constants
const THEME = {
  background: 'bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-100/90',
  card: 'bg-white/20 backdrop-blur-xl border border-white/30',
  cardHover: 'hover:bg-white/30 hover:border-white/40',
  text: {
    primary: 'text-slate-700',
    secondary: 'text-slate-600',
    accent: 'text-blue-600',
  },
  button: {
    primary: 'bg-blue-500/80 hover:bg-blue-600/90 text-white backdrop-blur-sm',
    secondary: 'bg-white/20 hover:bg-white/30 text-slate-700 backdrop-blur-sm border border-white/30',
    danger: 'bg-red-500/80 hover:bg-red-600/90 text-white backdrop-blur-sm',
  },
  input: 'bg-white/20 border border-white/30 text-slate-700 placeholder-slate-500 backdrop-blur-sm',
  shadow: 'shadow-xl shadow-blue-500/10',
};

const AllocateEquipmentForm = () => {
  // Fetch labs dynamically
  const { labs, loading: labsLoading } = useLabs();
  const [labId, setLabId] = useState('');
  const [qrData, setQrData] = useState('');
  const [itemId, setItemId] = useState('');
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const token = localStorage.getItem('token');

  // Handler for QR code input (simulate scan or paste)
  const handleQrInput = async (e) => {
    setMessage('');
    setEquipmentDetails(null);
    setItemId('');
    const value = e.target.value;
    setQrData(value);
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!parsed.itemId) throw new Error('QR code missing itemId');
      setItemId(parsed.itemId);
      // Fetch equipment details by itemId
      const res = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/equipment/stock?itemId=${parsed.itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipmentDetails(res.data && Array.isArray(res.data) ? res.data[0] : res.data);
    } catch (err) {
      setMessage('Invalid QR code or item not found');
    }
  };

  // Handler for QR scanner result
  const handleQRScan = (data) => {
    setShowScanner(false);
    setQrData(data);
    // Simulate input event to reuse handleQrInput logic
    handleQrInput({ target: { value: data } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!itemId) return setMessage('Please scan a valid equipment QR code.');
    if (!labId) return setMessage('Please select a lab.');
    setLoading(true);
    try {
      await axios.post(
        'https://backend-pharmacy-5541.onrender.com/api/equipment/allocate/scan',
        { itemId, toLabId: labId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Equipment allocated successfully!');
      setQrData('');
      setItemId('');
      setEquipmentDetails(null);
      setLabId('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Allocation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="w-full max-w-none mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Header Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-blue-800/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">Allocate Equipment to Lab</h1>
                  <p className="text-blue-100 text-lg">Assign equipment from central store to lab units using QR scanner</p>
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

        {/* Breadcrumb Navigation */}
        <div className="relative z-10 px-8 py-4 bg-white/40 backdrop-blur-sm border-b border-white/20">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Dashboard
            </a>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <a href="/equipment" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Equipment Management
            </a>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-600 font-medium">Allocate Equipment</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('success') 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 mr-2 ${
                  message.includes('success') ? 'text-green-500' : 'text-red-500'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {message.includes('success') ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {message}
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan or Paste Equipment QR Code</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={qrData}
                  onChange={handleQrInput}
                  placeholder="Scan or paste QR code data here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR
                </button>
              </div>
            </div>

            {showScanner && (
              <EquipmentQRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
            )}

            {equipmentDetails && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Equipment Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Item ID:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.itemId}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Name:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.name}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Variant:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.variant}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Status:</span>
                    <span className={`font-medium ${
                      equipmentDetails.status === 'available' ? 'text-green-600' : 
                      equipmentDetails.status === 'allocated' ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>{equipmentDetails.status}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Location:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.location}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Assigned To:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.assignedTo || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Expiry Date:</span>
                    <span className="font-medium text-gray-900">
                      {equipmentDetails.expiryDate ? new Date(equipmentDetails.expiryDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Warranty:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.warranty || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-600 text-sm block">Maintenance Cycle:</span>
                    <span className="font-medium text-gray-900">{equipmentDetails.maintenanceCycle || '-'}</span>
                  </div>
                </div>
                {equipmentDetails.qrCodeImage && (
                  <div className="mt-4 flex justify-center">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <img src={equipmentDetails.qrCodeImage} alt="QR Code" className="w-20 h-20" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Destination Lab</label>
              <select
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">{labsLoading ? 'Loading labs...' : 'Select Lab'}</option>
                {labs.map((lab) => (
                  <option key={lab.labId} value={lab.labId}>
                    {lab.labId} - {lab.labName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Allocating...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Allocate Equipment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AllocateEquipmentForm;
