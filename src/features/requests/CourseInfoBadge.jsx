import React from 'react';
import { BookOpen, Users, Calendar } from 'lucide-react';

const CourseInfoBadge = ({ request, className = '' }) => {
  if (!request?.courseId) return null;

  const course = request.courseId;
  const batchId = request.batchId;
  
  // Find the specific batch from the course batches
  const batch = course.batches?.find(b => b._id.toString() === batchId?.toString());

  if (!course && !batch) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Course Badge */}
      {course && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-800">
              {course.courseCode || course.courseName}
            </span>
            {course.courseCode && course.courseName && (
              <span className="text-xs text-blue-600 leading-tight">
                {course.courseName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Batch Badge */}
      {batch && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-lg">
          <Users className="w-3.5 h-3.5 text-green-600" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-green-800">
              {batch.batchCode}
            </span>
            {batch.batchName && (
              <span className="text-xs text-green-600 leading-tight">
                {batch.batchName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Academic Year Badge */}
      {batch?.academicYear && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200/60 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-xs font-semibold text-purple-800">
            AY {batch.academicYear}
          </span>
        </div>
      )}
    </div>
  );
};

export default CourseInfoBadge;
