import React, { useState } from 'react';
import CreateRequestForm from './CreateRequestForm';

// SVG Icons
const RequestIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

// Theme configuration
const THEME = {
  background: 'bg-gradient-to-br from-blue-100 to-blue-200',
  card: 'bg-white',
  border: 'border-blue-300',
  primaryText: 'text-blue-900',
  secondaryText: 'text-blue-600',
  primaryBg: 'bg-blue-900',
  secondaryBg: 'bg-blue-600',
  hoverBg: 'hover:bg-blue-700',
  inputFocus: 'focus:ring-blue-900 focus:border-blue-900'
};

const RequestPage = () => {
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
    <div className={`p-4 md:p-6 min-h-screen ${THEME.background}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`${THEME.card} rounded-xl shadow-xl p-4 md:p-8 ${THEME.border}`}>
          <div className="flex items-center mb-6">
            <div className={`${THEME.primaryBg} p-2 rounded-lg mr-3`}>
              <RequestIcon />
            </div>
            <h2 className={`text-xl md:text-2xl font-bold ${THEME.primaryText}`}>
              Submit New Chemical Request
            </h2>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border-l-4 border-green-500">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border-l-4 border-red-500">
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