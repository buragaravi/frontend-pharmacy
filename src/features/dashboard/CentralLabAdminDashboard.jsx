import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentToken } from '../../utils/authUtils';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useResponsiveColors } from '../../hooks/useResponsiveColors';
import SafeButton from '../../components/SafeButton';
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
import RequirementsPage from '../requirements/RequirementsPage';
import CourseList from '../courses/CourseList';
import AuditRouter from '../audit/AuditRouter';


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

const CourseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const AuditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Parent Category Icons
const LabOperationsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const InventoryManagementIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const AllocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ReportsAnalyticsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AdministrationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const QualityAuditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RequirementsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

// NotificationCenter Component
const NotificationCenter = ({ notifications = [], onMarkAsRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        className="p-2 rounded-full bg-white shadow hover:scale-105 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a1.5 1.5 0 0 1-1.5 2.25h-13.5a1.5 1.5 0 0 1-1.5-2.25L6 14.25V9.75a6 6 0 0 1 6-6z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={notification._id || index} className={`p-3 border-b border-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                  <div className="text-sm font-medium">{notification.type ? notification.type.toUpperCase() : 'INFO'}</div>
                  <div className="text-xs text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</div>
                  {!notification.read && (
                    <button
                      onClick={() => onMarkAsRead(notification._id)}
                      className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Categories - organized like AdminDashboard
const NAV_CATEGORIES = {
  'Lab Operations': {
    icon: LabOperationsIcon,
    items: [
      { key: 'all_lab_requests', label: 'All Lab Requests', icon: LabRequestIcon, component: <AllLabRequestsPage /> },
      { key: 'requirements', label: 'Requirements', icon: RequirementsIcon, component: <RequirementsPage /> },
      { key: 'quotations', label: 'Quotations', icon: QuotationIcon, component: <QuotationPage /> },
      { key: 'indents', label: 'Indents', icon: IndentIcon, component: <IndentPage /> }
    ]
  },
  'Inventory Management': {
    icon: InventoryManagementIcon,
    items: [
      { key: 'chemicals', label: 'Chemicals', icon: ChemicalIcon, component: <ChemicalDashboard /> },
      { key: 'products', label: 'Products', icon: ProductIcon, component: <ProductList /> },
      { key: 'equipment_stock', label: 'Equipment Stock', icon: EquipmentIcon, component: <EquipmentStockList /> },
      { key: 'glassware_stock', label: 'Glassware Stock', icon: GlasswareIcon, component: <GlasswareStockPage /> }
    ]
  },
  'Allocation': {
    icon: AllocationIcon,
    items: [
      { key: 'allocate_equipment', label: 'Allocate Equipment', icon: AllocateIcon, component: <AllocateEquipmentToLabByScanForm /> },
      { key: 'allocate_glassware', label: 'Allocate Glassware', icon: GlasswareIcon, component: <AllocateGlasswareForm /> },
    ]
  },
  'Reports & Analytics': {
    icon: ReportsAnalyticsIcon,
    items: [
      { key: 'transactions', label: 'Reports', icon: ReportIcon, component: <TransactionsPage /> },
      { key: 'experiments', label: 'Experiments', icon: ExperimentIcon, component: <ExperimentsPage /> }
    ]
  },
  'Administration': {
    icon: AdministrationIcon,
    items: [
      { key: 'courses', label: 'Course & Batch Management', icon: CourseIcon, component: <CourseList /> },
      { key: 'invoices', label: 'Invoices', icon: InvoiceIcon, component: <InvoicePage /> },
      { key: 'vendors', label: 'Vendors', icon: VendorIcon, component: <VendorList /> }
    ]
  },
  'Quality Audit': {
    icon: QualityAuditIcon,
    items: [
      { key: 'audit_dashboard', label: 'Audit Management', icon: AuditIcon, component: <AuditRouter /> }
    ]
  }
};

// Flatten NAV_ITEMS for backward compatibility
const NAV_ITEMS = Object.values(NAV_CATEGORIES).flatMap(category => category.items);

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

const CentralLabAdminDashboard = () => {
  const { getSafeBackground, getSafeBackdrop } = useResponsiveColors();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedChild, setSelectedChild] = useState('all_lab_requests'); // Default to All Lab Requests
  const [selected, setSelected] = useState('all_lab_requests');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false); // No dashboard overview - go straight to All Lab Requests
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

  // Scroll detection for scroll buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);

      setShowScrollTop(scrollTop > 200);
      setShowScrollBottom(scrollPercent < 0.9);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside dropdown
      if (!event.target.closest('.dropdown-container')) {
        setExpandedCategory(null);
      }
      // Check if click is outside mobile menu and toggle button
      if (!event.target.closest('.mobile-menu-container') && 
          !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
        setMobileExpandedCategory(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser(navigate);
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
    setMobileExpandedCategory(null);
  };

  // Find the selected child item for rendering
  const selectedChildItem = selectedChild
    ? Object.values(NAV_CATEGORIES).flatMap(category => category.items).find((item) => item.key === selectedChild)
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
    
    // Always show the selected component or default to AllLabRequestsPage
    return selectedChildItem?.component || <AllLabRequestsPage />;
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      {/* Navigation Bar */}
      <header className="w-full bg-gradient-to-br from-blue-50/90 via-blue-50/80 to-blue-100/90 backdrop-blur-xl sticky top-0 z-50 border-b border-white/30 shadow-xl shadow-blue-500/10">
        {/* Enhanced Header Section */}
        <div 
          className="relative overflow-visible"
          style={getSafeBackground('header', '#1e3a8a')}
        >
          <div className="absolute inset-0 bg-blue-900/20"></div>
          <div className="relative z-10 w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/30"
                style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.2)')}
              >
                <img src="/pydah.svg" alt="Logo" className="h-4 w-auto sm:h-5 lg:h-6" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight">
                  Central Store Admin
                </h1>
                <p className="text-blue-100 text-xs hidden sm:block">Management hub</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationCenter notifications={notifications} onMarkAsRead={markNotificationAsRead} />
              {user && (
                <span className="hidden lg:inline text-xs font-medium text-blue-100">
                  Welcome, {user.name}
                </span>
              )}
              <SafeButton
                onClick={handleLogout}
                variant="secondary"
                size="sm"
                className="text-white border border-white/30 text-xs px-2 py-1"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </SafeButton>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-24 h-24 bg-white/10 rounded-full"></div>
          </div>
        </div>

        {/* Modern Navigation Bar */}
        <nav 
          className="w-full border-b border-white/20 overflow-visible"
          style={getSafeBackdrop('10px', 'rgba(255, 255, 255, 0.4)')}
        >
          <div className="w-full flex items-center px-3 sm:px-4 lg:px-6 py-2 relative overflow-visible">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <SafeButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="secondary"
                size="sm"
                className="border border-white/60 p-1.5"
                aria-label="Toggle menu"
              >
                <svg className="w-4 h-4 text-blue-700 transition-transform duration-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </SafeButton>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center w-full overflow-visible">
              {/* Parent Categories as horizontal nav - Centered */}
              <div className="flex items-center justify-center space-x-1 xl:space-x-3 overflow-visible">
                {Object.entries(NAV_CATEGORIES).map(([category, categoryData]) => (
                  <div key={category} className="relative dropdown-container flex-shrink-0">
                    <button
                      className={`px-1.5 xl:px-3 py-1.5 xl:py-2 rounded-lg font-medium transition-all duration-400 text-xs whitespace-nowrap flex items-center gap-1 xl:gap-1.5 transform hover:scale-102 border ${
                        expandedCategory === category 
                          ? 'bg-blue-500/20 text-blue-700 border-blue-300/40 backdrop-blur-sm' 
                          : 'bg-transparent hover:bg-blue-50/30 text-blue-700 border-blue-200/30 hover:border-blue-300/50'
                      }`}
                      onClick={() => handleParentClick(category)}
                    >
                      <categoryData.icon />
                      <span className="hidden xl:inline">{category}</span>
                      <span className="xl:hidden text-[10px]">{
                        category === 'Lab Operations' ? 'Lab Ops' :
                        category === 'Inventory Management' ? 'Inventory' :
                        category === 'Allocation' ? 'Allocate' :
                        category === 'Reports & Analytics' ? 'Reports' :
                        category === 'Administration' ? 'Admin' :
                        category === 'Quality Audit' ? 'Audit' :
                        category.split(' ')[0]
                      }</span>
                      <div className={`transition-all duration-400 ${expandedCategory === category ? 'rotate-180' : 'rotate-0'}`}>
                        <svg className="w-2.5 h-2.5 xl:w-3 xl:h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {/* Dropdown for child items */}
                    {expandedCategory === category && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 min-w-[200px] xl:min-w-[220px] bg-white/98 backdrop-blur-lg border border-blue-100/60 rounded-xl shadow-xl z-[9999] overflow-visible">
                        <div className="py-2">
                          {categoryData.items.map((item) => (
                            <button
                              key={item.key}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 text-left hover:transform hover:scale-[1.01] ${
                                selectedChild === item.key ? 'bg-blue-500/90 text-white' : 'hover:bg-blue-50/80 text-blue-700'
                              }`}
                              onClick={() => handleChildClick(item)}
                            >
                              <item.icon />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
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
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-b border-blue-100/50 mobile-menu-container">
            <div className="flex flex-col gap-2 py-4 px-4 max-h-[70vh] overflow-y-auto">
              {/* Dashboard Button for Mobile */}
              {/* <button
                className={`w-full text-left px-5 py-4 rounded-2xl font-medium transition-all duration-400 flex items-center gap-3 text-sm ${
                  showDashboard && !selectedChild 
                    ? 'bg-blue-500/20 text-blue-700 backdrop-blur-sm border border-blue-300/40' 
                    : 'bg-transparent text-blue-600 hover:bg-blue-50/30 border border-blue-200/30 hover:border-blue-300/50'
                }`}
                onClick={() => {
                  setShowDashboard(true);
                  setSelectedChild(null);
                  setExpandedCategory(null);
                  setMobileExpandedCategory(null);
                  setMobileMenuOpen(false);
                }}
              >
                🏠 Dashboard
              </button> */}
              
              {/* Categories with collapsible sections */}
              {Object.entries(NAV_CATEGORIES).map(([category, categoryData]) => (
                <div key={category} className="mb-2">
                  <button
                    className={`w-full text-left px-5 py-4 rounded-2xl font-medium transition-all duration-400 flex items-center justify-between text-sm transform hover:scale-[1.01] ${
                      mobileExpandedCategory === category 
                        ? 'bg-blue-500/20 text-blue-700 backdrop-blur-sm border border-blue-300/40' 
                        : 'bg-transparent text-blue-700 hover:bg-blue-50/30 border border-blue-200/30 hover:border-blue-300/50'
                    }`}
                    onClick={() => setMobileExpandedCategory(mobileExpandedCategory === category ? null : category)}
                  >
                    <div className="flex items-center gap-3">
                      <categoryData.icon />
                      <span>{category}</span>
                    </div>
                    <div className={`transition-all duration-400 ${mobileExpandedCategory === category ? 'rotate-180' : 'rotate-0'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Category Items */}
                  {mobileExpandedCategory === category && (
                    <div className="mt-1 ml-4 space-y-1">
                      {categoryData.items.map((item) => (
                        <button
                          key={item.key}
                          className={`w-full text-left px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 text-sm sm:text-base ${
                            selectedChild === item.key 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-white text-blue-600 shadow-sm hover:bg-blue-50 border border-gray-100'
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
              
              {/* User Info Section */}
              {user && (
                <div className="px-4 py-3 sm:py-4 mt-4 rounded-xl bg-white shadow-sm border-t border-gray-200">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      <div className="font-medium">Logged in as</div>
                      <div className="text-blue-700 font-semibold">{user.name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="w-full">
        <div
          className="w-full border border-gray-100 bg-white"
          style={{ minHeight: 'calc(100vh - 140px)' }}
        >
          <div className="w-full px-4 lg:px-24 md:px-16">{renderContent()}</div>
        </div>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-32 right-4 sm:right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-40 group"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Scroll to top
          </span>
        </button>
      )}

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="fixed bottom-16 right-4 sm:right-6 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-40 group"
          aria-label="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V4" />
          </svg>
          <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Scroll to bottom
          </span>
        </button>
      )}
    </div>
  );
};

export default CentralLabAdminDashboard;