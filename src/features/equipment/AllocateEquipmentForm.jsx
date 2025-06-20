import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EquipmentQRScanner from './EquipmentQRScanner';

const labOptions = [
  { label: 'Lab 1', value: 'LAB01' },
  { label: 'Lab 2', value: 'LAB02' },
  { label: 'Lab 3', value: 'LAB03' },
  { label: 'Lab 4', value: 'LAB04' },
  { label: 'Lab 5', value: 'LAB05' },
  { label: 'Lab 6', value: 'LAB06' },
  { label: 'Lab 7', value: 'LAB07' },
  { label: 'Lab 8', value: 'LAB08' },
];

const AllocateEquipmentForm = () => {
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
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-[#0B3861] mb-4">Allocate Equipment to Lab (by QR)</h3>
      {message && (
        <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-[#F5F9FD] text-[#0B3861]' : 'bg-red-100 text-red-800'}`}>{message}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0B3861]">Scan or Paste Equipment QR Code</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={qrData}
              onChange={handleQrInput}
              placeholder="Scan or paste QR code data here..."
              className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]"
              required
            />
            <button type="button" onClick={() => setShowScanner(true)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Scan QR</button>
          </div>
        </div>
        {showScanner && (
          <EquipmentQRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
        )}
        {equipmentDetails && (
          <div className="bg-[#F5F9FD] p-4 rounded-xl border border-[#BCE0FD] space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-medium">Item ID:</span> {equipmentDetails.itemId}</div>
              <div><span className="font-medium">Name:</span> {equipmentDetails.name}</div>
              <div><span className="font-medium">Variant:</span> {equipmentDetails.variant}</div>
              <div><span className="font-medium">Status:</span> {equipmentDetails.status}</div>
              <div><span className="font-medium">Location:</span> {equipmentDetails.location}</div>
              <div><span className="font-medium">Assigned To:</span> {equipmentDetails.assignedTo || '-'}</div>
              <div><span className="font-medium">Expiry Date:</span> {equipmentDetails.expiryDate ? new Date(equipmentDetails.expiryDate).toLocaleDateString() : '-'}</div>
              <div><span className="font-medium">Warranty:</span> {equipmentDetails.warranty || '-'}</div>
              <div><span className="font-medium">Maintenance Cycle:</span> {equipmentDetails.maintenanceCycle || '-'}</div>
            </div>
            {equipmentDetails.qrCodeImage && (
              <div className="mt-2"><img src={equipmentDetails.qrCodeImage} alt="QR" style={{ width: 80, height: 80 }} /></div>
            )}
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0B3861]">Select Lab</label>
          <select value={labId} onChange={(e) => setLabId(e.target.value)} className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3861]" required>
            <option value=""> Select Lab</option>
            {labOptions.map((lab) => (
              <option key={lab.value} value={lab.value} className="text-[#0B3861]">{lab.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg font-medium transition-colors ${loading ? 'bg-gray-300 text-gray-600' : 'bg-[#0B3861] text-white hover:bg-[#1E88E5]'}`}>{loading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Allocating...</span>) : ('Allocate Equipment')}</button>
        </div>
      </form>
    </div>
  );
};

export default AllocateEquipmentForm;
