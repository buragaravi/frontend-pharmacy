import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserDetails from '../../components/UserDetails';
import QuotationPage from '../quotations/QuotationPage';
import ChemicalDashboard from '../chemicals/ChemicalDashboard';
import TransactionsPage from '../transactions/TransactionsPage';
import ExperimentsPage from '../../pages/ExperimentsPage';
import UserManagement from '../users/UserManagement';
import IndentPage from '../indents/IndentPage';
import { AllocateGlasswareForm, GlasswareStockPage } from '../glassware';
import { AllocateOtherProductForm } from '../other';
import ProductList from '../products/ProductList';
import InvoicePage from '../invoice/InvoicePage';
import VendorList from '../vendor/VendorList';
import { AllocateEquipmentToLabByScanForm } from '../equipment';
import LabRequestListPage from '../requests/LabRequestListPage';
import EquipmentStockList from  '../equipment/EquipmentStockList';

// Combine Admin and Central Admin menu items
const NAV_ITEMS = [
  { key: 'chemicals', label: 'Chemicals', component: <ChemicalDashboard /> },
  { key: 'quotations', label: 'Quotations', component: <QuotationPage /> },
  { key: 'indents', label: 'Indents', component: <IndentPage /> },
  { key: 'experiments', label: 'Experiments', component: <ExperimentsPage /> },
  { key: 'transactions', label: 'Reports', component: <TransactionsPage /> },
  { key: 'allocate_equipment', label: 'Allocate Equipment', component: <AllocateEquipmentToLabByScanForm /> },
  { key: 'allocate_glassware', label: 'Allocate Glassware', component: <AllocateGlasswareForm /> },
  { key: 'glassware_stock', label: 'Glassware Stock', component: <GlasswareStockPage /> },
  { key: 'allocate_other', label: 'Allocate Other Products', component: <AllocateOtherProductForm /> },
  { key: 'products', label: 'Products', component: <ProductList /> },
  { key: 'invoices', label: 'Invoices', component: <InvoicePage /> },
  { key: 'vendors', label: 'Vendors', component: <VendorList /> },
  { key: 'equipment_stock', label: 'Equipment Stock', component: <EquipmentStockList /> },
  { key: 'labrequests', label: 'Lab Requests', component: null },
  { key: 'users', label: 'User Management', component: <UserManagement /> }
];

const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse bg-gray-100 rounded-xl p-6 h-40 w-full">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }
  return (
    <div className="animate-pulse flex items-center justify-center h-40">
      <div className="rounded-full h-12 w-12 bg-blue-100 opacity-70"></div>
    </div>
  );
};

const AdminDashboard = () => {
  const [selected, setSelected] = useState('chemicals');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch user data
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

  // Same as CentralLabAdminDashboard
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
      {/* Two-line Navigation Bar */}
      <header className="w-full bg-white shadow-sm backdrop-blur sticky top-0 z-50 border-b border-gray-100">
        {/* First line - Logo, Title, User, Logout */}
        <div className="w-full border-b border-gray-100">
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <img src="/pydah.svg" alt="Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-blue-800 tracking-tight whitespace-nowrap">
                Admin Dashboard
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

        {/* Second line - Navigation Menu */}
        <nav className="w-full">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center justify-end px-4 py-2">
            <button
              className="flex items-center justify-center p-2 rounded-lg focus:outline-none hover:bg-blue-50 transition-colors"
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
          <div className="hidden md:block px-4 sm:px-6 py-2">
            <ul className="flex flex-wrap gap-2 items-center justify-start max-w-7xl mx-auto">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <button
                    className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                      selected === item.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-blue-600'
                    }`}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden w-full bg-white shadow-lg border-t border-gray-100 animate-fade-in-down">
              <ul className="flex flex-col gap-1 py-3 px-4">
                {NAV_ITEMS.map((item) => (
                  <li key={item.key}>
                    <button
                      className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        selected === item.key ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-blue-600'
                      }`}
                      onClick={() => handleNavClick(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                {user && (
                  <li className="px-4 py-2 text-sm text-blue-600 border-t border-gray-100 mt-2 sm:hidden">
                    Logged in as: {user.name}
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>
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

export default AdminDashboard;
