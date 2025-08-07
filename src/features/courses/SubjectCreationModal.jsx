import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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

  const handleSubmit = async () => {
    // Validate subjects
    const validSubjects = subjects.filter(subject => 
      subject.name.trim() && subject.code.trim()
    );

    if (validSubjects.length === 0) {
      alert('Please fill in at least one subject with name and code');
      return;
    }

    setLoading(true);
    setResults([]);
    setShowResults(true);

    const token = localStorage.getItem('token');
    const creationResults = [];

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
    }

    setResults(creationResults);
    setLoading(false);

    // Call callback if any subjects were created successfully
    const successfulCreations = creationResults.filter(result => result.success);
    if (successfulCreations.length > 0 && onSubjectsCreated) {
      onSubjectsCreated(successfulCreations);
    }
  };

  const handleClose = () => {
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
    <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto w-11/12 max-w-4xl mb-10">
        <div className="bg-white shadow-2xl rounded-xl border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center text-white font-bold text-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add Subjects</h2>
                  <p className="text-green-100">
                    For: {course.courseName} ({course.courseCode})
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showResults ? (
              <>
                {/* Course Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Course Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Course Name:</span>
                      <span className="ml-2 text-gray-900">{course.courseName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Course Code:</span>
                      <span className="ml-2 text-gray-900">{course.courseCode}</span>
                    </div>
                    {course.department && (
                      <div>
                        <span className="font-medium text-gray-700">Department:</span>
                        <span className="ml-2 text-gray-900">{course.department}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Total Batches:</span>
                      <span className="ml-2 text-gray-900">{course.batches?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Subjects Form */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Add Multiple Subjects</h3>
                    <button
                      onClick={addSubjectRow}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Another Subject</span>
                    </button>
                  </div>

                  {/* Subject Rows */}
                  <div className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-medium text-gray-900">Subject {index + 1}</h4>
                          {subjects.length > 1 && (
                            <button
                              onClick={() => removeSubjectRow(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={subject.name}
                              onChange={(e) => updateSubject(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="e.g., Data Structures and Algorithms"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={subject.code}
                              onChange={(e) => updateSubject(index, 'code', e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                              placeholder="e.g., DSA101"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                          </label>
                          <textarea
                            value={subject.description}
                            onChange={(e) => updateSubject(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Brief description of the subject..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Subjects...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Subject Creation Results</h3>
                  <p className="text-gray-600">
                    {results.filter(r => r.success).length} of {results.length} subjects created successfully
                  </p>
                </div>

                {/* Results List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {result.success ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <h4 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                              {result.subject.name} ({result.subject.code})
                            </h4>
                          </div>
                          <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                            {result.success ? result.message : result.error}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results Actions */}
                <div className="flex justify-center space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={startOver}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add More Subjects
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
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
