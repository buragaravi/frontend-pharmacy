import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { GraduationCap } from 'lucide-react';

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

const EnhancedCourseSelector = ({ 
  selectedCourse, 
  onCourseSelect, 
  placeholder = "Select Course",
  className = "",
  disabled = false 
}) => {
  // Fetch all courses
  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses-active'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data || response.data;
    },
  });

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => c._id === courseId);
    onCourseSelect(course || null);
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center space-x-2">
          <span>⚠️</span>
          <span>Error loading courses: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600 flex items-center space-x-1">
        <GraduationCap className="h-3 w-3" />
        <span>Course *</span>
      </label>
      <select
        value={selectedCourse?._id || ''}
        onChange={handleCourseChange}
        disabled={disabled || isLoading}
        className={`w-full px-3 py-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-sm transition-all duration-200 ${
          disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-sky-300'
        } ${className}`}
      >
        <option value="" className="text-slate-400">
          {isLoading ? 'Loading courses...' : placeholder}
        </option>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.courseCode} - {course.courseName}
          </option>
        ))}
      </select>
      
      {selectedCourse && (
        <div className="text-xs text-slate-600 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2 rounded-lg border border-sky-100">
          <div className="flex items-center space-x-1">
            <span className="font-medium text-sky-700">Selected:</span> 
            <span className="text-slate-700">{selectedCourse.courseName}</span>
            <span className="text-slate-500">({selectedCourse.courseCode})</span>
          </div>
          {selectedCourse.description && (
            <div className="mt-1 text-slate-500 text-xs">{selectedCourse.description}</div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
          <span className="ml-2 text-xs text-slate-500">Loading courses...</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedCourseSelector;
