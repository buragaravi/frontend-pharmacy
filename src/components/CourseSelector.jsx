import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseSelector = ({ 
  selectedCourseId, 
  selectedBatchId, 
  onCourseChange, 
  onBatchChange, 
  academicYear = null,
  required = false,
  disabled = false,
  className = ""
}) => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, [academicYear]);

  // Fetch batches when course changes
  useEffect(() => {
    if (selectedCourseId) {
      fetchBatchesForCourse(selectedCourseId);
    } else {
      setBatches([]);
      if (selectedBatchId && onBatchChange) {
        onBatchChange('');
      }
    }
  }, [selectedCourseId, academicYear]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
       let url = 'https://backend-pharmacy-5541.onrender.com/api/courses/active';
      
      if (academicYear) {
        url += `?academicYear=${academicYear}`;
      }
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchesForCourse = async (courseId) => {
    const course = courses.find(c => c._id === courseId);
    if (course) {
      let filteredBatches = course.batches.filter(batch => batch.isActive);
      
      // Filter by academic year if specified
      if (academicYear) {
        filteredBatches = filteredBatches.filter(batch => batch.academicYear === academicYear);
      }
      
      setBatches(filteredBatches);
      
      // Clear batch selection if current batch is not in the new list
      if (selectedBatchId && !filteredBatches.find(b => b._id === selectedBatchId)) {
        if (onBatchChange) {
          onBatchChange('');
        }
      }
    }
  };

  const handleCourseChange = (courseId) => {
    if (onCourseChange) {
      onCourseChange(courseId);
    }
  };

  const handleBatchChange = (batchId) => {
    if (onBatchChange) {
      onBatchChange(batchId);
    }
  };

  const selectedCourse = courses.find(c => c._id === selectedCourseId);
  const selectedBatch = batches.find(b => b._id === selectedBatchId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Course Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Course {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedCourseId || ''}
            onChange={(e) => handleCourseChange(e.target.value)}
            disabled={disabled || loading}
            className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none bg-white ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">
              {loading ? 'Loading courses...' : 'Select a course'}
            </option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.courseName} ({course.courseCode}) - {course.department}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            {loading ? (
              <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Course Info Display */}
        {selectedCourse && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3">
                {selectedCourse.courseCode.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-blue-900">{selectedCourse.courseName}</div>
                <div className="text-blue-600 text-xs">{selectedCourse.department} • Code: {selectedCourse.courseCode}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Batch {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedBatchId || ''}
            onChange={(e) => handleBatchChange(e.target.value)}
            disabled={disabled || !selectedCourseId || batches.length === 0}
            className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none bg-white ${
              disabled || !selectedCourseId || batches.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">
              {!selectedCourseId 
                ? 'Select a course first' 
                : batches.length === 0 
                ? 'No batches available' 
                : 'Select a batch'
              }
            </option>
            {batches.map(batch => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName} ({batch.batchCode}) - AY {batch.academicYear}
                {batch.numberOfStudents ? ` • ${batch.numberOfStudents} students` : ''}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Batch Info Display */}
        {selectedBatch && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <div className="font-semibold text-green-900">{selectedBatch.batchName}</div>
                  <div className="text-green-600 text-xs">
                    Code: {selectedBatch.batchCode} • Academic Year: {selectedBatch.academicYear}
                  </div>
                </div>
              </div>
              {selectedBatch.numberOfStudents && (
                <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  {selectedBatch.numberOfStudents} students
                </div>
              )}
            </div>
          </div>
        )}

        {/* Academic Year Filter Info */}
        {academicYear && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Showing batches for academic year: {academicYear}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-sm text-red-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Batch Count Info */}
      {selectedCourseId && courses.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <span>Available batches: {batches.length}</span>
            {academicYear && (
              <span>Academic Year: {academicYear}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
