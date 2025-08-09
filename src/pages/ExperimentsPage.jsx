import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExperimentForm from '../components/ExperimentForm';
import EnhancedCourseSelector from '../components/EnhancedCourseSelector';
import SubjectSelector from '../components/SubjectSelector';
import Swal from 'sweetalert2';

// Create axios instance with interceptors
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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedChemicals, setExpandedChemicals] = useState(null);
  const queryClient = useQueryClient();

  // Fetch experiments with proper population
  const { data: experiments, isLoading, error } = useQuery({
    queryKey: ['experiments', selectedCourse?._id, selectedSubject?._id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      let url = '/experiments';
      
      // Use specific endpoints based on filters
      if (selectedSubject) {
        url = `/experiments/subject/${selectedSubject._id}`;
      } else if (selectedCourse) {
        url = `/experiments/course/${selectedCourse._id}`;
      }
      
      const response = await api.get(url, {
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
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Experiment has been deleted successfully.',
        confirmButtonColor: '#0ea5e9',
        timer: 2000,
        timerProgressBar: true
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to delete experiment',
        confirmButtonColor: '#0ea5e9'
      });
    }
  });

  const handleEdit = (experiment) => {
    setSelectedExperiment(experiment);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this experiment? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedExperiment(null);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedSubject(null); // Reset subject when course changes
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
  };

  const clearFilters = () => {
    setSelectedCourse(null);
    setSelectedSubject(null);
  };

  const handleChemicalsExpand = (experimentId) => {
    setExpandedChemicals(expandedChemicals === experimentId ? null : experimentId);
  };

  // Skeleton loading component
  const ExperimentSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-3 sm:px-5 py-3 sm:py-4">
        <div className="space-y-2">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3 sm:hidden"></div>
        </div>
      </td>
      <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
        <div className="space-y-2">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </td>
      <td className="px-3 sm:px-5 py-3 sm:py-4 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          <div className="h-5 sm:h-6 bg-gray-200 rounded-md w-12 sm:w-16"></div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded-md w-16 sm:w-20"></div>
        </div>
      </td>
      <td className="px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded-md"></div>
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded-md"></div>
        </div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 min-h-screen">
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
    <div className="w-full">
      <GlobalStyles />
      
      {/* Background floating bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-16 h-16 bg-sky-200/15 rounded-full blur-lg bubble-float-1"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-sky-200/10 rounded-full blur-md bubble-float-2"></div>
        <div className="absolute top-60 left-1/4 w-20 h-20 bg-sky-200/8 rounded-full blur-xl bubble-float-3"></div>
        <div className="absolute top-80 right-1/3 w-14 h-14 bg-sky-200/12 rounded-full blur-lg bubble-float-4"></div>
        <div className="absolute bottom-40 left-1/3 w-18 h-18 bg-sky-300/8 rounded-full blur-md bubble-float-1"></div>
        <div className="absolute bottom-60 right-10 w-16 h-16 bg-sky-300/10 rounded-full blur-lg bubble-float-2"></div>
        <div className="absolute top-1/2 left-5 w-10 h-10 bg-sky-300/6 rounded-full blur-sm bubble-float-3"></div>
        <div className="absolute top-1/3 right-5 w-8 h-8 bg-sky-300/8 rounded-full blur-sm bubble-float-4"></div>
      </div>
      
      <div className="w-full max-w-none mx-auto relative">
        {/* Enhanced Header Section with Soft Design */}
        <div className="relative p-3 sm:p-4 text-white rounded-b-2xl sm:rounded-b-3xl bg-blue-600 overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl text-white font-medium mb-1 flex items-center gap-2">
                    Experiments Management
                    {isLoading && (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </h1>
                  <p className="text-white/90 text-xs sm:text-sm">
                    Create and manage laboratory experiments with their chemical requirements
                  </p>
                </div>
              </div>
              
              {/* Add Experiment Button */}
              <div className="flex items-center space-x-2 sm:space-x-3 w-full lg:w-auto">
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium flex-1 lg:flex-none"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setOpenForm(true)}
                  className="px-3 sm:px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm flex items-center space-x-1 sm:space-x-2 flex-1 lg:flex-none justify-center"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Experiment</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="relative z-10 p-3 sm:p-4 lg:p-6 bg-white/80 backdrop-blur-sm border-b border-blue-100">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Filter Experiments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Course Filter */}
              <EnhancedCourseSelector
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
                placeholder="Filter by Course"
                className="text-xs sm:text-sm"
              />

              {/* Subject Filter */}
              <SubjectSelector
                selectedCourse={selectedCourse}
                selectedSubject={selectedSubject}
                onSubjectSelect={handleSubjectSelect}
                placeholder="Filter by Subject"
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Filter Summary */}
            {(selectedCourse || selectedSubject) && (
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span>Active filters:</span>
                {selectedCourse && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                    Course: {selectedCourse.courseCode}
                  </span>
                )}
                {selectedSubject && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs">
                    Subject: {selectedSubject.code}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Section */}
        <div className="relative z-10 p-3 sm:p-4 lg:p-6">
          {/* Modern Table Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Experiment Details
                    </th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                      Course & Subject
                    </th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider hidden md:table-cell">
                      Default Chemicals
                    </th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/70 divide-y divide-blue-100">
                  {isLoading ? (
                    // Show skeleton loading rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <ExperimentSkeleton key={`skeleton-${index}`} />
                    ))
                  ) : experiments?.map((experiment, index) => (
                    <React.Fragment key={experiment._id}>
                      <tr 
                        className="hover:bg-blue-25 transition-colors duration-200 group cursor-pointer"
                        onClick={() => handleChemicalsExpand(experiment._id)}
                      >
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                            {experiment.name}
                          </div>
                          {experiment.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {experiment.description}
                            </div>
                          )}
                          {/* Mobile: Show course/subject info */}
                          <div className="sm:hidden mt-2 text-xs text-slate-500">
                            {experiment.subjectId ? (
                              <span>{experiment.subjectId.courseId?.courseName} - {experiment.subjectId.name}</span>
                            ) : (
                              <span>{experiment.subject || 'No subject'}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
                        <div>
                          {experiment.subjectId ? (
                            <>
                              <div className="text-sm text-slate-700">
                                {experiment.subjectId.courseId?.courseName || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {experiment.subjectId.name} ({experiment.subjectId.code})
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-700">
                              {experiment.subject || 'No subject assigned'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {experiment.defaultChemicals?.length > 0 ? (
                            <>
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                {experiment.defaultChemicals[0].chemicalName} ({experiment.defaultChemicals[0].quantity} {experiment.defaultChemicals[0].unit})
                              </span>
                              {experiment.defaultChemicals.length > 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                  +{experiment.defaultChemicals.length - 1} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">No chemicals</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(experiment);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 sm:p-1.5 rounded-md transition-all duration-200"
                            title="Edit experiment"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(experiment._id);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 sm:p-1.5 rounded-md transition-all duration-200"
                            title="Delete experiment"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Chemicals Row */}
                    {expandedChemicals === experiment._id && experiment.defaultChemicals?.length > 1 && (
                      <tr>
                        <td colSpan="4" className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                          <div className="bg-white rounded-lg p-3 sm:p-4 border shadow-sm">
                            <h4 className="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="hidden sm:inline">All Default Chemicals for "</span>{experiment.name}<span className="hidden sm:inline">"</span>
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs sm:text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-slate-600">Chemical Name</th>
                                    <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-slate-600">Quantity</th>
                                    <th className="text-left py-1.5 sm:py-2 px-2 sm:px-3 font-medium text-slate-600">Unit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {experiment.defaultChemicals.map((chem, chemIndex) => (
                                    <tr key={chemIndex} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                      <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-slate-700 font-medium">{chem.chemicalName}</td>
                                      <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-slate-600">{chem.quantity}</td>
                                      <td className="py-1.5 sm:py-2 px-2 sm:px-3 text-slate-600">{chem.unit}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {!isLoading && experiments?.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-slate-600">No experiments found</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  {selectedCourse || selectedSubject
                    ? 'Try adjusting your filters or create a new experiment' 
                    : 'Create your first experiment to get started'}
                </p>
                <div className="mt-4 sm:mt-6">
                  <button
                    onClick={() => setOpenForm(true)}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl border border-white/20 overflow-hidden max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-blue-600 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    {selectedExperiment ? 'Edit Experiment' : 'Add New Experiment'}
                  </h3>
                  <button
                    onClick={handleCloseForm}
                    className="text-white/80 hover:text-white transition-colors duration-200 p-1 hover:bg-white/20 rounded-lg"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-3 sm:p-4 lg:p-6">
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