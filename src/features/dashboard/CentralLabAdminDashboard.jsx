import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QuotationPage from '../quotations/QuotationPage';
import ChemicalDashboard from '../chemicals/ChemicalDashboard';
import TransactionsPage from '../transactions/TransactionsPage';
import ExperimentsPage from '../../pages/ExperimentsPage';
import UnifiedAllocateDialog from '../requests/UnifiedAllocateDialog';
import IndentPage from '../indents/IndentPage';
import { AllocateGlasswareForm, GlasswareStockPage } from '../glassware';
import AllLabRequestsPage from '../requests/AllLabRequestsPage';
import { AllocateOtherProductForm } from '../other';
import ProductList from '../products/ProductList';
import InvoicePage from '../invoice/InvoicePage';
import VendorList from '../vendor/VendorList';
import { AllocateEquipmentToLabByScanForm } from '../equipment';
import EquipmentStockList from '../equipment/EquipmentStockList';
import UserManagement from '../users/UserManagement';

// SVG Icons
const ChemicalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const EquipmentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const GlasswareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const LabRequestIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const QuotationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IndentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

const AllocateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ReportIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ExperimentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const InvoiceIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const VendorIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

// Navigation Categories - organized like AdminDashboard
const NAV_CATEGORIES = {
  'Lab Operations': [
    { key: 'labrequests', label: 'All Lab Requests', icon: LabRequestIcon, component: <AllLabRequestsPage /> },
    { key: 'quotations', label: 'Quotations', icon: QuotationIcon, component: <QuotationPage /> },
    { key: 'indents', label: 'Indents', icon: IndentIcon, component: <IndentPage /> }
  ],
  'Inventory Management': [
    { key: 'chemicals', label: 'Chemicals', icon: ChemicalIcon, component: <ChemicalDashboard /> },
    { key: 'products', label: 'Products', icon: ProductIcon, component: <ProductList /> },
    { key: 'equipment_stock', label: 'Equipment Stock', icon: EquipmentIcon, component: <EquipmentStockList /> },
    { key: 'glassware_stock', label: 'Glassware Stock', icon: GlasswareIcon, component: <GlasswareStockPage /> }
  ],
  'Allocation': [
    { key: 'allocate_equipment', label: 'Allocate Equipment', icon: AllocateIcon, component: <AllocateEquipmentToLabByScanForm /> },
    { key: 'allocate_glassware', label: 'Allocate Glassware', icon: GlasswareIcon, component: <AllocateGlasswareForm /> },
    { key: 'allocate_other', label: 'Allocate Other Products', icon: ProductIcon, component: <AllocateOtherProductForm /> }
  ],
  'Reports & Analytics': [
    { key: 'transactions', label: 'Reports', icon: ReportIcon, component: <TransactionsPage /> },
    { key: 'experiments', label: 'Experiments', icon: ExperimentIcon, component: <ExperimentsPage /> }
  ],
  'Administration': [
    { key: 'invoices', label: 'Invoices', icon: InvoiceIcon, component: <InvoicePage /> },
    { key: 'vendors', label: 'Vendors', icon: VendorIcon, component: <VendorList /> },
    { key: 'users', label: 'User Management', icon: UserIcon, component: <UserManagement /> }
  ]
};

// Flatten NAV_ITEMS for backward compatibility
const NAV_ITEMS = Object.values(NAV_CATEGORIES).flat();

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

const CentralLabAdminDashboard = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedChild, setSelectedChild] = useState('labrequests'); // Default to All Lab Requests
  const [selected, setSelected] = useState('labrequests');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // No dashboard overview - go straight to All Lab Requests
  const navigate = useNavigate();

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
    navigate('/login');
  };

  const handleParentClick = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Handler for child click
  const handleChildClick = (child) => {
    setSelectedChild(child.key);
    setShowDashboard(false);
    setMobileMenuOpen(false);
    setExpandedCategory(null);
  };

  // Find the selected child item for rendering
  const selectedChildItem = selectedChild
    ? Object.values(NAV_CATEGORIES).flat().find((item) => item.key === selectedChild)
    : null;

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
    
    // Always show the selected component, no dashboard overview
    return selectedChildItem?.component || null;
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <AnimatedBackground />
      
      {/* Navigation Bar */}
      <header className="w-full bg-white shadow-sm backdrop-blur sticky top-0 z-50 border-b border-gray-100">
        {/* First line - Logo, Title, User, Logout */}
        <div className="w-full border-b border-gray-100">
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-blue-800 tracking-tight whitespace-nowrap">
                Central Lab Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="hidden sm:inline text-sm font-medium text-blue-700">
                  Welcome, {user.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-white text-blue-700 font-medium hover:bg-blue-50 transition-colors whitespace-nowrap border border-blue-200 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Second line - Horizontal Navigation Bar */}
        <nav className="w-full bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex items-center px-4 sm:px-6 py-2 relative">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                className="flex items-center justify-center p-2 rounded-lg focus:outline-none bg-white border border-gray-200 shadow-sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center w-full">
              {/* Parent Categories as horizontal nav */}
              <div className="flex items-center space-x-2">
                {Object.entries(NAV_CATEGORIES).map(([category, items]) => (
                  <div key={category} className="relative">
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm whitespace-nowrap flex items-center gap-2 ${
                        expandedCategory === category ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-blue-700'
                      }`}
                      onClick={() => handleParentClick(category)}
                    >
                      {category}
                      <svg className={`w-4 h-4 ml-1 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                    </button>
                    {/* Dropdown for child items */}
                    {expandedCategory === category && (
                      <div className="absolute left-0 mt-2 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {items.map((item) => (
                          <button
                            key={item.key}
                            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 text-left ${
                              selectedChild === item.key ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-blue-700'
                            }`}
                            onClick={() => handleChildClick(item)}
                          >
                            <item.icon />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-100/50 fade-in">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {Object.values(NAV_CATEGORIES).flat().map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                      selectedChild === item.key 
                        ? 'bg-blue-100/50 text-blue-600' 
                        : 'bg-white text-blue-600 shadow-sm'
                    }`}
                    onClick={() => handleChildClick(item)}
                  >
                    <item.icon />
                    {item.label}
                  </button>
                </li>
              ))}
              {user && (
                <li className="px-4 py-3 mt-2 rounded-xl bg-white shadow-sm">
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
          className="w-full rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 bg-white mt-4"
          style={{ minHeight: 'calc(100vh - 100px)' }}
        >
          <div className="mt-2 min-h-[400px] w-full">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
};

export default CentralLabAdminDashboard;