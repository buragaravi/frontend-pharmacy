  import React, { useState, useEffect } from 'react';
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import axios from 'axios';
  import { toast } from 'react-toastify';
  import { format } from 'date-fns';
  import Swal from 'sweetalert2';
  import { useResponsiveColors } from '../../hooks/useResponsiveColors';
  import SafeButton from '../../components/SafeButton';

  // Create axios instance with default config
  const api = axios.create({
    baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
    retries: 3, // Add retries
  });

  // Add request interceptor to add token to all requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      
      // If the error is due to token expiration
      if (response?.status === 401) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If server error and retries available
      if (response?.status === 500 && config.retries > 0) {
        config.retries -= 1;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(api(config));
          }, 1000); // Retry after 1 second
        });
      }

      return Promise.reject(error);
    }
  );

  // SVG Icons
  const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const UserManagement = () => {
    const { getSafeBackground, getSafeBackdrop, deviceInfo } = useResponsiveColors();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [addUserFormData, setAddUserFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      labId: '',
      labAssignments: [],
    });
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: '',
      labId: '',
      labAssignments: [],
    });

    // Lab assignment management state
    const [selectedLabs, setSelectedLabs] = useState([]);
    const [editingLabAssignments, setEditingLabAssignments] = useState([]);

    // Dynamic labs state
    const [availableLabs, setAvailableLabs] = useState([]);
    const [labsLoading, setLabsLoading] = useState(true);

    // Fetch available labs
    useEffect(() => {
      const fetchLabs = async () => {
        try {
          setLabsLoading(true);
          const response = await api.get('/labs/assignable');
          const labs = response.data?.data || [];
          setAvailableLabs(labs);
        } catch (error) {
          console.error('Error fetching assignable labs:', error);
          // Fallback to regular labs excluding central-store
          try {
            const fallbackResponse = await api.get('/labs?includeInactive=false');
            const allLabs = fallbackResponse.data?.data || [];
            const assignableLabs = allLabs.filter(lab => lab.labId !== 'central-store');
            setAvailableLabs(assignableLabs);
          } catch (fallbackError) {
            console.error('Error fetching fallback labs:', fallbackError);
            setAvailableLabs([]);
          }
        } finally {
          setLabsLoading(false);
        }
      };

      fetchLabs();
    }, []);

    // Add user mutation
    const addUserMutation = useMutation({
      mutationFn: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        Swal.fire({
          icon: 'success',
          title: 'User Added Successfully!',
          text: 'The new user has been created and can now login.',
          confirmButtonColor: '#2563eb',
          timer: 3000
        });
        setIsAddUserModalOpen(false);
        setAddUserFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          labId: '',
          labAssignments: [],
        });
        setSelectedLabs([]);
      },
      onError: (error) => {
        console.error('Frontend - User registration error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          fullError: error
        });
        
        Swal.fire({
          icon: 'error',
          title: 'Failed to Add User',
          text: error.response?.data?.message || error.response?.data?.msg || 'An error occurred while adding the user.',
          confirmButtonColor: '#ef4444',
        });
      },
    });

    // Fetch users
    const { data: users, isLoading, error } = useQuery({
      queryKey: ['users'],
      queryFn: async () => {
        const response = await api.get('/users');
        return response.data;
      },
    });

    // Update user mutation
    const updateUserMutation = useMutation({
      mutationFn: async ({ userId, userData }) => {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User updated successfully');
        setIsEditModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      },
    });

    // Reset password mutation
    const resetPasswordMutation = useMutation({
      mutationFn: async ({ userId, newPassword }) => {
        const response = await api.post(`/users/${userId}/reset-password`, { newPassword });
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Password reset successfully');
        setIsResetPasswordModalOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
      mutationFn: async (userId) => {
        const response = await api.delete(`/users/${userId}`);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('User deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      },
    });

    // Lab assignment mutations
    const addLabAssignmentMutation = useMutation({
      mutationFn: async ({ userId, labAssignment }) => {
        const response = await api.post(`/users/${userId}/lab-assignments`, labAssignment);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Lab assignment added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add lab assignment');
      },
    });

    const updateLabAssignmentMutation = useMutation({
      mutationFn: async ({ userId, labId, labAssignment }) => {
        const response = await api.put(`/users/${userId}/lab-assignments/${labId}`, labAssignment);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Lab assignment updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update lab assignment');
      },
    });

    const removeLabAssignmentMutation = useMutation({
      mutationFn: async ({ userId, labId }) => {
        const response = await api.delete(`/users/${userId}/lab-assignments/${labId}`);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        toast.success('Lab assignment removed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove lab assignment');
      },
    });

    const handleEdit = (user) => {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        labId: user.labId,
        labAssignments: user.labAssignments || [],
      });
      setEditingLabAssignments(user.labAssignments || []);
      setIsEditModalOpen(true);
    };

    // Lab assignment helper functions
    const addLabToAssignments = (assignments, labId, permission = 'read') => {
      const lab = availableLabs.find(l => l.labId === labId);
      if (!lab) return assignments;
      
      const existingIndex = assignments.findIndex(a => a.labId === labId);
      if (existingIndex >= 0) {
        // Update existing assignment
        const updated = [...assignments];
        updated[existingIndex] = { ...updated[existingIndex], permission };
        return updated;
      } else {
        // Add new assignment
        return [...assignments, {
          labId: lab.labId,
          labName: lab.labName,
          permission,
          isActive: true
        }];
      }
    };

    const removeLabFromAssignments = (assignments, labId) => {
      return assignments.filter(a => a.labId !== labId);
    };

    const updateLabPermission = (assignments, labId, permission) => {
      return assignments.map(a => a.labId === labId ? { ...a, permission } : a);
    };

    const handleAddUser = () => {
      setAddUserFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        labId: '',
        labAssignments: [],
      });
      setSelectedLabs([]);
      setIsAddUserModalOpen(true);
    };

    const handleAddUserFormChange = (e) => {
      const { name, value } = e.target;
      setAddUserFormData((prev) => {
        const updated = { ...prev, [name]: value };
        // Reset lab assignments when role changes away from lab_assistant
        if (name === 'role' && value !== 'lab_assistant') {
          updated.labAssignments = [];
          updated.labId = '';
        }
        return updated;
      });
      
      // Reset selected labs when role changes
      if (name === 'role' && value !== 'lab_assistant') {
        setSelectedLabs([]);
      }
    };

    const handleAddUserSubmit = (e) => {
      e.preventDefault();
      
      if (addUserFormData.password !== addUserFormData.confirmPassword) {
        Swal.fire({
          icon: 'error',
          title: 'Password Mismatch',
          text: 'Passwords do not match. Please try again.',
          confirmButtonColor: '#ef4444',
        });
        return;
      }

      if (addUserFormData.password.length < 6) {
        Swal.fire({
          icon: 'error',
          title: 'Password Too Short',
          text: 'Password must be at least 6 characters long.',
          confirmButtonColor: '#ef4444',
        });
        return;
      }

      // Prepare payload based on role
      let payload = {
        name: addUserFormData.name,
        email: addUserFormData.email,
        password: addUserFormData.password,
        role: addUserFormData.role
      };

      // For lab_assistant, use lab assignments if available, otherwise fall back to single labId
      if (addUserFormData.role === 'lab_assistant') {
        if (addUserFormData.labAssignments.length > 0) {
          payload.labAssignments = addUserFormData.labAssignments;
        } else if (addUserFormData.labId) {
          // Fallback for single lab selection
          payload.labId = addUserFormData.labId;
        }
      }

      console.log('Frontend - Sending user registration data:', JSON.stringify(payload, null, 2));
      addUserMutation.mutate(payload);
    };

    const handleResetPassword = (user) => {
      setSelectedUser(user);
      setIsResetPasswordModalOpen(true);
    };

    const handleDelete = async (userId) => {
      setSelectedUser(userId);
      setIsDeleteModalOpen(true);
    };

    const closeModal = () => {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        role: '',
        labId: '',
        labAssignments: [],
      });
      setEditingLabAssignments([]);
    };

    const closeDeleteModal = () => {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    };

    const confirmDelete = () => {
      deleteUserMutation.mutate(selectedUser, {
        onSuccess: () => {
          closeDeleteModal();
        }
      });
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (selectedUser) {
        // Prepare update data
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // For lab assistants, include lab assignments (even if empty)
        if (formData.role === 'lab_assistant') {
          updateData.labAssignments = editingLabAssignments;
          
          // Also include legacy labId as fallback if no lab assignments
          if (editingLabAssignments.length === 0 && formData.labId) {
            updateData.labId = formData.labId;
          }
        } else {
          // For non-lab assistants, include labId if provided (legacy support)
          if (formData.labId) {
            updateData.labId = formData.labId;
          }
        }

        console.log('Updating user with data:', updateData); // Debug log

        updateUserMutation.mutate({
          userId: selectedUser._id,
          userData: updateData,
        });
      }
    };

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
            <p className="mt-4 text-blue-800">Loading users...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-red-300">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-red-600">Error Loading Users</h2>
              </div>
              <p className="text-gray-600 mb-4">{error.message || 'Failed to load users. Please try again.'}</p>
              <button
                onClick={() => queryClient.invalidateQueries(['users'])}
                className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="w-full"
      >
        <div 
          className="w-full max-w-none mx-auto overflow-hidden relative"
        >
          {/* Enhanced Header Section */}
          <div 
            className="relative  p-3 bg-blue-600 rounded-b-3xl text-white overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-900/20"></div>
            <div className="relative z-10">
              <div className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div 
                      className="p-1 md:p-4 rounded-2xl border border-white/30"
                      style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.2)')}
                    >
                      <svg className="w-6 h-6 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl lg:text-2xl font-bold mb-1 md:mb-2">User Management</h1>
                    </div>
                  </div>
                  
                  <SafeButton
                    onClick={handleAddUser} 
                    variant="success"
                    className="w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm md:text-base">Add User</span>
                  </SafeButton>
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

          {/* Content Section */}
          <div className="relative z-10 p-4 md:p-8">
            <div 
              className="rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden"
              style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.8)')}
            >
              
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead 
                    className="text-white"
                    style={getSafeBackground('header', '#1e3a8a')}
                  >
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Lab Access</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody 
                    className="divide-y divide-blue-100"
                    style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.6)')}
                  >
                    {users?.map((user, index) => (
                      <tr key={user._id} className={`transition-colors duration-200 hover:bg-blue-50/70 ${index % 2 === 0 ? 'bg-white/40' : 'bg-blue-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'lab_assistant' ? (
                            user.labAssignments && user.labAssignments.length > 0 ? (
                              <div className="space-y-1">
                                {user.labAssignments.map((assignment, idx) => (
                                  <div key={assignment.labId || idx} className="flex items-center gap-2">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 border border-green-200">
                                      {assignment.labName || assignment.labId}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${
                                      assignment.permission === 'read_write' 
                                        ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                        : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                      {assignment.permission === 'read_write' ? 'Full Access' : 'Read Only'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              user.labId ? (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                                  {user.labId} (Legacy)
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">No lab assigned</span>
                              )
                            )
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.lastLogin ? format(new Date(user.lastLogin), 'PPpp') : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                              disabled={updateUserMutation.isLoading}
                              title="Edit User"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                              disabled={resetPasswordMutation.isLoading}
                              title="Reset Password"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                              disabled={deleteUserMutation.isLoading}
                              title="Delete User"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible only on mobile */}
              <div className="block md:hidden p-4 space-y-4">
                {users?.map((user, index) => (
                  <div 
                    key={user._id} 
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
                  >
                    {/* Card Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-blue-100/30 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      {/* Header with Name and Role */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 min-w-[80px]">Email:</span>
                          <span className="text-sm text-gray-900 break-all">{user.email}</span>
                        </div>
                        
                        {user.role === 'lab_assistant' && (user.labAssignments?.length > 0 || user.labId) && (
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-500">Lab Access:</span>
                            {user.labAssignments && user.labAssignments.length > 0 ? (
                              <div className="space-y-2">
                                {user.labAssignments.map((assignment, idx) => (
                                  <div key={assignment.labId || idx} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                                        {assignment.labName || assignment.labId}
                                      </span>
                                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                                        assignment.permission === 'read_write' 
                                          ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                          : 'bg-blue-100 text-blue-800 border-blue-200'
                                      }`}>
                                        {assignment.permission === 'read_write' ? 'Full Access' : 'Read Only'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : user.labId ? (
                              <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                                {user.labId} (Legacy)
                              </span>
                            ) : null}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 min-w-[80px]">Last Login:</span>
                          <span className="text-sm text-gray-900">
                            {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a') : 'Never'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 pt-4 border-t border-blue-100/50">
                        <button
                          onClick={() => handleEdit(user)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 text-sm font-medium"
                          disabled={updateUserMutation.isLoading}
                        >
                          <EditIcon />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 text-sm font-medium"
                          disabled={resetPasswordMutation.isLoading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 17 21 9z" />
                          </svg>
                          <span>Reset</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 text-sm font-medium"
                          disabled={deleteUserMutation.isLoading}
                        >
                          <DeleteIcon />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty State for Mobile */}
                {users?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-blue-100 rounded-full inline-block mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-500">Get started by adding your first user.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-4xl w-full mx-4 border border-white/20 relative overflow-hidden">
              {/* Modal Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Add New User</h3>
                </div>

                <form onSubmit={handleAddUserSubmit} className="space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={addUserFormData.name}
                          onChange={handleAddUserFormChange}
                          placeholder="Enter full name"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={addUserFormData.email}
                          onChange={handleAddUserFormChange}
                          placeholder="Enter email address"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                        <div className="relative">
                          <select
                            name="role"
                            value={addUserFormData.role}
                            onChange={(e) => {
                              handleAddUserFormChange(e);
                              if (e.target.value !== 'lab_assistant') {
                                setAddUserFormData(prev => ({ ...prev, labId: '' }));
                              }
                            }}
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            required
                          >
                            <option value="">Select role</option>
                            <option value="admin">Admin</option>
                            <option value="central_store_admin">Central Store Admin</option>
                            <option value="lab_assistant">Lab Assistant</option>
                            <option value="faculty">Faculty</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Security & Lab Access */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Security & Access</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={addUserFormData.password}
                          onChange={handleAddUserFormChange}
                          placeholder="Enter password (min 6 characters)"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={addUserFormData.confirmPassword}
                          onChange={handleAddUserFormChange}
                          placeholder="Confirm password"
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lab Assignments Section - Full Width */}
                  {addUserFormData.role === 'lab_assistant' && (
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Lab Assignments</h4>
                      <p className="text-sm text-gray-500 mb-4">Select labs and assign permissions for each lab.</p>
                      
                      {/* Current Lab Assignments */}
                      {addUserFormData.labAssignments.length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Assigned Labs:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {addUserFormData.labAssignments.map((assignment, index) => (
                              <div key={assignment.labId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-green-800">{assignment.labName}</span>
                                  <span className="text-sm text-green-600">({assignment.labId})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={assignment.permission}
                                    onChange={(e) => {
                                      const updatedAssignments = [...addUserFormData.labAssignments];
                                      updatedAssignments[index] = { ...updatedAssignments[index], permission: e.target.value };
                                      setAddUserFormData(prev => ({ ...prev, labAssignments: updatedAssignments }));
                                    }}
                                    className="text-xs px-2 py-1 bg-white border border-green-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="read">Read Only</option>
                                    <option value="read_write">Full Access</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedAssignments = addUserFormData.labAssignments.filter((_, i) => i !== index);
                                      setAddUserFormData(prev => ({ ...prev, labAssignments: updatedAssignments }));
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Remove lab assignment"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add New Lab Assignment */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Add Lab Assignment:</h5>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <select
                              value={selectedLabs[0] || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setSelectedLabs([e.target.value]);
                                }
                              }}
                              className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg text-gray-800 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            >
                              <option value="">Select a lab to add</option>
                              {availableLabs
                                .filter(lab => !addUserFormData.labAssignments.some(a => a.labId === lab.labId))
                                .map((lab) => (
                                  <option key={lab.labId} value={lab.labId}>
                                    {lab.labName} ({lab.labId})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="w-40">
                            <select
                              id="newLabPermission"
                              defaultValue="read"
                              className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg text-gray-800 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            >
                              <option value="read">Read Only</option>
                              <option value="read_write">Full Access</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const selectedLabId = selectedLabs[0];
                              const permissionSelect = document.getElementById('newLabPermission');
                              const permission = permissionSelect?.value || 'read';
                              
                              if (selectedLabId) {
                                const lab = availableLabs.find(l => l.labId === selectedLabId);
                                if (lab && !addUserFormData.labAssignments.some(a => a.labId === selectedLabId)) {
                                  const newAssignment = {
                                    labId: lab.labId,
                                    labName: lab.labName,
                                    permission: permission,
                                    isActive: true
                                  };
                                  setAddUserFormData(prev => ({
                                    ...prev,
                                    labAssignments: [...prev.labAssignments, newAssignment]
                                  }));
                                  setSelectedLabs([]);
                                  // Reset permission selector
                                  if (permissionSelect) permissionSelect.value = 'read';
                                }
                              }
                            }}
                            disabled={!selectedLabs[0] || addUserFormData.labAssignments.some(a => a.labId === selectedLabs[0])}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Fallback to single lab selection if no assignments */}
                      {addUserFormData.labAssignments.length === 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-3">
                            <strong>Fallback:</strong> If no lab assignments are made above, you can select a single lab:
                          </p>
                          <select
                            name="labId"
                            value={addUserFormData.labId}
                            onChange={handleAddUserFormChange}
                            className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-yellow-300/50 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none"
                          >
                            <option value="">Select single lab (fallback)</option>
                            {availableLabs.map((lab) => (
                              <option key={lab.labId} value={lab.labId}>
                                {lab.labName} ({lab.labId})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      disabled={addUserMutation.isLoading}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addUserMutation.isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {addUserMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create User
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-4xl w-full mx-4 border border-white/20 relative overflow-hidden">
              {/* Modal Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <EditIcon />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Edit User</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Right Column - Role & Access */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Role & Access</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={(e) => {
                            handleChange(e);
                            // Reset lab assignments when role changes away from lab_assistant
                            if (e.target.value !== 'lab_assistant') {
                              setFormData(prev => ({ ...prev, labAssignments: [] }));
                              setEditingLabAssignments([]);
                            }
                          }}
                          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a role</option>
                          <option value="admin">Admin</option>
                          <option value="central_store_admin">Central Store Admin</option>
                          <option value="lab_assistant">Lab Assistant</option>
                          <option value="faculty">Faculty</option>
                        </select>
                      </div>

                      {/* Legacy Lab ID field for non-lab assistants */}
                      {formData.role !== 'lab_assistant' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Lab ID</label>
                          <input
                            type="text"
                            name="labId"
                            value={formData.labId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lab Assignments Section - Full Width */}
                  {formData.role === 'lab_assistant' && (
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Lab Assignments</h4>
                      <p className="text-sm text-gray-500 mb-4">Manage lab access and permissions.</p>
                      
                      {/* Current Lab Assignments */}
                      {editingLabAssignments.length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Current Lab Assignments:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {editingLabAssignments.map((assignment, index) => (
                              <div key={assignment.labId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-green-800">{assignment.labName || assignment.labId}</span>
                                  <span className="text-sm text-green-600">({assignment.labId})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={assignment.permission}
                                    onChange={(e) => {
                                      const updatedAssignments = [...editingLabAssignments];
                                      updatedAssignments[index] = { ...updatedAssignments[index], permission: e.target.value };
                                      setEditingLabAssignments(updatedAssignments);
                                      setFormData(prev => ({ ...prev, labAssignments: updatedAssignments }));
                                    }}
                                    className="text-xs px-2 py-1 bg-white border border-green-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="read">Read Only</option>
                                    <option value="read_write">Full Access</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedAssignments = editingLabAssignments.filter((_, i) => i !== index);
                                      setEditingLabAssignments(updatedAssignments);
                                      setFormData(prev => ({ ...prev, labAssignments: updatedAssignments }));
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Remove lab assignment"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add New Lab Assignment */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Add Lab Assignment:</h5>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <select
                              id="editNewLabSelect"
                              defaultValue=""
                              className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg text-gray-800 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            >
                              <option value="">Select a lab to add</option>
                              {availableLabs
                                .filter(lab => !editingLabAssignments.some(a => a.labId === lab.labId))
                                .map((lab) => (
                                  <option key={lab.labId} value={lab.labId}>
                                    {lab.labName} ({lab.labId})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="w-40">
                            <select
                              id="editNewLabPermission"
                              defaultValue="read"
                              className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-lg text-gray-800 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                            >
                              <option value="read">Read Only</option>
                              <option value="read_write">Full Access</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const labSelect = document.getElementById('editNewLabSelect');
                              const permissionSelect = document.getElementById('editNewLabPermission');
                              const selectedLabId = labSelect?.value;
                              const permission = permissionSelect?.value || 'read';
                              
                              if (selectedLabId) {
                                const lab = availableLabs.find(l => l.labId === selectedLabId);
                                if (lab && !editingLabAssignments.some(a => a.labId === selectedLabId)) {
                                  const newAssignment = {
                                    labId: lab.labId,
                                    labName: lab.labName,
                                    permission: permission,
                                    isActive: true
                                  };
                                  const updatedAssignments = [...editingLabAssignments, newAssignment];
                                  setEditingLabAssignments(updatedAssignments);
                                  setFormData(prev => ({ ...prev, labAssignments: updatedAssignments }));
                                  
                                  // Reset selectors
                                  if (labSelect) labSelect.value = '';
                                  if (permissionSelect) permissionSelect.value = 'read';
                                }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={updateUserMutation.isLoading}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateUserMutation.isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {updateUserMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/20 relative overflow-hidden">
              {/* Modal Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-pink-50/50"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <DeleteIcon />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Confirm Delete</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeDeleteModal}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteUserMutation.isLoading}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteUserMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {isResetPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-white/20 relative overflow-hidden">
              {/* Modal Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Reset Password for {selectedUser.name}</h3>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newPassword = formData.get('newPassword');
                  const confirmPassword = formData.get('confirmPassword');

                  if (newPassword !== confirmPassword) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Password Mismatch',
                      text: 'Passwords do not match. Please try again.',
                      confirmButtonColor: '#ef4444',
                    });
                    return;
                  }

                  if (newPassword.length < 6) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Password Too Short',
                      text: 'Password must be at least 6 characters long.',
                      confirmButtonColor: '#ef4444',
                    });
                    return;
                  }

                  resetPasswordMutation.mutate({
                    userId: selectedUser._id,
                    newPassword
                  });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetPasswordModalOpen(false);
                        setSelectedUser(null);
                      }}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetPasswordMutation.isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {resetPasswordMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default UserManagement;
