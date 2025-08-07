import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseDetailModal = ({ 
  course, 
  isOpen, 
  onClose, 
  loading = false, 
  error = '',
  onAddSubject,
}) => {
  const [courseDetails, setCourseDetails] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && course) {
      fetchCourseDetails();
      fetchSubjects();
    }
  }, [isOpen, course]);

  const fetchCourseDetails = async () => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://backend-pharmacy-5541.onrender.com/api/courses/${course._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCourseDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      setDetailError('Failed to load course details');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://backend-pharmacy-5541.onrender.com/api/subjects?courseId=${course._id}&isActive=true`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Fetched subjects:', response.data);
      if (response.data.success) {
        setSubjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  if (!isOpen || !course) return null;

  const activeBatches = courseDetails?.batches?.filter(batch => batch.isActive) || [];
  const inactiveBatches = courseDetails?.batches?.filter(batch => !batch.isActive) || [];
  const academicYears = [...new Set(courseDetails?.batches?.map(batch => batch.academicYear) || [])].sort().reverse();

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto w-11/12 max-w-6xl mb-10">
        <div className="bg-white shadow-2xl rounded-xl border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-xl bg-blue-600 bg-opacity-20 flex items-center justify-center text-white font-bold text-2xl">
                  {course.courseCode?.charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{course.courseName}</h2>
                  <p className="text-blue-100">Code: {course.courseCode}</p>
                  <div className="mt-1">
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

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAddSubject && onAddSubject(course)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Subject</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mt-6 bg-blue-500 bg-opacity-30 p-1 rounded-lg">
              <TabButton
                id="overview"
                label="Overview"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              />
              <TabButton
                id="batches"
                label="Batches"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>}
                isActive={activeTab === 'batches'}
                onClick={() => setActiveTab('batches')}
              />
              <TabButton
                id="subjects"
                label="Subjects"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>}
                isActive={activeTab === 'subjects'}
                onClick={() => setActiveTab('subjects')}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {detailLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : detailError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{detailError}</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Course Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Course Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                          <p className="text-gray-900 font-medium">{courseDetails?.courseName || course.courseName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                          <p className="text-gray-900 font-medium">{courseDetails?.courseCode || course.courseCode}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <p className="text-gray-900 font-medium">{courseDetails?.department || course.department || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            (courseDetails?.isActive ?? course.isActive)
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(courseDetails?.isActive ?? course.isActive) ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {(courseDetails?.description || course.description) && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-700">{courseDetails?.description || course.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{courseDetails?.batches?.length || 0}</div>
                        <div className="text-sm text-gray-600">Total Batches</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{activeBatches.length}</div>
                        <div className="text-sm text-gray-600">Active Batches</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
                        <div className="text-sm text-gray-600">Total Subjects</div>
                      </div>
                    </div>

                    {/* Academic Years */}
                    {academicYears.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Years</h3>
                        <div className="flex flex-wrap gap-2">
                          {academicYears.map((year) => (
                            <span
                              key={year}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {year}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Batches Tab */}
                {activeTab === 'batches' && (
                  <div className="space-y-6">
                    {/* Active Batches */}
                    {activeBatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Batches ({activeBatches.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeBatches.map((batch, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{batch.batchName}</h4>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  Active
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Academic Year:</span> {batch.academicYear}</p>
                                <p><span className="font-medium">Semester:</span> {batch.semester}</p>
                                {batch.section && <p><span className="font-medium">Section:</span> {batch.section}</p>}
                                {batch.maxStudents && <p><span className="font-medium">Max Students:</span> {batch.maxStudents}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inactive Batches */}
                    {inactiveBatches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inactive Batches ({inactiveBatches.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {inactiveBatches.map((batch, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-700">{batch.batchName}</h4>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-500">
                                <p><span className="font-medium">Academic Year:</span> {batch.academicYear}</p>
                                <p><span className="font-medium">Semester:</span> {batch.semester}</p>
                                {batch.section && <p><span className="font-medium">Section:</span> {batch.section}</p>}
                                {batch.maxStudents && <p><span className="font-medium">Max Students:</span> {batch.maxStudents}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {courseDetails?.batches?.length === 0 && (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
                        <p className="mt-1 text-sm text-gray-500">This course doesn't have any batches yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                  <div className="space-y-6">
                    {subjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((subject) => (
                          <div key={subject._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                subject.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {subject.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><span className="font-medium">Code:</span> {subject.code}</p>
                              {subject.description && (
                                <p className="text-gray-500 text-xs mt-2">{subject.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                        <p className="mt-1 text-sm text-gray-500">This course doesn't have any subjects yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;
