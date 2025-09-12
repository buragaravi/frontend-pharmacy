import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentToken } from '../utils/authUtils';

// Glassmorphic theme constants
const THEME = {
  background: 'bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-100/90',
  card: 'bg-white/20 backdrop-blur-xl border border-white/30',
  cardHover: 'hover:bg-white/30 hover:border-white/40',
  text: {
    primary: 'text-slate-700',
    secondary: 'text-slate-600',
    accent: 'text-blue-600',
  },
  button: {
    primary: 'bg-blue-500/80 hover:bg-blue-600/90 text-white backdrop-blur-sm',
    secondary: 'bg-white/20 hover:bg-white/30 text-slate-700 backdrop-blur-sm border border-white/30',
  },
  input: 'bg-white/20 border border-white/30 text-slate-700 placeholder-slate-500 backdrop-blur-sm',
  shadow: 'shadow-xl shadow-blue-500/10',
};

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(navigate);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getCurrentToken();
        if (token) {
          const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // If token is invalid, logout user
        logoutUser(navigate);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500/60"></div>
      </div>
    );
  }

  if (!user) return <p className={`${THEME.text.primary} text-center`}>Failed to load user information.</p>;

  return (
    <div className="relative w-full">
      {/* Floating bubbles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <div className={`relative z-10 p-4 sm:p-6 rounded-2xl ${THEME.card} ${THEME.shadow} w-full max-w-4xl mx-auto`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex items-center">
            <div className={`${THEME.card} p-3 rounded-full mr-4 ${THEME.shadow}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 sm:h-8 sm:w-8 ${THEME.text.accent}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${THEME.text.primary}`}>Welcome, {user.name}!</h2>
          </div>
          
          <button
            onClick={handleLogout}
            className={`flex items-center ${THEME.button.secondary} px-4 py-2 rounded-lg transition-all duration-200 ${THEME.shadow} hover:shadow-lg text-sm`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>

        <div className="grid gap-4 sm:gap-6">
          <div className={`${THEME.card} rounded-xl p-4 sm:p-6 ${THEME.shadow}`}>
            <div className="grid gap-4">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${THEME.text.accent} mt-1 mr-3 flex-shrink-0`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div className="flex-1">
                  <p className={`${THEME.text.secondary} text-xs uppercase tracking-wide mb-1`}>Email</p>
                  <p className={`${THEME.text.primary} text-sm font-medium`}>{user.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${THEME.text.accent} mt-1 mr-3 flex-shrink-0`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                <div className="flex-1">
                  <p className={`${THEME.text.secondary} text-xs uppercase tracking-wide mb-1`}>User ID</p>
                  <p className={`${THEME.text.primary} text-sm font-medium`}>{user.userId}</p>
                </div>
              </div>

              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${THEME.text.accent} mt-1 mr-3 flex-shrink-0`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className={`${THEME.text.secondary} text-xs uppercase tracking-wide mb-1`}>Role</p>
                  <span className={`inline-flex items-center px-2.5 py-1 ${THEME.card} ${THEME.text.primary} rounded-full text-xs font-medium ${THEME.shadow}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              {user.role === 'lab_assistant' && (
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${THEME.text.accent} mt-1 mr-3 flex-shrink-0`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className={`${THEME.text.secondary} text-xs uppercase tracking-wide mb-1`}>Lab ID</p>
                    <span className={`inline-flex items-center px-2.5 py-1 ${THEME.card} ${THEME.text.primary} rounded-full text-xs font-medium ${THEME.shadow}`}>
                      {user.labId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;