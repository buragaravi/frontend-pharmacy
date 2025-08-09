import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { X, Plus, Trash2, Book, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SubjectCreationModal = ({ 
  course, 
  isOpen, 
  onClose, 
  onSubjectsCreated 
}) => {
  const [subjects, setSubjects] = useState([
    { name: '', code: '', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  if (!isOpen || !course) return null;

  const addSubjectRow = () => {
    setSubjects([...subjects, { name: '', code: '', description: '' }]);
  };

  const removeSubjectRow = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index));
    }
  };

  const updateSubject = (index, field, value) => {
    const updated = subjects.map((subject, i) => 
      i === index ? { ...subject, [field]: value } : subject
    );
    setSubjects(updated);
  };

  const getValidationStatus = (index, field) => {
    const subject = subjects[index];
    if (!subject) return '';
    
    if (field === 'name') {
      if (!subject.name.trim()) return '';
      if (subject.name.trim().length < 3) return 'error';
      return 'success';
    }
    
    if (field === 'code') {
      if (!subject.code.trim()) return '';
      if (subject.code.trim().length < 2) return 'error';
      // Check for duplicates
      const codes = subjects.map(s => s.code.trim().toUpperCase()).filter(Boolean);
      const currentCode = subject.code.trim().toUpperCase();
      const duplicateCount = codes.filter(code => code === currentCode).length;
      if (duplicateCount > 1) return 'error';
      return 'success';
    }
    
    return '';
  };

  const getFieldClassName = (index, field) => {
    const status = getValidationStatus(index, field);
    const baseClasses = "w-full px-3 py-2 border rounded-lg transition-colors text-sm";
    
    if (status === 'success') {
      return `${baseClasses} border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50`;
    } else if (status === 'error') {
      return `${baseClasses} border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50`;
    } else {
      return `${baseClasses} border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`;
    }
  };

  const handleSubmit = async () => {
    // Validate subjects
    const validSubjects = subjects.filter(subject => 
      subject.name.trim() && subject.code.trim()
    );

    if (validSubjects.length === 0) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill in at least one subject with name and code',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-yellow-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });
      return;
    }

    // Check for duplicate codes within the form
    const codes = validSubjects.map(s => s.code.trim().toUpperCase());
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      Swal.fire({
        title: 'Duplicate Subject Codes',
        text: `Duplicate codes found: ${[...new Set(duplicateCodes)].join(', ')}. Please ensure all subject codes are unique.`,
        icon: 'error',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
      return;
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Create Subjects?',
      text: `Are you sure you want to create ${validSubjects.length} subject${validSubjects.length > 1 ? 's' : ''} for ${course.courseName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Create Subjects',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-lg font-bold text-blue-700',
        content: 'text-gray-600'
      }
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    setResults([]);
    setShowResults(true);

    const token = localStorage.getItem('token');
    const creationResults = [];

    // Show progress during creation
    let completedCount = 0;
    const totalCount = validSubjects.length;

    // Process subjects one by one
    for (let i = 0; i < validSubjects.length; i++) {
      const subject = validSubjects[i];
      try {
        const response = await axios.post(
          'https://backend-pharmacy-5541.onrender.com/api/subjects',
          {
            name: subject.name.trim(),
            code: subject.code.trim().toUpperCase(),
            courseId: course._id,
            description: subject.description.trim() || undefined
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        creationResults.push({
          subject: subject,
          success: true,
          data: response.data.data,
          message: 'Created successfully'
        });
      } catch (error) {
        creationResults.push({
          subject: subject,
          success: false,
          error: error.response?.data?.message || error.message,
          message: 'Failed to create'
        });
      }
      
      completedCount++;
      // Update progress every subject
      if (completedCount < totalCount) {
        console.log(`Progress: ${completedCount}/${totalCount} subjects processed`);
      }
    }

    setResults(creationResults);
    setLoading(false);

    // Show result notification
    const successCount = creationResults.filter(result => result.success).length;
    const failureCount = creationResults.length - successCount;

    if (successCount === creationResults.length) {
      // All successful
      Swal.fire({
        title: 'All Subjects Created!',
        text: `Successfully created ${successCount} subject${successCount > 1 ? 's' : ''} for ${course.courseName}`,
        icon: 'success',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });
    } else if (successCount > 0) {
      // Partial success
      Swal.fire({
        title: 'Partial Success',
        text: `${successCount} subject${successCount > 1 ? 's' : ''} created successfully, ${failureCount} failed. Please check the results below.`,
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-yellow-700',
          content: 'text-gray-600'
        }
      });
    } else {
      // All failed
      Swal.fire({
        title: 'Creation Failed',
        text: 'All subjects failed to create. Please check the errors below and try again.',
        icon: 'error',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }

    // Call callback if any subjects were created successfully
    if (successCount > 0 && onSubjectsCreated) {
      onSubjectsCreated(creationResults.filter(result => result.success));
    }
  };

  const handleClose = async () => {
    // Check if there's any unsaved data
    const hasUnsavedData = subjects.some(subject => 
      subject.name.trim() || subject.code.trim() || subject.description.trim()
    );

    if (hasUnsavedData && !showResults) {
      const result = await Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close without saving?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Discard',
        cancelButtonText: 'Continue Editing',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-lg font-bold text-yellow-700',
          content: 'text-gray-600'
        }
      });

      if (!result.isConfirmed) return;
    }

    setSubjects([{ name: '', code: '', description: '' }]);
    setResults([]);
    setShowResults(false);
    onClose();
  };

  const startOver = () => {
    setSubjects([{ name: '', code: '', description: '' }]);
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto w-11/12 max-w-4xl mb-10">
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                  <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Add Subjects</h2>
                  <p className="text-blue-100 text-sm hidden sm:block">
                    For: {course.courseName} ({course.courseCode})
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {!showResults ? (
              <>
                {/* Course Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center">
                    <Book className="w-5 h-5 mr-2 text-blue-600" />
                    Course Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <span className="font-medium text-gray-700 block">Course Name:</span>
                      <span className="text-gray-900 font-semibold">{course.courseName}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <span className="font-medium text-gray-700 block">Course Code:</span>
                      <span className="text-blue-600 font-semibold">{course.courseCode}</span>
                    </div>
                    {course.department && (
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <span className="font-medium text-gray-700 block">Department:</span>
                        <span className="text-gray-900 font-semibold">{course.department}</span>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <span className="font-medium text-gray-700 block">Total Batches:</span>
                      <span className="text-green-600 font-semibold">{course.batches?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Subjects Form */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add Multiple Subjects</h3>
                    <button
                      onClick={addSubjectRow}
                      className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Another Subject</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>

                  {/* Subject Rows */}
                  <div className="space-y-4">
                    {subjects.map((subject, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm sm:text-base font-medium text-gray-900">Subject {index + 1}</h4>
                          {subjects.length > 1 && (
                            <button
                              onClick={() => removeSubjectRow(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={subject.name}
                              onChange={(e) => updateSubject(index, 'name', e.target.value)}
                              className={getFieldClassName(index, 'name')}
                              placeholder="e.g., Data Structures and Algorithms"
                            />
                            {subject.name.trim() && subject.name.trim().length < 3 && (
                              <p className="text-xs text-red-600 mt-1">Subject name must be at least 3 characters</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={subject.code}
                              onChange={(e) => updateSubject(index, 'code', e.target.value.toUpperCase())}
                              className={getFieldClassName(index, 'code')}
                              placeholder="e.g., DSA101"
                            />
                            {subject.code.trim() && subject.code.trim().length < 2 && (
                              <p className="text-xs text-red-600 mt-1">Subject code must be at least 2 characters</p>
                            )}
                            {(() => {
                              const codes = subjects.map(s => s.code.trim().toUpperCase()).filter(Boolean);
                              const currentCode = subject.code.trim().toUpperCase();
                              const duplicateCount = codes.filter(code => code === currentCode).length;
                              if (currentCode && duplicateCount > 1) {
                                return <p className="text-xs text-red-600 mt-1">Duplicate subject code detected</p>;
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            value={subject.description}
                            onChange={(e) => updateSubject(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                            placeholder="Brief description of the subject..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Subjects...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Subjects</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Results View */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    {results.filter(r => r.success).length === results.length ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Subject Creation Results</h3>
                  <p className="text-gray-600">
                    {results.filter(r => r.success).length} of {results.length} subjects created successfully
                  </p>
                </div>

                {/* Results List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-3 sm:p-4 ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {result.success ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <h4 className={`font-semibold text-sm sm:text-base ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                              {result.subject.name} ({result.subject.code})
                            </h4>
                          </div>
                          <p className={`text-xs sm:text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                            {result.success ? result.message : result.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results Actions */}
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={startOver}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add More Subjects
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectCreationModal;
