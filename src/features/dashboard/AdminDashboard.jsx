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

// SVG ICONS
const ChemicalIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 3v6a5 5 0 0 0 10 0V3"/><path d="M5 21h14"/><path d="M8 17h8"/><path d="M12 17v4"/></svg>
);
const ProductIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>
);
const EquipmentIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
);
const GlasswareIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 3h12l-1 7a5 5 0 0 1-10 0L6 3z"/><path d="M8 21h8"/></svg>
);
const LabRequestIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6"/><path d="M9 13h6"/></svg>
);
const QuotationIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>
);
const IndentIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
);
const AllocateIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
);
const ReportIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
);
const ExperimentIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
);
const InvoiceIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
);
const VendorIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h6"/></svg>
);
const UserIcon = (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/></svg>
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
  const [selected, setSelected] = useState('chemicals');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedLab, setExpandedLab] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
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
        <div className="space-y-6">
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
              <NotificationCenter notifications={notifications} onMarkAsRead={markNotificationAsRead} />
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
            {/* Dashboard Button */}
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2 mr-2 ${
                showDashboard && !selectedChild ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-blue-600'
              }`}
              onClick={() => {
                setShowDashboard(true);
                setSelectedChild(null);
                setExpandedCategory(null);
              }}
            >
              🏠 Dashboard
            </button>
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
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
