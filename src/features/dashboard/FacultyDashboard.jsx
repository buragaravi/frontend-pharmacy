import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserDetails from '../../components/UserDetails';
import RequestPage from '../requests/RequestPage';
import MyRequestsPage from '../requests/MyRequestsPage';
import CreateRequestForm from '../requests/CreateRequestForm';
import ProductList from '../products/ProductList';
import RequirementsPage from '../requirements/RequirementsPage';
import AuditRouter from '../audit/AuditRouter';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { 
    key: 'myrequests', 
    label: 'My Requests', 
    component: MyRequestsPage
  },
  { 
    key: 'request', 
    label: 'New Request', 
    component: CreateRequestForm
  },
  { 
    key: 'requirements', 
    label: 'Requirements', 
    component: RequirementsPage
  },
  { 
    key: 'products', 
    label: 'Products', 
    component: () => <ProductList userRole="faculty" showAdminActions={false} />
  },
  { 
    key: 'audit', 
    label: 'Quality Audits', 
    component: () => <AuditRouter />
  },
  { 
    key: 'profile', 
    label: 'Profile', 
    component: UserDetails
  }
];

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
        <div className="flex items-center justify-center h-32">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg shadow-blue-500/10 border border-white/40">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-600 font-medium">Loading...</span>
            </div>
          </div>
        </div>
      );
    }
    const found = menuItems.find((item) => item.key === selected);
    return found && found.component ? React.createElement(found.component) : null;
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Floating claymorphism bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Bar */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-lg shadow-blue-500/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Main header line - Logo, Title, Navigation, User, Menu Button, Logout */}
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                <img src="/pydah.svg" alt="Logo" className="h-6 sm:h-8 w-auto" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Faculty Dashboard
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:block flex-1 mx-8">
              <ul className="flex flex-wrap gap-3 items-center justify-center">
                {menuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-4 py-3 rounded-2xl font-medium transition-all duration-300 text-sm whitespace-nowrap shadow-lg ${
                        selected === item.key 
                          ? 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40' 
                          : 'bg-white/60 backdrop-blur-sm text-slate-700 border border-white/40 hover:bg-white/80 hover:shadow-xl hover:shadow-blue-500/20'
                      }`}
                      onClick={() => {
                        if (item.route) {
                          navigate(item.route);
                        } else {
                          setSelected(item.key);
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="flex items-center gap-3 sm:gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg shadow-blue-500/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/25">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {user.name}
                  </span>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden flex items-center justify-center p-3 rounded-2xl focus:outline-none bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 shadow-lg shadow-blue-500/10 transition-all duration-300"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-red-400/80 to-pink-500/80 text-white border border-white/20 hover:from-red-500/90 hover:to-pink-600/90 transition-all duration-300 text-sm font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <div className="lg:hidden w-full bg-white/80 backdrop-blur-xl border-t border-white/30 shadow-lg shadow-blue-500/10">
            <ul className="flex flex-col gap-2 py-4 px-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-4 rounded-2xl font-medium transition-all duration-300 shadow-lg ${
                      selected === item.key 
                        ? 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 text-white shadow-xl shadow-indigo-500/30' 
                        : 'bg-white/60 backdrop-blur-sm text-slate-700 border border-white/40 hover:bg-white/80 hover:shadow-xl hover:shadow-blue-500/20'
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
                    {item.label}
                  </button>
                </li>
              ))}
              {user && (
                <li className="px-4 py-4 mt-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/25">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-sm text-slate-700">
                      <div className="font-semibold">Logged in as</div>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full relative z-10">
        <div className="bg-transparent min-h-[600px] p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;