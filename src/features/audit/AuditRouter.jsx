import React from 'react';
import AdminAuditDashboard from './AdminAuditDashboard';
import FacultyAuditDashboard from './FacultyAuditDashboard';

const AuditRouter = () => {
  // Decode JWT token to get user data
  const getDecodedUser = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Decode JWT token manually (split by . and decode base64)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.user || payload; // The user data might be in 'user' property or directly in payload
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const user = getDecodedUser();

  // Determine which audit dashboard to show based on user role
  if (user?.role === 'admin') {
    return <AdminAuditDashboard />;
  } else if (user?.role === 'faculty') {
    return <FacultyAuditDashboard />;
  } else {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">
            You don't have permission to access the audit system.
          </p>
        </div>
      </div>
    );
  }
};

export default AuditRouter;
