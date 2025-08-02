import React, { useState } from 'react';
import CreateRequestForm from './CreateRequestForm';
import { useResponsiveColors } from '../../hooks/useResponsiveColors';
import SafeButton from '../../components/SafeButton';

// SVG Icons
const RequestIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const RequestPage = () => {
  // Color utilities for cross-platform compatibility
  const { getSafeBackground, getSafeBackdrop } = useResponsiveColors();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-pharmacy-5541.onrender.com/api/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.message || 'Failed to submit request.');
        if (window.toast) window.toast.error(`Request unsuccessful: ${result.message || 'Failed to submit request.'}`);
        return;
      }
      setSuccessMessage(result.message || 'Request submitted successfully!');
      if (window.toast) window.toast.success(result.message || 'Request submitted successfully!');
    } catch (error) {
      setErrorMessage(error.message);
      if (window.toast) window.toast.error(`Request unsuccessful: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="p-4 md:p-6 min-h-screen"
      style={getSafeBackground('background', '#f9fafb')}
    >
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-xl shadow-xl p-4 md:p-8 border border-gray-200"
          style={getSafeBackground('light', '#ffffff')}
        >
          <div className="flex items-center mb-6">
            <div 
              className="p-2 rounded-lg mr-3"
              style={getSafeBackground('header', '#1d4ed8')}
            >
              <RequestIcon />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Submit New Chemical Request
            </h2>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div 
              className="mb-6 p-4 rounded-lg border-l-4 text-green-800"
              style={getSafeBackground('success', '#f0f9f0')}
            >
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div 
              className="mb-6 p-4 rounded-lg border-l-4 text-red-800"
              style={getSafeBackground('error', '#fef2f2')}
            >
              {errorMessage}
            </div>
          )}

          <CreateRequestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </div>
    </div>
  );
};

export default RequestPage;