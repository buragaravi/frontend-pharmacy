import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

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
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    labId: '',
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

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      labId: user.labId,
    });
    setIsModalOpen(true);
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
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: '',
      labId: '',
    });
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
      updateUserMutation.mutate({
        userId: selectedUser.id,
        userData: formData,
      });
    } else {
      // Add user logic here
    }
    // Only close modal after successful mutation
    if (!updateUserMutation.isError) {
      closeModal();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3861]"></div>
          <p className="mt-4 text-[#0B3861]">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
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
              className="px-4 py-2 bg-[#0B3861] text-white rounded-md hover:bg-[#064789] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-[#BCE0FD]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-[#0B3861] p-2 rounded-lg mr-3">
                <UserIcon />
              </div>
              <h2 className="text-2xl font-bold text-[#0B3861]">User Management</h2>
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setFormData({
                  name: '',
                  email: '',
                  role: '',
                  labId: '',
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-[#0B3861] text-white rounded-md hover:bg-[#064789] transition-colors"
            >
              Add User
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#BCE0FD]">
              <thead className="bg-[#F5F9FD]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Lab ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#0B3861] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#BCE0FD]">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F5F9FD] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0B3861]">
                      {user.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0B3861]">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0B3861]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#BCE0FD] text-[#0B3861]">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0B3861]">
                      {user.labId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0B3861]">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'PPpp') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-[#0B3861] hover:text-[#64B5F6] transition-colors"
                          disabled={updateUserMutation.isLoading}
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-[#0B3861] hover:text-[#64B5F6] transition-colors"
                          disabled={resetPasswordMutation.isLoading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={deleteUserMutation.isLoading}
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
        </div>
      </div>      {isModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-96 shadow-xl rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-[#0B3861] mb-4">
                {selectedUser ? 'Edit User' : 'Add User'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0B3861] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BCE0FD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#64B5F6]"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0B3861] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BCE0FD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#64B5F6]"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0B3861] mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BCE0FD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#64B5F6]"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#0B3861] mb-2">
                    Lab ID
                  </label>
                  <input
                    type="text"
                    name="labId"
                    value={formData.labId}
                    onChange={handleChange}
                    className="w-full p-2 border border-[#BCE0FD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#64B5F6]"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={updateUserMutation.isLoading}
                    className="px-4 py-2 text-sm border border-[#BCE0FD] text-[#0B3861] rounded-md hover:bg-[#F5F9FD] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isLoading}
                    className="px-4 py-2 text-sm bg-[#0B3861] text-white rounded-md hover:bg-[#064789] disabled:opacity-50 flex items-center"
                  >
                    {updateUserMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      selectedUser ? 'Update' : 'Add'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-96 shadow-xl rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-[#0B3861] mb-4">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm border border-[#BCE0FD] text-[#0B3861] rounded-md hover:bg-[#F5F9FD]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteUserMutation.isLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleteUserMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-[#0B3861] mb-4">Reset Password for {selectedUser.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const newPassword = formData.get('newPassword');
              const confirmPassword = formData.get('confirmPassword');

              if (newPassword !== confirmPassword) {
                toast.error('Passwords do not match');
                return;
              }

              if (newPassword.length < 6) {
                toast.error('Password must be at least 6 characters long');
                return;
              }

              resetPasswordMutation.mutate({
                userId: selectedUser._id,
                newPassword
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0B3861] mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-[#BCE0FD] rounded-lg focus:ring-2 focus:ring-[#0B3861] focus:border-[#0B3861]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-[#0B3861] border border-[#0B3861] rounded-lg hover:bg-[#F5F9FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isLoading}
                  className="px-4 py-2 bg-[#0B3861] text-white rounded-lg hover:bg-[#0D4A7A] disabled:opacity-50"
                >
                  {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;