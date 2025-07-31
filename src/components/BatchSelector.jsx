import React from 'react';

const BatchSelector = ({ 
  batches = [], 
  selectedBatchId, 
  onBatchChange, 
  courseInfo = null,
  required = false,
  disabled = false,
  academicYear = null,
  className = ""
}) => {
  // Filter batches by academic year if specified
  const filteredBatches = academicYear 
    ? batches.filter(batch => batch.academicYear === academicYear)
    : batches;

  const activeBatches = filteredBatches.filter(batch => batch.isActive);
  const selectedBatch = activeBatches.find(batch => batch._id === selectedBatchId);

  const handleBatchChange = (batchId) => {
    if (onBatchChange) {
      onBatchChange(batchId);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Course Context Info */}
      {courseInfo && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3">
              {courseInfo.courseCode?.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-blue-900">{courseInfo.courseName}</div>
              <div className="text-blue-600 text-xs">{courseInfo.department} • {courseInfo.courseCode}</div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Batch {required && <span className="text-red-500">*</span>}
          {academicYear && (
            <span className="text-xs text-gray-500 font-normal ml-2">
              (AY {academicYear})
            </span>
          )}
        </label>

        {activeBatches.length === 0 ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-gray-500">
              {academicYear ? `No active batches for academic year ${academicYear}` : 'No active batches available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Dropdown for mobile */}
            <div className="sm:hidden">
              <select
                value={selectedBatchId || ''}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={disabled}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 appearance-none bg-white ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select a batch</option>
                {activeBatches.map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchName} ({batch.batchCode}) - AY {batch.academicYear}
                    {batch.numberOfStudents ? ` • ${batch.numberOfStudents} students` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Card grid for desktop */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeBatches.map(batch => (
                <div
                  key={batch._id}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                    selectedBatchId === batch._id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !disabled && handleBatchChange(batch._id)}
                >
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    selectedBatchId === batch._id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedBatchId === batch._id && (
                      <svg className="w-2 h-2 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 8 8">
                        <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                      </svg>
                    )}
                  </div>

                  {/* Batch info */}
                  <div className="pr-6">
                    <div className={`text-sm font-semibold mb-1 ${
                      selectedBatchId === batch._id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {batch.batchName}
                    </div>
                    <div className={`text-xs mb-2 ${
                      selectedBatchId === batch._id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      Code: {batch.batchCode}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                        selectedBatchId === batch._id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        📅 {batch.academicYear}
                      </span>
                      
                      {batch.numberOfStudents && (
                        <span className={`font-medium ${
                          selectedBatchId === batch._id ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {batch.numberOfStudents} students
                        </span>
                      )}
                    </div>

                    {batch.description && (
                      <div className={`text-xs mt-2 line-clamp-2 ${
                        selectedBatchId === batch._id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {batch.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Batch Summary */}
      {selectedBatch && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-semibold text-green-900">
                  Selected: {selectedBatch.batchName}
                </div>
                <div className="text-green-600 text-xs">
                  {selectedBatch.batchCode} • AY {selectedBatch.academicYear}
                  {selectedBatch.numberOfStudents && ` • ${selectedBatch.numberOfStudents} students`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Statistics */}
      {activeBatches.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{activeBatches.length} active batch{activeBatches.length !== 1 ? 'es' : ''} available</span>
            {academicYear && (
              <span>Academic Year: {academicYear}</span>
            )}
          </div>
          {!academicYear && activeBatches.length > 0 && (
            <div className="mt-1 text-xs">
              Years: {[...new Set(activeBatches.map(b => b.academicYear))].sort().reverse().join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchSelector;
