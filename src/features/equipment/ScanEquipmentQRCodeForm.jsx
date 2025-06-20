import React, { useState } from 'react';
import { scanEquipmentQRCode } from './equipmentApi';

const ScanEquipmentQRCodeForm = () => {
  const [qrCodeData, setQrCodeData] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      const res = await scanEquipmentQRCode(qrCodeData);
      setResult(res);
      setMessage('Scan successful!');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Scan Equipment QR Code</h2>
      <textarea placeholder="Paste QR Code Data (JSON)" value={qrCodeData} onChange={e => setQrCodeData(e.target.value)} className="border p-1 rounded w-full" rows={3} required />
      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Scanning...' : 'Scan'}</button>
      {message && <div className="mt-2 text-blue-700">{message}</div>}
      {result && (
        <div className="mt-4 bg-gray-100 p-2 rounded">
          <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </form>
  );
};

export default ScanEquipmentQRCodeForm;
