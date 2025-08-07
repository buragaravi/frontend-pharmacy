import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import EnhancedCourseSelector from './EnhancedCourseSelector';
import SubjectSelector from './SubjectSelector';

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
  const chemicalDropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    description: '',
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [defaultChemicals, setDefaultChemicals] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState('');
  const [chemicalQuantity, setChemicalQuantity] = useState('');
  const [chemicalSearchTerm, setChemicalSearchTerm] = useState('');
  const [showChemicalDropdown, setShowChemicalDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chemicalDropdownRef.current && !chemicalDropdownRef.current.contains(event.target)) {
        setShowChemicalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch available chemicals
  const { data: availableChemicals = [] } = useQuery({
    queryKey: ['chemicals', 'available'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/chemicals/central/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
  });

  useEffect(() => {
    if (experiment) {
      setFormData({
        name: experiment.name,
        subjectId: experiment.subjectId?._id || experiment.subjectId || '',
        description: experiment.description || '',
      });
      
      // Set selected course and subject for the selectors
      if (experiment.subjectId) {
        if (typeof experiment.subjectId === 'object') {
          setSelectedSubject(experiment.subjectId);
          if (experiment.subjectId.courseId) {
            setSelectedCourse(experiment.subjectId.courseId);
          }
        }
      }
      
      // Set default chemicals if editing
      if (experiment.defaultChemicals) {
        setDefaultChemicals(experiment.defaultChemicals);
      }
    }
  }, [experiment]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Experiment name is required';
    }
    if (!formData.subjectId || formData.subjectId.trim() === '') {
      errors.subjectId = 'Subject is required';
    }
    if (!selectedSubject) {
      errors.subjectId = 'Please select a subject';
    }
    if (defaultChemicals.length === 0) {
      errors.defaultChemicals = 'At least one default chemical is required';
    }
    console.log('Validation errors:', errors);
    console.log('Current formData:', formData);
    console.log('Selected subject:', selectedSubject);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Making API call with data:', data);
      const token = localStorage.getItem('token');
      const response = await api.post('https://backend-pharmacy-5541.onrender.com/api/experiments', data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Success response:', data);
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setSnackbar({
        open: true,
        message: 'Experiment created successfully!',
        severity: 'success',
      });
      setTimeout(() => onClose(), 1500);
    },
    onError: (error) => {
      console.error('Error response:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
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
      const response = await api.put(`/experiments/${experiment._id}`, data, {
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

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedSubject(null);
    setFormData((prev) => ({ ...prev, subjectId: '' }));
  };

  const handleSubjectSelect = (subject) => {
    console.log('Subject selected:', subject);
    setSelectedSubject(subject);
    setFormData((prev) => ({ ...prev, subjectId: subject?._id || '' }));
    // Clear validation error
    if (validationErrors.subjectId) {
      setValidationErrors((prev) => ({ ...prev, subjectId: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form data:', formData);
    console.log('Selected subject:', selectedSubject);
    console.log('Selected course:', selectedCourse);
    console.log('Default chemicals:', defaultChemicals);
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    // Double-check that we have a valid subjectId
    if (!formData.subjectId || !selectedSubject) {
      console.error('Missing subjectId or selectedSubject');
      setValidationErrors(prev => ({
        ...prev,
        subjectId: 'Please select a subject'
      }));
      return;
    }

    const data = {
      ...formData,
      defaultChemicals: defaultChemicals,
    };

    console.log('Submitting experiment data:', data);

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

  // Chemical management functions
  const filteredChemicals = availableChemicals.filter(chemical =>
    chemical.chemicalName.toLowerCase().includes(chemicalSearchTerm.toLowerCase())
  );

  const addChemical = () => {
    if (!selectedChemical || !chemicalQuantity) {
      return;
    }
    
    const chemical = availableChemicals.find(c => c._id === selectedChemical);
    if (!chemical) return;

    const newChemical = {
      chemicalId: chemical._id,
      chemicalName: chemical.chemicalName,
      quantity: parseFloat(chemicalQuantity),
      unit: chemical.unit || 'ml'
    };

    setDefaultChemicals(prev => [...prev, newChemical]);
    setSelectedChemical('');
    setChemicalQuantity('');
    setChemicalSearchTerm('');
    setShowChemicalDropdown(false);
    
    // Clear validation error
    if (validationErrors.defaultChemicals) {
      setValidationErrors(prev => ({ ...prev, defaultChemicals: '' }));
    }
  };

  const removeChemical = (index) => {
    setDefaultChemicals(prev => prev.filter((_, i) => i !== index));
  };

  const updateChemicalQuantity = (index, newQuantity) => {
    setDefaultChemicals(prev => 
      prev.map((chemical, i) => 
        i === index ? { ...chemical, quantity: parseFloat(newQuantity) || 0 } : chemical
      )
    );
  };

  return (
    <div className="w-full h-full">
      <form onSubmit={handleSubmit} className="w-full space-y-6 p-6">
        <div className="space-y-4">
          {/* Experiment Name */}
          <div className="w-full">
            <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-sm
                ${validationErrors.name 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              placeholder="Enter experiment name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Course and Subject Selection */}
          <div className="space-y-4">
            {/* Course Selector */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Course*
              </label>
              <EnhancedCourseSelector
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
                disabled={isLoading}
              />
            </div>

            {/* Subject Selector */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Subject*
              </label>
              <SubjectSelector
                selectedCourse={selectedCourse}
                selectedSubject={selectedSubject}
                onSubjectSelect={handleSubjectSelect}
                disabled={isLoading || !selectedCourse}
              />
              {validationErrors.subjectId && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.subjectId}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="w-full">
            <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="Enter experiment description (optional)"
            />
          </div>

          {/* Default Chemicals Section */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Default Chemicals*
            </label>
            
            {/* Selected Chemicals List */}
            <div className="space-y-2 mb-4">
              {defaultChemicals.map((chemical, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-blue-900 text-sm">{chemical.chemicalName}</span>
                    <span className="text-xs text-blue-700 ml-2">({chemical.unit})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={chemical.quantity}
                      onChange={(e) => updateChemicalQuantity(index, e.target.value)}
                      className="w-20 px-2 py-1 border border-blue-300 rounded text-xs text-center"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Chemical Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Chemical</h4>
              <div className="space-y-3">
                {/* Chemical Search */}
                <div className="relative" ref={chemicalDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search for chemicals..."
                    value={chemicalSearchTerm}
                    onChange={(e) => {
                      setChemicalSearchTerm(e.target.value);
                      setShowChemicalDropdown(true);
                    }}
                    onFocus={() => setShowChemicalDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                  
                  {/* Chemical Dropdown */}
                  {showChemicalDropdown && filteredChemicals.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredChemicals.slice(0, 10).map((chemical) => (
                        <button
                          key={chemical._id}
                          type="button"
                          onClick={() => {
                            setSelectedChemical(chemical._id);
                            setChemicalSearchTerm(chemical.chemicalName);
                            setShowChemicalDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                          disabled={isLoading}
                        >
                          <div className="font-medium text-gray-900">{chemical.chemicalName}</div>
                          <div className="text-xs text-gray-500">Unit: {chemical.unit || 'ml'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity Input and Add Button */}
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Quantity"
                    value={chemicalQuantity}
                    onChange={(e) => setChemicalQuantity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={addChemical}
                    disabled={!selectedChemical || !chemicalQuantity || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {validationErrors.defaultChemicals && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.defaultChemicals}</p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? (experiment ? 'Updating...' : 'Creating...') 
              : (experiment ? 'Update Experiment' : 'Create Experiment')
            }
          </button>
        </div>
      </form>

      {/* Success/Error Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
            snackbar.severity === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <span>{snackbar.message}</span>
              <button
                onClick={handleCloseSnackbar}
                className="ml-3 text-white hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentForm;
