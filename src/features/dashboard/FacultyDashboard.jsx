import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserDetails from '../../components/UserDetails';
import RequestPage from '../requests/RequestPage';
import MyRequestsPage from '../requests/MyRequestsPage';
import CreateRequestForm from '../requests/CreateRequestForm';
import ProductList from '../products/ProductList';
import RequirementsPage from '../requirements/RequirementsPage';
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
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }
    const found = menuItems.find((item) => item.key === selected);
    return found && found.component ? React.createElement(found.component) : null;
  };

  return (
    <div className="min-h-screen font-sans bg-white relative">
      {/* Navigation Bar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6">
          {/* Main header line - Logo, Title, Navigation, User, Menu Button, Logout */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-50">
                <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              </div>
              <span className="text-xl font-semibold text-gray-800 tracking-tight whitespace-nowrap">
                Faculty Dashboard
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:block flex-1 mx-8">
              <ul className="flex flex-wrap gap-2 items-center justify-center">
                {menuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                        selected === item.key 
                          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
              )}
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden flex items-center justify-center p-2 rounded-lg focus:outline-none bg-gray-50 border border-gray-200 hover:bg-gray-100"
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
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <div className="md:hidden w-full bg-white border-t border-gray-200">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      selected === item.key 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'bg-white text-gray-600 border border-gray-200'
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
                <li className="px-4 py-3 mt-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-sm text-gray-700">
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
      <main className="w-full">
        <div className="bg-transparent min-h-[600px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;