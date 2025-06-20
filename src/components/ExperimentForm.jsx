import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const SUBJECTS = [
  'Pharmaceutical Analysis',
  'Pharmaceutical Chemistry',
  'Pharmacology',
  'Pharmaceutics',
  'Pharmacognosy',
  'Pharmaceutical Microbiology',
  'Biochemistry',
  'Human Anatomy and Physiology',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const token = localStorage.getItem('token');
// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
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

const ExperimentForm = ({ experiment, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
    subject: '',
    customSubject: '',
    description: '',
  });
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (experiment) {
      const isCustom = !SUBJECTS.includes(experiment.subject);
      setFormData({
        name: experiment.name,
        semester: experiment.semester,
        subject: isCustom ? 'custom' : experiment.subject,
        customSubject: isCustom ? experiment.subject : '',
        description: experiment.description || '',
      });
      setIsCustomSubject(isCustom);
    }
  }, [experiment]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Experiment name is required';
    }
    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }
    if (isCustomSubject && !formData.customSubject.trim()) {
      errors.customSubject = 'Custom subject is required';
    }
    if (!formData.semester) {
      errors.semester = 'Semester is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const response = await api.post('https://backend-pharmacy-5541.onrender.com/api/experiments', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setSnackbar({
        open: true,
        message: 'Experiment created successfully!',
        severity: 'success',
      });
      setTimeout(() => onClose(), 1500);
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create experiment',
        severity: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const response = await api.put(`https://backend-pharmacy-5541.onrender.com/api/experiments/${experiment._id}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setSnackbar({
        open: true,
        message: 'Experiment updated successfully!',
        severity: 'success',
      });
      setTimeout(() => onClose(), 1500);
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update experiment',
        severity: 'error',
      });
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomSubject(true);
      setFormData(prev => ({ ...prev, subject: 'custom' }));
    } else {
      setIsCustomSubject(false);
      setFormData(prev => ({ ...prev, subject: value, customSubject: '' }));
    }
    // Clear validation errors
    setValidationErrors((prev) => ({
      ...prev,
      subject: '',
      customSubject: '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const data = {
      ...formData,
      subject: isCustomSubject ? formData.customSubject : formData.subject,
    };
    delete data.customSubject;

    if (experiment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold text-[#6D123F] mb-6">
          {experiment ? 'Edit Experiment' : 'Add New Experiment'}
        </h2>

        <div className="space-y-6">
          {/* Experiment Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
                ${validationErrors.name 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-[#6D123F] focus:border-[#6D123F]'}`}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Subject and Semester in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Dropdown */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject*
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleSubjectChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
                  ${validationErrors.subject 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#6D123F] focus:border-[#6D123F]'}
                  ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
                <option value="custom">Other (Custom Subject)</option>
              </select>
              {validationErrors.subject && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.subject}</p>
              )}
            </div>

            {/* Custom Subject Input */}
            {isCustomSubject && (
              <div>
                <label htmlFor="customSubject" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Subject*
                </label>
                <input
                  type="text"
                  id="customSubject"
                  name="customSubject"
                  value={formData.customSubject}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
                    ${validationErrors.customSubject 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-[#6D123F] focus:border-[#6D123F]'}`}
                />
                {validationErrors.customSubject && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.customSubject}</p>
                )}
              </div>
            )}

            {/* Semester Dropdown */}
            <div className={isCustomSubject ? 'md:col-span-2' : ''}>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                Semester*
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none
                  ${validationErrors.semester 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-[#6D123F] focus:border-[#6D123F]'}
                  ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
              >
                <option value="">Select semester</option>
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
              {validationErrors.semester && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.semester}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6D123F] focus:border-[#6D123F] focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-[#6D123F] text-[#6D123F] rounded-lg hover:bg-[#F8F4F6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#6D123F] text-white rounded-lg hover:bg-[#8B1A54] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{experiment ? 'Update' : 'Create'} Experiment</span>
            </button>
          </div>
        </div>
      </form>

      {/* Toast Notification */}
      {snackbar.open && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all transform 
          ${snackbar.severity === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
          role="alert"
        >
          <div className="flex items-center space-x-2">
            <span>{snackbar.message}</span>
            <button
              onClick={handleCloseSnackbar}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentForm;