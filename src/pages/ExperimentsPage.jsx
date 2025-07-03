import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExperimentForm from '../components/ExperimentForm';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Animated styles for bubbles and glassmorphic effects
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-10px) rotate(1deg); }
      66% { transform: translateY(5px) rotate(-1deg); }
    }

    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(8px) rotate(-1deg); }
      66% { transform: translateY(-12px) rotate(1deg); }
    }

    @keyframes bubbleFloat {
      0% { transform: translateY(0px) scale(1); opacity: 0.7; }
      50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
      100% { transform: translateY(0px) scale(1); opacity: 0.7; }
    }

    .bubble-float-1 {
      animation: float 6s ease-in-out infinite;
    }

    .bubble-float-2 {
      animation: floatReverse 8s ease-in-out infinite;
      animation-delay: -2s;
    }

    .bubble-float-3 {
      animation: bubbleFloat 10s ease-in-out infinite;
      animation-delay: -4s;
    }

    .bubble-float-4 {
      animation: float 7s ease-in-out infinite;
      animation-delay: -1s;
    }

    .glass-card {
      animation: fadeIn 0.5s ease-out forwards;
    }

    .hover-scale {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .hover-scale:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
  `}</style>
);

const ExperimentsPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const queryClient = useQueryClient();

  const { data: experiments, isLoading, error } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/experiments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/experiments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
    },
  });

  const handleEdit = (experiment) => {
    setSelectedExperiment(experiment);
    setOpenForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this experiment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedExperiment(null);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <GlobalStyles />
        <div className="w-full max-w-none mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">Loading experiments...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <GlobalStyles />
        <div className="w-full max-w-none mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="p-8">
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error.response?.data?.message || 'Failed to load experiments'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <GlobalStyles />
      
      {/* Background floating bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-200/20 rounded-full blur-lg bubble-float-1"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-indigo-200/15 rounded-full blur-md bubble-float-2"></div>
        <div className="absolute top-60 left-1/4 w-20 h-20 bg-cyan-200/10 rounded-full blur-xl bubble-float-3"></div>
        <div className="absolute top-80 right-1/3 w-14 h-14 bg-purple-200/15 rounded-full blur-lg bubble-float-4"></div>
        <div className="absolute bottom-40 left-1/3 w-18 h-18 bg-blue-300/10 rounded-full blur-md bubble-float-1"></div>
        <div className="absolute bottom-60 right-10 w-16 h-16 bg-indigo-300/12 rounded-full blur-lg bubble-float-2"></div>
        <div className="absolute top-1/2 left-5 w-10 h-10 bg-cyan-300/8 rounded-full blur-sm bubble-float-3"></div>
        <div className="absolute top-1/3 right-5 w-8 h-8 bg-purple-300/10 rounded-full blur-sm bubble-float-4"></div>
      </div>
      
      <div className="w-full max-w-none mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="relative z-10 w-full bg-white/70 backdrop-blur-sm border-b border-gray-200/30">
          <div className="w-full px-4 py-2">
            <nav className="flex items-center space-x-1.5 text-xs">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-gray-500">Admin Dashboard</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-blue-600 font-medium">Experiments Management</span>
            </nav>
          </div>
        </div>

        {/* Enhanced Header Section with Glassmorphic Design */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-4 sm:p-6 lg:p-8 text-white overflow-hidden rounded-t-3xl shadow-lg">
          <div className="absolute inset-0 bg-blue-800/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                    Experiments Management
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-lg opacity-90">
                    Create and manage laboratory experiments with their chemical requirements
                  </p>
                </div>
              </div>
              
              {/* Add Experiment Button */}
              <div className="flex items-center">
                <button
                  onClick={() => setOpenForm(true)}
                  className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 backdrop-blur-sm border border-white/20"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Add Experiment</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 bg-indigo-300/20 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Modern Table Container */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden glass-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200/50">
                <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                      Experiment Name
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                      Default Chemicals
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/40 backdrop-blur-sm divide-y divide-blue-100/30">
                  {experiments?.map((experiment, index) => (
                    <tr 
                      key={experiment._id} 
                      className="hover:bg-blue-50/50 transition-all duration-200 hover-scale"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{experiment.name}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{experiment.subject}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Semester {experiment.semester}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {experiment.defaultChemicals.map((chem, chemIndex) => (
                            <span
                              key={chemIndex}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200"
                            >
                              {chem.chemicalName} ({chem.quantity} {chem.unit})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(experiment)}
                            className="group p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit experiment"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(experiment._id)}
                            className="group p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete experiment"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {experiments?.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 16l-8-8-8 8M26 16v12M16 24l4 4 4-4M32 24l4 4 4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No experiments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new experiment.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setOpenForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Experiment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Modal/Dialog */}
      {openForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseForm}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-4xl border border-white/20 overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    {selectedExperiment ? 'Edit Experiment' : 'Add New Experiment'}
                  </h3>
                  <button
                    onClick={handleCloseForm}
                    className="text-white/80 hover:text-white transition-colors duration-200 p-1 hover:bg-white/20 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-6">
                <ExperimentForm
                  experiment={selectedExperiment}
                  onClose={handleCloseForm}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentsPage;