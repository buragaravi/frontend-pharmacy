import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const StockCheckPage = () => {
  const token = localStorage.getItem('token');
  const user = jwtDecode(token);
  const userLabId = user.labId || 'central-store';
  const [labId, setLabId] = useState(userLabId);
  const [equipment, setEquipment] = useState([]);
  const [scanned, setScanned] = useState({}); // { itemId: { status, remarks, lastScanAt, scannedLocation } }
  const [showScanner, setShowScanner] = useState(false);
  const [summary, setSummary] = useState({ present: 0, notScanned: 0, locationMismatched: 0, missing: 0, damaged: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [error, setError] = useState('');

  const labOptions = [
    { label: 'Central Store (All)', value: 'central-store' },
    { label: 'Lab 1', value: 'LAB01' },
    { label: 'Lab 2', value: 'LAB02' },
    { label: 'Lab 3', value: 'LAB03' },
    { label: 'Lab 4', value: 'LAB04' },
    { label: 'Lab 5', value: 'LAB05' },
    { label: 'Lab 6', value: 'LAB06' },
    { label: 'Lab 7', value: 'LAB07' },
    { label: 'Lab 8', value: 'LAB08' },
  ];

  useEffect(() => {
    setError('');
    if (!labId || labId === 'central-store') {
      // Fetch all labs LAB01-LAB08
      Promise.all(labOptions.filter(l => l.value).map(lab =>
        axios.get(`https://backend-pharmacy-5541.onrender.com/api/equipment/stock?labId=${lab.value}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.data)
      ))
        .then(results => {
          // Flatten and deduplicate by itemId
          const all = results.flat();
          const unique = [];
          const seen = new Set();
          for (const item of all) {
            if (!seen.has(item.itemId)) {
              unique.push(item);
              seen.add(item.itemId);
            }
          }
          setEquipment(unique);
        })
        .catch(() => setError('Failed to load equipment for all labs'));
    } else {
      axios.get(`https://backend-pharmacy-5541.onrender.com/api/equipment/stock?labId=${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setEquipment(res.data))
        .catch(() => setError('Failed to load equipment'));
    }
  }, [labId, token]);

  useEffect(() => {
    // Calculate summary
    let present = 0, notScanned = 0, locationMismatched = 0, missing = 0, damaged = 0;
    equipment.forEach(item => {
      const s = scanned[item.itemId];
      if (!s) notScanned++;
      else if (s.status === 'Present') present++;
      else if (s.status === 'Location Mismatched') locationMismatched++;
      else if (s.status === 'Missing') missing++;
      else if (s.status === 'Damaged') damaged++;
    });
    setSummary({ present, notScanned, locationMismatched, missing, damaged });
  }, [scanned, equipment]);

  // handleScan expects the QRScanner to send the raw QR data (string)
  const handleScan = (qrData) => {
    setShowScanner(false);
    try {
      // Try to parse as JSON, fallback to raw string as itemId
      let itemId = '';
      try {
        const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        itemId = parsed.itemId || qrData;
      } catch {
        itemId = qrData;
      }
      const item = equipment.find(e => e.itemId === itemId);
      if (!item) return setError('Scanned item not in this lab list');
      setScanned(prev => ({
        ...prev,
        [item.itemId]: {
          ...prev[item.itemId],
          status: 'Present',
          lastScanAt: new Date().toISOString(),
        },
      }));
      // SweetAlert for scanned item
      if (window.Swal) {
        window.Swal.fire({
          icon: 'success',
          title: 'Scanned!',
          text: `Item ID: ${itemId}`,
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        alert(`Scanned Item ID: ${itemId}`);
      }
    } catch {
      setError('Invalid QR code');
    }
  };

  const handleRemarkChange = (itemId, value) => {
    setScanned(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        remarks: value,
      },
    }));
  };

  const handleManualMark = (itemId, status) => {
    setScanned(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
        lastScanAt: new Date().toISOString(),
      },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const items = equipment.map(item => ({
        itemId: item.itemId,
        name: item.name,
        expectedLocation: item.location,
        status: scanned[item.itemId]?.status || 'Not Scanned',
        remarks: scanned[item.itemId]?.remarks || '',
        lastScanAt: scanned[item.itemId]?.lastScanAt || null,
        scannedLocation: scanned[item.itemId]?.scannedLocation || '',
      }));
      const report = {
        performedBy: user._id,
        performedByName: user.name, // <-- include performedByName
        lab: labId,
        items,
        // summary is not required, backend will compute
      };
      await axios.post('https://backend-pharmacy-5541.onrender.com/api/equipment/stock-check/report', report, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportSaved(true);
    } catch {
      setError('Failed to save report');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Monthly Equipment Stock Check</h2>
      <div className="mb-4 flex gap-4 items-center">
        <label>Lab/Location:</label>
        <select value={labId} onChange={e => setLabId(e.target.value)} className="border rounded px-2 py-1">
          {labOptions.map(lab => (
            <option key={lab.value} value={lab.value}>{lab.label}</option>
          ))}
        </select>
        <button onClick={() => setShowScanner(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Start Scan</button>
      </div>
      {showScanner && <EquipmentQRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="border px-2">Item ID</th>
              <th className="border px-2">Name</th>
              <th className="border px-2">Expected Location</th>
              <th className="border px-2">Status</th>
              <th className="border px-2">Remarks</th>
              <th className="border px-2">Last Scan</th>
              <th className="border px-2">Manual Mark</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map(item => (
              <tr key={item.itemId} className={scanned[item.itemId]?.status === 'Present' ? 'bg-green-50' : scanned[item.itemId]?.status === 'Location Mismatched' ? 'bg-yellow-50' : ''}>
                <td className="border px-2">{item.itemId}</td>
                <td className="border px-2">{item.name}</td>
                <td className="border px-2">{item.location}</td>
                <td className="border px-2">{scanned[item.itemId]?.status || 'Not Scanned'}</td>
                <td className="border px-2">
                  <input type="text" value={scanned[item.itemId]?.remarks || ''} onChange={e => handleRemarkChange(item.itemId, e.target.value)} className="border rounded px-1 py-0.5 w-32" />
                </td>
                <td className="border px-2">{scanned[item.itemId]?.lastScanAt ? new Date(scanned[item.itemId].lastScanAt).toLocaleString() : '-'}</td>
                <td className="border px-2">
                  <button onClick={() => handleManualMark(item.itemId, 'Missing')} className="text-xs bg-red-200 px-2 py-1 rounded mr-1">Missing</button>
                  <button onClick={() => handleManualMark(item.itemId, 'Damaged')} className="text-xs bg-yellow-200 px-2 py-1 rounded">Damaged</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="my-4">
        <h3 className="font-semibold">Summary</h3>
        <div>Present: {summary.present} | Not Scanned: {summary.notScanned} | Location Mismatched: {summary.locationMismatched} | Missing: {summary.missing} | Damaged: {summary.damaged}</div>
      </div>
      <button onClick={handleSubmit} disabled={submitting || reportSaved} className="bg-green-600 text-white px-6 py-2 rounded mt-2">Submit Report</button>
      {reportSaved && <div className="text-green-700 font-semibold mt-2">Report saved successfully!</div>}
    </div>
  );
};

export default StockCheckPage;
