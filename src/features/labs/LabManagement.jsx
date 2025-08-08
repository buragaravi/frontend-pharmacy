import React, { useState, useEffect } from 'react';
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
      Swal.fire({
        icon: 'error',
        title: 'Loading Failed',
        text: 'Failed to load laboratory data. Please check your connection and try again.',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
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

    // Show loading alert
    Swal.fire({
      title: selectedLab ? 'Updating Laboratory...' : 'Creating Laboratory...',
      text: 'Please wait while we process your request',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

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
          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please check the form for errors and try again',
            confirmButtonText: 'Fix Errors',
            confirmButtonColor: '#ef4444',
            background: '#ffffff',
            backdrop: 'rgba(0,0,0,0.4)',
            customClass: {
              popup: 'rounded-2xl shadow-2xl',
              title: 'text-xl font-bold text-red-700',
              content: 'text-gray-600'
            }
          });
          return;
        }
        throw new Error(data.message || 'Operation failed');
      }

      // Success alert
      await Swal.fire({
        icon: 'success',
        title: selectedLab ? 'Laboratory Updated!' : 'Laboratory Created!',
        text: data.message || `Lab ${selectedLab ? 'updated' : 'created'} successfully`,
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });

      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error saving lab:', error);
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: error.message || 'An unexpected error occurred',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }
  };

  // Handle delete
  const handleDelete = async (labId) => {
    // Show loading alert
    Swal.fire({
      title: 'Deleting Laboratory...',
      text: 'Please wait while we remove the laboratory',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

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

      // Success alert
      await Swal.fire({
        icon: 'success',
        title: 'Laboratory Deleted!',
        text: 'The laboratory has been successfully removed from the system',
        confirmButtonText: 'Done',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });

      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error deleting lab:', error);
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: error.message || 'Failed to delete laboratory',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (lab) => {
    const action = lab.isActive ? 'deactivate' : 'activate';
    const actionTitle = lab.isActive ? 'Deactivate Laboratory' : 'Activate Laboratory';
    
    // Confirmation alert
    const result = await Swal.fire({
      title: actionTitle,
      text: `Are you sure you want to ${action} "${lab.labName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: lab.isActive ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      }
    });

    if (!result.isConfirmed) return;

    // Show loading alert
    Swal.fire({
      title: `${actionTitle.split(' ')[0]}ing Laboratory...`,
      text: `Please wait while we ${action} the laboratory`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

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

      // Success alert
      await Swal.fire({
        icon: 'success',
        title: `Laboratory ${lab.isActive ? 'Deactivated' : 'Activated'}!`,
        text: `"${lab.labName}" has been successfully ${lab.isActive ? 'deactivated' : 'activated'}`,
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });

      loadLabs();
      loadStats();

    } catch (error) {
      console.error('Error updating lab status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update laboratory status',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }
  };

  // Handle bulk sync
  const handleBulkSync = async () => {
    // Confirmation alert
    const result = await Swal.fire({
      title: 'Synchronize All Laboratories',
      text: 'This will sync all laboratories with the latest data. This operation may take a few moments.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Sync All',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      }
    });

    if (!result.isConfirmed) return;

    // Show loading alert
    Swal.fire({
      title: 'Synchronizing Laboratories...',
      text: 'Please wait while we sync all laboratory data',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

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

      // Success alert
      await Swal.fire({
        icon: 'success',
        title: 'Synchronization Complete!',
        text: `Sync completed: ${data.data.totalSynced} documents updated`,
        confirmButtonText: 'Perfect!',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });

      loadLabs();

    } catch (error) {
      console.error('Error syncing labs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Synchronization Failed',
        text: error.message || 'Failed to synchronize laboratory data',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
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
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-gray-200 backdrop-blur-lg">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-gray-700 text-lg font-semibold mb-2">Loading Laboratory Data</div>
          <div className="text-gray-500 text-sm">Please wait while we fetch your information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header Section */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Enhanced Title Section */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                  Laboratory Management
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                  Manage laboratory spaces, configurations, and inventory tracking
                </p>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 flex-wrap items-center w-full lg:w-auto">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-700 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span>Show inactive labs</span>
              </label>

              <SafeButton
                onClick={handleBulkSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 px-4 py-3 border-2 border-blue-200 rounded-xl bg-white/80 backdrop-blur-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 ${
                  isSyncing ? 'animate-pulse' : ''
                }`}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={isSyncing ? 'animate-spin' : ''}
                >
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
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Statistics Cards */}
        {stats && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Total Labs</div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalLabs}</div>
                    <div className="text-sm text-green-600 font-medium">All Laboratories</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">System Labs</div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.systemLabs}</div>
                    <div className="text-sm text-blue-600 font-medium">Built-in Labs</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Custom Labs</div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.customLabs}</div>
                    <div className="text-sm text-purple-600 font-medium">User Created</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5 12,2"/>
                      <line x1="12" y1="22" x2="12" y2="15.5"/>
                      <polyline points="22,8.5 12,15.5 2,8.5"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Total Items</div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats.labStats?.reduce((sum, lab) => sum + lab.inventory.total, 0) || 0}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">Inventory Items</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Enhanced Labs Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200">
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              Laboratory Spaces
              <span className="text-sm font-normal text-gray-500">({labs.length} labs)</span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Lab ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Lab Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Inventory</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {labs.map((lab, index) => {
                  const labStat = stats?.labStats?.find(s => s.labId === lab.labId);
                  return (
                    <tr 
                      key={lab.labId} 
                      className="hover:bg-blue-50/50 transition-all duration-300 group"
                    >
                      <td className="px-6 py-5 text-sm font-mono font-bold text-gray-900">
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 rounded-lg border border-blue-200">
                          {lab.labId}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                        {lab.labName}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 max-w-xs">
                        <div className="truncate">{lab.description || '-'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border-2 ${
                          lab.isSystem 
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-300' 
                            : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300'
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
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border-2 ${
                          lab.isActive 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300' 
                            : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border-gray-300'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${lab.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>
                          {lab.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-900">
                        {labStat ? (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="font-bold mb-2 text-gray-900">
                              Total: <span className="text-blue-600">{labStat.inventory.total}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                C: {labStat.inventory.chemicals}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                E: {labStat.inventory.equipment}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                G: {labStat.inventory.glassware}
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                O: {labStat.inventory.others}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2 flex-wrap">
                          <SafeButton
                            onClick={() => openEditDialog(lab)}
                            variant="outline"
                            size="xs"
                            className="flex items-center gap-2 px-3 py-2 text-xs border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
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
                              className={`flex items-center gap-2 px-3 py-2 text-xs border-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                lab.isActive 
                                  ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
                                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300'
                              }`}
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
                              className="flex items-center gap-2 px-3 py-2 text-xs border-2 border-red-200 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-200 transform hover:scale-105"
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
              <tr>
                <td colSpan="7" className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                    <div className="text-xl font-bold text-gray-700 mb-2">No laboratories found</div>
                    <div className="text-gray-500 mb-6 max-w-md text-center">
                      Get started by creating your first laboratory space to manage your inventory and equipment.
                    </div>
                    <SafeButton
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                      }}
                      variant="primary"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Your First Lab
                    </SafeButton>
                  </div>
                </td>
              </tr>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl transform animate-slideUp border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Create New Laboratory
              </h2>
              <p className="text-gray-600">
                Set up a new laboratory space for inventory management
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lab ID *
                </label>
                <input
                  type="text"
                  value={formData.labId}
                  onChange={(e) => setFormData(prev => ({ ...prev, labId: e.target.value }))}
                  placeholder="e.g., LAB09, RESEARCH_LAB"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formErrors.labId ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:bg-blue-50/30'
                  }`}
                />
                {formErrors.labId && (
                  <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.labId}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lab Name *
                </label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={(e) => setFormData(prev => ({ ...prev, labName: e.target.value }))}
                  placeholder="e.g., Advanced Physics Laboratory"
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formErrors.labName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:bg-blue-50/30'
                  }`}
                />
                {formErrors.labName && (
                  <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.labName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the laboratory and its purpose"
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm resize-vertical transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                    formErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:bg-blue-50/30'
                  }`}
                />
                {formErrors.description && (
                  <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {formErrors.description}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-6">
                <SafeButton
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </SafeButton>
                <SafeButton
                  type="submit"
                  variant="primary"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Laboratory
                </SafeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl transform animate-slideUp border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Edit Laboratory
              </h2>
              <p className="text-gray-600">
                Update laboratory information and settings
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Lab ID
                </label>
                <input
                  type="text"
                  value={formData.labId}
                  disabled={selectedLab?.isSystem}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-sm transition-all duration-300 ${
                    selectedLab?.isSystem 
                      ? 'bg-gray-50 cursor-not-allowed opacity-70 border-gray-300' 
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-400'
                  }`}
                />
                {selectedLab?.isSystem && (
                  <div className="text-xs text-amber-600 mt-2 flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                    System lab IDs cannot be modified
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Lab Name
                </label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={(e) => setFormData(prev => ({ ...prev, labName: e.target.value }))}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-400 ${
                    formErrors.labName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                />
                {formErrors.labName && (
                  <div className="text-xs text-red-500 mt-2 flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                    {formErrors.labName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-sm resize-vertical min-h-20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-400 ${
                    formErrors.description ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <div className="text-xs text-red-500 mt-2 flex items-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                    {formErrors.description}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                <SafeButton
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
                >
                  Cancel
                </SafeButton>
                <SafeButton
                  type="submit"
                  variant="primary"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg"
                >
                  Update Laboratory
                </SafeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced CSS Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default LabManagement;
