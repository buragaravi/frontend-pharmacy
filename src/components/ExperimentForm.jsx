import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const SUBJECTS = [
  // 🧪 B.Pharmacy Lab Subjects
  "Human Anatomy and Physiology Lab",
  "Pharmaceutical Analysis Lab",
  "Pharmaceutics Lab",
  "Pharmaceutical Inorganic Chemistry Lab",
  "Pharmaceutical Organic Chemistry Lab",
  "Physical Pharmaceutics Lab",
  "Pharmaceutical Microbiology Lab",
  "Pharmacology Lab",
  "Pharmacognosy and Phytochemistry Lab",
  "Biochemistry Lab",
  "Computer Applications in Pharmacy Lab",
  "Industrial Pharmacy Lab",
  "Instrumental Methods of Analysis Lab",
  "Pharmaceutical Biotechnology Lab",
  "Novel Drug Delivery Systems Lab",
  "Pharmacy Practice Lab",
  
  // 🧬 M.Pharmacy Lab Subjects (based on specialization)
  "Modern Pharmaceutical Analytical Techniques Lab",
  "Advanced Drug Delivery Systems Lab",
  "Advanced Biopharmaceutics Lab",
  "Industrial Pharmacy Lab - Advanced",
  "Pharmacological Screening Methods Lab",
  "Cellular and Molecular Pharmacology Lab",
  "Advanced Pharmaceutical Chemistry Lab",
  "Natural Product Lab Techniques",
  "Clinical Pharmacy Lab",
  "Herbal Drug Standardization Lab",
  "Pharmaceutical Validation Techniques Lab",

  // 💊 Pharm.D Lab Subjects
  "Clinical Pharmacy Lab",
  "Pharmaceutical Formulations Lab",
  "Hospital Pharmacy Lab",
  "Biopharmaceutics and Pharmacokinetics Lab",
  "Pharmacotherapeutics Case Study Lab",
  "Clinical Toxicology Simulations",
  "Clinical Research and Trial Documentation Lab",
  "Pharmacoepidemiology & Pharmacoeconomics Lab",
  "Drug Information & Patient Counseling Lab",
  "Adverse Drug Reaction Reporting & Monitoring Lab"
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8,9,10];

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
      const isCustom = !SUBJECTS.includes(experiment.subject);
      setFormData({
        name: experiment.name,
        semester: experiment.semester,
        subject: isCustom ? 'custom' : experiment.subject,
        customSubject: isCustom ? experiment.subject : '',
        description: experiment.description || '',
      });
      setIsCustomSubject(isCustom);
      
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
    if (!formData.subject) {
      errors.subject = 'Subject is required';
    }
    if (isCustomSubject && !formData.customSubject.trim()) {
      errors.customSubject = 'Custom subject is required';
    }
    if (!formData.semester) {
      errors.semester = 'Semester is required';
    }
    if (defaultChemicals.length === 0) {
      errors.defaultChemicals = 'At least one default chemical is required';
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
      defaultChemicals: defaultChemicals,
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

          {/* Subject and Semester in grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subject Dropdown */}
            <div className="w-full">
              <label htmlFor="subject" className="block text-xs font-medium text-gray-700 mb-1">
                Subject*
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleSubjectChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-sm
                  ${validationErrors.subject 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
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
                <p className="mt-1 text-xs text-red-500">{validationErrors.subject}</p>
              )}
            </div>

            {/* Semester Dropdown */}
            <div className="w-full">
              <label htmlFor="semester" className="block text-xs font-medium text-gray-700 mb-1">
                Semester*
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-sm
                  ${validationErrors.semester 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
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
                <p className="mt-1 text-xs text-red-500">{validationErrors.semester}</p>
              )}
            </div>
          </div>

          {/* Custom Subject Input */}
          {isCustomSubject && (
            <div className="w-full">
              <label htmlFor="customSubject" className="block text-xs font-medium text-gray-700 mb-1">
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-sm
                  ${validationErrors.customSubject 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                placeholder="Enter custom subject name"
              />
              {validationErrors.customSubject && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.customSubject}</p>
              )}
            </div>
          )}

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
                      min="0.01"
                      step="0.01"
                      value={chemical.quantity}
                      onChange={(e) => {
                        const newChemicals = [...defaultChemicals];
                        newChemicals[index].quantity = parseFloat(e.target.value) || 0;
                        setDefaultChemicals(newChemicals);
                      }}
                      className="w-20 px-2 py-1 border border-blue-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Qty"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newChemicals = defaultChemicals.filter((_, i) => i !== index);
                        setDefaultChemicals(newChemicals);
                        if (validationErrors.defaultChemicals) {
                          setValidationErrors(prev => ({ ...prev, defaultChemicals: '' }));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Chemical Form */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-800 mb-3">Add Chemical</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="relative lg:col-span-1" ref={chemicalDropdownRef}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Chemical</label>
                  <input
                    type="text"
                    value={chemicalSearchTerm}
                    onChange={(e) => {
                      setChemicalSearchTerm(e.target.value);
                      setShowChemicalDropdown(true);
                    }}
                    onFocus={() => setShowChemicalDropdown(true)}
                    placeholder="Search chemicals..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  
                  {/* Chemical Dropdown */}
                  {showChemicalDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {availableChemicals
                        .filter(chemical => 
                          chemical.chemicalName.toLowerCase().includes(chemicalSearchTerm.toLowerCase()) ||
                          chemical.brand.toLowerCase().includes(chemicalSearchTerm.toLowerCase())
                        )
                        .map((chemical) => (
                          <button
                            key={chemical._id}
                            type="button"
                            onClick={() => {
                              setSelectedChemical(chemical._id);
                              setChemicalSearchTerm(`${chemical.chemicalName} - ${chemical.brand}`);
                              setShowChemicalDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-xs border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div>
                              <span className="font-medium text-gray-900">{chemical.chemicalName}</span>
                              <span className="text-gray-600 ml-1">- {chemical.brand}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Available: {chemical.availableQuantity} {chemical.unit}
                            </div>
                          </button>
                        ))}
                      {availableChemicals.filter(chemical => 
                        chemical.chemicalName.toLowerCase().includes(chemicalSearchTerm.toLowerCase()) ||
                        chemical.brand.toLowerCase().includes(chemicalSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          No chemicals found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={chemicalQuantity}
                    onChange={(e) => setChemicalQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="lg:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChemical && chemicalQuantity) {
                        const chemical = availableChemicals.find(c => c._id === selectedChemical);
                        if (chemical) {
                          // Check if chemical is already added
                          const isAlreadyAdded = defaultChemicals.some(dc => dc.chemicalId === selectedChemical);
                          if (isAlreadyAdded) {
                            setSnackbar({
                              open: true,
                              message: 'Chemical already added to the list',
                              severity: 'error',
                            });
                            return;
                          }
                          
                          const newChemical = {
                            chemicalId: chemical._id,
                            chemicalName: chemical.chemicalName,
                            quantity: parseFloat(chemicalQuantity),
                            unit: chemical.unit
                          };
                          setDefaultChemicals([...defaultChemicals, newChemical]);
                          setSelectedChemical('');
                          setChemicalQuantity('');
                          setChemicalSearchTerm('');
                          
                          // Clear validation error
                          if (validationErrors.defaultChemicals) {
                            setValidationErrors(prev => ({ ...prev, defaultChemicals: '' }));
                          }
                        }
                      }
                    }}
                    disabled={!selectedChemical || !chemicalQuantity || isLoading}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                  >
                    Add Chemical
                  </button>
                </div>
              </div>
            </div>
            
            {validationErrors.defaultChemicals && (
              <p className="mt-2 text-xs text-red-500">{validationErrors.defaultChemicals}</p>
            )}
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
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
              placeholder="Enter experiment description (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium transition-colors"
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