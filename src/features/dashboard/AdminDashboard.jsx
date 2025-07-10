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
import AllLabRequestsPage from '../requests/AllLabRequestsPage';
import EquipmentStockList from  '../equipment/EquipmentStockList';
import RequestCard from '../requests/RequestCard';
import UnifiedAllocateDialog from '../requests/UnifiedAllocateDialog';

// SVG Icons - Converted to Component Functions for consistency with CentralLabAdminDashboard
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

// Enhanced Navigation with Icons and Categories
const NAV_CATEGORIES = {
  'Lab Operations': [
    { key: 'labrequests', label: 'Lab Requests (Single)', icon: LabRequestIcon, component: <LabRequestListPage /> },
    { key: 'all_lab_requests', label: 'All Lab Requests', icon: LabRequestIcon, component: <AllLabRequestsPage /> },
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

const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

// Quick Stats Component
const QuickStats = ({ productStats, requestStats, pendingRequests }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{productStats?.total ?? '—'}</div>
          <div className="text-blue-100 text-sm">Total Products</div>
        </div>
        <div className="text-3xl">📦</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{productStats?.chemical ?? '—'}</div>
          <div className="text-green-100 text-sm">Chemicals</div>
        </div>
        <div className="text-3xl">🧪</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{productStats?.equipment ?? '—'}</div>
          <div className="text-purple-100 text-sm">Equipment</div>
        </div>
        <div className="text-3xl">🔧</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{productStats?.glassware ?? '—'}</div>
          <div className="text-orange-100 text-sm">Glassware</div>
        </div>
        <div className="text-3xl">🥛</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{productStats?.others ?? '—'}</div>
          <div className="text-yellow-100 text-sm">Other Products</div>
        </div>
        <div className="text-3xl">📦</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{requestStats?.active ?? '—'}</div>
          <div className="text-cyan-100 text-sm">Active Requests</div>
        </div>
        <div className="text-3xl">📋</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{requestStats?.pending ?? '—'}</div>
          <div className="text-gray-100 text-sm">Pending</div>
        </div>
        <div className="text-3xl">⏳</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{requestStats?.partially_fulfilled ?? '—'}</div>
          <div className="text-pink-100 text-sm">Partially Fulfilled</div>
        </div>
        <div className="text-3xl">🟠</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-green-700 to-green-800 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{requestStats?.fulfilled ?? '—'}</div>
          <div className="text-green-100 text-sm">Fulfilled</div>
        </div>
        <div className="text-3xl">✅</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{requestStats?.rejected ?? '—'}</div>
          <div className="text-red-100 text-sm">Rejected</div>
        </div>
        <div className="text-3xl">❌</div>
      </div>
    </div>
    <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{pendingRequests?.length ?? '—'}</div>
          <div className="text-blue-100 text-sm">Pending/Partial Requests</div>
        </div>
        <div className="text-3xl">🔄</div>
      </div>
    </div>
  </div>
);

// Recent Activity Component
const RecentActivity = ({ requests }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <span>🕒</span>
      Recent Requests (All Labs)
    </h3>
    <div className="space-y-3">
      {Array.isArray(requests) && requests.length > 0 ? (
        requests.slice(0, 10).map((req) => (
          <div key={req._id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex-1">
              <span className="font-semibold text-blue-800">{req.labId?.name || req.labId || 'Unknown Lab'}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-blue-700">{req.facultyId?.name || 'Unknown Faculty'}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'partially_fulfilled' ? 'bg-orange-100 text-orange-800' : req.status === 'fulfilled' ? 'bg-green-100 text-green-800' : req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{req.status.replace('_', ' ')}</span>
            </div>
            <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()}</div>
          </div>
        ))
      ) : (
        <div className="p-3 text-gray-500 text-sm">No recent requests found.</div>
      )}
    </div>
  </div>
);

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

// Add NotificationCenter component (copy from CentralLabAdminDashboard, adapted for this file)
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

const AdminDashboard = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selected, setSelected] = useState('AllLabRequestsPage');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const navigate = useNavigate();
  const [productStats, setProductStats] = useState(null);
  const [requestStats, setRequestStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [centralChemicals, setCentralChemicals] = useState([]);
  const [centralStats, setCentralStats] = useState({
    totalChemicals: 0,
    totalQuantity: 0,
    lowStockItems: 0,
    expiringSoon: 0,
  });
  const [allLabRequests, setAllLabRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);

  // Scroll detection for scroll buttons - Updated to match CentralLabAdminDashboard
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

  // Close dropdowns when clicking outside - Fixed mobile menu handling
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch central chemicals
    const fetchCentralChemicals = async () => {
      try {
        const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const chemicals = Array.isArray(res.data) ? res.data : [];
        setCentralChemicals(chemicals);
        // Calculate stats
        let totalChemicals = chemicals.length;
        let totalQuantity = 0;
        let lowStockItems = 0;
        let expiringSoon = 0;
        const now = new Date();
        chemicals.forEach(chem => {
          const quantity = Number(chem.quantity) || 0;
          totalQuantity += quantity;
          const threshold = Number(chem.threshold) || 10;
          if (quantity < threshold) lowStockItems++;
          if (chem.expiryDate) {
            const daysUntilExpiry = Math.ceil((new Date(chem.expiryDate) - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) expiringSoon++;
          }
        });
        setCentralStats({ totalChemicals, totalQuantity, lowStockItems, expiringSoon });
      } catch (error) {
        setCentralChemicals([]);
        setCentralStats({ totalChemicals: 0, totalQuantity: 0, lowStockItems: 0, expiringSoon: 0 });
      }
    };

    // Fetch all lab requests (improved, parallel)
    const fetchAllLabRequests = async () => {
      try {
        const allRequests = [];
        const requests = labList.map(labId =>
          axios.get(`https://backend-pharmacy-5541.onrender.com/api/requests/lab/${labId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => {
            if (Array.isArray(res.data)) {
              return res.data;
            } else if (Array.isArray(res.data.data)) {
              return res.data.data;
            }
            return [];
          }).catch(() => [])
        );
        const results = await Promise.all(requests);
        results.forEach(arr => allRequests.push(...arr));
        setAllLabRequests(allRequests);
      } catch (error) {
        setAllLabRequests([]);
      }
    };

    fetchCentralChemicals();
    fetchAllLabRequests();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handler for parent (category) click
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
    ? Object.values(NAV_CATEGORIES).flat().find((item) => item.key === selectedChild)
    : null;

  // Add this function to handle marking notifications as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/notifications/mark-read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      // Optionally handle error
    }
  };

  // Render the main content area
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
    if (showDashboard && !selectedChild) {
      return (
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Central Lab Chemical Analytics</h3>
            <ul className="space-y-2 text-lg">
              <li><span className="font-semibold text-blue-900">Total Chemicals:</span> <span className="ml-2 text-blue-700">{centralStats.totalChemicals}</span></li>
              <li><span className="font-semibold text-blue-900">Total Quantity:</span> <span className="ml-2 text-green-700">{centralStats.totalQuantity}</span></li>
              <li><span className="font-semibold text-blue-900">Low Stock Items:</span> <span className="ml-2 text-red-700">{centralStats.lowStockItems}</span></li>
              <li><span className="font-semibold text-blue-900">Expiring Soon (30 days):</span> <span className="ml-2 text-yellow-700">{centralStats.expiringSoon}</span></li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🕒</span>
              All Lab Requests
            </h3>
            <div className="space-y-3">
              {Array.isArray(allLabRequests) && allLabRequests.length > 0 ? (
                allLabRequests.slice(0, 20).map((req) => (
                  <RequestCard 
                    key={req._id} 
                    request={req} 
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowFulfillDialog(true);
                    }} 
                  />
                ))
              ) : (
                <div className="p-3 text-gray-500 text-sm">No lab requests found.</div>
              )}
            </div>
          </div>
          {showFulfillDialog && selectedRequest && (
            <UnifiedAllocateDialog
              request={selectedRequest}
              onClose={() => {
                setShowFulfillDialog(false);
                setSelectedRequest(null);
              }}
              onSuccess={() => {
                setShowFulfillDialog(false);
                setSelectedRequest(null);
                window.location.reload(); // Refresh requests after allocation
              }}
            />
          )}
        </div>
      );
    }
    if (selectedChildItem && selectedChildItem.component) {
      return selectedChildItem.component;
    }
    return null;
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      {/* Navigation Bar */}
      <header className="w-full bg-white shadow-sm backdrop-blur sticky top-0 z-50 border-b border-gray-100">
        {/* First line - Logo, Title, User, Logout */}
        <div className="w-full border-b border-gray-100">
          <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/pydah.svg" alt="Logo" className="h-8 w-auto sm:h-10" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-800 tracking-tight whitespace-nowrap">
                Admin Dashboard
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationCenter notifications={notifications} onMarkAsRead={markNotificationAsRead} />
              {user && (
                <span className="hidden sm:inline text-sm lg:text-base font-medium text-blue-700">
                  Welcome, {user.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-white text-blue-700 font-medium hover:bg-blue-50 transition-colors whitespace-nowrap border border-blue-200 shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Second line - Horizontal Navigation Bar */}
        <nav className="w-full bg-white border-b border-gray-100">
          <div className="w-full flex items-center px-4 sm:px-6 lg:px-8 py-2 sm:py-3 relative">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                className="mobile-menu-toggle flex items-center justify-center p-2 sm:p-3 rounded-lg focus:outline-none bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-blue-50 active:bg-blue-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                type="button"
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
            
            {/* Dashboard Button - Desktop */}
            <div className="hidden md:flex items-center mr-4">
              <button
                className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-1 lg:gap-2 ${
                  showDashboard && !selectedChild ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-blue-700'
                }`}
                onClick={() => {
                  setShowDashboard(true);
                  setSelectedChild(null);
                  setExpandedCategory(null);
                }}
              >
                🏠 Dashboard
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center w-full">
              {/* Parent Categories as horizontal nav */}
              <div className="flex items-center space-x-1 lg:space-x-2">
                {Object.entries(NAV_CATEGORIES).map(([category, items]) => (
                  <div key={category} className="relative dropdown-container">
                    <button
                      className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition-colors duration-200 text-sm lg:text-base whitespace-nowrap flex items-center gap-1 lg:gap-2 ${
                        expandedCategory === category ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50 text-blue-700'
                      }`}
                      onClick={() => handleParentClick(category)}
                    >
                      {category}
                      <svg className={`w-4 h-4 transition-transform ${expandedCategory === category ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                    </button>
                    {/* Dropdown for child items */}
                    {expandedCategory === category && (
                      <div className="absolute left-0 mt-2 min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {items.map((item) => (
                          <button
                            key={item.key}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm lg:text-base font-medium transition-colors duration-150 text-left ${
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
          <div className="md:hidden w-full bg-white/95 backdrop-blur-lg border-t border-gray-100/50 mobile-menu-container">
            <div className="flex flex-col gap-1 py-3 sm:py-4 px-4 sm:px-6 max-h-[70vh] overflow-y-auto">
              {/* Dashboard Button for Mobile */}
              <button
                className={`w-full text-left px-4 py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 sm:gap-4 text-sm sm:text-base ${
                  showDashboard && !selectedChild 
                    ? 'bg-blue-100/80 text-blue-700 shadow-sm' 
                    : 'bg-white text-blue-600 shadow-sm hover:bg-blue-50'
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
              </button>
              
              {/* Categories with collapsible sections */}
              {Object.entries(NAV_CATEGORIES).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-between text-sm sm:text-base ${
                      mobileExpandedCategory === category 
                        ? 'bg-blue-100/80 text-blue-800 shadow-sm' 
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
                    }`}
                    onClick={() => setMobileExpandedCategory(mobileExpandedCategory === category ? null : category)}
                  >
                    <span>{category}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mobileExpandedCategory === category ? 'rotate-90' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  
                  {/* Category Items */}
                  {mobileExpandedCategory === category && (
                    <div className="mt-1 ml-4 space-y-1">
                      {items.map((item) => (
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

export default AdminDashboard;
