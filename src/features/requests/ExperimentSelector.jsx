import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const ExperimentSelector = ({ onExperimentSelect }) => {
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState('');

  // Fetch all experiments once
  const { data: allExperiments = [], isLoading } = useQuery({
    queryKey: ['experiments-all'],
    queryFn: async () => {
      const response = await api.get('/experiments');
      return response.data;
    },
  });

  // Filter experiments by selected semester
  const filteredExperiments = selectedSemester
    ? allExperiments.filter(exp => String(exp.semester) === String(selectedSemester))
    : [];

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSelectedExperiment('');
  };

  const handleExperimentChange = (e) => {
    const experimentId = e.target.value;
    setSelectedExperiment(experimentId);
    // Find the selected experiment from the filtered list
    const experiment = filteredExperiments.find(exp => exp._id === experimentId);
    if (experiment) {
      onExperimentSelect({
        experimentId: experiment._id,
        experimentName: experiment.name,
        subject: experiment.subject,
        defaultChemicals: experiment.defaultChemicals || []
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-[#6D123F] mb-1">
          Semester
        </label>
        <select
          value={selectedSemester}
          onChange={handleSemesterChange}
          className="w-full px-3 py-2 text-sm md:text-base border border-[#E8D8E1] rounded-lg focus:ring-2 focus:ring-[#6D123F] focus:border-[#6D123F] transition-colors"
          required
        >
          <option value="">Select Semester</option>
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#6D123F] mb-1">
          Experiment
        </label>
        <select
          value={selectedExperiment}
          onChange={handleExperimentChange}
          className="w-full px-3 py-2 text-sm md:text-base border border-[#E8D8E1] rounded-lg focus:ring-2 focus:ring-[#6D123F] focus:border-[#6D123F] transition-colors"
          required
          disabled={!selectedSemester || isLoading}
        >
          <option value="">Select Experiment</option>
          {filteredExperiments.map((exp) => (
            <option key={exp._id} value={exp._id}>
              {exp.name} ({exp.subject})
            </option>
          ))}
        </select>
        {isLoading && (
          <p className="mt-1 text-sm text-gray-500">Loading experiments...</p>
        )}
      </div>
    </div>
  );
};

export default ExperimentSelector;