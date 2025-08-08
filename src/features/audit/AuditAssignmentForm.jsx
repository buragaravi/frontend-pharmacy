import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AuditAssignmentForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    labs: [],
    categories: [],
    dueDate: '',
    estimatedDuration: '',
    priority: 'medium',
    isRecurring: false,
    recurringPattern: {
      frequency: 'monthly',
      interval: 1
    }
  });
  
  const [faculty, setFaculty] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabs, setSelectedLabs] = useState([]);

  const categories = [
    { value: 'chemical', label: 'Chemicals', color: 'bg-blue-100 text-blue-800' },
    { value: 'equipment', label: 'Equipment', color: 'bg-purple-100 text-purple-800' },
    { value: 'glassware', label: 'Glassware', color: 'bg-green-100 text-green-800' },
    { value: 'others', label: 'Other Products', color: 'bg-orange-100 text-orange-800' },
    { value: 'all', label: 'All Categories', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchFaculty();
    fetchLabs();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Filter for faculty users and ensure we have an array
      const users = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setFaculty(users.filter(user => user.role === 'faculty'));
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setFaculty([]); // Set empty array on error
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/labs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Backend returns { success: true, count: number, data: Lab[] }
      setLabs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
      setLabs([]); // Set empty array on error to prevent map errors
    }
  };

  const handleLabSelection = (lab) => {
    const isSelected = selectedLabs.some(l => l.labId === lab.labId);
    if (isSelected) {
      setSelectedLabs(selectedLabs.filter(l => l.labId !== lab.labId));
    } else {
      setSelectedLabs([...selectedLabs, { labId: lab.labId, labName: lab.labName }]);
    }
  };

  const handleCategorySelection = (category) => {
    const isSelected = formData.categories.includes(category);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c !== category)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        labs: selectedLabs,
        dueDate: new Date(formData.dueDate).toISOString()
      };

      await axios.post('https://backend-pharmacy-5541.onrender.com/api/audit/assignments', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating audit assignment:', error);
      alert('Failed to create audit assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Create Audit Assignment</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Monthly Equipment Audit - Lab 01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Faculty *
              </label>
              <select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Faculty</option>
                {faculty.map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the audit assignment..."
            />
          </div>

          {/* Lab Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Labs * ({selectedLabs.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {Array.isArray(labs) && labs.length > 0 ? (
                labs.map(lab => (
                  <div
                    key={lab.labId}
                    onClick={() => handleLabSelection(lab)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedLabs.some(l => l.labId === lab.labId)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{lab.labName}</div>
                    <div className="text-xs text-gray-500">{lab.labId}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-4">
                  {labs.length === 0 ? 'No labs available' : 'Loading labs...'}
                </div>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Audit Categories * ({formData.categories.length} selected)
            </label>
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <div
                  key={category.value}
                  onClick={() => handleCategorySelection(category.value)}
                  className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.categories.includes(category.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{category.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="4"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                Make this a recurring audit
              </label>
            </div>
            
            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.recurringPattern.frequency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurringPattern: { ...prev.recurringPattern, frequency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Every
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.recurringPattern.interval}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurringPattern: { ...prev.recurringPattern, interval: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedLabs.length === 0 || formData.categories.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AuditAssignmentForm;
