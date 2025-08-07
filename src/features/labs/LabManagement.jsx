import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SafeButton from '../../components/SafeButton';
import Swal from 'sweetalert2';

const LabManagement = () => {
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [formData, setFormData] = useState({
    labId: '',
    labName: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Load labs
  const loadLabs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://backend-pharmacy-5541.onrender.com/api/labs?includeInactive=${includeInactive}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to load labs');

      const data = await response.json();
      setLabs(data.data || []);
    } catch (error) {
      console.error('Error loading labs:', error);
      toast.error('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  // Load lab statistics
  const loadStats = async () => {
    try {
      const response = await fetch('https://backend-pharmacy-5541.onrender.com/api/labs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadLabs();
    loadStats();
  }, [includeInactive]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const method = selectedLab ? 'PUT' : 'POST';
      const url = selectedLab ? `https://backend-pharmacy-5541.onrender.com/api/labs/${selectedLab.labId}` : 'https://backend-pharmacy-5541.onrender.com/api/labs';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFormErrors(data.errors);
        }
        throw new Error(data.message || 'Operation failed');
      }

      toast.success(data.message || `Lab ${selectedLab ? 'updated' : 'created'} successfully`);
      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error saving lab:', error);
      toast.error(error.message);
    }
  };

  // Handle delete
  const handleDelete = async (labId) => {
    try {
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/labs/${labId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete lab');
      }

      toast.success('Lab deleted successfully');
      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error deleting lab:', error);
      toast.error(error.message);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (lab) => {
    try {
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/labs/${lab.labId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !lab.isActive
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update lab status');
      }

      toast.success(`Lab ${lab.isActive ? 'deactivated' : 'activated'} successfully`);
      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error updating lab status:', error);
      toast.error(error.message);
    }
  };

  // Handle bulk sync
  const handleBulkSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('https://backend-pharmacy-5541.onrender.com/api/labs/bulk-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sync failed');
      }

      toast.success(`Sync completed: ${data.data.totalSynced} documents updated`);
      loadLabs();

    } catch (error) {
      console.error('Error syncing labs:', error);
      toast.error(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ labId: '', labName: '', description: '' });
    setFormErrors({});
    setSelectedLab(null);
  };

  // Open edit dialog
  const openEditDialog = (lab) => {
    setSelectedLab(lab);
    setFormData({
      labId: lab.labId,
      labName: lab.labName,
      description: lab.description || ''
    });
    setShowEditModal(true);
  };

  // Confirm delete
  const confirmDelete = (lab) => {
    Swal.fire({
      title: 'Delete Lab',
      text: `Are you sure you want to delete "${lab.labName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(lab.labId);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-500 flex justify-center items-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-700 text-sm font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white rounded-lg mt-4 mx-4">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
                Laboratory Management
              </h1>
              <p className="text-gray-500 text-sm font-normal mt-1">
                Manage laboratory spaces and configurations
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span>Show inactive labs</span>
              </label>

              <SafeButton
                onClick={handleBulkSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                {isSyncing ? 'Syncing...' : 'Sync All'}
              </SafeButton>
              
              <SafeButton
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                variant="primary"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Create Lab
              </SafeButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Statistics Cards */}
        {stats && (
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Labs</div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalLabs}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">System Labs</div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.systemLabs}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Custom Labs</div>
                    <div className="text-2xl font-semibold text-gray-900">{stats.customLabs}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5 12,2"/>
                      <line x1="12" y1="22" x2="12" y2="15.5"/>
                      <polyline points="22,8.5 12,15.5 2,8.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Items</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.labStats?.reduce((sum, lab) => sum + lab.inventory.total, 0) || 0}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Labs Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 bg-slate-50">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Laboratory Spaces
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inventory</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab, index) => {
                  const labStat = stats?.labStats?.find(s => s.labId === lab.labId);
                  return (
                    <tr 
                      key={lab.labId} 
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 text-sm font-mono font-medium text-gray-900 bg-slate-100 rounded-md">
                        {lab.labId}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {lab.labName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {lab.description || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          lab.isSystem 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-slate-100 text-gray-700 border border-gray-200'
                        }`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {lab.isSystem ? (
                              <>
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                              </>
                            ) : (
                              <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5 12,2"/>
                            )}
                          </svg>
                          {lab.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          lab.isActive 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-slate-100 text-gray-500 border border-gray-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${lab.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                          {lab.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {labStat ? (
                          <div>
                            <div className="font-medium mb-0.5">
                              Total: {labStat.inventory.total}
                            </div>
                            <div className="text-xs text-gray-500">
                              C:{labStat.inventory.chemicals} E:{labStat.inventory.equipment} G:{labStat.inventory.glassware} O:{labStat.inventory.others}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <SafeButton
                            onClick={() => openEditDialog(lab)}
                            variant="outline"
                            size="xs"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </SafeButton>
                          
                          {!lab.isSystem && (
                            <SafeButton
                              onClick={() => handleToggleActive(lab)}
                              variant="outline"
                              size="xs"
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {lab.isActive ? (
                                  <rect x="6" y="4" width="4" height="16"/>
                                ) : (
                                  <polygon points="5,3 19,12 5,21 5,3"/>
                                )}
                              </svg>
                              {lab.isActive ? 'Pause' : 'Activate'}
                            </SafeButton>
                          )}

                          {!lab.isSystem && (
                            <SafeButton
                              onClick={() => confirmDelete(lab)}
                              variant="outline"
                              size="xs"
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 rounded-md bg-white text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Delete
                            </SafeButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {labs.length === 0 && (
              <div className="p-12 text-center text-gray-500 text-sm">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
                <div className="font-medium mb-1">No labs found</div>
                <div>Create your first laboratory to get started</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Create New Laboratory
              </h2>
              <p className="text-gray-500 text-sm">
                Set up a new laboratory space
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lab ID
                </label>
                <input
                  type="text"
                  value={formData.labId}
                  onChange={(e) => setFormData(prev => ({ ...prev, labId: e.target.value }))}
                  placeholder="e.g., LAB09, RESEARCH_LAB"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.labId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.labId && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.labId}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lab Name
                </label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={(e) => setFormData(prev => ({ ...prev, labName: e.target.value }))}
                  placeholder="e.g., Advanced Physics Laboratory"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.labName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.labName && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.labName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the laboratory"
                  rows={3}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-vertical min-h-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.description}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <SafeButton
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </SafeButton>
                <SafeButton
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                >
                  Create Laboratory
                </SafeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Edit Laboratory
              </h2>
              <p className="text-gray-500 text-sm">
                Update laboratory information
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lab ID
                </label>
                <input
                  type="text"
                  value={formData.labId}
                  disabled={selectedLab?.isSystem}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors duration-200 ${
                    selectedLab?.isSystem 
                      ? 'bg-gray-50 cursor-not-allowed opacity-70 border-gray-300' 
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {selectedLab?.isSystem && (
                  <div className="text-xs text-gray-500 mt-1">
                    System lab IDs cannot be modified
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lab Name
                </label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={(e) => setFormData(prev => ({ ...prev, labName: e.target.value }))}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.labName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.labName && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.labName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-vertical min-h-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <div className="text-xs text-red-500 mt-1">
                    {formErrors.description}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <SafeButton
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </SafeButton>
                <SafeButton
                  type="submit"
                  variant="primary"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                >
                  Update Laboratory
                </SafeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LabManagement;
