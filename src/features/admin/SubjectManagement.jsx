import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Book, 
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronDown,
  Loader2
} from 'lucide-react';
import SafeButton from '../../components/SafeButton';
import Swal from 'sweetalert2';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    courseId: '',
    isActive: 'true'
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    courseId: '',
    description: '',
    isActive: true
  });

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchCourses();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/subjects?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Loading Failed',
        text: 'Failed to load subject data. Please check your connection and try again.',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#6366f1',
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

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-pharmacy-5541.onrender.com/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      } else {
        setError('Failed to fetch courses: ' + data.message);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to fetch courses: ' + err.message);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-pharmacy-5541.onrender.com/api/subjects/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
        setShowAnalytics(true);
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show loading alert
    Swal.fire({
      title: editingSubject ? 'Updating Subject...' : 'Creating Subject...',
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
    
    try {
      const token = localStorage.getItem('token');
      const method = editingSubject ? 'PUT' : 'POST';
      const url = editingSubject ? `https://backend-pharmacy-5541.onrender.com/api/subjects/${editingSubject._id}` : 'https://backend-pharmacy-5541.onrender.com/api/subjects';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: editingSubject ? 'Subject Updated!' : 'Subject Created!',
          text: data.message || `Subject has been successfully ${editingSubject ? 'updated' : 'created'}`,
          confirmButtonText: 'Excellent!',
          confirmButtonColor: '#6366f1',
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
        
        fetchSubjects();
        resetForm();
        setShowCreateModal(false);
        setShowEditModal(false);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Operation Failed',
          text: data.message || `Failed to ${editingSubject ? 'update' : 'create'} subject`,
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
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your connection and try again.',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }
  };

  const handleEdit = (subject) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      courseId: subject.courseId._id,
      description: subject.description || '',
      isActive: subject.isActive
    });
    setEditingSubject(subject);
    setShowEditModal(true);
  };

  const handleDelete = async (subjectId) => {
    const result = await Swal.fire({
      title: 'Deactivate Subject',
      text: 'Are you sure you want to deactivate this subject? This action can be reversed later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Deactivate',
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
      title: 'Deactivating Subject...',
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

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-pharmacy-5541.onrender.com/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Subject Deactivated!',
          text: data.message || 'Subject has been successfully deactivated',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#10b981',
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
        fetchSubjects();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Deactivation Failed',
          text: data.message || 'Failed to deactivate subject',
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
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to the server. Please check your connection and try again.',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        backdrop: 'rgba(0,0,0,0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-xl font-bold text-red-700',
          content: 'text-gray-600'
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      courseId: '',
      description: '',
      isActive: true
    });
    setEditingSubject(null);
  };

  return (
    <div className="w-full">
      {/* Enhanced Header */}
      <div className="bg-blue-600 rounded-b-3xl">
        <div className="px-2 sm:px-4 py-2 sm:py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                <Book className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Subject Management
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
                  Manage academic subjects and course content
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <SafeButton
                onClick={fetchAnalytics}
                className="flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg sm:rounded-xl transition-all duration-300 backdrop-blur-sm shadow-lg text-sm sm:text-base"
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">Analytics</span>
              </SafeButton>
              <SafeButton
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 bg-white hover:bg-gray-50 text-blue-700 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg font-medium text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Subject</span>
              </SafeButton>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{subjects.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                <Book className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{subjects.filter(s => s.isActive).length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Inactive</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{subjects.filter(s => !s.isActive).length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Courses</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{courses.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">{/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 hover:shadow-xl transition-all duration-300">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Search & Filter Options
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Search Subjects</label>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search by name, code..."
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-300 placeholder-gray-400 text-sm hover:border-gray-400"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Filter by Course</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-300 text-sm hover:border-gray-400"
                  value={filters.courseId}
                  onChange={(e) => setFilters({...filters, courseId: e.target.value})}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Status Filter</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-300 text-sm hover:border-gray-400"
                  value={filters.isActive}
                  onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Subjects Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">Subject Details</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white uppercase tracking-wider hidden sm:table-cell">Course</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 divide-y divide-blue-50">
                {loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                          <div className="p-3 sm:p-4 bg-blue-100 rounded-xl sm:rounded-2xl">
                            <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-base sm:text-lg font-medium text-gray-600 mb-1">Loading subjects...</p>
                            <p className="text-xs sm:text-sm text-gray-400">Please wait while we fetch the data</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="text-gray-500 flex flex-col items-center">
                        <div className="p-3 sm:p-4 bg-gray-100 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                          <Book className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No subjects found</p>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-4 sm:mb-6 px-4">
                          {filters.search || filters.courseId || filters.isActive ? 
                            'Try adjusting your filters to find what you\'re looking for.' : 
                            'Create your first subject to get started with academic management.'}
                        </p>
                        {!(filters.search || filters.courseId || filters.isActive) && (
                          <SafeButton
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 font-medium shadow-lg text-sm sm:text-base"
                          >
                            Create New Subject
                          </SafeButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-blue-50 transition-all duration-300 group">
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 group-hover:bg-blue-200 transition-all duration-300">
                            <Book className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                              {subject.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg inline-block mt-1">
                              {subject.code}
                            </div>
                            {subject.description && (
                              <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 max-w-xs truncate">
                                {subject.description}
                              </div>
                            )}
                            {/* Show course info on mobile */}
                            <div className="sm:hidden mt-2">
                              <div className="text-xs text-gray-600 font-medium">
                                {subject.courseId?.courseName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {subject.courseId?.courseCode}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10 bg-blue-100 rounded-lg lg:rounded-xl flex items-center justify-center mr-3">
                            <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm lg:text-base font-medium text-gray-700">
                              {subject.courseId?.courseName}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-500">
                              {subject.courseId?.courseCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 whitespace-nowrap">
                        {subject.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                            <span className="hidden sm:inline">Active</span>
                            <span className="sm:hidden">✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                            <span className="hidden sm:inline">Inactive</span>
                            <span className="sm:hidden">✗</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2 lg:space-x-3">
                          <SafeButton
                            onClick={() => handleEdit(subject)}
                            className="text-blue-600 hover:text-blue-900 hover:bg-blue-100 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 group"
                            title="Edit Subject"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </SafeButton>
                          <SafeButton
                            onClick={() => handleDelete(subject._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1.5 sm:p-2 lg:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300"
                            title="Deactivate Subject"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </SafeButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-lg lg:max-w-2xl shadow-2xl transform animate-slideUp border border-gray-200 max-h-screen overflow-y-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                {editingSubject ? (
                  <Edit className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                ) : (
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                )}
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 px-2">
                {editingSubject ? 'Update subject information and settings' : 'Set up a new subject for academic management'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Subject Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all duration-300 placeholder-gray-400 hover:border-gray-400"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Organic Chemistry"
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Subject Code *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all duration-300 placeholder-gray-400 hover:border-gray-400"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="e.g. CHEM301"
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Course *</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full appearance-none pl-2 sm:pl-3 pr-7 sm:pr-9 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm transition-all duration-300 hover:border-gray-400"
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.courseCode} - {course.courseName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                  </div>
                </div>
                
                {editingSubject && (
                  <div className="lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Status</label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-300 hover:border-gray-400"
                        value={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">Description</label>
                <textarea
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-300 resize-none placeholder-gray-400 hover:border-gray-400"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Subject description (optional)"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t border-gray-100">
                <SafeButton
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </SafeButton>
                <SafeButton
                  type="submit"
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 font-medium shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base order-1 sm:order-2"
                >
                  {editingSubject ? (
                    <>
                      <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Update Subject</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Create Subject</span>
                    </>
                  )}
                </SafeButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full max-h-screen overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Subject Analytics</h2>
                <p className="text-xs sm:text-sm text-gray-600 px-2">Comprehensive overview of academic subject data</p>
              </div>
              
              <div className="flex justify-end mb-4 sm:mb-6">
                <SafeButton
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  <span className="text-xl sm:text-2xl">×</span>
                </SafeButton>
              </div>
              
              {/* Enhanced Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-blue-50 border border-blue-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">{analytics.summary.totalSubjects}</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-700">Total Subjects</div>
                      <div className="text-xs text-gray-500 mt-1">Across all courses</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                      <Book className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">{analytics.summary.activeSubjects}</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-700">Active Subjects</div>
                      <div className="text-xs text-gray-500 mt-1">Currently available</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 sm:mb-2">{analytics.summary.inactiveSubjects}</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-700">Inactive Subjects</div>
                      <div className="text-xs text-gray-500 mt-1">Archived or hidden</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Course Distribution */}
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                  Subjects by Course
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {analytics.subjectsByCourse.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300 rounded-lg sm:rounded-xl border border-purple-200 shadow-sm hover:shadow-md">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className="bg-purple-100 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4 shadow-inner">
                          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-sm sm:text-base font-semibold text-gray-800 block">{item.courseName}</span>
                          <span className="text-xs sm:text-sm text-gray-500 bg-white px-2 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg inline-block mt-1">{item.courseCode}</span>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 self-end sm:self-auto">
                        {item.activeSubjects} / {item.totalSubjects} active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;