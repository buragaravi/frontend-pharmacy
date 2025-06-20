import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QuotationPage from '../quotations/QuotationPage';
import ChemicalDashboard from '../chemicals/ChemicalDashboard';
import TransactionsPage from '../transactions/TransactionsPage';
import ExperimentsPage from '../../pages/ExperimentsPage';
import LabRequestListPage from '../requests/LabRequestListPage';
import IndentPage from '../indents/IndentPage';
import { AllocateGlasswareForm, GlasswareStockPage } from '../glassware';
import { AllocateOtherProductForm } from '../other';
import ProductList from '../products/ProductList';
import InvoicePage from '../invoice/InvoicePage';
import VendorList from '../vendor/VendorList';
import { AllocateEquipmentToLabByScanForm } from '../equipment';
import EquipmentStockList from '../equipment/EquipmentStockList';

const NAV_ITEMS = [
  { key: 'chemicals', label: 'Chemicals', component: <ChemicalDashboard /> },
  { key: 'quotations', label: 'Quotations', component: <QuotationPage /> },
  { key: 'indents', label: 'Indents', component: <IndentPage /> },
  { key: 'transactions', label: 'Reports', component: <TransactionsPage /> },
  { key: 'allocate_equipment', label: 'Allocate Equipment', component: <AllocateEquipmentToLabByScanForm /> },
  { key: 'allocate_glassware', label: 'Allocate Glassware', component: <AllocateGlasswareForm /> },
  { key: 'glassware_stock', label: 'Glassware Stock', component: <GlasswareStockPage /> },
  { key: 'allocate_other', label: 'Allocate Other Products', component: <AllocateOtherProductForm /> },
  { key: 'experiments', label: 'Experiments', component: <ExperimentsPage /> },
  { key: 'products', label: 'Products', component: <ProductList /> },
  { key: 'invoices', label: 'Invoices', component: <InvoicePage /> },
  { key: 'vendors', label: 'Vendors', component: <VendorList /> },
  { key: 'equipment_stock', label: 'Equipment Stock', component: <EquipmentStockList /> },
  { key: 'labrequests', label: 'Lab Requests', component: null },
];

const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

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
  const [selected, setSelected] = useState('chemicals');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleNavClick = (item) => {
    setSelected(item.key);
    setMobileMenuOpen(false);
  };

  const renderLabRequests = () => {
    if (expandedLab) {
      return (
        <>
          <div className="flex flex-row flex-wrap gap-3 mb-6 items-center justify-between relative">
            <div className="flex flex-wrap gap-3 flex-grow">
              {labList.map((lab) => (
                <button
                  key={lab}
                  className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-200 text-sm md:text-base focus:outline-none ${
                    expandedLab === lab
                      ? 'bg-blue-600 text-white border border-blue-700 shadow-md'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => setExpandedLab(lab)}
                >
                  {lab}
                </button>
              ))}
            </div>
            <button
              className="ml-2 p-2 rounded-full bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 font-medium text-lg flex items-center justify-center shadow-sm transition-colors"
              style={{ minWidth: 36, minHeight: 36 }}
              onClick={() => setExpandedLab(null)}
              title="Close"
            >
              <span className="text-xl leading-none">✖</span>
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            <LabRequestListPage labId={expandedLab} key={expandedLab} />
          </div>
        </>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {labList.map((lab) => (
          <div
            key={lab}
            className="aspect-square flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
            onClick={() => setExpandedLab(lab)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-30"></div>
            <span className="text-2xl font-bold text-blue-800 relative z-10 mb-2">{lab}</span>
            <span className="text-lg font-medium text-blue-700 relative z-10 mb-2">Lab Requests</span>
            <span className="relative z-10 inline-block bg-white text-blue-700 font-medium rounded-lg px-4 py-2 mt-2 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
              View
            </span>
          </div>
        ))}
      </div>
    );
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
    if (selected === 'labrequests') return renderLabRequests();

    const found = NAV_ITEMS.find((item) => item.key === selected);
    return found?.component || null;
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
              <span className="text-xl font-semibold text-blue-800 tracking-tight whitespace-nowrap">
                Central Lab Admin
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
                className="px-4 py-2 rounded-xl bg-white text-blue-700 font-medium hover:bg-blue-50 transition-all soft-shadow hover-scale"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Second line - Navigation Menu */}
          <nav className="w-full">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center justify-end pb-2">
              <button
                className="flex items-center justify-center p-2 rounded-xl focus:outline-none bg-white soft-shadow hover-scale"
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
            <div className="hidden md:block">
              <ul className="flex flex-wrap gap-2 items-center justify-start pb-3">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2 hover-scale ${
                        selected === item.key 
                          ? 'bg-blue-100/50 text-blue-600 scale-in neumorphic-active' 
                          : 'bg-white text-blue-600 soft-shadow hover:bg-blue-50'
                      }`}
                      onClick={() => handleNavClick(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-100/50 fade-in">
            <ul className="flex flex-col gap-1 py-3 px-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                      selected === item.key 
                        ? 'bg-blue-100/50 text-blue-600 neumorphic-active' 
                        : 'bg-white text-blue-600 soft-shadow'
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
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
        <p>Central Lab Admin Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default CentralLabAdminDashboard;