import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExperimentSelector from './ExperimentSelector';
import { toast } from 'react-toastify';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// CSS Animations
const AnimationStyles = () => (
  <style jsx>{`
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 {
      animation-delay: 2s;
    }
    .animation-delay-4000 {
      animation-delay: 4s;
    }
  `}</style>
);

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

// Constants for claymorphism theming
const THEME = {
  background: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  card: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/10',
  border: 'border-white/30',
  primaryText: 'text-slate-800',
  secondaryText: 'text-slate-600',
  mutedText: 'text-slate-500',
  primaryBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  secondaryBg: 'bg-gradient-to-r from-indigo-400 to-blue-500',
  hoverBg: 'hover:from-blue-600 hover:to-indigo-700',
  inputBg: 'bg-white/60 backdrop-blur-sm',
  inputBorder: 'border-white/40',
  inputFocus: 'focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400/50 focus:bg-white/80',
  cardHover: 'hover:bg-white/80 hover:shadow-3xl hover:shadow-blue-500/20 transition-all duration-300'
};

// Dynamic Lab IDs will be fetched from API

// SVG Icons
const ExperimentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ChemicalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

// Claymorphism Design System
const CLAY_CARD = 'bg-white/60 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-blue-500/10';
const CLAY_INPUT = 'bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl shadow-inner shadow-blue-500/5 focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400/50 focus:bg-white/70 transition-all duration-300';
const CLAY_BTN = 'bg-gradient-to-r from-blue-400/80 to-indigo-500/80 backdrop-blur-sm text-white font-medium rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-500/90 hover:to-indigo-600/90 active:scale-95 transition-all duration-300 ease-out border border-white/20 px-6 py-3';
const CLAY_BTN_PRIMARY = 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 backdrop-blur-sm text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/50 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all duration-300 ease-out border border-white/20 px-8 py-4';
const CLAY_BTN_SECONDARY = 'bg-gradient-to-r from-slate-100/80 to-slate-200/80 backdrop-blur-sm text-slate-700 font-medium rounded-2xl shadow-md shadow-slate-500/10 hover:shadow-lg hover:shadow-slate-500/20 hover:from-slate-200/90 hover:to-slate-300/90 active:scale-95 transition-all duration-300 ease-out border border-white/30 px-4 py-2';
const CLAY_BTN_DANGER = 'bg-gradient-to-r from-red-400/80 to-pink-500/80 backdrop-blur-sm text-white font-medium rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-500/90 hover:to-pink-600/90 active:scale-95 transition-all duration-300 ease-out border border-white/20 px-4 py-2';
const CLAY_SECTION = 'bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/20 p-6 md:p-8 mb-8';
const CLAY_LABEL = 'block text-base font-semibold text-slate-800 mb-3 drop-shadow-sm';
const CLAY_HEADER = 'text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm';
const CLAY_SUBHEADER = 'text-lg font-bold text-slate-700 mb-4';

const CreateRequestForm = () => {
  const queryClient = useQueryClient();
  const [labId, setLabId] = useState('');
  
  // Dynamic labs state  
  const [availableLabs, setAvailableLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(true);
  
  const [experiments, setExperiments] = useState([
    {
      experimentId: '',
      experimentName: '',
      courseId: '',
      batchId: '',
      date: '',
      chemicals: [
        {
          chemicalName: '',
          quantity: '',
          unit: '',
          chemicalMasterId: '',
          suggestions: [],
          showSuggestions: false,
          availableQuantity: null,
        },
      ],
      equipment: [],
      glassware: [],
    },
  ]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const experimentRefs = useRef([]);
  // --- Equipment Handlers and State ---
  const [equipmentStock, setEquipmentStock] = useState([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState('');

  // Fetch dynamic labs and aggregate equipment from all labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLabsLoading(true);
        const response = await api.get('/labs?includeInactive=false');
        const labs = response.data?.data || [];
        setAvailableLabs(labs);
        return labs.map(lab => lab.labId);
      } catch (error) {
        console.error('Error fetching labs:', error);
        // Fallback to central-store if API fails
        const fallbackLabs = [{ labId: 'central-store', labName: 'Central Store', isSystem: true, isActive: true }];
        setAvailableLabs(fallbackLabs);
        return ['central-store'];
      } finally {
        setLabsLoading(false);
      }
    };

    const fetchEquipment = async () => {
      setEquipmentLoading(true);
      setEquipmentError('');
      try {
        // First fetch labs to get dynamic lab IDs
        const labIds = await fetchLabs();
        
        // Get live equipment data
        console.log('Fetching live equipment data...');
        const liveEquipment = await api.get('/equipment/live');
        console.log('Live Equipment Response:', {
          status: liveEquipment.status,
          data: liveEquipment.data,
          count: liveEquipment.data?.length || 0
        });
        
        // Get stock data from all labs using dynamic lab IDs
        console.log('Fetching lab-specific stock data...');
        const labPromises = labIds.map(labId => {
          console.log(`Fetching stock for lab ${labId}...`);
          return api.get(`/equipment/stock?labId=${labId}`)
            .then(response => {
              console.log(`Lab ${labId} Response:`, {
                status: response.status,
                data: response.data,
                count: response.data?.length || 0
              });
              // Add labId to each item
              return {
                labId,
                data: response.data || []
              };
            })
            .catch(error => {
              console.error(`Error fetching lab ${labId}:`, error.response || error);
              return Promise.reject(error);
            });
        });

        const labResults = await Promise.allSettled(labPromises);
        
        // Group by name+variant and calculate totals
        const grouped = {};
        
        // Helper function to add or update item in grouped
        const addToGrouped = (item, labId = 'CENTRAL') => {
          if (!item.name) {
            console.warn('Skipping item without name:', item);
            return;
          }

          const key = `${item.name}||${item.variant || ''}`;
          console.log(`Processing item for ${key} from ${labId}:`, item);

          // Initialize if not exists
          if (!grouped[key]) {
            grouped[key] = {
              name: item.name,
              variant: item.variant || '',
              available: 0,
              issued: 0,
              total: 0,
              labCounts: {}
            };
          }

          // Initialize lab counts if needed
          if (!grouped[key].labCounts[labId]) {
            grouped[key].labCounts[labId] = {
              available: 0,
              issued: 0
            };
          }

          // Update counts based on status
          if (item.status === 'issued') {
            grouped[key].issued += 1;
            grouped[key].labCounts[labId].issued += 1;
            console.log(`Added 1 issued to ${key} for ${labId}. New total issued: ${grouped[key].issued}`);
          } else {
            // Consider as available if status is 'available' or not set
            grouped[key].available += 1;
            grouped[key].labCounts[labId].available += 1;
            console.log(`Added 1 available to ${key} for ${labId}. New total available: ${grouped[key].available}`);
          }

          grouped[key].total += 1;
        };

        // Process live equipment data
        console.log('Processing live equipment data...');
        if (liveEquipment.data) {
          liveEquipment.data.forEach(item => {
            addToGrouped(item, 'LIVE');
          });
        }

        // Process lab-specific data
        console.log('Processing lab-specific data...');
        labResults
          .filter(res => res.status === 'fulfilled')
          .forEach(result => {
            const labId = result.value.labId;
            console.log(`Processing data for ${labId}...`);
            result.value.data.forEach(item => {
              addToGrouped(item, labId);
            });
          });

        // Final verification of counts
        Object.entries(grouped).forEach(([key, group]) => {
          console.log(`\nVerification for ${key}:`);
          console.log('Total counts:', {
            available: group.available,
            issued: group.issued,
            total: group.total
          });
          console.log('Lab-wise counts:', group.labCounts);
          
          // Verify that lab counts sum up to totals
          let labAvailableSum = 0;
          let labIssuedSum = 0;
          Object.values(group.labCounts).forEach(counts => {
            labAvailableSum += counts.available;
            labIssuedSum += counts.issued;
          });
          
          if (labAvailableSum !== group.available || labIssuedSum !== group.issued) {
            console.error('Count mismatch detected!', {
              key,
              totalAvailable: group.available,
              sumOfLabAvailable: labAvailableSum,
              totalIssued: group.issued,
              sumOfLabIssued: labIssuedSum
            });
            // Fix the counts if there's a mismatch
            group.available = labAvailableSum;
            group.issued = labIssuedSum;
            group.total = labAvailableSum + labIssuedSum;
          }

          // Set maxRequestable
          group.maxRequestable = group.available + group.issued;
        });

        console.log('\nFinal Equipment Summary:', 
          Object.entries(grouped).map(([key, value]) => ({
            key,
            available: value.available,
            issued: value.issued,
            total: value.total,
            maxRequestable: value.maxRequestable,
            labCounts: value.labCounts
          }))
        );

        setEquipmentStock(Object.values(grouped));
      } catch (err) {
        console.error('Equipment fetch error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          endpoint: err.config?.url,
          fullError: err
        });
        setEquipmentError(`Failed to fetch equipment data: ${err.response?.data?.message || err.message}`);
        setEquipmentStock([]);
      } finally {
        setEquipmentLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  // Fetch active courses
  const { data: coursesData = [] } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: async () => {
      const response = await api.get('/courses/active');
      return response.data.data;
    },
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      const response = await api.post('/requests', requestData);
      return response.data;
    },
    onSuccess: (data) => {
      const msg = data?.message || data?.msg || 'Request created successfully!';
      setTimeout(() => toast.success(msg, { autoClose: 4000 }), 100); // Ensure toast renders after state update
      setTimeout(() => {
        setLabId('');
        setExperiments([{
          experimentId: '',
          experimentName: '',
          date: '',
          courseId: '',
          batchId: '',
          chemicals: [{
            chemicalName: '',
            quantity: '',
            unit: '',
            chemicalMasterId: '',
            suggestions: [],
            showSuggestions: false,
            availableQuantity: null,
          }],
          equipment: [],
          glassware: [],
        }]);
      }, 200);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || 'Failed to create request';
      setTimeout(() => toast.error(`Request unsuccessful: ${msg}`, { autoClose: 5000 }), 100);
    },
  });

  const handleExperimentSelect = async (index, experiment) => {
    const newExperiments = [...experiments];
    if (newExperiments[index].experimentId) return; // Prevent reselection

    // Helper function to match and auto-fill chemicals
    const processDefaultChemicals = async (defaultChemicals) => {
      if (!defaultChemicals || defaultChemicals.length === 0) {
        return [{
          chemicalName: '',
          quantity: '',
          unit: '',
          chemicalMasterId: '',
          suggestions: [],
          showSuggestions: false,
          availableQuantity: null,
        }];
      }

      try {
        // Fetch available chemicals for matching
        const response = await api.get(`/chemicals/all-with-lab-quantities`);
        const availableChemicals = response.data.chemicals;

        return defaultChemicals.map(defaultChem => {
          // Find matching chemical by name (case-insensitive)
          const matchedChemical = availableChemicals.find(availableChem => 
            availableChem.displayName.toLowerCase().trim() === defaultChem.chemicalName.toLowerCase().trim()
          );

          if (matchedChemical) {
            const availableQty = calculateAvailableQuantity(matchedChemical, labId);
            const labQuantities = getLabQuantitiesForDisplay(matchedChemical, labId);
            const hasZeroQuantity = availableQty === 0;
            
            return {
              chemicalName: defaultChem.chemicalName,
              quantity: defaultChem.quantity,
              unit: defaultChem.unit,
              chemicalMasterId: matchedChemical._id,
              suggestions: [],
              showSuggestions: false,
              availableQuantity: availableQty,
              labs: matchedChemical.labs, // Include all lab quantities
              centralStoreQty: labQuantities.centralStoreQty,
              selectedLabQty: labQuantities.selectedLabQty,
              hasZeroQuantity,
              totalQuantity: matchedChemical.totalQuantity || 0,
            };
          } else {
            // If no match found, keep the default chemical but without ID
            return {
              chemicalName: defaultChem.chemicalName,
              quantity: defaultChem.quantity,
              unit: defaultChem.unit,
              chemicalMasterId: '',
              suggestions: [],
              showSuggestions: false,
              availableQuantity: null,
              isAvailableInLab: false,
            };
          }
        });
      } catch (err) {
        console.error('Error fetching chemicals for matching:', err);
        // If error, return default chemicals without matching
        return defaultChemicals.map(chem => ({
          chemicalName: chem.chemicalName,
          quantity: chem.quantity,
          unit: chem.unit,
          chemicalMasterId: '',
          suggestions: [],
          showSuggestions: false,
          availableQuantity: null,
        }));
      }
    };

    // Helper function to match and auto-fill glassware
    const processDefaultGlassware = async (defaultGlassware) => {
      if (!defaultGlassware || defaultGlassware.length === 0) {
        return [];
      }

      try {
        // Fetch available glassware for matching
        const response = await api.get(`/glassware/central/available`);
        const availableGlassware = response.data;

        return defaultGlassware.map(defaultGw => {
          // Find matching glassware by name (case-insensitive)
          const matchedGlassware = availableGlassware.find(availableGw => 
            availableGw.name.toLowerCase().trim() === defaultGw.name.toLowerCase().trim()
          );

          if (matchedGlassware) {
            return {
              glasswareId: matchedGlassware._id,
              productId: matchedGlassware.productId || '',
              name: defaultGw.name,
              variant: matchedGlassware.variant || matchedGlassware.unit,
              quantity: defaultGw.quantity,
              unit: defaultGw.unit,
              suggestions: [],
              showSuggestions: false,
              availableQuantity: matchedGlassware.quantity,
            };
          } else {
            // If no match found, keep the default glassware but without ID
            return {
              glasswareId: '',
              productId: '',
              name: defaultGw.name,
              variant: '',
              quantity: defaultGw.quantity,
              unit: defaultGw.unit,
              suggestions: [],
              showSuggestions: false,
              availableQuantity: null,
            };
          }
        });
      } catch (err) {
        console.error('Error fetching glassware for matching:', err);
        // If error, return default glassware without matching
        return defaultGlassware.map(gw => ({
          glasswareId: '',
          productId: '',
          name: gw.name,
          variant: '',
          quantity: gw.quantity,
          unit: gw.unit,
          suggestions: [],
          showSuggestions: false,
          availableQuantity: null,
        }));
      }
    };

    // Helper function to match and auto-fill equipment
    const processDefaultEquipment = (defaultEquipment) => {
      if (!defaultEquipment || defaultEquipment.length === 0) {
        return [];
      }

      return defaultEquipment.map(defaultEq => {
        // Find matching equipment by name (case-insensitive) using existing equipmentStock
        const matchedEquipment = equipmentStock.find(availableEq => 
          availableEq.name.toLowerCase().trim() === defaultEq.name.toLowerCase().trim()
        );

        if (matchedEquipment) {
          return {
            name: defaultEq.name,
            variant: matchedEquipment.variant,
            quantity: defaultEq.quantity,
            unit: defaultEq.unit || '',
            suggestions: [],
            showSuggestions: false,
            available: matchedEquipment.available,
            issued: matchedEquipment.issued,
            maxRequestable: matchedEquipment.available,
          };
        } else {
          // If no match found, keep the default equipment but without availability info
          return {
            name: defaultEq.name,
            variant: '',
            quantity: defaultEq.quantity,
            unit: defaultEq.unit || '',
            suggestions: [],
            showSuggestions: false,
            available: null,
            issued: null,
            maxRequestable: null,
          };
        }
      });
    };

    // Process all default items
    const processedChemicals = await processDefaultChemicals(experiment.defaultChemicals);
    const processedGlassware = await processDefaultGlassware(experiment.defaultGlassware);
    const processedEquipment = processDefaultEquipment(experiment.defaultEquipment);

    newExperiments[index] = {
      ...newExperiments[index],
      experimentId: experiment.experimentId,
      experimentName: experiment.experimentName,
      courseId: experiment.courseId || '', // Auto-fill course from experiment
      courseName: experiment.courseName || '', // Store course name for display
      courseCode: experiment.courseCode || '', // Store course code for display
      subjectId: experiment.subjectId || '',
      subjectName: experiment.subjectName || '',
      chemicals: processedChemicals,
      glassware: processedGlassware,
      equipment: processedEquipment,
    };
    setExperiments(newExperiments);
  };

  // Handle resetting experiment selection
  const handleResetExperiment = (index) => {
    const newExperiments = [...experiments];
    newExperiments[index] = {
      ...newExperiments[index],
      experimentId: '',
      experimentName: '',
      courseId: '', // Clear auto-filled course
      courseName: '', // Clear course name
      courseCode: '', // Clear course code
      subjectId: '',
      subjectName: '',
      chemicals: [], // Clear chemicals
      glassware: [], // Clear glassware
      equipment: [], // Clear equipment
    };
    setExperiments(newExperiments);
  };

  const handleExperimentChange = (index, field, value) => {
    const newExperiments = [...experiments];
    newExperiments[index][field] = value;
    setExperiments(newExperiments);
  };

  // Handle course change and reset batch
  const handleCourseChange = (expIndex, courseId) => {
    const newExperiments = [...experiments];
    newExperiments[expIndex].courseId = courseId;
    newExperiments[expIndex].batchId = ''; // Reset batch when course changes
    setExperiments(newExperiments);
  };

  // Get batches for a specific course
  const getBatchesForCourse = (courseId) => {
    const course = coursesData.find(c => c._id === courseId);
    return course ? course.batches : [];
  };

  const handleChemicalChange = (expIndex, chemIndex, field, value) => {
    const newExperiments = [...experiments];
    newExperiments[expIndex].chemicals[chemIndex][field] = value;
    setExperiments(newExperiments);
  };

  // Helper function to calculate available quantity for selected lab
  const calculateAvailableQuantity = (chemical, selectedLabId) => {
    if (!selectedLabId) {
      // If no lab selected, show only Central Store quantity
      if (!chemical.labs) {
        return chemical.totalQuantity || 0;
      }
      const centralStoreQty = chemical.labs.find(lab => lab.labId === 'central-store')?.quantity || 0;
      return centralStoreQty;
    }
    
    if (!chemical.labs) {
      return 0;
    }
    
    // Calculate central-store + selected lab quantities
    const centralStoreQty = chemical.labs.find(lab => lab.labId === 'central-store')?.quantity || 0;
    const selectedLabQty = chemical.labs.find(lab => lab.labId === selectedLabId)?.quantity || 0;
    
    return centralStoreQty + selectedLabQty;
  };

  // Helper function to get lab-specific quantities for display
  const getLabQuantitiesForDisplay = (chemical, selectedLabId) => {
    if (!chemical.labs) {
      return { centralStoreQty: 0, selectedLabQty: 0 };
    }
    
    const centralStoreQty = chemical.labs.find(lab => lab.labId === 'central-store')?.quantity || 0;
    const selectedLabQty = selectedLabId ? (chemical.labs.find(lab => lab.labId === selectedLabId)?.quantity || 0) : 0;
    
    return { centralStoreQty, selectedLabQty };
  };

  // Helper function to check if chemical is available in selected lab
  const isChemicalAvailableInLab = (chemical, selectedLabId) => {
    if (!selectedLabId || !chemical.labs) {
      return true; // If no lab selected, show all chemicals
    }
    
    // Check if chemical is available in central-store or selected lab
    const centralStoreQty = chemical.labs.find(lab => lab.labId === 'central-store')?.quantity || 0;
    const selectedLabQty = chemical.labs.find(lab => lab.labId === selectedLabId)?.quantity || 0;
    
    return (centralStoreQty + selectedLabQty) > 0;
  };

  // Debounced search function
  const debouncedSearch = React.useCallback(
    debounce(async (expIndex, chemIndex, searchTerm) => {
    if (!searchTerm.trim()) {
      const updated = [...experiments];
      updated[expIndex].chemicals[chemIndex] = {
        ...updated[expIndex].chemicals[chemIndex],
        suggestions: [],
        showSuggestions: false,
          availableQuantity: null,
          totalSuggestions: 0
      };
      setExperiments(updated);
      return;
    }

    try {
        const response = await api.get(`/chemicals/all-with-lab-quantities?search=${encodeURIComponent(searchTerm)}`);
        
        // Show ALL chemicals from ALL labs - no filtering
        const suggestions = response.data.chemicals.map(item => {
          const availableQty = calculateAvailableQuantity(item, labId);
          const labQuantities = getLabQuantitiesForDisplay(item, labId);
          const hasZeroQuantity = availableQty === 0;
          
          
          return {
            name: item.displayName,
        unit: item.unit,
        id: item._id,
            availableQuantity: availableQty,
            labs: item.labs, // Include all lab quantities
            centralStoreQty: labQuantities.centralStoreQty,
            selectedLabQty: labQuantities.selectedLabQty,
            hasZeroQuantity,
            totalQuantity: item.totalQuantity || 0, // Total across all labs
            // Add individual lab quantities for display
            individualLabQuantities: item.labs || [],
          };
        });

      const updated = [...experiments];
      updated[expIndex].chemicals[chemIndex] = {
        ...updated[expIndex].chemicals[chemIndex],
        suggestions,
        showSuggestions: true,
          totalSuggestions: suggestions.length,
      };
      setExperiments(updated);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search chemicals');
    }
    }, 300),
    [labId, experiments]
  );

  const handleChemicalSearch = (expIndex, chemIndex, searchTerm) => {
    handleChemicalChange(expIndex, chemIndex, 'chemicalName', searchTerm);
    debouncedSearch(expIndex, chemIndex, searchTerm);
  };

  const handleChemicalSelect = (expIndex, chemIndex, suggestion) => {
    const updated = [...experiments];
    
    // Create a proper chemical object structure for quantity calculations
    const chemicalForCalculation = {
      labs: suggestion.labs || [],
      totalQuantity: suggestion.totalQuantity || 0
    };
    
    const availableQty = calculateAvailableQuantity(chemicalForCalculation, labId);
    const labQuantities = getLabQuantitiesForDisplay(chemicalForCalculation, labId);
    const hasZeroQuantity = availableQty === 0;
    
    const newChemical = {
      chemicalName: suggestion.name,
      unit: suggestion.unit,
      chemicalMasterId: suggestion.id,
      quantity: '',
      suggestions: [],
      showSuggestions: false,
      availableQuantity: availableQty,
      labs: suggestion.labs || [], // Include all lab quantities
      centralStoreQty: labQuantities.centralStoreQty,
      selectedLabQty: labQuantities.selectedLabQty,
      hasZeroQuantity,
      totalQuantity: suggestion.totalQuantity || 0,
    };
    
    updated[expIndex].chemicals[chemIndex] = newChemical;
    setExperiments(updated);
  };

  const handleFocus = (expIndex, chemIndex) => {
    const updated = [...experiments];
    const chemical = updated[expIndex].chemicals[chemIndex];
    if (chemical.chemicalName.trim() && chemical.suggestions.length > 0) {
      chemical.showSuggestions = true;
      setExperiments(updated);
    }
  };

  const handleBlur = (expIndex, chemIndex) => {
    setTimeout(() => {
      const updated = [...experiments];
      updated[expIndex].chemicals[chemIndex].showSuggestions = false;
      setExperiments(updated);
    }, 200);
  };

  // Refresh chemical suggestions when lab changes
  const refreshChemicalSuggestions = async (expIndex, chemIndex) => {
    const chemical = experiments[expIndex].chemicals[chemIndex];
    if (chemical.chemicalName.trim()) {
      await handleChemicalSearch(expIndex, chemIndex, chemical.chemicalName);
    }
  };

  // Handle lab change and update quantities only
  const handleLabChange = (newLabId) => {
    setLabId(newLabId);
    
    // Update all existing chemicals with new lab quantities
    const updatedExperiments = experiments.map(experiment => ({
      ...experiment,
      chemicals: experiment.chemicals.map(chemical => {
        if (chemical.chemicalMasterId && chemical.labs) {
          const availableQty = calculateAvailableQuantity(chemical, newLabId);
          const labQuantities = getLabQuantitiesForDisplay(chemical, newLabId);
          const hasZeroQuantity = availableQty === 0;
          
          return {
            ...chemical,
            availableQuantity: availableQty,
            centralStoreQty: labQuantities.centralStoreQty,
            selectedLabQty: labQuantities.selectedLabQty,
            hasZeroQuantity,
          };
        }
        return chemical;
      })
    }));
    
    setExperiments(updatedExperiments);
  };
  // --- Glassware Handlers ---
  const handleGlasswareChange = (expIndex, gwIndex, field, value) => {
    console.log(`Updating glassware[${expIndex}][${gwIndex}].${field} = "${value}"`); // Debug log
    const newExperiments = [...experiments];
    newExperiments[expIndex].glassware[gwIndex][field] = value;
    console.log('Updated glassware object:', newExperiments[expIndex].glassware[gwIndex]); // Debug log
    setExperiments(newExperiments);
  };const handleGlasswareSearch = async (expIndex, gwIndex, searchTerm) => {
    console.log(`Setting glassware name to: "${searchTerm}" for experiment ${expIndex}, glassware ${gwIndex}`); // Debug log
    handleGlasswareChange(expIndex, gwIndex, 'name', searchTerm);
    if (!searchTerm.trim()) {
      const updated = [...experiments];
      updated[expIndex].glassware[gwIndex] = {
        ...updated[expIndex].glassware[gwIndex],
        suggestions: [],
        showSuggestions: false,
        availableQuantity: null
      };
      setExperiments(updated);
      return;
    }
    try {
      const response = await api.get(`/glassware/central/available`);
      const suggestions = response.data.map(item => ({
        name: item.name,
        unit: item.unit, // Ensure unit is always included
        id: item._id,
        availableQuantity: item.quantity,
        variant: item.variant || item.unit,
        productId: item.productId || '',
      }));
      const updated = [...experiments];
      updated[expIndex].glassware[gwIndex] = {
        ...updated[expIndex].glassware[gwIndex],
        suggestions,
        showSuggestions: true,
      };
      setExperiments(updated);
    } catch (err) {
      console.error('Glassware search error:', err);
      toast.error('Failed to search glassware');
    }
  };
  const handleGlasswareSelect = (expIndex, gwIndex, suggestion) => {
    console.log('Selecting glassware suggestion:', suggestion); // Debug log
    const updated = [...experiments];
    updated[expIndex].glassware[gwIndex] = {
      name: suggestion.name,
      unit: suggestion.unit, // Always set unit from suggestion
      glasswareId: suggestion.id,
      productId: suggestion.productId,
      variant: suggestion.variant || suggestion.unit,
      quantity: '',
      suggestions: [],
      showSuggestions: false,
      availableQuantity: suggestion.availableQuantity,
    };
    console.log('Updated glassware after selection:', updated[expIndex].glassware[gwIndex]); // Debug log
    setExperiments(updated);
  };

  const addChemical = (expIndex) => {
    const newExperiments = [...experiments];
    newExperiments[expIndex].chemicals.push({
      chemicalName: '',
      quantity: '',
      unit: '',
      chemicalMasterId: '',
      suggestions: [],
      showSuggestions: false,
      availableQuantity: null,
    });
    setExperiments(newExperiments);
  };

  const removeChemical = (expIndex, chemIndex) => {
    const newExperiments = [...experiments];
    if (newExperiments[expIndex].chemicals.length > 1) {
      newExperiments[expIndex].chemicals.splice(chemIndex, 1);
      setExperiments(newExperiments);
    }
  };

  const addGlassware = (expIndex) => {
    const newExperiments = [...experiments];
    if (!newExperiments[expIndex].glassware) newExperiments[expIndex].glassware = [];
    newExperiments[expIndex].glassware.push({
      glasswareId: '',
      productId: '',
      name: '',
      variant: '',
      quantity: '',
      unit: '',
      suggestions: [],
      showSuggestions: false,
      availableQuantity: null,
    });
    setExperiments(newExperiments);
  };

  // Equipment handlers
  const handleEquipmentChange = (expIndex, eqIndex, field, value) => {
    const newExperiments = [...experiments];
    newExperiments[expIndex].equipment[eqIndex][field] = value;
    setExperiments(newExperiments);
  };

  const handleEquipmentSearch = (expIndex, eqIndex, searchTerm) => {
    handleEquipmentChange(expIndex, eqIndex, 'name', searchTerm);
    if (!searchTerm.trim()) {
      const updated = [...experiments];
      updated[expIndex].equipment[eqIndex] = {
        ...updated[expIndex].equipment[eqIndex],
        suggestions: [],
        showSuggestions: false,
        variant: '',
        available: null,
        issued: null,
        maxRequestable: null,
        unit: '',
      };
      setExperiments(updated);
      return;
    }
    // Filter suggestions
    const suggestions = equipmentStock.filter(eq => eq.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const updated = [...experiments];
    updated[expIndex].equipment[eqIndex] = {
      ...updated[expIndex].equipment[eqIndex],
      suggestions,
      showSuggestions: true,
    };
    setExperiments(updated);
  };

  const handleEquipmentSelect = (expIndex, eqIndex, suggestion) => {
    const updated = [...experiments];
    updated[expIndex].equipment[eqIndex] = {
      name: suggestion.name,
      variant: suggestion.variant,
      available: suggestion.available,
      issued: suggestion.issued,
      maxRequestable: suggestion.available,
      quantity: '',
      suggestions: [],
      showSuggestions: false,
    };
    setExperiments(updated);
  };

  const addEquipment = (expIndex) => {
    const newExperiments = [...experiments];
    if (!newExperiments[expIndex].equipment) newExperiments[expIndex].equipment = [];
    newExperiments[expIndex].equipment.push({
      name: '',
      variant: '',
      quantity: '',
      unit: '',
      suggestions: [],
      showSuggestions: false,
      available: null,
      issued: null,
      maxRequestable: null,
    });
    setExperiments(newExperiments);
  };

  // Scroll to new experiment card when added
  const handleAddExperiment = () => {
    setExperiments(prev => {
      const newArr = [
        ...prev,
        {
          experimentId: '',
          experimentName: '',
          courseId: '',
          batchId: '',
          date: '',
          chemicals: [{
            chemicalName: '',
            quantity: '',
            unit: '',
            chemicalMasterId: '',
            suggestions: [],
            showSuggestions: false,
            availableQuantity: null,
          }],
          equipment: [],
          glassware: [],
        },
      ];
      setTimeout(() => {
        if (experimentRefs.current[newArr.length - 1]) {
          experimentRefs.current[newArr.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return newArr;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    // Validate lab selection
    if (!labId) {
      setFormError('Please select a lab');
      toast.error('Please select a lab');
      return;
    }

    // Validate experiments
    if (experiments.length === 0) {
      setFormError('Please add at least one experiment');
      toast.error('Please add at least one experiment');
      return;
    }

    // Validate each experiment
    for (const exp of experiments) {
      if (!exp.experimentId || !exp.date || !exp.courseId || !exp.batchId) {
        setFormError('Please fill in all experiment details including course and batch');
        toast.error('Please fill in all experiment details including course and batch');
        return;
      }

      // Validate chemicals
      if (exp.chemicals.length === 0) {
        setFormError('Please add at least one chemical for each experiment');
        toast.error('Please add at least one chemical for each experiment');
        return;
      }

      for (const chem of exp.chemicals) {
        if (!chem.chemicalName || !chem.quantity || !chem.unit) {
          setFormError('Please fill in all chemical details');
          toast.error('Please fill in all chemical details');
          return;
        }

        if (isNaN(chem.quantity) || Number(chem.quantity) <= 0) {
          setFormError('Please enter a valid quantity for chemicals');
          toast.error('Please enter a valid quantity for chemicals');
          return;
        }
      }
    }

    const formatted = {
      labId,
      experiments: experiments.map((exp, expIndex) => {
        console.log(`Processing experiment ${expIndex}:`, exp); // Debug log
        console.log(`Glassware in experiment ${expIndex}:`, exp.glassware); // Debug log
        
        return {
          experimentId: exp.experimentId,
          experimentName: exp.experimentName,
          courseId: exp.courseId,
          batchId: exp.batchId,
          date: exp.date,
          chemicals: exp.chemicals.map(chem => ({
            chemicalMasterId: chem.chemicalMasterId,
            quantity: Number(chem.quantity),
            chemicalName: chem.chemicalName,
            unit: chem.unit,
          })),        glassware: (exp.glassware || [])
            .filter(gw => {
              const isValid = gw.name && gw.name.trim() && gw.quantity && Number(gw.quantity) > 0;
              console.log(`Filtering glassware:`, { gw, isValid }); // Debug log
              return isValid;
            }) // Only include valid glassware
            .map(gw => {
              const payload = {
                glasswareId: gw.glasswareId || '',
                productId: gw.productId || '',
                name: gw.name.trim(), // Always send name and trim it
                variant: gw.variant || gw.unit || 'piece',
                quantity: Number(gw.quantity),
                unit: gw.unit || 'piece', // Default unit if not set
              };
              console.log('Final glassware payload:', payload); // Debug log
              return payload;
            }),
          equipment: (exp.equipment || []).map(eq => ({
            name: eq.name,
            variant: eq.variant,
            quantity: Number(eq.quantity),
            unit: eq.unit,
          })),
        };
      }),
    };

    console.log('Complete formatted request payload:', JSON.stringify(formatted, null, 2)); // Debug log

    createRequestMutation.mutate(formatted);
    setFormSuccess('Request submitted successfully!');
  };

  const renderChemicalInput = (expIndex, chemIndex) => {
    const chemical = experiments[expIndex].chemicals[chemIndex];
    
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-blue-500/5 border border-white/30 p-4 sm:p-6 lg:${CLAY_CARD} lg:p-6 relative group`}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center">
          {/* Chemical Name */}
          <div className="sm:col-span-5 relative z-40">
            <label className={`${CLAY_LABEL} text-sm`}>Chemical Name</label>
            <input
              type="text"
              placeholder="Search chemical..."
              value={chemical.chemicalName}
              onChange={(e) => handleChemicalSearch(expIndex, chemIndex, e.target.value)}
              onFocus={() => handleFocus(expIndex, chemIndex)}
              onBlur={() => handleBlur(expIndex, chemIndex)}
              required
              className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
            />
            {chemical.showSuggestions && chemical.suggestions.length > 0 && (
              <div className="absolute z-[9999] mt-2 w-full bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-blue-500/20 max-h-60 overflow-auto">
                {/* Count display */}
                <div className="px-4 py-3 text-sm text-slate-600 bg-slate-100/60 border-b border-white/30 rounded-t-2xl">
                  Showing {chemical.suggestions.length} chemical{chemical.suggestions.length !== 1 ? 's' : ''}
                </div>
                
                <ul>
                {chemical.suggestions.map((sug, idx) => (
                  <li
                    key={`suggestion-${expIndex}-${chemIndex}-${idx}`}
                      className={`px-4 py-3 text-sm hover:bg-blue-100/60 cursor-pointer border-b border-white/20 last:border-b-0 transition-all duration-200 ${
                        sug.hasZeroQuantity ? 'bg-red-100/60 hover:bg-red-200/60' : 'hover:bg-blue-100/60'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleChemicalSelect(expIndex, chemIndex, sug);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                      <span className="font-medium">{sug.name}</span>
                            {sug.hasZeroQuantity && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                ⚠️ Not Available
                      </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {labId ? `Available for ${labId}: ${sug.availableQuantity} ${sug.unit}` : `Central Store Available: ${sug.availableQuantity} ${sug.unit}`}
                          </div>
                          {sug.hasZeroQuantity && (
                            <div className="text-xs text-red-600 mt-1">
                              Total across all labs: {sug.totalQuantity} {sug.unit}
                            </div>
                          )}
                          {labId && sug.individualLabQuantities && sug.individualLabQuantities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sug.individualLabQuantities.map((lab, labIdx) => (
                                <span 
                                  key={labIdx} 
                                  className={`text-xs px-2 py-1 rounded ${
                                    lab.labId === 'central-store' 
                                      ? 'bg-green-100 text-green-700' 
                                      : lab.labId === labId 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {lab.labId}: {lab.quantity}
                                </span>
                              ))}
                            </div>
                          )}
                          {!labId && sug.individualLabQuantities && sug.individualLabQuantities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sug.individualLabQuantities.slice(0, 3).map((lab, labIdx) => (
                                <span 
                                  key={labIdx} 
                                  className={`text-xs px-2 py-1 rounded ${
                                    lab.labId === 'central-store' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {lab.labId}: {lab.quantity}
                                </span>
                              ))}
                              {sug.individualLabQuantities.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{sug.individualLabQuantities.length - 3} more labs
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="sm:col-span-3">
            <label className={`${CLAY_LABEL} text-sm`}>Quantity</label>
            <input
              type="number"
              placeholder="0"
              value={chemical.quantity}
              onChange={(e) => handleChemicalChange(expIndex, chemIndex, 'quantity', e.target.value)}
              required
              className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
              max={chemical.availableQuantity || undefined}
              min="0"
              step="0.01"
            />
            {chemical.availableQuantity !== null && (
              <div className="mt-1 text-xs">
                <div className="flex items-center">
                  <span className="text-gray-500">
                    {labId ? `Available for ${labId}: ${chemical.availableQuantity} ${chemical.unit}` : `Central Store Available: ${chemical.availableQuantity} ${chemical.unit}`}
                  </span>
                {chemical.quantity > chemical.availableQuantity && (
                  <span className="ml-2 text-red-500 font-medium">
                    (Exceeds limit)
                  </span>
                )}
                </div>
                {chemical.availableQuantity === 0 && (
                  <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    ⚠️ Not available in selected context. Total across all labs: {chemical.totalQuantity || 0} {chemical.unit}
                  </div>
                )}
                {labId && chemical.centralStoreQty !== undefined && chemical.selectedLabQty !== undefined && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Central: {chemical.centralStoreQty}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {labId}: {chemical.selectedLabQty}
                    </span>
                  </div>
                )}
                {!labId && chemical.labs && chemical.labs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {chemical.labs.slice(0, 4).map((lab, labIdx) => (
                      <span key={labIdx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {lab.labId}: {lab.quantity}
                      </span>
                    ))}
                    {chemical.labs.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{chemical.labs.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unit */}
          <div className="sm:col-span-3">
            <label className={`${CLAY_LABEL} text-sm`}>Unit</label>
            <input
              type="text"
              placeholder="g, ml, etc."
              value={chemical.unit}
              readOnly
              className={`${CLAY_INPUT} w-full px-4 py-3 text-sm bg-gray-100/60 text-gray-600`}
            />
          </div>

          {/* Delete Button */}
          <div className="sm:col-span-1 flex justify-center sm:justify-center">
            <button
              type="button"
              onClick={() => removeChemical(expIndex, chemIndex)}
              className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100/60 rounded-2xl transition-all duration-200 group-hover:opacity-100 opacity-60 shadow-lg shadow-red-500/10"
              title="Remove chemical"
              disabled={experiments[expIndex].chemicals.length <= 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGlasswareInput = (expIndex, gwIndex) => {
    const gw = experiments[expIndex].glassware[gwIndex];
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-blue-500/5 border border-white/30 p-4 sm:p-6 lg:${CLAY_CARD} lg:p-6 relative group`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <div className="relative z-40">
          <label className={`${CLAY_LABEL} text-sm`}>Glassware Name</label>
          <input
            type="text"
            placeholder="Search glassware"
            value={gw.name}
            onChange={e => handleGlasswareSearch(expIndex, gwIndex, e.target.value)}
            onFocus={() => handleGlasswareSearch(expIndex, gwIndex, gw.name || '')}
            onBlur={() => setTimeout(() => {
              const updated = [...experiments];
              updated[expIndex].glassware[gwIndex].showSuggestions = false;
              setExperiments(updated);
            }, 200)}
            required
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
          />
          {gw.showSuggestions && gw.suggestions.length > 0 && (
            <ul className="absolute z-[9999] mt-2 w-full bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-blue-500/20 max-h-60 overflow-auto">
              {gw.suggestions.map((sug, idx) => (
                <li
                  key={`glassware-suggestion-${expIndex}-${gwIndex}-${idx}`}
                  className="px-4 py-3 text-sm hover:bg-blue-100/60 cursor-pointer border-b border-white/20 last:border-b-0 transition-all duration-200"
                  onClick={() => handleGlasswareSelect(expIndex, gwIndex, sug)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{sug.name}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Available: {sug.availableQuantity} {sug.unit}
                    </span>
                    {sug.variant && (
                      <span className="ml-2 text-xs text-gray-500">{sug.variant}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className={`${CLAY_LABEL} text-sm`}>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            value={gw.quantity}
            onChange={e => handleGlasswareChange(expIndex, gwIndex, 'quantity', e.target.value)}
            required
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
            max={gw.availableQuantity || undefined}
          />
          {gw.availableQuantity !== null && (
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>Available: {gw.availableQuantity} {gw.unit}</span>
              {gw.quantity > gw.availableQuantity && (
                <span className="ml-2 text-red-500 font-medium">
                  (Exceeds available quantity)
                </span>
              )}
            </div>
          )}
        </div>        
        <div>
          <label className={`${CLAY_LABEL} text-sm`}>Unit</label>
          <input
            type="text"
            placeholder="Unit (e.g., piece, ml, etc.)"
            value={gw.unit}
            onChange={e => handleGlasswareChange(expIndex, gwIndex, 'unit', e.target.value)}
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm ${
              gw.glasswareId ? 'bg-gray-100/60' : 'bg-white/60'
            }`}
            readOnly={!!gw.glasswareId} // Only readonly if selected from suggestions
          />
          {gw.glasswareId && (
            <div className="text-xs text-slate-500 mt-2 bg-slate-100/60 px-3 py-1 rounded-lg">
              Unit is set from selected glassware
            </div>
          )}
        </div>
        </div>
        
        {/* Remove Button */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => {
              const newExperiments = [...experiments];
              newExperiments[expIndex].glassware.splice(gwIndex, 1);
              setExperiments(newExperiments);
            }}
            className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100/60 rounded-2xl transition-all duration-200 group-hover:opacity-100 opacity-60 shadow-lg shadow-red-500/10"
            title="Remove glassware"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderEquipmentDebugInfo = () => {
    if (!equipmentError) return null;
    
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="text-red-800 font-semibold mb-2">Debug Information:</h4>
        <p className="text-red-700">{equipmentError}</p>
        <p className="text-sm text-red-600 mt-2">
          Total items loaded: {equipmentStock.length}
        </p>
        {equipmentStock.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-red-600">Sample item structure:</p>
            <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(equipmentStock[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderEquipmentInput = (expIndex, eqIndex) => {
    const eq = experiments[expIndex].equipment[eqIndex];
    return (
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-md shadow-blue-500/5 border border-white/30 p-4 sm:p-6 lg:${CLAY_CARD} lg:p-6 relative group`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <div className="relative z-40">
          <label className={`${CLAY_LABEL} text-sm`}>Equipment Name</label>
          <input
            type="text"
            placeholder="Search equipment"
            value={eq.name}
            onChange={e => handleEquipmentSearch(expIndex, eqIndex, e.target.value)}
            onFocus={() => handleEquipmentSearch(expIndex, eqIndex, eq.name || '')}
            onBlur={() => setTimeout(() => {
              const updated = [...experiments];
              updated[expIndex].equipment[eqIndex].showSuggestions = false;
              setExperiments(updated);
            }, 200)}
            required
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
          />
          {eq.showSuggestions && eq.suggestions && eq.suggestions.length > 0 && (
            <ul className="absolute z-[9999] mt-2 w-full bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl shadow-blue-500/20 max-h-60 overflow-auto">
              {eq.suggestions.map((sug, idx) => (
                <li
                  key={`equipment-suggestion-${expIndex}-${eqIndex}-${idx}`}
                  className="px-4 py-3 text-sm hover:bg-blue-100/60 cursor-pointer border-b border-white/20 last:border-b-0 transition-all duration-200"
                  onClick={() => handleEquipmentSelect(expIndex, eqIndex, sug)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{sug.name}</span>
                      {sug.variant && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {sug.variant}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Total Available: {sug.available}
                        </span>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Total Issued: {sug.issued}
                        </span>
                      </div>
                      {sug.labCounts && Object.entries(sug.labCounts)
                        .filter(([_, counts]) => counts.available > 0 || counts.issued > 0)
                        .map(([labId, counts]) => (
                          <div key={labId} className="text-xs text-gray-600 flex items-center gap-1">
                            <span className="font-medium">{labId}:</span>
                            <span className="text-green-600">Available: {counts.available}</span>
                            <span className="text-yellow-600">Issued: {counts.issued}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className={`${CLAY_LABEL} text-sm`}>Variant</label>
          <input
            type="text"
            value={eq.variant}
            readOnly
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm bg-gray-100/60`}
          />
        </div>
        <div>
          <label className={`${CLAY_LABEL} text-sm`}>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            value={eq.quantity}
            onChange={e => handleEquipmentChange(expIndex, eqIndex, 'quantity', e.target.value)}
            required
            className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
            min={1}
            max={eq.available || undefined}
          />
          {eq.available !== null && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Available: {eq.available}
                </span>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  Issued: {eq.issued}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Max Requestable: {eq.available}
                </span>
                {eq.quantity > eq.available && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full animate-pulse">
                    Exceeds available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
        
        {/* Remove Button */}
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => {
              const newExperiments = [...experiments];
              newExperiments[expIndex].equipment.splice(eqIndex, 1);
              setExperiments(newExperiments);
            }}
            className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100/60 rounded-2xl transition-all duration-200 group-hover:opacity-100 opacity-60 shadow-lg shadow-red-500/10"
            title="Remove equipment"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderEquipmentSection = (expIndex) => {
    return (
      <div className="space-y-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`${THEME.secondaryBg} p-2 rounded-xl shadow-lg shadow-indigo-500/25 text-white`}>
            <ChemicalIcon />
            </div>
            <h4 className={`${CLAY_SUBHEADER}`}>Equipment</h4>
            {equipmentLoading && (
              <span className="text-sm bg-blue-100/60 text-blue-800 px-3 py-1 rounded-full animate-pulse font-medium">
                Loading...
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => addEquipment(expIndex)}
            className={`${CLAY_BTN_SECONDARY} text-sm w-full sm:w-auto`}
            aria-label="Add equipment"
            title="Add equipment"
          >
            + Add Equipment
          </button>
        </div>
        
        {renderEquipmentDebugInfo()}

        {experiments[expIndex].equipment && experiments[expIndex].equipment.map((_, eqIndex) => (
          <div key={`equipment-${expIndex}-${eqIndex}`}>{renderEquipmentInput(expIndex, eqIndex)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Floating claymorphism bubbles - hidden on small/medium screens */}
      <div className="hidden lg:block fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-0 w-full">
        {/* Transparent background on small/medium, card on large screens */}
        <div className={`w-full ${
          // Small and medium screens: transparent background, full width
          'bg-transparent p-2 sm:p-4 md:p-6' 
        } ${
          // Large screens: card background with max width
          'lg:bg-white/60 lg:backdrop-blur-xl lg:rounded-3xl lg:shadow-2xl lg:shadow-blue-500/10 lg:border lg:border-white/30 lg:p-8 lg:max-w-7xl lg:mx-auto'
        }`}>
          {/* Header */}
          <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200/50 lg:border-white/30">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`${THEME.secondaryBg} p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/25 text-white`}>
                <ExperimentIcon />
              </div>
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 lg:text-slate-800`}>Create New Request</h1>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Lab ID Selection */}
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/10 border border-white/40 p-4 sm:p-6 lg:${CLAY_CARD} lg:p-6`}>
              <label className={`${CLAY_LABEL} text-sm sm:text-base`}>Lab ID</label>
              <select
                value={labId}
                onChange={(e) => handleLabChange(e.target.value)}
                required
                className={`w-full ${CLAY_INPUT} px-4 py-3 text-sm`}
                aria-label="Select Lab"
              >
                <option value="">Select Lab</option>
                {availableLabs.map((lab) => (
                  <option key={lab.labId} value={lab.labId}>
                    {lab.labName} ({lab.labId})
                  </option>
                ))}
              </select>
              {!labId && (
                <div className="mt-4 bg-amber-100/60 backdrop-blur-sm border border-amber-200/50 rounded-2xl px-4 py-3 shadow-lg shadow-amber-500/10">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-amber-800 leading-relaxed">Showing Central Store quantities only. Select a lab to see lab-specific availability</span>
                  </div>
                </div>
              )}
              {labId && (
                <div className="mt-4 bg-green-100/60 backdrop-blur-sm border border-green-200/50 rounded-2xl px-4 py-3 shadow-lg shadow-green-500/10">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800 leading-relaxed">Showing chemicals available in Central Store + {labId}</span>
                  </div>
                </div>
              )}
            </div>
            {experiments.map((experiment, expIndex) => (
              <div
                key={`experiment-${expIndex}`}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/10 border border-white/40 p-4 sm:p-6 lg:${CLAY_SECTION} transition-all duration-500 relative group`}
                ref={el => (experimentRefs.current[expIndex] = el)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`${THEME.secondaryBg} p-3 rounded-2xl shadow-lg shadow-indigo-500/25 text-white`}>
                    <ExperimentIcon />
                    </div>
                    <h3 className={`${CLAY_SUBHEADER}`}>Experiment {expIndex + 1}</h3>
                  </div>
                  {expIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormError('');
                        setFormSuccess('');
                        const newExperiments = [...experiments];
                        newExperiments.splice(expIndex, 1);
                        setExperiments(newExperiments);
                      }}
                      className={`${CLAY_BTN_DANGER} text-sm sm:text-base`}
                      aria-label="Remove this experiment"
                      title="Remove this experiment"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Only allow experiment selection if not already selected */}
                {!experiment.experimentId && (
                  <div className="mb-8 transition-all duration-500">
                    <ExperimentSelector
                      key={`selector-${expIndex}`}
                      onExperimentSelect={(experiment) => handleExperimentSelect(expIndex, experiment)}
                    />
                  </div>
                )}
                {experiment.experimentId && (
                  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/10 border border-white/40 p-4 sm:p-6 lg:${CLAY_CARD} lg:p-6 mb-6 sm:mb-8 transition-all duration-500`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`${THEME.primaryBg} text-white px-4 py-2 rounded-2xl shadow-lg shadow-indigo-500/25 font-semibold text-lg`}>{experiment.experimentName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResetExperiment(expIndex)}
                          className={`${CLAY_BTN_DANGER} text-sm flex items-center gap-2`}
                          title="Reset experiment selection"
                        >
                          <span>×</span>
                          Reset
                        </button>
                      </div>
                      {(experiment.courseId || experiment.batchId) && (
                        <div className={`text-sm ${THEME.secondaryText} ml-1`}>
                          {experiment.courseId && (
                            <span>
                              Course: {coursesData.find(c => c._id === experiment.courseId)?.courseName} ({coursesData.find(c => c._id === experiment.courseId)?.courseCode})
                            </span>
                          )}
                          {experiment.courseId && experiment.batchId && <span className="mx-2">|</span>}
                          {experiment.batchId && (
                            <span>
                              Batch: {getBatchesForCourse(experiment.courseId).find(b => b._id === experiment.batchId)?.batchName} ({getBatchesForCourse(experiment.courseId).find(b => b._id === experiment.batchId)?.batchCode}) - {getBatchesForCourse(experiment.courseId).find(b => b._id === experiment.batchId)?.academicYear}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className={`${CLAY_LABEL}`}>Date</label>
                    <input
                      type="date"
                      value={experiment.date}
                      onChange={(e) => handleExperimentChange(expIndex, 'date', e.target.value)}
                      required
                      className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
                      aria-label="Experiment date"
                    />
                  </div>
                  <div>
                    <label className={`${CLAY_LABEL}`}>Course</label>
                    {experiment.experimentId ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={`${experiment.courseName} (${experiment.courseCode})`}
                          readOnly
                          className={`${CLAY_INPUT} w-full px-4 py-3 text-sm bg-green-100/60 border-green-300/50 text-green-800 cursor-not-allowed`}
                          aria-label="Course (Auto-filled from experiment)"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-green-600 text-xs font-medium">✓ Auto-filled</span>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={experiment.courseId}
                        onChange={(e) => handleCourseChange(expIndex, e.target.value)}
                        required
                        className={`${CLAY_INPUT} w-full px-4 py-3 text-sm`}
                        aria-label="Course"
                      >
                        <option value="">Select Course</option>
                        {coursesData.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.courseName} ({course.courseCode})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className={`${CLAY_LABEL}`}>Batch</label>
                    <select
                      value={experiment.batchId || ''}
                      onChange={(e) => handleExperimentChange(expIndex, 'batchId', e.target.value)}
                      required
                      disabled={!experiment.courseId || experiment.courseId === ''}
                      className={`${CLAY_INPUT} w-full px-4 py-3 text-sm ${(!experiment.courseId || experiment.courseId === '') ? 'bg-gray-100/60 cursor-not-allowed' : 'bg-white/60'}`}
                      aria-label="Batch"
                    >
                      <option value="">
                        {(!experiment.courseId || experiment.courseId === '') ? 'Select Course First' : 'Select Batch'}
                      </option>
                      {experiment.courseId && experiment.courseId !== '' && getBatchesForCourse(experiment.courseId).map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batchName} ({batch.batchCode}) - {batch.academicYear}
                        </option>
                      ))}
                    </select>
                    {experiment.experimentId && experiment.courseId && experiment.courseId !== '' && (
                      <div className="mt-2 text-xs text-green-600 bg-green-100/60 px-3 py-1 rounded-lg">
                        <span>✓</span> Course auto-filled - Please select appropriate batch
                      </div>
                    )}
                  </div>
                </div>

                {/* Chemicals Section */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`${THEME.secondaryBg} p-2 rounded-xl shadow-lg shadow-indigo-500/25 text-white`}>
                      <ChemicalIcon />
                      </div>
                      <h4 className={`${CLAY_SUBHEADER}`}>Required Chemicals</h4>
                      {experiment.chemicals.length > 0 && (
                        <span className="bg-blue-100/60 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                          {experiment.chemicals.length} item{experiment.chemicals.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addChemical(expIndex)}
                      className={`${CLAY_BTN} flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center`}
                      aria-label="Add chemical"
                      title="Add chemical"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Chemical
                    </button>
                  </div>
                  {experiment.chemicals.map((_, chemIndex) => (
                    <div key={`chemical-${expIndex}-${chemIndex}`}>{renderChemicalInput(expIndex, chemIndex)}</div>
                  ))}
                </div>

                {/* Glassware Section */}
                <div className="space-y-6 mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`${THEME.secondaryBg} p-2 rounded-xl shadow-lg shadow-indigo-500/25 text-white`}>
                      <ChemicalIcon />
                      </div>
                      <h4 className={`${CLAY_SUBHEADER}`}>Glassware</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => addGlassware(expIndex)}
                      className={`${CLAY_BTN_SECONDARY} text-sm w-full sm:w-auto`}
                      aria-label="Add glassware"
                      title="Add glassware"
                    >
                      + Add Glassware
                    </button>
                  </div>
                  {experiment.glassware && experiment.glassware.map((_, gwIndex) => (
                    <div key={`glassware-${expIndex}-${gwIndex}`}>{renderGlasswareInput(expIndex, gwIndex)}</div>
                  ))}
                </div>

                {/* Equipment Section */}
                {renderEquipmentSection(expIndex)}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddExperiment}
              className={`${CLAY_BTN} w-full py-4 mt-8 disabled:opacity-60 text-sm sm:text-base`}
              aria-label="Add another experiment"
              title="Add another experiment"
              disabled={experiments.some(e => !e.experimentId)}
            >
              + Add Another Experiment
            </button>

            <div className="flex justify-center mt-12">
              <button
                type="submit"
                disabled={createRequestMutation.isLoading}
                className={`${CLAY_BTN_PRIMARY} px-8 sm:px-16 py-4 sm:py-5 text-lg sm:text-xl font-bold disabled:opacity-60 w-full sm:w-auto`}
                aria-label="Submit request"
              >
                {createRequestMutation.isLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin -ml-1 mr-2 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-base">Submitting Request...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="text-base">Submit Request</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestForm;