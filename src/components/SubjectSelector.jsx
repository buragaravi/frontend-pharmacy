import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Book } from 'lucide-react';

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

const SubjectSelector = ({ 
  selectedCourse,
  selectedSubject, 
  onSubjectSelect, 
  placeholder = "Select Subject",
  className = "",
  disabled = false 
}) => {
  // Fetch subjects for the selected course
  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: ['subjects-by-course', selectedCourse?._id],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await api.get(`/subjects?courseId=${selectedCourse._id}&isActive=true`);
      return response.data.data || response.data;
    },
    enabled: !!selectedCourse,
  });

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const subject = subjects.find(s => s._id === subjectId);
    onSubjectSelect(subject || null);
  };

  if (!selectedCourse) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-400 flex items-center space-x-1">
          <Book className="h-3 w-3" />
          <span>Subject *</span>
        </label>
        <div className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-400 text-sm">
          Please select a course first
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600 flex items-center space-x-1">
          <Book className="h-3 w-3" />
          <span>Subject *</span>
        </label>
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>Error loading subjects: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600 flex items-center space-x-1">
        <Book className="h-3 w-3" />
        <span>Subject *</span>
      </label>
      <select
        value={selectedSubject?._id || ''}
        onChange={handleSubjectChange}
        disabled={disabled || isLoading || !selectedCourse}
        className={`w-full px-3 py-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-sm transition-all duration-200 ${
          disabled || isLoading || !selectedCourse ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-sky-300'
        } ${className}`}
      >
        <option value="" className="text-slate-400">
          {isLoading ? 'Loading subjects...' : 
           subjects.length === 0 ? 'No subjects available' : 
           placeholder}
        </option>
        {subjects.map((subject) => (
          <option key={subject._id} value={subject._id}>
            {subject.code} - {subject.name}
          </option>
        ))}
      </select>
      
      {selectedSubject && (
        <div className="text-xs text-slate-600 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-100">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-emerald-700">Selected:</span> 
            <span className="text-slate-700">{selectedSubject.name}</span>
            <span className="text-slate-500">({selectedSubject.code})</span>
          </div>
          {selectedSubject.description && (
            <div className="mt-1 text-slate-500 text-xs">{selectedSubject.description}</div>
          )}
        </div>
      )}

      {selectedCourse && subjects.length === 0 && !isLoading && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-2">
            <span>ℹ️</span>
            <span>No subjects found for {selectedCourse.courseName}. Please add subjects to this course first.</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
          <span className="ml-2 text-xs text-slate-500">Loading subjects...</span>
        </div>
      )}
    </div>
  );
};

export default SubjectSelector;
