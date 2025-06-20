// import React, { useState, useEffect } from 'react';
// import jwtDecode from 'jwt-decode';
// import AnalyticsControlsContainer from './controls/AnalyticsControlsContainer'
// import AdminView from './role-views/AdminView';
// import CentralAdminView from './role-views/CentralAdminView';
// import LabAssistantView from './role-views/LabAssistantView';
// import FacultyView from './role-views/FacultyView';
// import UnauthorizedView from './role-views/UnauthorizedView';
// import useAnalytics from './hooks/useAnalytics';

// const AnalyticsContainer = ({ 
//   initialFilters = null,
//   embedded = false,
//   onFilterChange: externalFilterChange 
// }) => {
//   const [user, setUser] = useState(null);
  
//   // Date range generation function
//   const getDateRanges = () => {
//     const now = new Date();
//     const oneDay = 24 * 60 * 60 * 1000;
    
//     // Helper to get start of day
//     const startOfDay = (date) => {
//       const d = new Date(date);
//       d.setHours(0, 0, 0, 0);
//       return d;
//     };
    
//     // Helper to get end of day
//     const endOfDay = (date) => {
//       const d = new Date(date);
//       d.setHours(23, 59, 59, 999);
//       return d;
//     };
    
//     // Helper to get start of week (Sunday)
//     const startOfWeek = (date) => {
//       const d = new Date(date);
//       const day = d.getDay();
//       const diff = d.getDate() - day;
//       return new Date(d.setDate(diff));
//     };
    
//     // Helper to get end of week (Saturday)
//     const endOfWeek = (date) => {
//       const d = new Date(date);
//       const day = d.getDay();
//       const diff = d.getDate() + (6 - day);
//       return new Date(d.setDate(diff));
//     };
    
//     // Helper to get start of month
//     const startOfMonth = (date) => {
//       return new Date(date.getFullYear(), date.getMonth(), 1);
//     };
    
//     // Helper to get end of month
//     const endOfMonth = (date) => {
//       return new Date(date.getFullYear(), date.getMonth() + 1, 0);
//     };
    
//     return {
//       today: {
//         startDate: startOfDay(now),
//         endDate: endOfDay(now),
//         label: 'Today'
//       },
//       thisWeek: {
//         startDate: startOfWeek(now),
//         endDate: endOfWeek(now),
//         label: 'This Week'
//       },
//       last7Days: {
//         startDate: new Date(now.getTime() - (6 * oneDay)),
//         endDate: now,
//         label: 'Last 7 Days'
//       },
//       last30Days: {
//         startDate: new Date(now.getTime() - (29 * oneDay)),
//         endDate: now,
//         label: 'Last 30 Days'
//       },
//       thisMonth: {
//         startDate: startOfMonth(now),
//         endDate: endOfMonth(now),
//         label: 'This Month'
//       },
//       lastMonth: {
//         startDate: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)),
//         endDate: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)),
//         label: 'Last Month'
//       },
//       thisYear: {
//         startDate: new Date(now.getFullYear(), 0, 1),
//         endDate: new Date(now.getFullYear(), 11, 31),
//         label: 'This Year'
//       }
//     };
//   };

//   // Initialize state with default or provided filters
//   const [filters, setFilters] = useState(initialFilters || {
//     timeRange: getDateRanges().last30Days,
//     chemicals: [],
//     labs: [],
//     metric: 'quantity',
//     viewMode: 'overview'
//   });

//   // Decode user from JWT token on mount
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           id: decoded.userId,
//           role: decoded.role,
//           labId: decoded.labId
//         });
//       } catch (error) {
//         console.error('Failed to decode token:', error);
//       }
//     }
//   }, []);

//   const { data, loading, error, refetch } = useAnalytics(filters);

//   // Handle internal filter changes
//   const handleFilterChange = (newFilters) => {
//     const updatedFilters = { ...filters, ...newFilters };
//     setFilters(updatedFilters);
    
//     // Notify parent component if needed
//     if (externalFilterChange) {
//       externalFilterChange(updatedFilters);
//     }
//   };

//   // Reset to default filters
//   const handleReset = () => {
//     const defaultFilters = {
//       timeRange: getDateRanges().last30Days,
//       chemicals: [],
//       labs: [],
//       metric: 'quantity',
//       viewMode: 'overview'
//     };
    
//     setFilters(defaultFilters);
//     if (externalFilterChange) externalFilterChange(defaultFilters);
//   };

//   // Render appropriate view based on user role
//   const renderRoleView = () => {
//     if (!user) return <UnauthorizedView />;
    
//     switch(user.role) {
//       case 'admin':
//         return <AdminView data={data} filters={filters} />;
//       case 'central_lab_admin':
//         return <CentralAdminView data={data} filters={filters} />;
//       case 'lab_assistant':
//         return <LabAssistantView data={data} filters={filters} labId={user.labId} />;
//       case 'faculty':
//         return <FacultyView data={data} filters={filters} userId={user.id} />;
//       default:
//         return <UnauthorizedView />;
//     }
//   };

//   // Simple loading spinner component
//   const LoadingSpinner = () => (
//     <div className="flex justify-center items-center min-h-[300px]">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//     </div>
//   );

//   // Simple error alert component
//   const ErrorAlert = ({ message, onRetry }) => (
//     <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
//       <div className="flex items-center">
//         <div className="flex-shrink-0">
//           <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//           </svg>
//         </div>
//         <div className="ml-3">
//           <p className="text-sm text-red-700">
//             {message}
//             {onRetry && (
//               <button 
//                 onClick={onRetry}
//                 className="ml-2 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
//               >
//                 Retry
//               </button>
//             )}
//           </p>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className={`analytics-container ${embedded ? 'embedded' : 'standalone'}`}>
//       {/* Error state */}
//       {error && (
//         <ErrorAlert 
//           message={error} 
//           onRetry={refetch}
//         />
//       )}

//       {/* Controls section */}
//       <div className={`controls-section ${embedded ? 'p-4 bg-gray-50 rounded-lg' : 'mb-8'}`}>
//         <AnalyticsControlsContainer  filters={filters}
//           onChange={handleFilterChange}
//           onReset={handleReset}
//           embedded={embedded}
//           userRole={user?.role}
//           dateRanges={getDateRanges()}
//         />
//       </div>

//       {/* Loading state */}
//       {loading && <LoadingSpinner />}

//       {/* Main content */}
//       {!loading && !error && (
//         <div className={`content-section ${embedded ? '' : 'bg-white rounded-lg shadow'}`}>
//           {renderRoleView()}
//         </div>
//       )}

//       {/* Embedded mode footer */}
//       {embedded && !loading && !error && (
//         <div className="mt-4 text-right">
//           <button 
//             onClick={() => window.location.href = '/analytics'}
//             className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
//           >
//             View Full Analytics →
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AnalyticsContainer;