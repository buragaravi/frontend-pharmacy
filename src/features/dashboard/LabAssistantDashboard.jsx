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
    key: 'indents',
    label: 'Indents',
    component: IndentPage,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm0 4h14v2H5zm-4-8h2v2H1zm0 4h2v2H1zm0 4h2v2H1z" />
      </svg>
    )
  },
  {
    key: 'chemicals',
    label: 'Chemicals',
    component: ChemicalDashboard,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM15 20H6c-.55 0-1-.45-1-1v-1h10v2zm4-1c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z" />
      </svg>
    )
  },
  {
    key: 'glassware_stock',
    label: 'Glassware Stock',
    component: GlasswareStockPage,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
      </svg>
    )
  },
  {
    key: 'requests',
    label: 'Lab Requests',
    component: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
      </svg>
    )
  },
  {
    key: 'transactions',
    label: 'Transactions',
    component: TransactionsPage,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
      </svg>
    )
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
    )
  },
  {
    key: 'profile',
    label: 'Profile',
    component: UserDetails,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
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
    .soft-shadow { box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.08), -4px -4px 8px rgba(255, 255, 255, 0.8); }
    .soft-shadow-inset { box-shadow: inset 3px 3px 6px rgba(0, 0, 0, 0.08), inset -3px -3px 6px rgba(255, 255, 255, 0.8); }
    .neumorphic-active { box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.08), inset -2px -2px 4px rgba(255, 255, 255, 0.8); }
    .royal-blue-bg { background-color: #1a237e; }
    .royal-blue-text { color: #1a237e; }
    .royal-blue-border { border-color: #1a237e; }
    .royal-blue-hover:hover { background-color: #1a237e; color: white; }
    .skeleton-wave { position: relative; overflow: hidden; }
    .skeleton-wave::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background: linear-gradient(90deg,rgba(255,255,255,0) 0,rgba(255,255,255,0.2) 20%,rgba(255,255,255,0.5) 60%,rgba(255,255,255,0)); animation: shimmer 2s infinite; content: ''; }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
  `}</style>
);

const LabAssistantDashboard = () => {
  const [labId, setLabId] = useState('');
  const [selected, setSelected] = useState('requests');
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

  // Fetch labId from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { labId } = decoded.user;
        setLabId(labId);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
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

    switch (selected) {
      case 'indents':
        return <IndentPage />;
      case 'chemicals':
        return <ChemicalDashboard />;
      case 'requests':
        return <LabRequestListPage labId={labId} />;
      case 'transactions':
        return <TransactionsPage />;
      case 'return_equipment':
        return <ReturnEquipmentToCentralForm />;
      case 'profile':
        return <UserDetails />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <AnimatedBackground />
      
      {/* Navigation Bar */}
      <header className="w-full bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200/50 slide-down">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* First line - Logo, Title, User, Logout */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl soft-shadow">
                <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              </div>
              <span className="text-xl font-semibold text-blue-900 tracking-tight whitespace-nowrap">
                Lab Assistant Dashboard
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white soft-shadow">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white font-medium hover:bg-blue-800 transition-all soft-shadow hover-scale"
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
                <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                          ? 'bg-blue-900 text-white scale-in' 
                          : 'bg-white text-blue-900 soft-shadow hover:bg-blue-50/50'
                      }`}
                      onClick={() => setSelected(item.key)}
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
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-200/50 fade-in">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                      selected === item.key 
                        ? 'bg-blue-900 text-white' 
                        : 'bg-white text-blue-900 soft-shadow'
                    }`}
                    onClick={() => {
                      setSelected(item.key);
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
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-medium">
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
      <main className="flex flex-col items-center justify-start p-4 md:p-6 w-full max-w-7xl mx-auto">
        <div
          className="w-full rounded-2xl p-5 md:p-7 bg-white/90 backdrop-blur-sm mt-4 soft-shadow"
          style={{ minHeight: 'calc(100vh - 160px)' }}
        >
          <div className="mt-1 min-h-[400px] w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      
      {/* Subtle footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>Lab Assistant Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default LabAssistantDashboard;