import React, { useState, useEffect } from 'react';
import { useResponsiveColors, getSafeBackground } from '../../utils/colorUtils';
import SafeButton from '../../components/SafeButton';

const CourseForm = ({ course, onCreate, onUpdate, onClose }) => {
  const colors = useResponsiveColors();
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    batches: [
      {
        batchName: '',
        batchCode: '',
        academicYear: '',
        numberOfStudents: '',
        description: '',
        isActive: true
      }
    ],
    isActive: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form

  const isEditing = Boolean(course);

  // Generate academic year options (current year and next 2 years)
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 3; i++) {
      const startYear = currentYear + i;
      const endYear = (startYear + 1).toString().slice(-2);
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  const academicYears = generateAcademicYears();

  useEffect(() => {
    if (course) {
      setFormData({
        courseName: course.courseName || '',
        courseCode: course.courseCode || '',
        description: course.description || '',
        batches: course.batches?.length > 0 ? course.batches.map(batch => ({
          batchName: batch.batchName || '',
          batchCode: batch.batchCode || '',
          academicYear: batch.academicYear || '',
          numberOfStudents: batch.numberOfStudents || '',
          description: batch.description || '',
          isActive: batch.isActive !== undefined ? batch.isActive : true
        })) : [{
          batchName: '',
          batchCode: '',
          academicYear: '',
          numberOfStudents: '',
          description: '',
          isActive: true
        }],
        isActive: course.isActive !== undefined ? course.isActive : true
      });
    }
  }, [course]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.courseName.trim()) {
        newErrors.courseName = 'Course name is required';
      } else if (formData.courseName.length < 3) {
        newErrors.courseName = 'Course name must be at least 3 characters';
      }

      if (!formData.courseCode.trim()) {
        newErrors.courseCode = 'Course code is required';
      } else if (!/^[A-Z0-9]+$/.test(formData.courseCode.toUpperCase())) {
        newErrors.courseCode = 'Course code must contain only letters and numbers';
      }
    }

    if (step === 2) {
      formData.batches.forEach((batch, index) => {
        if (!batch.batchName.trim()) {
          newErrors[`batch_${index}_batchName`] = 'Batch name is required';
        }
        if (!batch.batchCode.trim()) {
          newErrors[`batch_${index}_batchCode`] = 'Batch code is required';
        }
        if (!batch.academicYear.trim()) {
          newErrors[`batch_${index}_academicYear`] = 'Academic year is required';
        }
        if (batch.numberOfStudents && (isNaN(batch.numberOfStudents) || batch.numberOfStudents < 1)) {
          newErrors[`batch_${index}_numberOfStudents`] = 'Invalid number of students';
        }
      });

      // Check for duplicate batch codes within same academic year
      const batchIdentifiers = formData.batches.map(batch => `${batch.batchCode.trim()}-${batch.academicYear}`);
      const uniqueIdentifiers = [...new Set(batchIdentifiers)];
      if (batchIdentifiers.length !== uniqueIdentifiers.length) {
        newErrors.duplicateBatches = 'Batch codes must be unique within the same academic year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleBatchChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.map((batch, i) => 
        i === index ? { ...batch, [field]: value } : batch
      )
    }));

    // Clear related error
    const errorKey = `batch_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const addBatch = () => {
    setFormData(prev => ({
      ...prev,
      batches: [
        ...prev.batches,
        {
          batchName: '',
          batchCode: '',
          academicYear: '',
          numberOfStudents: '',
          description: '',
          isActive: true
        }
      ]
    }));
  };

  const removeBatch = (index) => {
    if (formData.batches.length > 1) {
      setFormData(prev => ({
        ...prev,
        batches: prev.batches.filter((_, i) => i !== index)
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < 2) {
        handleNext(e);
      }
    }
  };

  const handleBatchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // In step 2, Enter should not submit the form
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isValid = validateStep(currentStep);
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Current form data:', formData);
    console.log('Is editing:', isEditing);
    
    if (!validateStep(1) || !validateStep(2)) {
      console.log('Validation failed, returning to step 1');
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        courseCode: formData.courseCode.toUpperCase(),
        batches: formData.batches.map(batch => ({
          ...batch,
          batchCode: batch.batchCode.toUpperCase(),
          numberOfStudents: batch.numberOfStudents ? parseInt(batch.numberOfStudents) : undefined
        }))
      };

      console.log('Submit data prepared:', submitData);

      if (isEditing) {
        console.log('Calling onUpdate with course ID:', course._id);
        await onUpdate(course._id, submitData);
      } else {
        console.log('Calling onCreate');
        await onCreate(submitData);
      }
      
      console.log('Form submission completed successfully');
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error.message || 'Failed to save course'
      });
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2].map((step) => (
          <React.Fragment key={step}>
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300"
              style={currentStep >= step 
                ? { 
                    backgroundColor: getSafeBackground('primary', '#2563eb').backgroundColor || getSafeBackground('primary', '#2563eb'),
                    borderColor: getSafeBackground('primary', '#2563eb').backgroundColor || getSafeBackground('primary', '#2563eb'),
                    color: 'white'
                  }
                : { 
                    borderColor: '#d1d5db',
                    color: '#9ca3af'
                  }
              }
            >
              <span className="text-sm font-semibold">{step}</span>
            </div>
            {step < 2 && (
              <div 
                className="w-16 h-1 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: currentStep > step 
                    ? (getSafeBackground('primary', '#2563eb').backgroundColor || getSafeBackground('primary', '#2563eb'))
                    : '#d1d5db'
                }}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 text-white p-6 border-b"
        style={{ backgroundColor: getSafeBackground('header', '#1d4ed8') }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {currentStep === 1 ? 'Basic course information' : 'Manage course batches'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <StepIndicator />

        {/* Form Submission Error Display */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Step 1: Course Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeInScale">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => handleInputChange('courseName', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    errors.courseName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Computer Science Engineering"
                />
                {errors.courseName && (
                  <p className="text-red-600 text-sm mt-1">{errors.courseName}</p>
                )}
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    errors.courseCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., CSE, IT, ECE"
                />
                {errors.courseCode && (
                  <p className="text-red-600 text-sm mt-1">{errors.courseCode}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (currentStep < 2) {
                      handleNext(e);
                    }
                  }
                }}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                placeholder="Brief description of the course program... (Ctrl+Enter to proceed)"
              />
            </div>

            {/* Course Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Course is active
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Batch Management */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeInScale">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Course Batches</h3>
              <button
                type="button"
                onClick={addBatch}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Batch
              </button>
            </div>

            {errors.duplicateBatches && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errors.duplicateBatches}</p>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.batches.map((batch, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">
                      Batch {index + 1}
                    </h4>
                    {formData.batches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatch(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Batch Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        value={batch.batchName}
                        onChange={(e) => handleBatchChange(index, 'batchName', e.target.value)}
                        onKeyDown={handleBatchKeyDown}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors[`batch_${index}_batchName`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., CSE-A, IT-B"
                      />
                      {errors[`batch_${index}_batchName`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`batch_${index}_batchName`]}</p>
                      )}
                    </div>

                    {/* Batch Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Code *
                      </label>
                      <input
                        type="text"
                        value={batch.batchCode}
                        onChange={(e) => handleBatchChange(index, 'batchCode', e.target.value.toUpperCase())}
                        onKeyDown={handleBatchKeyDown}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors[`batch_${index}_batchCode`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., CSEA, ITB"
                      />
                      {errors[`batch_${index}_batchCode`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`batch_${index}_batchCode`]}</p>
                      )}
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year *
                      </label>
                      <select
                        value={batch.academicYear}
                        onChange={(e) => handleBatchChange(index, 'academicYear', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors[`batch_${index}_academicYear`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Year</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      {errors[`batch_${index}_academicYear`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`batch_${index}_academicYear`]}</p>
                      )}
                    </div>

                    {/* Number of Students */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Students Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={batch.numberOfStudents}
                        onChange={(e) => handleBatchChange(index, 'numberOfStudents', e.target.value)}
                        onKeyDown={handleBatchKeyDown}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                          errors[`batch_${index}_numberOfStudents`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 30"
                      />
                      {errors[`batch_${index}_numberOfStudents`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`batch_${index}_numberOfStudents`]}</p>
                      )}
                    </div>

                    {/* Batch Status */}
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id={`batch_${index}_isActive`}
                        checked={batch.isActive}
                        onChange={(e) => handleBatchChange(index, 'isActive', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`batch_${index}_isActive`} className="ml-2 text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Batch Description */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Description
                    </label>
                    <textarea
                      value={batch.description}
                      onChange={(e) => handleBatchChange(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                      placeholder="Optional batch description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-8">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <SafeButton
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </SafeButton>
            
            {currentStep < 2 ? (
              <SafeButton
                type="button"
                onClick={handleNext}
                variant="primary"
                className="flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </SafeButton>
            ) : (
              <SafeButton
                type="submit"
                disabled={loading}
                variant="success"
                className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Course' : 'Create Course'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </SafeButton>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
