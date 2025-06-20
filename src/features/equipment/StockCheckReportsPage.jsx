import React, { useEffect, useState } from 'react';
// import { getCurrentMonthStockCheckReports } from './equipmentStockCheckApi';

const StockCheckReportsPage = ({ token }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentMonthStockCheckReports(token)
      .then(setReports)
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Monthly Stock Check Reports</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="border px-2">Date</th>
              <th className="border px-2">Lab</th>
              <th className="border px-2">User</th>
              <th className="border px-2">Present</th>
              <th className="border px-2">Not Scanned</th>
              <th className="border px-2">Location Mismatched</th>
              <th className="border px-2">Missing</th>
              <th className="border px-2">Damaged</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r._id}>
                <td className="border px-2">{new Date(r.performedAt).toLocaleString()}</td>
                <td className="border px-2">{r.lab}</td>
                <td className="border px-2">{r.performedByName}</td>
                <td className="border px-2">{r.summary?.present || 0}</td>
                <td className="border px-2">{r.summary?.notScanned || 0}</td>
                <td className="border px-2">{r.summary?.locationMismatched || 0}</td>
                <td className="border px-2">{r.summary?.missing || 0}</td>
                <td className="border px-2">{r.summary?.damaged || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockCheckReportsPage;
