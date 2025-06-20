import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (!user || !allowedRoles.includes(user.role)) {
      alert(`Access denied: Your role (${user?.role || 'unknown'}) is not permitted.`);
      navigate('/unauthorized');
    }
  }, [token, user, allowedRoles, navigate]);

  if (!token || !user || !allowedRoles.includes(user.role)) {
    return null; // Optional: add a loading spinner here
  }

  return children;
};

export default ProtectedRoute;
