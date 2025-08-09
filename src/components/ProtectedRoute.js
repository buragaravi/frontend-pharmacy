import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: `Your role (${user?.role || 'unknown'}) is not permitted to access this page.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        navigate('/unauthorized');
      });
    }
  }, [token, user, allowedRoles, navigate]);

  if (!token || !user || !allowedRoles.includes(user.role)) {
    return null; // Optional: add a loading spinner here
  }

  return children;
};

export default ProtectedRoute;
