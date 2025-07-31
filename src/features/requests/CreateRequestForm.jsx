import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ExperimentSelector from './ExperimentSelector';
import { toast } from 'react-toastify';

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

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white/95 backdrop-blur-md border border-[#BCE0FD]/30 shadow-xl',
  border: 'border-[#BCE0FD]/20',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  mutedText: 'text-gray-600',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputBg: 'bg-gray-50/80',
  inputBorder: 'border-[#BCE0FD]/30',
  inputFocus: 'focus:ring-2 focus:ring-[#0B3861]/20 focus:border-[#0B3861]',
  cardHover: 'hover:bg-gray-50/50 transition-colors duration-200'
};

// Lab IDs array
const LAB_IDS = [
  'LAB01',
  'LAB02',
  'LAB03',
  'LAB04',
  'LAB05',
  'LAB06',
  'LAB07',
  'LAB08'
];

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

const CLOUDY_CARD = 'bg-gradient-to-br from-blue-50/80 to-white shadow-xl rounded-3xl border border-blue-100';
const CLOUDY_INPUT = 'bg-white/80 border-2 border-blue-100 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200';
const CLOUDY_BTN = 'bg-gradient-to-br from-blue-200/80 to-white text-blue-900 font-semibold rounded-xl shadow-md hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-blue-100';
const CLOUDY_BTN_PRIMARY = 'bg-gradient-to-br from-blue-400/80 to-blue-200 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-blue-300';
const CLOUDY_SECTION = 'bg-white/70 rounded-2xl shadow-lg border border-blue-100 p-4 md:p-6 mb-8';
const CLOUDY_LABEL = 'block text-base font-semibold text-blue-900 mb-2 drop-shadow-sm';
const CLOUDY_HEADER = 'text-2xl md:text-3xl font-extrabold tracking-tight text-blue-900 drop-shadow-lg';
const CLOUDY_SUBHEADER = 'text-lg font-bold text-blue-800 mb-4';

const CreateRequestForm = () => {
  const queryClient = useQueryClient();
  const [labId, setLabId] = useState('');
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

  // Fetch and aggregate equipment from all labs
  useEffect(() => {
    const fetchEquipment = async () => {
      setEquipmentLoading(true);
      setEquipmentError('');
      try {
        // Get live equipment data
        console.log('Fetching live equipment data...');
        const liveEquipment = await api.get('/equipment/live');
        console.log('Live Equipment Response:', {
          status: liveEquipment.status,
          data: liveEquipment.data,
          count: liveEquipment.data?.length || 0
        });
        
        // Get stock data from all labs
        console.log('Fetching lab-specific stock data...');
        const labPromises = LAB_IDS.map(labId => {
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
        const response = await api.get(`/chemicals/central/available`);
        const availableChemicals = response.data;

        return defaultChemicals.map(defaultChem => {
          // Find matching chemical by name (case-insensitive)
          const matchedChemical = availableChemicals.find(availableChem => 
            availableChem.chemicalName.toLowerCase().trim() === defaultChem.chemicalName.toLowerCase().trim()
          );

          if (matchedChemical) {
            return {
              chemicalName: defaultChem.chemicalName,
              quantity: defaultChem.quantity,
              unit: defaultChem.unit,
              chemicalMasterId: matchedChemical._id,
              suggestions: [],
              showSuggestions: false,
              availableQuantity: matchedChemical.quantity,
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
      chemicals: processedChemicals,
      glassware: processedGlassware,
      equipment: processedEquipment,
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

  const handleChemicalSearch = async (expIndex, chemIndex, searchTerm) => {
    handleChemicalChange(expIndex, chemIndex, 'chemicalName', searchTerm);
    
    if (!searchTerm.trim()) {
      const updated = [...experiments];
      updated[expIndex].chemicals[chemIndex] = {
        ...updated[expIndex].chemicals[chemIndex],
        suggestions: [],
        showSuggestions: false,
        availableQuantity: null
      };
      setExperiments(updated);
      return;
    }

    try {
      const response = await api.get(`/chemicals/central/available`);
      const suggestions = response.data.map(item => ({
        name: item.chemicalName,
        unit: item.unit,
        id: item._id,
        availableQuantity: item.quantity,
      }));

      const updated = [...experiments];
      updated[expIndex].chemicals[chemIndex] = {
        ...updated[expIndex].chemicals[chemIndex],
        suggestions,
        showSuggestions: true,
      };
      setExperiments(updated);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search chemicals');
    }
  };

  const handleChemicalSelect = (expIndex, chemIndex, suggestion) => {
    const updated = [...experiments];
    updated[expIndex].chemicals[chemIndex] = {
      chemicalName: suggestion.name,
      unit: suggestion.unit,
      chemicalMasterId: suggestion.id,
      quantity: '',
      suggestions: [],
      showSuggestions: false,
      availableQuantity: suggestion.availableQuantity,
    };
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="relative">
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Chemical Name</label>
          <input
            type="text"
            placeholder="Search chemical"
            value={chemical.chemicalName}
            onChange={(e) => handleChemicalSearch(expIndex, chemIndex, e.target.value)}
            onFocus={() => handleFocus(expIndex, chemIndex)}
            onBlur={() => handleBlur(expIndex, chemIndex)}
            required
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
          />
          {chemical.showSuggestions && chemical.suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full border border-[#E8D8E1] rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
              {chemical.suggestions.map((sug, idx) => (
                <li
                  key={`suggestion-${expIndex}-${chemIndex}-${idx}`}
                  className="px-3 py-2 text-sm hover:bg-[#F9F3F7] cursor-pointer border-b border-[#E8D8E1] last:border-b-0"
                  onClick={() => handleChemicalSelect(expIndex, chemIndex, sug)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{sug.name}</span>
                    <span className="text-xs bg-[#F0E6EC] text-[#6D123F] px-2 py-1 rounded">
                      Available: {sug.availableQuantity} {sug.unit}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            value={chemical.quantity}
            onChange={(e) => handleChemicalChange(expIndex, chemIndex, 'quantity', e.target.value)}
            required
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
            max={chemical.availableQuantity || undefined}
          />
          {chemical.availableQuantity !== null && (
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>Available: {chemical.availableQuantity} {chemical.unit}</span>
              {chemical.quantity > chemical.availableQuantity && (
                <span className="ml-2 text-red-500 font-medium">
                  (Exceeds available quantity)
                </span>
              )}
            </div>
          )}
        </div>
        <div>
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Unit</label>
          <input
            type="text"
            placeholder="Unit"
            value={chemical.unit}
            readOnly
            className="w-full px-3 py-2 text-sm md:text-base border border-[#E8D8E1] rounded-lg bg-gray-100"
          />
        </div>
      </div>
    );
  };

  const renderGlasswareInput = (expIndex, gwIndex) => {
    const gw = experiments[expIndex].glassware[gwIndex];
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="relative">
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Glassware Name</label>
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
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
          />
          {gw.showSuggestions && gw.suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full border border-[#E8D8E1] rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
              {gw.suggestions.map((sug, idx) => (
                <li
                  key={`glassware-suggestion-${expIndex}-${gwIndex}-${idx}`}
                  className="px-3 py-2 text-sm hover:bg-[#F9F3F7] cursor-pointer border-b border-[#E8D8E1] last:border-b-0"
                  onClick={() => handleGlasswareSelect(expIndex, gwIndex, sug)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{sug.name}</span>
                    <span className="text-xs bg-[#F0E6EC] text-[#6D123F] px-2 py-1 rounded">
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
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            value={gw.quantity}
            onChange={e => handleGlasswareChange(expIndex, gwIndex, 'quantity', e.target.value)}
            required
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
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
        </div>        <div>
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Unit</label>
          <input
            type="text"
            placeholder="Unit (e.g., piece, ml, etc.)"
            value={gw.unit}
            onChange={e => handleGlasswareChange(expIndex, gwIndex, 'unit', e.target.value)}
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors ${
              gw.glasswareId ? 'bg-gray-100' : 'bg-white'
            }`}
            readOnly={!!gw.glasswareId} // Only readonly if selected from suggestions
          />
          {gw.glasswareId && (
            <div className="text-xs text-gray-500 mt-1">
              Unit is set from selected glassware
            </div>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="relative">
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Equipment Name</label>
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
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
          />
          {eq.showSuggestions && eq.suggestions && eq.suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full border border-[#E8D8E1] rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
              {eq.suggestions.map((sug, idx) => (
                <li
                  key={`equipment-suggestion-${expIndex}-${eqIndex}-${idx}`}
                  className="px-3 py-2 text-sm hover:bg-[#F9F3F7] cursor-pointer border-b border-[#E8D8E1] last:border-b-0"
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
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Variant</label>
          <input
            type="text"
            value={eq.variant}
            readOnly
            className="w-full px-3 py-2 text-sm md:text-base border border-[#E8D8E1] rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${THEME.secondaryText} mb-1`}>Quantity</label>
          <input
            type="number"
            placeholder="Enter quantity"
            value={eq.quantity}
            onChange={e => handleEquipmentChange(expIndex, eqIndex, 'quantity', e.target.value)}
            required
            className={`w-full px-3 py-2 text-sm md:text-base border ${THEME.border} rounded-lg ${THEME.inputFocus} transition-colors`}
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
    );
  };

  const renderEquipmentSection = (expIndex) => {
    return (
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ChemicalIcon />
            <h4 className="text-md font-semibold text-blue-800">Equipment</h4>
            {equipmentLoading && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                Loading...
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => addEquipment(expIndex)}
            className={`${CLOUDY_BTN} px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400`}
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
    <div className={`min-h-screen ${THEME.background} relative overflow-hidden`}>
      {/* Floating bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full p-4 md:p-6">
        <div className={`${THEME.card} rounded-xl p-6 md:p-8 w-full`}>
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className={`${THEME.secondaryBg} p-2 rounded-lg text-white`}>
                <ExperimentIcon />
              </div>
              <h1 className={`text-lg font-semibold ${THEME.primaryText}`}>Create New Request</h1>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lab ID Selection */}
            <div className={`${THEME.inputBg} ${THEME.inputBorder} border rounded-lg p-4`}>
              <label className={`block text-sm font-medium ${THEME.primaryText} mb-2`}>Lab ID</label>
              <select
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                required
                className={`w-full ${THEME.inputBg} ${THEME.inputBorder} border rounded-md px-3 py-2 text-sm ${THEME.inputFocus} transition-all`}
                aria-label="Select Lab"
              >
                <option value="">Select Lab</option>
                {LAB_IDS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
            {experiments.map((experiment, expIndex) => (
              <div
                key={`experiment-${expIndex}`}
                className={`${CLOUDY_SECTION} transition-all duration-500 border-l-4 border-blue-200 relative group`}
                ref={el => (experimentRefs.current[expIndex] = el)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ExperimentIcon />
                    <h3 className={CLOUDY_SUBHEADER}>Experiment {expIndex + 1}</h3>
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
                      className={`${CLOUDY_BTN} px-4 py-1 text-red-500 border-red-200 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300`}
                      aria-label="Remove this experiment"
                      title="Remove this experiment"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Only allow experiment selection if not already selected */}
                {!experiment.experimentId && (
                  <div className="mb-6 transition-all duration-500">
                    <ExperimentSelector
                      key={`selector-${expIndex}`}
                      onExperimentSelect={(experiment) => handleExperimentSelect(expIndex, experiment)}
                    />
                  </div>
                )}
                {experiment.experimentId && (
                  <div className="mb-6 transition-all duration-500">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
                        <span className="bg-blue-100 px-3 py-1 rounded-xl shadow-inner">{experiment.experimentName}</span>
                      </div>
                      {(experiment.courseId || experiment.batchId) && (
                        <div className="text-sm text-gray-600 ml-1">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={CLOUDY_LABEL}>Date</label>
                    <input
                      type="date"
                      value={experiment.date}
                      onChange={(e) => handleExperimentChange(expIndex, 'date', e.target.value)}
                      required
                      className={`${CLOUDY_INPUT} w-full px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      aria-label="Experiment date"
                    />
                  </div>
                  <div>
                    <label className={CLOUDY_LABEL}>Course</label>
                    <select
                      value={experiment.courseId}
                      onChange={(e) => handleCourseChange(expIndex, e.target.value)}
                      required
                      className={`${CLOUDY_INPUT} w-full px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      aria-label="Course"
                    >
                      <option value="">Select Course</option>
                      {coursesData.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.courseName} ({course.courseCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={CLOUDY_LABEL}>Batch</label>
                    <select
                      value={experiment.batchId}
                      onChange={(e) => handleExperimentChange(expIndex, 'batchId', e.target.value)}
                      required
                      disabled={!experiment.courseId}
                      className={`${CLOUDY_INPUT} w-full px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 ${!experiment.courseId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      aria-label="Batch"
                    >
                      <option value="">Select Batch</option>
                      {getBatchesForCourse(experiment.courseId).map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batchName} ({batch.batchCode}) - {batch.academicYear}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chemicals Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChemicalIcon />
                      <h4 className="text-md font-semibold text-blue-800">Chemicals</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => addChemical(expIndex)}
                      className={`${CLOUDY_BTN} px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      aria-label="Add chemical"
                      title="Add chemical"
                    >
                      + Add Chemical
                    </button>
                  </div>
                  {experiment.chemicals.map((_, chemIndex) => (
                    <div key={`chemical-${expIndex}-${chemIndex}`}>{renderChemicalInput(expIndex, chemIndex)}</div>
                  ))}
                </div>

                {/* Glassware Section */}
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChemicalIcon />
                      <h4 className="text-md font-semibold text-blue-800">Glassware</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => addGlassware(expIndex)}
                      className={`${CLOUDY_BTN} px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400`}
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
              className={`${CLOUDY_BTN_PRIMARY} w-full py-3 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60`}
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
                className={`${CLOUDY_BTN_PRIMARY} px-12 py-4 text-xl font-bold focus:outline-none focus:ring-4 focus:ring-blue-400 disabled:opacity-60 transform hover:scale-105 transition-all duration-200 shadow-2xl`}
                aria-label="Submit request"
              >
                {createRequestMutation.isLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin -ml-1 mr-2 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Request...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Request
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