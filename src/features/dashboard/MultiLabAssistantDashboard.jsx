import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import IndentPage from '../indents/IndentPage';
import ChemicalDashboard from '../chemicals/ChemicalDashboard';
import TransactionsPage from '../transactions/TransactionsPage';
import LabRequestListPage from '../requests/LabRequestListPage';
import UserDetails from '../../components/UserDetails';
import ReturnEquipmentToCentralForm from '../equipment/ReturnEquipmentToCentralForm';
import AuditRouter from '../audit/AuditRouter';
import { GlasswareStockPage } from '../glassware';

// Skeleton loader component
const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse rounded-2xl p-6 h-40 w-full bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="h-4 bg-blue-200/50 rounded-full w-3/4 mb-4"></div>
        <div className="h-3 bg-blue-200/50 rounded-full w-1/2 mb-3"></div>
        <div className="h-3 bg-blue-200/50 rounded-full w-2/3"></div>
      </div>
    );
  }
  return (
    <div className="animate-pulse flex items-center justify-center h-40">
      <div className="rounded-full h-12 w-12 bg-blue-200/50"></div>
    </div>
  );
};

// Multi-Lab Dashboard Component with Tab Support
const MultiLabDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLabId, setActiveLabId] = useState('');
  const [activeLabPermission, setActiveLabPermission] = useState('read');
  const [selectedMenu, setSelectedMenu] = useState('requests');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Define menu items with permission requirements
  const menuItems = [
    {
      key: 'requests',
      label: 'Lab Requests',
      component: LabRequestListPage,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      ),
      requiresPermission: 'read'
    },
    {
      key: 'indents',
      label: 'Indents',
      component: IndentPage,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm-4-8h2v2H1zm0 4h2v2H1zm0 4h2v2H1z" />
        </svg>
      ),
      requiresPermission: 'read_write'
    },
    {
      key: 'chemicals',
      label: 'Chemicals',
      component: ChemicalDashboard,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM15 20H6c-.55 0-1-.45-1-1v-1h10v2zm4-1c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z" />
        </svg>
      ),
      requiresPermission: 'read'
    },
    {
      key: 'glassware_stock',
      label: 'Glassware Stock',
      component: GlasswareStockPage,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
        </svg>
      ),
      requiresPermission: 'read'
    },
    {
      key: 'transactions',
      label: 'Transactions',
      component: TransactionsPage,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        </svg>
      ),
      requiresPermission: 'read'
    },
    {
      key: 'return_equipment',
      label: 'Return Equipment',
      component: ReturnEquipmentToCentralForm,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" />
          <path d="M6 15h12v2H6z" />
        </svg>
      ),
      requiresPermission: 'read_write'
    },
    {
      key: 'audit',
      label: 'Quality Audits',
      component: () => <AuditRouter />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      requiresPermission: 'read'
    },
    {
      key: 'profile',
      label: 'Profile',
      component: UserDetails,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      ),
      requiresPermission: 'read' // Profile is always accessible
    }
  ];

  // Fetch user info with lab assignments
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res.data;
        setUser(userData);
        
        // Set initial active lab (first lab assignment or legacy labId)
        if (userData.labAssignments && userData.labAssignments.length > 0) {
          // Use first active lab assignment
          const firstActiveLab = userData.labAssignments.find(lab => lab.isActive);
          if (firstActiveLab) {
            setActiveLabId(firstActiveLab.labId);
            setActiveLabPermission(firstActiveLab.permission);
          }
        } else if (userData.labId) {
          // Legacy single lab support
          setActiveLabId(userData.labId);
          setActiveLabPermission('read_write'); // Default for legacy
        }
        
      } catch (error) {
        console.error('Error fetching user:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handle lab switching
  const handleLabSwitch = (labId, permission) => {
    setActiveLabId(labId);
    setActiveLabPermission(permission);
    // Reset to default view when switching labs
    setSelectedMenu('requests');
  };

  // Filter menu items based on permission
  const getVisibleMenuItems = () => {
    return menuItems.filter(item => {
      if (item.requiresPermission === 'read') {
        return true; // Both read and read_write can access
      }
      if (item.requiresPermission === 'read_write') {
        return activeLabPermission === 'read_write';
      }
      return true;
    });
  };

  // Get active lab assignments (excluding central-store)
  const getActiveLabAssignments = () => {
    if (!user) return [];
    
    if (user.labAssignments && user.labAssignments.length > 0) {
      return user.labAssignments.filter(lab => 
        lab.isActive && lab.labName?.toLowerCase() !== 'central-store'
      );
    }
    
    // Legacy support - if user has single labId
    if (user.labId && user.labName?.toLowerCase() !== 'central-store') {
      return [{
        labId: user.labId,
        labName: user.labName || 'Lab',
        permission: 'read_write',
        isActive: true
      }];
    }
    
    return [];
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

    if (!activeLabId) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No Lab Assigned</h3>
          <p>You don't have access to any labs. Please contact your administrator.</p>
        </div>
      );
    }

    const visibleMenuItems = getVisibleMenuItems();
    const selectedMenuItem = visibleMenuItems.find(item => item.key === selectedMenu);
    
    if (!selectedMenuItem) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
          <p>You don't have permission to access this feature for the selected lab.</p>
        </div>
      );
    }

    const ComponentToRender = selectedMenuItem.component;
    return <ComponentToRender labId={activeLabId} />;
  };

  // Animation keyframes
  const AnimatedBackground = () => (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      .fade-in { animation: fadeIn 0.3s ease-out forwards; }
      .slide-down { animation: slideDown 0.4s ease-out forwards; }
      .scale-in { animation: scaleIn 0.4s ease-out forwards; }
      .float { animation: float 6s ease-in-out infinite; }
      .hover-scale { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
      .hover-scale:hover { transform: translateY(-2px); }
      .soft-shadow { box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.08), -4px -4px 8px rgba(255, 255, 255, 0.8); }
      .soft-shadow-inset { box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.08), inset -3px -3px 6px rgba(255, 255, 255, 0.8); }
      .neumorphic-active { box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.08), inset -2px -2px 4px rgba(255, 255, 255, 0.8); }
      .skeleton-wave { position: relative; overflow: hidden; }
      .skeleton-wave::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background: linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,0.2) 20%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0)); animation: shimmer 2s infinite; content: ''; }
    `}</style>
  );

  const activeLabAssignments = getActiveLabAssignments();
  const visibleMenuItems = getVisibleMenuItems();

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-blue-50 to-blue-100">
      <AnimatedBackground />
      
      {/* Navigation Bar */}
      <header className="w-full bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-blue-200/50 slide-down">
        <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
          {/* First line - Logo, Title, User, Logout */}
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 rounded-xl soft-shadow">
                <img src="/pydah.svg" alt="Logo" className="h-6 sm:h-8 w-auto" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-semibold text-blue-900 tracking-tight">
                  Lab Assistant Dashboard
                </span>
                {activeLabAssignments.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {activeLabAssignments.find(lab => lab.labId === activeLabId)?.labName || 'Lab'} • 
                    <span className={`ml-1 ${activeLabPermission === 'read_write' ? 'text-green-600' : 'text-blue-600'}`}>
                      {activeLabPermission === 'read_write' ? 'Full Access' : 'Read Only'}
                    </span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white soft-shadow">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-medium text-xs sm:text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:inline">
                    {user.name}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition-all soft-shadow hover-scale text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>
          </div>
          
          {/* Lab Selection Tabs - Only show if multiple labs */}
          {activeLabAssignments.length > 1 && (
            <div className="pb-2 sm:pb-3">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {activeLabAssignments.map((lab) => (
                  <button
                    key={lab.labId}
                    onClick={() => handleLabSwitch(lab.labId, lab.permission)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                      activeLabId === lab.labId
                        ? 'bg-blue-900 text-white scale-in'
                        : 'bg-white text-blue-900 soft-shadow hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate max-w-[80px] sm:max-w-none">{lab.labName}</span>
                    <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      lab.permission === 'read_write' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {lab.permission === 'read_write' ? 'RW' : 'R'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Menu Navigation */}
          <nav className="w-full">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center justify-end pb-2">
              <button
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-xl focus:outline-none bg-white soft-shadow hover-scale"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              <ul className="flex flex-wrap gap-1 sm:gap-2 items-center justify-start pb-2 sm:pb-3">
                {visibleMenuItems.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover-scale ${
                        selectedMenu === item.key 
                          ? 'bg-blue-900 text-white scale-in' 
                          : 'bg-white text-blue-900 soft-shadow hover:bg-blue-50/50'
                      }`}
                      onClick={() => setSelectedMenu(item.key)}
                    >
                      <span className="text-sm sm:text-lg" role="img" aria-label={item.label}>
                        {item.icon}
                      </span>
                      <span className="hidden sm:inline lg:inline">{item.label}</span>
                      {item.requiresPermission === 'read_write' && activeLabPermission === 'read' && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        
        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-200/50 fade-in">
            <ul className="flex flex-col gap-1 py-2 sm:py-3 px-2 sm:px-4">
              {visibleMenuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${
                      selectedMenu === item.key 
                        ? 'bg-blue-900 text-white' 
                        : 'bg-white text-blue-900 soft-shadow'
                    }`}
                    onClick={() => {
                      setSelectedMenu(item.key);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="text-base sm:text-lg" role="img" aria-label={item.label}>
                      {item.icon}
                    </span>
                    {item.label}
                    {item.requiresPermission === 'read_write' && activeLabPermission === 'read' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
              
              {/* Lab Selection in Mobile Menu */}
              {activeLabAssignments.length > 1 && (
                <>
                  <li className="border-t border-gray-200 mt-2 pt-2">
                    <div className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-600">Switch Lab:</div>
                  </li>
                  {activeLabAssignments.map((lab) => (
                    <li key={`mobile-${lab.labId}`}>
                      <button
                        onClick={() => {
                          handleLabSwitch(lab.labId, lab.permission);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${
                          activeLabId === lab.labId
                            ? 'bg-blue-900 text-white'
                            : 'bg-white text-blue-900 soft-shadow'
                        }`}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="truncate">{lab.labName}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ml-auto ${
                          lab.permission === 'read_write' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {lab.permission === 'read_write' ? 'RW' : 'R'}
                        </span>
                      </button>
                    </li>
                  ))}
                </>
              )}
              
              {user && (
                <li className="px-3 sm:px-4 py-2 sm:py-3 mt-2 rounded-xl bg-white soft-shadow border-t border-gray-200">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-medium text-xs sm:text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700">
                      <div className="font-medium">Logged in as</div>
                      <div className="truncate max-w-[120px] sm:max-w-none">{user.name}</div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4">
        <div
          className="w-full rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-7 bg-white/90 backdrop-blur-sm soft-shadow"
          style={{ minHeight: 'calc(100vh - 140px)' }}
        >
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* Subtle footer */}
      <footer className="py-3 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
        <p>Multi-Lab Assistant Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default MultiLabDashboard;
