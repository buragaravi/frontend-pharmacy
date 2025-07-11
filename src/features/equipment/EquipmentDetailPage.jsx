import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Add custom styles for animations
const customStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-slideInRight {
    animation: slideInRight 0.4s ease-out forwards;
  }
`;

const EquipmentDetailPage = () => {
  const { itemId } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `https://backend-pharmacy-5541.onrender.com/api/equipment/item/${itemId}/full-trace`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setEquipment(res.data.equipment);
        setTransactions(res.data.transactions);
        setAuditLogs(res.data.auditLogs);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch equipment details');
      } finally {
        setLoading(false);
      }
    };
    if (itemId) fetchDetails();
  }, [itemId]);

  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-blue-100 text-blue-700',
      'allocated': 'bg-yellow-100 text-yellow-700',
      'maintenance': 'bg-red-100 text-red-700',
      'out_of_order': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-100/90 p-4 sm:p-6 animate-fadeInUp">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
          <div className="mb-6">
            <Link 
              to="/equipment/dashboard" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 mb-4 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Equipment Dashboard
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100/80 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Equipment Details</h1>
                <p className="text-slate-600 text-sm">Complete information and transaction history</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && <LoadingSkeleton />}

          {/* Error State */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium text-sm">Error Loading Equipment Details</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Details */}
          {equipment && (
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl overflow-hidden mb-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-5 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{equipment.name}</h2>
                    <p className="text-slate-600 text-sm">Item ID: {equipment.itemId}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(equipment.status)}`}>
                    {equipment.status}
                  </span>
                </div>
              </div>

              {/* Equipment Information Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Name</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.name}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Variant</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.variant || '-'}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Location</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.location}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Assigned To</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.assignedTo || '-'}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Vendor</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.vendor || '-'}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Price</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.pricePerUnit ? `₹${equipment.pricePerUnit}` : '-'}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Batch ID</label>
                    <p className="text-sm font-semibold text-slate-800">{equipment.batchId || '-'}</p>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(equipment.status)}`}>
                      {equipment.status}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                {equipment.qrCodeImage && (
                  <div className="mt-6 pt-5 border-t border-white/20">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">QR Code</label>
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 inline-block border border-white/20">
                      <img 
                        src={equipment.qrCodeImage} 
                        alt="Equipment QR Code" 
                        className="w-24 h-24 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Section */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-5 border-b border-white/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">Equipment Transactions</h3>
              </div>
            </div>
            
            <div className="p-6">
              {(!Array.isArray(transactions) || transactions.length === 0) ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 text-sm">No transactions found for this equipment.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Performed By</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">From</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">To</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Remarks</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {transactions.map((tx, idx) => (
                        <tr key={tx._id || idx} className="hover:bg-blue-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {tx.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.performedByRole || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{tx.fromLocation || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{tx.toLocation || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{tx.remarks || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-5 border-b border-white/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">Equipment Audit Log</h3>
              </div>
            </div>
            
            <div className="p-6">
              {(!Array.isArray(auditLogs) || auditLogs.length === 0) ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500 text-sm">No audit logs found for this equipment.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/20">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10 backdrop-blur-sm">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">By</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-white/10">
                      {auditLogs.map((log, idx) => (
                        <tr key={log._id || idx} className="hover:bg-white/30 transition-colors duration-200">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100/80 text-blue-700 backdrop-blur-sm">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-800">{log.performedByRole || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-700">{log.remarks || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EquipmentDetailPage;
