import React, { useState } from 'react';
import { useResponsiveColors, getSafeBackground, getSafeBackdrop } from '../../utils/colorUtils';
import SafeButton from '../../components/SafeButton';

const CourseCard = ({ course, onEdit, onDelete, canManage }) => {
  const colors = useResponsiveColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeBatches = course.batches.filter(batch => batch.isActive);
  const academicYears = [...new Set(course.batches.map(batch => batch.academicYear))].sort().reverse();
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover-lift group">
      {/* Course Header */}
      <div 
        className="p-6 border-b border-gray-200"
        style={{ backgroundColor: getSafeBackground('light', '#eff6ff') }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div 
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: getSafeBackground('primary', '#3b82f6') }}
            >
              {course.courseCode.charAt(0)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {course.courseName}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                Code: {course.courseCode}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              course.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {course.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="p-6">
        {/* Description */}
        {course.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {course.description}
            </p>
          </div>
        )}

        {/* Batch Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Batches ({course.batches.length})
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <svg 
                className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {academicYears.slice(0, 3).map(year => (
              <span
                key={year}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                📅 {year}
              </span>
            ))}
            {academicYears.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{academicYears.length - 3} more
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {activeBatches.length} active • {course.batches.length - activeBatches.length} inactive
          </div>
        </div>

        {/* Expanded Batch Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-4 mt-4 animate-expandDown">
            <div className="space-y-2">
              {course.batches.map((batch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      batch.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {batch.batchName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {batch.batchCode} • {batch.academicYear}
                      </div>
                    </div>
                  </div>
                  {batch.numberOfStudents && (
                    <div className="text-xs text-gray-600 font-medium">
                      {batch.numberOfStudents} students
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canManage && (
          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
            <SafeButton
              onClick={onEdit}
              variant="info"
              className="flex-1 text-sm flex items-center justify-center gap-2 hover-lift"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </SafeButton>
            <SafeButton
              onClick={onDelete}
              variant="danger"
              className="flex-1 text-sm flex items-center justify-center gap-2 hover-lift"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </SafeButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
