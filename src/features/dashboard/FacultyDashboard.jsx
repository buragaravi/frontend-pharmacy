import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserDetails from '../../components/UserDetails';
import RequestPage from '../requests/RequestPage';
import MyRequestsPage from '../requests/MyRequestsPage';
import CreateRequestForm from '../requests/CreateRequestForm';
import { useNavigate } from 'react-router-dom';
import { GlasswareStockPage } from '../glassware';

// Skeleton loader component
const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse rounded-2xl p-6 h-40 w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-4 bg-gray-200/50 rounded-full w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200/50 rounded-full w-1/2 mb-3"></div>
        <div className="h-3 bg-gray-200/50 rounded-full w-2/3"></div>
      </div>
    );
  }
  return (
    <div className="animate-pulse flex items-center justify-center h-40">
      <div className="rounded-full h-12 w-12 bg-gray-200/50"></div>
    </div>
  );
};

const menuItems = [
  { 
    key: 'myrequests', 
    label: 'My Requests', 
    component: MyRequestsPage, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  { 
    key: 'request', 
    label: 'New Request', 
    component: CreateRequestForm, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  { 
    key: 'glassware_stock', 
    label: 'Glassware Stock', 
    component: GlasswareStockPage, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
      </svg>
    )
  },
  { 
    key: 'profile', 
    label: 'Profile', 
    component: UserDetails, 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
];

// Animation keyframes
const AnimatedBackground = () => (
  <style>{`
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .animated-gradient { background-size: 400% 400%; animation: gradientShift 15s ease infinite; }
    .fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .slide-down { animation: slideDown 0.4s ease-out forwards; }
    .scale-in { animation: scaleIn 0.4s ease-out forwards; }
    .float { animation: float 6s ease-in-out infinite; }
    .hover-scale { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    .hover-scale:hover { transform: translateY(-2px); }
    .soft-shadow { box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.05), -4px -4px 12px rgba(255, 255, 255, 0.8); }
    .soft-shadow-inset { box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.05), inset -3px -3px 6px rgba(255, 255, 255, 0.8); }
    .neumorphic-active { box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.05), inset -2px -2px 4px rgba(255, 255, 255, 0.8); }
    .skeleton-wave { position: relative; overflow: hidden; }
    .skeleton-wave::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background: linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,0.2) 20%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0)); animation: shimmer 2s infinite; content: ''; }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
  `}</style>
);

const FacultyDashboard = () => {
  const [selected, setSelected] = useState('myrequests');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      );
    }
    const found = menuItems.find((item) => item.key === selected);
    return found && found.component ? React.createElement(found.component) : null;
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <AnimatedBackground />
      
      {/* Navigation Bar */}
      <header className="w-full bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100/50 slide-down">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* First line - Logo, Title, User, Logout */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 soft-shadow">
                <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              </div>
              <span className="text-xl font-semibold text-gray-700 tracking-tight whitespace-nowrap">
                Faculty Dashboard
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white soft-shadow">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {user.name}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-white text-gray-600 font-medium hover:bg-gray-50 transition-all soft-shadow hover-scale"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
          
          {/* Second line - Navigation Menu */}
          <nav className="w-full">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center justify-end pb-2">
              <button
                className="flex items-center justify-center p-2 rounded-xl focus:outline-none bg-white soft-shadow hover-scale"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <ul className="flex flex-wrap gap-2 items-center justify-start pb-3">
                {menuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2 hover-scale ${
                        selected === item.key 
                          ? 'bg-blue-100/50 text-blue-600 scale-in neumorphic-active' 
                          : 'bg-white text-gray-600 soft-shadow hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setSelected(item.key);
                        }
                      }}
                    >
                      <span className="text-lg" role="img" aria-label={item.label}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        
        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-100/50 fade-in">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                      selected === item.key 
                        ? 'bg-blue-100/50 text-blue-600 neumorphic-active' 
                        : 'bg-white text-gray-600 soft-shadow'
                    }`}
                    onClick={() => {
                      if (item.route) {
                        navigate(item.route);
                      } else {
                        setSelected(item.key);
                      }
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="text-lg" role="img" aria-label={item.label}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
              {user && (
                <li className="px-4 py-3 mt-2 rounded-xl bg-white soft-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">Logged in as</div>
                      <div>{user.name}</div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex flex-col items-center justify-start p-4 md:p-6 w-full max-w-7xl mx-auto">
        <div
          className="w-full rounded-2xl p-5 md:p-7 bg-white/80 backdrop-blur-sm mt-4 soft-shadow"
          style={{ minHeight: 'calc(100vh - 160px)' }}
        >
          <div className="mt-1 min-h-[400px] w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* Subtle footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>Faculty Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default FacultyDashboard;