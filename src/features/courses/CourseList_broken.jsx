import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import CourseForm from './CourseForm';
import CourseCard from './CourseCard';
import CourseStats from './CourseStats';
import CourseDetailModal from './CourseDetailModal';
import SubjectCreationModal from './SubjectCreationModal';

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
      
      const coursesData = res.data?.data || [];
      
      // Fetch subjects count for each course using subjects API
      const coursesWithSubjects = await Promise.all(
        coursesData.map(async (course) => {
          try {
            // Get subjects by courseId to count them
            const subjectsRes = await axios.get(
              `https://backend-pharmacy-5541.onrender.com/api/subjects?courseId=${course._id}&isActive=true`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            // Count subjects from the API response
            let subjectsCount = 0;
            console.log(subjectsRes.data);
            if (subjectsRes.data && subjectsRes.data.success && subjectsRes.data.data) {
              subjectsCount = subjectsRes.data.data.length;
            }
            
            return {
              ...course,
              subjectsCount
            };
          } catch (subjectError) {
            console.warn(`Failed to fetch subjects for course ${course._id}:`, subjectError);
            return {
              ...course,
              subjectsCount: 0
            };
          }
        })
      );
      
      setCourses(coursesWithSubjects);
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
        title: 'Subjects Created!',
        text: `${successCount} subject${successCount > 1 ? 's' : ''} created successfully`,
        icon: 'success',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });
      
      // Refresh courses to update subjects count
      fetchCourses();
    }
  };

  // Handle course creation
  const handleCreateCourse = async (courseData) => {
    // Show loading alert
    Swal.fire({
      title: 'Creating Course...',
      text: 'Please wait while we process your request',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(BASE_URL, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses([res.data.data, ...courses]);
      setShowForm(false);
      setError(null);
      
      // Show success message with SweetAlert
      await Swal.fire({
        icon: 'success',
        title: 'Course Created!',
        text: res.data.message || 'Course has been successfully created',
        confirmButtonText: 'Excellent!',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });
      
      fetchStats(); // Refresh stats
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.response?.data?.message || 'Failed to create course. Please try again.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle course update
  const handleUpdateCourse = async (id, courseData) => {
    // Show loading alert
    Swal.fire({
      title: 'Updating Course...',
      text: 'Please wait while we process your request',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

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
        await Swal.fire({
          icon: 'success',
          title: 'Course Updated!',
          text: res.data.message || 'Course has been successfully updated',
          confirmButtonText: 'Excellent!',
          confirmButtonColor: '#2563eb',
          background: '#ffffff',
          backdrop: 'rgba(0,0,0,0.4)',
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-xl font-bold text-green-700',
            content: 'text-gray-600'
          },
          showClass: {
            popup: 'animate__animated animate__zoomIn animate__faster'
          }
        });
        
        fetchStats(); // Refresh stats
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update course';
      
      // Show error message with SweetAlert
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: errorMessage,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Course',
      text: 'Are you sure you want to delete this course? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      }
    });

    if (!result.isConfirmed) return;

    // Show loading alert
    Swal.fire({
      title: 'Deleting Course...',
      text: 'Please wait while we process your request',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-gray-900',
        content: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourses(courses.filter(c => c._id !== id));
      setError(null);
      
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Course Deleted!',
        text: 'Course has been successfully deleted',
        confirmButtonText: 'Great!',
        confirmButtonColor: '#2563eb',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-green-700',
          content: 'text-gray-600'
        },
        showClass: {
          popup: 'animate__animated animate__zoomIn animate__faster'
        }
      });
      
      fetchStats(); // Refresh stats
    } catch (err) {
      // Show error message
      await Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: err.response?.data?.message || 'Failed to delete course. Please try again.',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Statistics Section */}
        {stats && (
          <div className="mb-6 lg:mb-8 transform transition-all duration-700 hover:scale-[1.02]">
            <CourseStats stats={stats} />
          </div>
        )}

        {/* Main Content Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 overflow-hidden transition-all duration-500 hover:shadow-2xl">
          
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white overflow-hidden">
            {/* Decorative background patterns */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-transparent"></div>
            <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white/10 rounded-full"></div>
            </div>
            <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full"></div>
            </div>
            
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                {/* Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-shrink-0 p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight">
                      Course Management
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base lg:text-lg mt-1">
                      Manage courses, batches, and academic programs
                    </p>
                  </div>
                </div>  
                
                {/* Add Course Button */}
                {canManageCourses && (
                  <div className="flex-shrink-0 w-full lg:w-auto">
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setShowForm(true);
                      }}
                      className="w-full lg:w-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl lg:rounded-2xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 transform hover:scale-105 hover:shadow-xl group"
                    >
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm sm:text-base lg:text-lg">Add New Course</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters and Controls Section */}
          <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col space-y-4 lg:space-y-6">
              
              {/* Search Bar - Full Width on Mobile */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search courses by name, code, or department..."
                    className="block w-full pl-12 pr-4 py-3 lg:py-4 border border-gray-200 rounded-xl lg:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md text-sm lg:text-base"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
              </div>

              {/* Filters and View Toggle Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                
                {/* Filter Dropdowns - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 flex-1">
                  <select
                    className="px-4 py-3 lg:py-4 border border-gray-200 rounded-xl lg:rounded-2xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md text-sm lg:text-base"
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <select
                    className="px-4 py-3 lg:py-4 border border-gray-200 rounded-xl lg:rounded-2xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md text-sm lg:text-base"
                    value={filters.academicYear}
                    onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                  >
                    <option value="all">All Academic Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <select
                    className="px-4 py-3 lg:py-4 border border-gray-200 rounded-xl lg:rounded-2xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow-md text-sm lg:text-base"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-center lg:justify-end">
                  <div className="flex items-center bg-gray-100 rounded-xl lg:rounded-2xl p-1 lg:p-2">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`flex items-center justify-center gap-2 px-4 py-2 lg:px-6 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base font-medium transition-all duration-300 ${
                        viewMode === 'cards' 
                          ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                      }`}
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center justify-center gap-2 px-4 py-2 lg:px-6 lg:py-3 rounded-lg lg:rounded-xl text-sm lg:text-base font-medium transition-all duration-300 ${
                        viewMode === 'table' 
                          ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                      }`}
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/60 to-blue-50/30 backdrop-blur-sm min-h-[500px]">
            {loading ? (
              <div className="animate-pulse">
                {viewMode === 'cards' ? <CourseCardSkeleton /> : <CourseTableSkeleton />}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 lg:py-24">
                <div className="mx-auto w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 lg:mb-8 transform transition-all duration-300 hover:scale-110">
                  <svg className="w-12 h-12 lg:w-16 lg:h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-700 mb-3 lg:mb-4">No courses found</h3>
                <p className="text-base lg:text-lg text-gray-500 mb-6 lg:mb-8 max-w-md mx-auto px-4">
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
                    className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl lg:rounded-2xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base lg:text-lg"
                  >
                    Create Your First Course
                  </button>
                )}
              </div>
            ) : (
              <div className="transition-all duration-500">
                {viewMode === 'cards' ? (
                  /* Cards View - Responsive Grid with Flex Wrap */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {filteredCourses.map((course, index) => (
                      <div 
                        key={course._id} 
                        className="transform transition-all duration-300 hover:scale-105"
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          animation: 'fadeInUp 0.6s ease-out forwards'
                        }}
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
                  /* Table View - Fully Responsive */
                  <div className="overflow-hidden rounded-xl lg:rounded-2xl border border-gray-200 shadow-lg bg-white">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <tr>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="hidden md:table-cell px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">
                              Batches
                            </th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            {canManageCourses && (
                              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredCourses.map((course, index) => (
                            <tr 
                              key={course._id} 
                              className="hover:bg-blue-50/50 transition-all duration-200 cursor-pointer transform hover:scale-[1.01]"
                              style={{ 
                                animationDelay: `${index * 0.05}s`,
                                animation: 'fadeInLeft 0.4s ease-out forwards'
                              }}
                              onClick={() => handleViewCourse(course)}
                            >
                              <td className="px-4 lg:px-6 py-4 lg:py-6">
                                <div className="flex items-center space-x-3 lg:space-x-4">
                                  <div className="flex-shrink-0 h-12 w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg">
                                    {course.courseCode.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm lg:text-base font-bold text-gray-900 truncate">
                                      {course.courseName}
                                    </div>
                                    <div className="text-xs lg:text-sm text-gray-500 font-medium">
                                      Code: {course.courseCode}
                                    </div>
                                    {/* Mobile-only department info */}
                                    <div className="md:hidden text-xs text-gray-500 mt-1">
                                      {course.department || 'N/A'}
                                    </div>
                                    {/* Mobile-only batch info */}
                                    <div className="lg:hidden text-xs text-gray-500 mt-1">
                                      {course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''} • {course.batches.filter(b => b.isActive).length} active
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-4 lg:px-6 py-4 lg:py-6">
                                <div className="text-sm lg:text-base text-gray-900 font-medium">
                                  {course.department || 'N/A'}
                                </div>
                              </td>
                              <td className="hidden lg:table-cell px-4 lg:px-6 py-4 lg:py-6">
                                <div className="flex flex-col space-y-1">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {course.batches.length} Total
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {course.batches.filter(b => b.isActive).length} Active
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 lg:py-6">
                                <span className={`inline-flex px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-semibold ${
                                  course.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {course.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {canManageCourses && (
                                <td className="px-4 lg:px-6 py-4 lg:py-6 text-right">
                                  <div className="flex items-center justify-end space-x-2 lg:space-x-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCourse(course);
                                        setShowForm(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    >
                                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCourse(course._id);
                                      }}
                                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    >
                                      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
                      onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                    >
                      <option value="all">All Academic Years</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    <select
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md text-sm w-full sm:w-auto"
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
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg sm:rounded-xl p-1 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 view-toggle flex-1 sm:flex-none ${
                      viewMode === 'cards' 
                        ? 'bg-white text-blue-600 shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="hidden sm:inline">Cards</span>
                    <span className="sm:hidden">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 view-toggle flex-1 sm:flex-none ${
                      viewMode === 'table' 
                        ? 'bg-white text-blue-600 shadow-md' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Table</span>
                    <span className="sm:hidden">List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="p-3 sm:p-4 lg:p-6 bg-white/60 backdrop-blur-sm min-h-[400px]">
              {loading ? (
                <div className="animate-fadeInScale">
                  {viewMode === 'cards' ? <CourseCardSkeleton /> : <CourseTableSkeleton />}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 sm:py-16 animate-fadeInScale">
                  <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No courses found</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto px-4">
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
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg sm:rounded-xl text-white font-semibold hover:from-blue-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Create Your First Course</span>
                      <span className="sm:hidden">Create Course</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-fadeInScale">
                  {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    // Responsive Table View
                    <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200 shadow-lg bg-white">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-50">
                          <tr>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Course</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Department</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Batches</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            {canManageCourses && (
                              <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
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
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                                    {course.courseCode.charAt(0)}
                                  </div>
                                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                    <div className="text-sm sm:text-base font-bold text-gray-900 truncate">{course.courseName}</div>
                                    <div className="text-xs sm:text-sm text-gray-500 font-medium">Code: {course.courseCode}</div>
                                    {/* Show department on mobile */}
                                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                                      {course.department || 'N/A'}
                                    </div>
                                    {/* Show batch info on mobile */}
                                    <div className="lg:hidden text-xs text-gray-500 mt-1">
                                      {course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''} • {course.batches.filter(b => b.isActive).length} active
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                                  {course.department || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                <div className="text-sm font-semibold text-gray-900">
                                  {course.batches.length} batch{course.batches.length !== 1 ? 'es' : ''}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {course.batches.filter(b => b.isActive).length} active
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                                  course.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  <span className="hidden sm:inline">{course.isActive ? 'Active' : 'Inactive'}</span>
                                  <span className="sm:hidden">{course.isActive ? '✓' : '✗'}</span>
                                </span>
                              </td>
                              {canManageCourses && (
                                <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right">
                                  <div className="flex justify-end gap-1 sm:gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCourse(course);
                                        setShowForm(true);
                                      }}
                                      className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-xs font-medium hover-lift"
                                      title="Edit Course"
                                    >
                                      <span className="hidden sm:inline">Edit</span>
                                      <span className="sm:hidden">✏️</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCourse(course._id);
                                      }}
                                      className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs font-medium hover-lift"
                                      title="Delete Course"
                                    >
                                      <span className="hidden sm:inline">Delete</span>
                                      <span className="sm:hidden">🗑️</span>
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
