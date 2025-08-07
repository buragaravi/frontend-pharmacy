import React, { useState, useEffect } from 'react';

const LabSelector = ({ 
  value, 
  onChange, 
  placeholder = "Select lab...",
  disabled = false,
  showSystemBadge = true,
  includeInactive = false,
  error = null,
  required = false,
  className = ""
}) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://backend-pharmacy-5541.onrender.com/api/labs?includeInactive=${includeInactive}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to load labs');

        const data = await response.json();
        setLabs(data.data || []);
      } catch (error) {
        console.error('Error loading labs:', error);
        // Fallback to just central-store if API fails
        setLabs([{
          labId: 'central-store',
          labName: 'Central Store',
          isSystem: true,
          isActive: true
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadLabs();
  }, [includeInactive]);

  if (loading) {
    return (
      <select 
        disabled 
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 ${className}`}
      >
        <option>Loading labs...</option>
      </select>
    );
  }

  return (
    <div className="space-y-1">
      <select
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      >
        <option value="">{placeholder}</option>
        {labs.map((lab) => (
          <option 
            key={lab.labId} 
            value={lab.labId}
            disabled={!lab.isActive}
            className={!lab.isActive ? 'text-gray-400' : ''}
          >
            {lab.labName} ({lab.labId})
            {showSystemBadge && lab.isSystem ? ' [System]' : ''}
            {!lab.isActive ? ' [Inactive]' : ''}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {labs.length === 0 && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No labs available. Contact admin to create labs.
        </p>
      )}
    </div>
  );
};

export default LabSelector;
