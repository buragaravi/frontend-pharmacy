import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyCompatibilityFixes } from './utils/browserCompatibility';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import TransactionsPage from './features/transactions/TransactionsPage';
import AdminDashboard from './features/dashboard/AdminDashboard';
import CentralAdminDashboard from './features/dashboard/CentralLabAdminDashboard';
import MultiLabAssistantDashboard from './features/dashboard/MultiLabAssistantDashboard';
import FacultyDashboard from './features/dashboard/FacultyDashboard';
import NotificationPage from './features/notification/NotificationPage';
import RequestPage from './features/requests/RequestPage';
import QuotationPage from './features/quotations/QuotationPage';
import UnauthorizedPage from './UnauthorizedPage';
import ExperimentsPage from './pages/ExperimentsPage';
import UserManagement from './features/users/UserManagement';
import ProductList from './features/products/ProductList';
import VendorList from './features/vendor/VendorList';
import InvoicePage from './features/invoice/InvoicePage';
import InvoiceList from './features/invoice/InvoiceList';
import VendorInvoices from './features/vendor/VendorInvoices';
import PasswordResetFlow from './features/auth/PasswordResetFlow';
import OutOfStockChemicals from './features/chemicals/OutOfStockChemicals';
import NotFound from './pages/NotFound';
import OfflineIndicator from './components/OfflineIndicator';
import CourseList from './features/courses/CourseList';

import { AllocateGlasswareForm, GlasswareStockPage } from './features/glassware';
import { AllocateOtherProductForm } from './features/other';
import CreateEquipmentRequestForm from './features/requests/CreateEquipmentRequestForm';
import CreateGlasswareRequestForm from './features/requests/CreateGlasswareRequestForm';
import CreateOtherProductRequestForm from './features/requests/CreateOtherProductRequestForm';
import UniversalQRScanner from './features/UniversalQRScanner';
import QRCodesPage from './pages/QRCodesPage';
import EquipmentDashboardPage from './pages/EquipmentDashboardPage';
import EquipmentDetailPageWrapper from './pages/EquipmentDetailPageWrapper';
import EquipmentQRScanPage from './features/equipment/EquipmentQRScanPage';
import StockCheckPage from './features/equipment/StockCheckPage';
import StockCheckReportsPage from './features/equipment/StockCheckReportsPage';
import UnifiedInvoiceForm from './features/invoice/UnifiedInvoiceForm';

import Home from './Home';
import AllocateEquipmentForm from './features/equipment/AllocateEquipmentForm';
import { AllocateEquipmentToLabByScanForm } from './features/equipment';

const queryClient = new QueryClient();

const App = () => {
  // 🌐 Apply browser compatibility fixes on app load
  useEffect(() => {
    applyCompatibilityFixes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
          <OfflineIndicator />
          <Routes>
            {/* Public Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/vendor-invoices" element={<VendorInvoices />} />
            <Route path="/password-reset" element={<PasswordResetFlow />} />

            <Route path="/" element={<Home />} />
            <Route path="/login" element={
                <LoginPage />
            } />
          
            <Route path="/register" element={
            
                <RegisterPage />
             
            } />

            {/* Protected Routes */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/central"
              element={
                <ProtectedRoute allowedRoles={['central_store_admin']}>
                      <CentralAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/lab"
              element={
                <ProtectedRoute allowedRoles={['lab_assistant']}>
                 
                      <MultiLabAssistantDashboard />
                   
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>

                      <FacultyDashboard />

                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles={['central_store_admin', 'lab_assistant']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <TransactionsPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'faculty', 'lab_assistant', 'central_store_admin']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <NotificationPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/request"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <RequestPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotation"
              element={
                <ProtectedRoute allowedRoles={['central_store_admin', 'admin']}>
                  <div className="p-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-2">
                      <QuotationPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/experiments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <div className="bg-[#6D123F] p-4 text-white text-center rounded-lg">
                        <h1 className="text-2xl font-bold">Lab Management System</h1>
                      </div>
                      <ExperimentsPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <CourseList />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chemicals/out-of-stock"
              element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <OutOfStockChemicals />
                </ProtectedRoute>
              }
            />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/invoices" element={<InvoicePage />} />

            <Route path="/allocate/glassware" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <AllocateGlasswareForm />
                </ProtectedRoute>
              } />
            <Route path="/stock/glassware" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant', 'faculty']}>
                  <GlasswareStockPage />
                </ProtectedRoute>
              } />
            <Route path="/allocate/other" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <AllocateOtherProductForm />
                </ProtectedRoute>
              } />
            <Route path="/request/equipment" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <CreateEquipmentRequestForm />
                </ProtectedRoute>
              } />
            <Route path="/request/glassware" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <CreateGlasswareRequestForm />
                </ProtectedRoute>
              } />
            <Route path="/request/other" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <CreateOtherProductRequestForm />
                </ProtectedRoute>
              } />
            <Route path="/scan/universal" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant', 'faculty']}>
                  <UniversalQRScanner />
                </ProtectedRoute>
              } />
            <Route path="/qrcodes" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant', 'faculty']}>
                  <QRCodesPage />
                </ProtectedRoute>
              } />
            <Route path="/equipment/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <EquipmentDashboardPage />
                </ProtectedRoute>
              } />
            <Route path="/equipment/item/:itemId" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <EquipmentDetailPageWrapper />
                </ProtectedRoute>
              } />
            <Route path="/equipment/allocate" element={
                <ProtectedRoute allowedRoles={['admin', 'central_store_admin', 'lab_assistant']}>
                  <div className="p-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D8E1] p-6">
                      <h2 className="text-xl font-semibold mb-4">Equipment Allocation</h2>
                      <AllocateEquipmentToLabByScanForm />
                    </div>
                  </div>
                </ProtectedRoute>
              } />
            <Route path="/equipment/scan-qr" element={<EquipmentQRScanPage />} />
            <Route path="/equipment/stock-check" element={<StockCheckPage />} />
            <Route path="/equipment/stock-check/reports" element={<StockCheckReportsPage />} />
            <Route path='/unifiedr' element={<UnifiedInvoiceForm />} />
            {/* 404 Not Found - Must be the last route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;