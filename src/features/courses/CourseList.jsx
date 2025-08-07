import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import CourseForm from './CourseForm';
import CourseCard from './CourseCard';
import CourseStats from './CourseStats';
import CourseDetailModal from './CourseDetailModal';
import SubjectCreationModal from './SubjectCreationModal';

// Enhanced animations and styles
const customStyles = `
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .animate-slideInTop {
    animation: slideInFromTop 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slideInBottom {
    animation: slideInFromBottom 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slideInLeft {
    animation: slideInFromLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-fadeInScale {
    animation: fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }

  .glass-effect {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }

  .view-toggle {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .view-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.6s;
  }

  .view-toggle:hover::before {
    left: 100%;
  }

  @media (max-width: 768px) {
    .mobile-hide {
      display: none;
    }
    
    .mobile-stack {
      flex-direction: column;
      gap: 1rem;
    }
    
    .mobile-full {
      width: 100%;
    }
  }
`;

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api/courses';

const CourseList = ({ userRole = 'admin', showAdminActions = true }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    academicYear: 'all',
    status: 'active'
  });
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForSubject, setSelectedCourseForSubject] = useState(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'central_store_admin';
  const canManageCourses = showAdminActions && isAdmin;

  // Fetch courses with filters
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.department !== 'all') params.append('department', filters.department);
      if (filters.academicYear !== 'all') params.append('academicYear', filters.academicYear);
      if (filters.status !== 'all') params.append('active', filters.status === 'active');
      
      const res = await axios.get(`${BASE_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data?.data);
    } catch (err) {
      console.error('Failed to fetch course stats:', err);
    }
  };

  // Extract unique departments and academic years for filters
  const extractFilterOptions = (courses) => {
    const depts = [...new Set(courses.map(course => course.department))];
    const years = [...new Set(courses.flatMap(course => 
      course.batches.map(batch => batch.academicYear)
    ))].sort().reverse();
    
    setDepartments(depts);
    setAcademicYears(years);
  };

  // Handle course detail view
  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  // Handle subject creation modal
  const handleAddSubject = (course) => {
    setSelectedCourseForSubject(course);
    setIsSubjectModalOpen(true);
  };

  const closeSubjectModal = () => {
    setIsSubjectModalOpen(false);
    setSelectedCourseForSubject(null);
  };

  const handleSubjectsCreated = (results) => {
    const successCount = results.filter(result => result.success).length;
    if (successCount > 0) {
      Swal.fire({
        title: 'Success!',
        text: `${successCount} subject${successCount > 1 ? 's' : ''} created successfully`,
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      // Optionally refresh courses or update UI
      fetchCourses();
    }
  };

  // Handle course creation
  const handleCreateCourse = async (courseData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(BASE_URL, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses([res.data.data, ...courses]);
      setShowForm(false);
      setError(null);
      fetchStats(); // Refresh stats
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // Handle course update
  const handleUpdateCourse = async (id, courseData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Updating course with ID:', id);
      console.log('Course data:', courseData);
      
      const res = await axios.put(`${BASE_URL}/${id}`, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Update response:', res.data);
      
      if (res.data.success) {
        setCourses(courses.map(c => c._id === id ? res.data.data : c));
        setShowForm(false);
        setEditingCourse(null);
        setError(null);
        
        // Show success message with SweetAlert
        Swal.fire({
          title: 'Success!',
          text: 'Course updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10B981'
        });
        
        fetchStats(); // Refresh stats
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update course';
      setError(errorMessage);
      
      // Show error message with SweetAlert
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this course? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(courses.filter(c => c._id !== id));
      setError(null);
      
      // Show success message
      Swal.fire({
        title: 'Deleted!',
        text: 'Course has been deleted successfully.',
        icon: 'success',
        confirmButtonColor: '#10B981'
      });
      
      fetchStats(); // Refresh stats
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
      
      // Show error message
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to delete course',
        icon: 'error',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = 
      course.courseName.toLowerCase().includes(searchLower) ||
      course.courseCode.toLowerCase().includes(searchLower) ||
      course.department.toLowerCase().includes(searchLower);
    
    const matchesDepartment = filters.department === 'all' || course.department === filters.department;
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' ? course.isActive : !course.isActive);
    
    const matchesAcademicYear = filters.academicYear === 'all' || 
      course.batches.some(batch => batch.academicYear === filters.academicYear);
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesAcademicYear;
  });

  // Loading skeleton component
  const CourseTableSkeleton = ({ rows = 5 }) => (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Course</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider mobile-hide">Department</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider mobile-hide">Batches</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            {canManageCourses && (
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {[...Array(rows)].map((_, idx) => (
            <tr key={idx} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-xl shimmer" />
                  <div className="ml-4">
                    <div className="h-4 w-32 shimmer rounded-lg mb-2" />
                    <div className="h-3 w-20 shimmer rounded-lg" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 mobile-hide">
                <div className="h-6 w-24 shimmer rounded-full" />
              </td>
              <td className="px-6 py-4 mobile-hide">
                <div className="h-4 w-16 shimmer rounded-lg mb-1" />
                <div className="h-3 w-20 shimmer rounded-lg" />
              </td>
              <td className="px-6 py-4">
                <div className="h-6 w-16 shimmer rounded-full" />
              </td>
              {canManageCourses && (
                <td className="px-6 py-4 text-right">
                  <div className="inline-block h-8 w-16 shimmer rounded-lg mr-2" />
                  <div className="inline-block h-8 w-16 shimmer rounded-lg" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Card view skeleton
  const CourseCardSkeleton = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-xl shimmer" />
            <div className="ml-4 flex-1">
              <div className="h-5 w-32 shimmer rounded-lg mb-2" />
              <div className="h-4 w-20 shimmer rounded-lg" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full shimmer rounded-lg" />
            <div className="h-4 w-3/4 shimmer rounded-lg" />
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-16 shimmer rounded-full" />
              <div className="h-6 w-20 shimmer rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  useEffect(() => {
    extractFilterOptions(courses);
  }, [courses]);

  return (
    <>
      <style>{customStyles}</style>
      <div className="w-full p-4 sm:p-6">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full ">
          {/* Statistics Section */}
          {stats && (
            <div className="mb-8 animate-slideInTop">
              <CourseStats stats={stats} />
            </div>
          )}

          {/* Main Content Card */}
          <div className="glass-effect bg-white/90 rounded-2xl shadow-xl border border-white/20 overflow-hidden animate-slideInBottom">
            {/* Enhanced Header */}
            <div className="relative p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-700 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-800/20 to-blue-800/20"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-1">Course Management</h1>
                      <p className="text-blue-100 text-sm">Manage courses and academic batches</p>
                    </div>
                  </div>
                  
                  {canManageCourses && (
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setShowForm(true);
                      }}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold hover:bg-white/30 transition-all duration-300 flex items-center gap-2 hover-lift"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Course
                    </button>
                  )}
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-40 h-40 bg-white/5 rounded-full"></div>
              </div>
              <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
                <div className="w-32 h-32 bg-white/5 rounded-full"></div>
              </div>
            </div>

            {/* Controls Section */}
            <div className="p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 flex-1 mobile-stack">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md mobile-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search courses, codes, departments..."
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex gap-3 mobile-stack">
                    <select
                      className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md mobile-full"
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value})}
                    >
                      <option value="all">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    <select
                      className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md mobile-full"
                      value={filters.academicYear}
                      onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                    >
                      <option value="all">All Academic Years</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    <select
                      className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md mobile-full"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 view-toggle ${
                      viewMode === 'cards' 
                        ? 'bg-white text-blue-600 shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 view-toggle ${
                      viewMode === 'table' 
                        ? 'bg-white text-blue-600 shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Table
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 bg-white/60 backdrop-blur-sm min-h-[400px]">
              {loading ? (
                <div className="animate-fadeInScale">
                  {viewMode === 'cards' ? <CourseCardSkeleton /> : <CourseTableSkeleton />}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-16 animate-fadeInScale">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {filters.search || filters.department !== 'all' || filters.academicYear !== 'all' 
                      ? "Try adjusting your filters or search terms to find courses."
                      : "Get started by creating your first course with academic batches."
                    }
                  </p>
                  {canManageCourses && (
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setShowForm(true);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Create Your First Course
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-fadeInScale">
                  {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCourses.map((course, index) => (
                        <div 
                          key={course._id} 
                          className="animate-slideInLeft"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <CourseCard 
                            course={course}
                            onEdit={() => {
                              setEditingCourse(course);
                              setShowForm(true);
                            }}
                            onDelete={() => handleDeleteCourse(course._id)}
                            onViewDetails={handleViewCourse}
                            onAddSubject={handleAddSubject}
                            canManage={canManageCourses}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Table View Implementation will go here
                    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider mobile-hide">Department</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider mobile-hide">Batches</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            {canManageCourses && (
                              <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredCourses.map((course, index) => (
                            <tr 
                              key={course._id} 
                              className="hover:bg-blue-50/50 transition-all duration-200 animate-slideInLeft cursor-pointer"
                              style={{ animationDelay: `${index * 0.05}s` }}
                              onClick={() => handleViewCourse(course)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {course.courseCode.charAt(0)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-bold text-gray-900">{course.courseName}</div>
                                    <div className="text-xs text-gray-500 font-medium">Code: {course.courseCode}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 mobile-hide">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {course.department}
                                </span>
                              </td>
                              <td className="px-6 py-4 mobile-hide">
                                <div className="text-sm font-semibold text-gray-900">
                                  {course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {course.batches.filter(b => b.isActive).length} active
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  course.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {course.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {canManageCourses && (
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCourse(course);
                                        setShowForm(true);
                                      }}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-xs font-medium hover-lift"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCourse(course._id);
                                      }}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs font-medium hover-lift"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Form Modal */}
        {canManageCourses && showForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowForm(false);
                setEditingCourse(null);
              }}
            ></div>
            
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 scale-100 animate-fadeInScale">
              <CourseForm 
                course={editingCourse}
                onCreate={handleCreateCourse}
                onUpdate={handleUpdateCourse}
                onClose={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-6 right-6 max-w-md bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-50 animate-slideInLeft">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600 transition-colors duration-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Detail Modal */}
        {isModalOpen && (
          <CourseDetailModal
            course={selectedCourse}
            isOpen={isModalOpen}
            onClose={closeModal}
            onAddSubject={handleAddSubject}
          />
        )}

        {/* Subject Creation Modal */}
        {isSubjectModalOpen && (
          <SubjectCreationModal
            course={selectedCourseForSubject}
            isOpen={isSubjectModalOpen}
            onClose={closeSubjectModal}
            onSubjectsCreated={handleSubjectsCreated}
          />
        )}
      </div>
    </>
  );
};

export default CourseList;
