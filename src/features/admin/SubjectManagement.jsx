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
      setError('Failed to fetch subjects');
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
    
    Swal.fire({
      title: editingSubject ? 'Updating Subject...' : 'Creating Subject...',
      text: 'Please wait while we process your request',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
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
          title: 'Success!',
          text: data.message,
          confirmButtonColor: '#7c3aed',
          timer: 2000,
          timerProgressBar: true,
          background: '#f8fafc',
          color: '#1e293b'
        });
        
        fetchSubjects();
        resetForm();
        setShowCreateModal(false);
        setShowEditModal(false);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.message || 'Failed to save subject',
          confirmButtonColor: '#7c3aed',
          background: '#f8fafc',
          color: '#1e293b'
        });
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Network Error!',
        text: 'Failed to save subject: ' + err.message,
        confirmButtonColor: '#7c3aed',
        background: '#f8fafc',
        color: '#1e293b'
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
      title: 'Are you sure?',
      text: 'Do you want to deactivate this subject? This action can be reversed later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, deactivate it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: '#f8fafc',
      color: '#1e293b'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Deactivating Subject...',
        text: 'Please wait while we process your request',
        allowOutsideClick: false,
        showConfirmButton: false,
        background: '#f8fafc',
        color: '#1e293b',
        willOpen: () => {
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
            title: 'Deactivated!',
            text: data.message,
            confirmButtonColor: '#7c3aed',
            timer: 2000,
            timerProgressBar: true,
            background: '#f8fafc',
            color: '#1e293b'
          });
          fetchSubjects();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: data.message,
            confirmButtonColor: '#7c3aed',
            background: '#f8fafc',
            color: '#1e293b'
          });
        }
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Network Error!',
          text: 'Failed to delete subject',
          confirmButtonColor: '#7c3aed',
          background: '#f8fafc',
          color: '#1e293b'
        });
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl shadow-inner">
                <Book className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  Subject Management
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Manage academic subjects and course content</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchAnalytics}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Analytics</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Subject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-indigo-100 p-5 mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Search Subjects</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, code, or description..."
                  className="w-full pl-10 pr-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white transition-all duration-200 placeholder-slate-400 text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Filter by Course</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-3 pr-8 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white transition-all duration-200 text-sm"
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Status Filter</label>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-3 pr-8 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white transition-all duration-200 text-sm"
                  value={filters.isActive}
                  onChange={(e) => setFilters({...filters, isActive: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-indigo-100">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Subject Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/70 divide-y divide-indigo-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
                        <span className="text-slate-500 text-sm">Loading subjects...</span>
                      </div>
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center">
                      <div className="text-slate-500 flex flex-col items-center">
                        <Book className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                        <p className="text-sm font-medium text-slate-600 mb-1">No subjects found</p>
                        <p className="text-xs text-slate-500 max-w-md">
                          {filters.search || filters.courseId || filters.isActive ? 
                            'Try adjusting your filters to find what you\'re looking for.' : 
                            'Create your first subject to get started.'}
                        </p>
                        {!(filters.search || filters.courseId || filters.isActive) && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm"
                          >
                            Create New Subject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  subjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-indigo-50 transition-colors duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                            <Book className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {subject.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                              {subject.code}
                            </div>
                            {subject.description && (
                              <div className="text-xs text-slate-400 mt-1 max-w-xs truncate">
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              {subject.courseId?.courseName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {subject.courseId?.courseCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subject.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 p-2 rounded-md transition-all duration-200"
                            title="Edit Subject"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject._id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 p-2 rounded-md transition-all duration-200"
                            title="Deactivate Subject"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl border border-indigo-100 animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all duration-200"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all duration-200 placeholder-slate-400"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Organic Chemistry"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all duration-200 placeholder-slate-400"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. CHEM301"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full appearance-none pl-3 pr-8 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all duration-200"
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
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    </div>
                  </div>
                  
                  {editingSubject && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none pl-3 pr-8 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all duration-200"
                          value={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all duration-200 resize-none placeholder-slate-400"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Subject description (optional)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-indigo-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm flex items-center space-x-2"
                  >
                    {editingSubject ? (
                      <>
                        <Edit className="h-4 w-4" />
                        <span>Update Subject</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Create Subject</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto shadow-2xl border border-indigo-100 animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Subject Analytics</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all duration-200"
                >
                  ×
                </button>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">{analytics.summary.totalSubjects}</div>
                  <div className="text-sm text-slate-600">Total Subjects</div>
                  <div className="text-xs text-slate-400 mt-1">Across all courses</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{analytics.summary.activeSubjects}</div>
                  <div className="text-sm text-slate-600">Active Subjects</div>
                  <div className="text-xs text-slate-400 mt-1">Currently available</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-rose-600 mb-1">{analytics.summary.inactiveSubjects}</div>
                  <div className="text-sm text-slate-600">Inactive Subjects</div>
                  <div className="text-xs text-slate-400 mt-1">Archived or hidden</div>
                </div>
              </div>
              
              {/* Course Distribution */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-700 mb-3">Subjects by Course</h3>
                  <div className="space-y-3">
                    {analytics.subjectsByCourse.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-200 rounded-lg border border-slate-100 shadow-sm">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-700">{item.courseName}</span>
                            <span className="text-xs text-slate-500 ml-2">{item.courseCode}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 bg-white px-3 py-1 rounded-md shadow-sm">
                          {item.activeSubjects} / {item.totalSubjects} active
                        </span>
                      </div>
                    ))}
                  </div>
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