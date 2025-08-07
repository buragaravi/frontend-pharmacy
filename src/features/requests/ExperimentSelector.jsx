import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import EnhancedCourseSelector from '../../components/EnhancedCourseSelector';
import SubjectSelector from '../../components/SubjectSelector';

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

const ExperimentSelector = ({ onExperimentSelect }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExperiment, setSelectedExperiment] = useState('');

  // Fetch experiments for the selected subject
  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments-by-subject', selectedSubject?._id],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await api.get(`/experiments/subject/${selectedSubject._id}`);
      return response.data || [];
    },
    enabled: !!selectedSubject,
  });

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedSubject(null);
    setSelectedExperiment('');
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedExperiment('');
  };

  const handleExperimentChange = (e) => {
    const experimentId = e.target.value;
    setSelectedExperiment(experimentId);
    // Find the selected experiment from the filtered list
    const experiment = experiments.find(exp => exp._id === experimentId);
    if (experiment) {
      onExperimentSelect({
        experimentId: experiment._id,
        experimentName: experiment.name,
        subjectId: selectedSubject._id,
        subjectName: selectedSubject.name,
        subjectCode: selectedSubject.code,
        courseId: selectedCourse._id, // Add courseId for batch selection
        courseName: selectedCourse.courseName,
        courseCode: selectedCourse.courseCode,
        defaultChemicals: experiment.defaultChemicals || [],
        defaultGlassware: experiment.defaultGlassware || [],
        defaultEquipment: experiment.defaultEquipment || []
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">
          Course
        </label>
        <EnhancedCourseSelector
          selectedCourse={selectedCourse}
          onCourseSelect={handleCourseSelect}
          placeholder="Select Course"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">
          Subject
        </label>
        <SubjectSelector
          selectedCourse={selectedCourse}
          selectedSubject={selectedSubject}
          onSubjectSelect={handleSubjectSelect}
          placeholder="Select Subject"
          disabled={!selectedCourse}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-blue-800 mb-1">
          Experiment
        </label>
        <select
          value={selectedExperiment}
          onChange={handleExperimentChange}
          className="w-full px-3 py-2 text-sm md:text-base border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition-colors"
          required
          disabled={!selectedSubject || isLoading}
        >
          <option value="">Select Experiment</option>
          {experiments.map((exp) => (
            <option key={exp._id} value={exp._id}>
              {exp.name}
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