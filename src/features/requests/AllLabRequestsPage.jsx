import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import RequestCard from './RequestCard';
import RequestDetailsModal from './RequestDetailsModal';
import FulfillRequestDialog from './FulfillRequestDialog';
import UnifiedAllocateDialog from './UnifiedAllocateDialog';
import { useNavigate } from 'react-router-dom';
import { useResponsiveColors, getSafeBackground, getSafeBackdrop } from '../../utils/colorUtils';
import SafeButton from '../../components/SafeButton';

// SVG Icons
const RequestIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0B3861]"></div>
  </div>
);

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white',
  border: 'border-[#BCE0FD]',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-[#0B3861] focus:border-[#0B3861]'
};

const statusCategories = [
  { status: 'all', label: 'All Requests', color: 'bg-gray-100 text-gray-800' },
  { status: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { status: 'fulfilled', label: 'Fulfilled', color: 'bg-blue-100 text-blue-800' },
  { status: 'partially_fulfilled', label: 'Partially Fulfilled', color: 'bg-purple-100 text-purple-800' }
];

const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

const AllLabRequestsPage = () => {
  const colors = useResponsiveColors();
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showUnifiedDialog, setShowUnifiedDialog] = useState(false);
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.user.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, [token]);

  const fetchAllLabRequests = async () => {
    setLoading(true);
    try {
      setError(null);
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch requests for all labs
      const requestPromises = labList.map(async (labId) => {
        try {
          const response = await axios.get(
            `https://backend-pharmacy-5541.onrender.com/api/requests/lab/${labId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          // Add labId to each request for grouping
          return response.data.map(request => ({
            ...request,
            labId
          }));
        } catch (err) {
          console.warn(`Failed to fetch requests for ${labId}:`, err.message);
          return [];
        }
      });

      const allLabResults = await Promise.all(requestPromises);
      
      // Flatten all requests into a single array
      const flattenedRequests = allLabResults.flat();
      
      // Sort by created_at date (newest first)
      const sortedRequests = flattenedRequests.sort((a, b) => 
        new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
      );

      setAllRequests(sortedRequests);
      applyFilters(sortedRequests, selectedStatus, startDate, endDate);
    } catch (err) {
      console.error('Error fetching all lab requests:', err);
      setError('Failed to fetch lab requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableChemicals = async () => {
    try {
      const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableChemicals(res.data);
    } catch (err) {
      console.error('Error fetching available chemicals:', err);
    }
  };

  useEffect(() => {
    fetchAllLabRequests();
    if (userRole === 'lab_assistant' || userRole === 'central_lab_admin') {
      fetchAvailableChemicals();
    }
  }, [token, userRole]);

  useEffect(() => {
    applyFilters(allRequests, selectedStatus, startDate, endDate);
  }, [selectedStatus, startDate, endDate]);

  const applyFilters = (requests, status, start, end) => {
    let filtered = [...requests];
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(req => req.status === status);
    }
    
    // Apply date filter
    if (start || end) {
      filtered = filtered.filter(req => {
        const requestDate = new Date(req.createdAt || req.created_at || req.date);
        const requestDateStr = format(requestDate, 'yyyy-MM-dd');
        
        if (start && !end) {
          return requestDateStr >= start;
        } else if (start && end) {
          return requestDateStr >= start && requestDateStr <= end;
        } else if (!start && end) {
          return requestDateStr <= end;
        }
        return true;
      });
    }
    
    setFilteredRequests(filtered);
  };

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
  };

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setModalOpen(false);
  };

  const handleRequestUpdate = () => {
    // Refresh the requests after approval/rejection
    fetchAllLabRequests();
  };

  const handleOpenFulfill = (request) => {
    setSelectedRequest(request);
    setShowFulfillDialog(true);
  };

  const handleCloseFulfill = () => {
    setSelectedRequest(null);
    setShowFulfillDialog(false);
  };

  const handleOpenUnifiedDialog = (request) => {
    setSelectedRequest(request);
    setShowUnifiedDialog(true);
  };

  const handleCloseUnifiedDialog = () => {
    setSelectedRequest(null);
    setShowUnifiedDialog(false);
  };

  const handleRequestUpdated = () => {
    fetchAllLabRequests();
    handleCloseFulfill();
    handleCloseUnifiedDialog();
  };

  const generatePDF = () => {
    // Initialize jsPDF in landscape mode with proper measurements
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    // Page dimensions in landscape (297mm wide, 210mm tall)
    const pageWidth = 297;
    const pageHeight = 210;
    const leftMargin = 15;
    const rightMargin = 15;
    const availableWidth = pageWidth - leftMargin - rightMargin;

    // Set default font
    doc.setFont('helvetica');

    // Add title with centered alignment accounting for margins
    doc.setFontSize(22);
    doc.setTextColor(11, 56, 97); // #0B3861
    doc.setFont('helvetica', 'bold');
    doc.text('ALL LABS REQUEST REPORT', pageWidth / 2, 20, { align: 'center' });

    // Add decorative line that respects margins
    doc.setDrawColor(109, 18, 63);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 25, pageWidth - rightMargin, 25);

    // Add report details with proper margin alignment
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const reportDetails = [
      `All Labs: ${labList.join(', ')}`,
      `Generated On: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`,
      startDate && endDate ? `Period: ${startDate} to ${endDate}` : '',
      selectedStatus !== 'all' ? `Status: ${statusCategories.find(s => s.status === selectedStatus)?.label}` : ''
    ].filter(Boolean);

    doc.text(reportDetails, leftMargin, 35);
    
    // Define table columns with optimized proportional widths
    const columns = [
      { title: '#', dataKey: 'index', minWidth: 8 },
      { title: 'LAB ID', dataKey: 'labId', minWidth: 15 },
      { title: 'REQUEST ID', dataKey: 'requestId', minWidth: 20 },
      { title: 'FACULTY NAME', dataKey: 'facultyName', minWidth: 25 },
      { title: 'REQUESTED DATE', dataKey: 'createdAt', minWidth: 25 },
      { title: 'APPROVAL DATE', dataKey: 'updatedAt', minWidth: 25 },
      { title: 'EXPERIMENTS', dataKey: 'experimentNames', minWidth: 35 },
      { title: 'CHEMICALS', dataKey: 'chemicalsCount', minWidth: 15 },
      { title: 'ALLOCATED', dataKey: 'allocatedCount', minWidth: 15 },
      { title: 'PENDING', dataKey: 'unallocatedCount', minWidth: 15 },
      { title: 'COMPLETION %', dataKey: 'allocationPercentage', minWidth: 15 },
      { title: 'STATUS', dataKey: 'status', minWidth: 20 }
    ];

    // Calculate total minimum width needed
    const totalMinWidth = columns.reduce((sum, col) => sum + col.minWidth, 0);
    
    // Calculate extra available width after minimums
    const extraWidth = availableWidth - totalMinWidth;
    const extraPerColumn = extraWidth / columns.length;

    // Prepare final column widths
    const finalColumnWidths = columns.map(col => col.minWidth + extraPerColumn);
    
    // Prepare table data
    const tableData = filteredRequests.map((req, index) => {
      let allocatedCount = 0;
      const facultyName = req.facultyId?.name || '';
      const experimentNames = req.experiments && req.experiments.length > 0
        ? req.experiments.map(exp => exp.experimentName).join(', ')
        : '';
      // Collect all chemical names from all experiments
      const chemicalNames = req.experiments && req.experiments.length > 0
        ? req.experiments.flatMap(exp => exp.chemicals.map(chem => chem.chemicalName)).join(', ')
        : '';
      let chemicalsCount = 0;
      let pendingChemicals = [];
      if (req.experiments) {
        req.experiments.forEach(exp => {
          chemicalsCount += exp.chemicals.length;
          allocatedCount += exp.chemicals.filter(chem => chem.isAllocated).length;
          // Collect pending chemical names
          pendingChemicals.push(...exp.chemicals.filter(chem => !chem.isAllocated).map(chem => chem.chemicalName));
        });
      }
      const unallocatedCount = chemicalsCount - allocatedCount;
      const allocationPercentage = chemicalsCount > 0 
        ? Math.round((allocatedCount / chemicalsCount) * 100) 
        : 0;

      return {
        index: index + 1,
        labId: req.labId || 'N/A',
        requestId: String(req._id).slice(-6).toUpperCase(),
        facultyName,
        createdAt: format(new Date(req.createdAt || req.created_at), 'dd/MM/yyyy hh:mm a'),
        updatedAt: req.status !== 'pending' ? format(new Date(req.updatedAt || req.updated_at), 'dd/MM/yyyy hh:mm a') : 'N/A',
        experimentNames,
        chemicalsCount: chemicalNames, // Show chemical names instead of count
        allocatedCount,
        unallocatedCount: unallocatedCount > 0 ? pendingChemicals.join(', ') : '0', // List pending chemical names if any
        allocationPercentage: `${allocationPercentage}%`,
        status: req.status?.charAt(0).toUpperCase() + req.status?.slice(1).replace('_', ' ') || 'Unknown'
      };
    });
    
    // Generate the table with perfect margin balance
    autoTable(doc, {
      head: [columns.map(col => col.title)],
      body: tableData.map(row => columns.map(col => row[col.dataKey])),
      startY: 45,
      margin: { left: leftMargin, right: rightMargin },
      tableWidth: availableWidth,
      styles: { 
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak',
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [11, 56, 97], // #0B3861
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.3
      },
      bodyStyles: {
        halign: 'center',
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 244, 246],
        lineWidth: 0.1
      },
      columnStyles: columns.reduce((styles, _, i) => {
        styles[i] = { 
          cellWidth: finalColumnWidths[i],
          halign: ['index', 'experimentsCount', 'chemicalsCount', 'allocatedCount', 'unallocatedCount', 'allocationPercentage'].includes(columns[i].dataKey) 
            ? 'center' : 'left'
        };
        return styles;
      }, {})
    });
    
    // Add balanced footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line that matches header line
      doc.setDrawColor(109, 18, 63);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, pageHeight - 15, pageWidth - rightMargin, pageHeight - 15);
      
      // Footer content with balanced spacing
      doc.setFontSize(9);
      doc.setTextColor(109, 18, 63);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setTextColor(150);
      doc.text('Confidential - For Central Lab Use Only', leftMargin, pageHeight - 10);
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`, pageWidth - rightMargin, pageHeight - 10, { align: 'right' });
    }
    
    // Save the PDF
    doc.save(`All_Lab_Requests_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  };

  const calculateStatusStats = () => {
    const stats = {};
    statusCategories.forEach(category => {
      if (category.status !== 'all') {
        stats[category.status] = allRequests.filter(req => req.status === category.status).length;
      }
    });
    return stats;
  };

  const isLabAssistant = userRole === 'lab_assistant';
  const isCentralAdmin = userRole === 'central_lab_admin';
  const isLabAdmin = userRole === 'admin';

  if (loading) {
    return (
      <div 
        className="w-full min-h-screen flex items-center justify-center"
        style={{ backgroundColor: getSafeBackground('light', '#eff6ff') }}
      >
        <div 
          className="rounded-2xl p-8 border border-blue-100/50"
          style={{ ...getSafeBackdrop('4px', 'rgba(255, 255, 255, 0.9)') }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="text-blue-700 font-medium">Loading all lab requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full min-h-screen flex items-center justify-center"
        style={{ backgroundColor: getSafeBackground('light', '#eff6ff') }}
      >
        <div 
          className="rounded-2xl p-8 border border-red-200/50 max-w-md"
          style={{ ...getSafeBackdrop('4px', 'rgba(255, 255, 255, 0.9)') }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-700 mb-2">Error Loading Requests</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <SafeButton
              onClick={() => fetchAllLabRequests()}
              variant="danger"
              className="transform hover:scale-105"
            >
              Retry Loading
            </SafeButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full min-h-screen"
      style={{ backgroundColor: getSafeBackground('light', '#eff6ff') }}
    >
      {/* Full Width Header with Rounded Top Borders and Water Bubbles */}
      <div 
        className="w-full border-b border-white/30 relative overflow-hidden rounded-t-3xl"
        style={{ backgroundColor: getSafeBackground('header', '#1d4ed8') }}
      >
        <div 
          className="absolute inset-0"
          style={{ ...getSafeBackdrop('4px', 'rgba(255, 255, 255, 0.1)') }}
        ></div>
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent, transparent, rgba(0,0,0,0.05))' }}
        ></div>
        
        {/* Water Bubble Background Effects */}
        <div className="water-bubbles">
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
          <div className="bubble bubble-5"></div>
          <div className="bubble bubble-6"></div>
          <div className="bubble bubble-7"></div>
          <div className="bubble bubble-8"></div>
        </div>
        
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <RequestIcon />
              </div>
              <div className="text-white">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">All Lab Requests</h1>
                <p className="text-blue-100/80 text-sm font-medium">Comprehensive view of all laboratory requests</p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <CalendarIcon />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-white text-sm placeholder-white/70 border-none outline-none"
                  placeholder="From"
                />
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <CalendarIcon />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-white text-sm placeholder-white/70 border-none outline-none"
                  placeholder="To"
                />
              </div>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-sm text-white font-medium hover:bg-white/25 transition-all duration-300 border border-white/30 rounded-xl hover:scale-105"
              >
                <DownloadIcon />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Filter Indicator */}
        {selectedStatus !== 'all' && (
          <div className="mb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-700 font-medium">Currently showing:</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  statusCategories.find(cat => cat.status === selectedStatus)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {statusCategories.find(cat => cat.status === selectedStatus)?.label || selectedStatus}
                </span>
                <span className="text-xs text-gray-600">({filteredRequests.length} requests)</span>
              </div>
              <button
                onClick={() => handleStatusClick('all')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {/* Content Grid - Full Width */}
        {filteredRequests.length === 0 ? (
          <div className="w-full">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-blue-100/50 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-blue-700 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {selectedStatus === 'all' 
                  ? "There are no requests from any lab at the moment"
                  : `No ${selectedStatus.replace('_', ' ')} requests found`}
              </p>
              {selectedStatus !== 'all' && (
                <button
                  onClick={() => handleStatusClick('all')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  Show All Requests
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Instructions for Status Filtering */}
            <div className="mb-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100/50">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Tip:</span>
                <span>Click on the status badges in each request card to filter by that status</span>
              </div>
            </div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {statusCategories.slice(1).map(category => {
                const count = allRequests.filter(req => req.status === category.status).length;
                return (
                  <div
                    key={category.status}
                    className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => handleStatusClick(category.status)}
                  >
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 ${category.color}`}>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{category.label}</p>
                    <p className="text-xs text-gray-500">Click to filter</p>
                  </div>
                );
              })}
            </div>

            {/* Requests Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRequests.map(req => (
                <div key={req._id} className="group">
                  <RequestCard
                    request={req}
                    onClick={() => handleOpenDetails(req)}
                    onStatusClick={handleStatusClick}
                    showStatus
                    showLabId={true}
                    userRole={userRole}
                    className="bg-white/90 backdrop-blur-sm border border-blue-100/50 hover:shadow-xl transition-all duration-300 rounded-xl p-4 cursor-pointer transform group-hover:scale-105"
                    actionButton={
                      <>
                        {/* Only show allocate button for approved requests */}
                        {req.status === 'approved' && (isCentralAdmin || isLabAdmin) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenUnifiedDialog(req);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Allocate Resources
                          </button>
                        )}
                        {/* Disabled button for non-approved requests */}
                        {req.status !== 'approved' && (req.status === 'pending' || req.status === 'partially_fulfilled') && (isCentralAdmin || isLabAdmin) && (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed transition-all duration-300 text-sm opacity-50"
                            title={req.status === 'pending' ? 'Pending admin approval' : 'Request not approved'}
                          >
                            {req.status === 'pending' ? 'Awaiting Approval' : 'Allocate Resources'}
                          </button>
                        )}
                      </>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedRequest && modalOpen && (
          <RequestDetailsModal
            open={true}
            request={selectedRequest}
            onClose={handleCloseDetails}
            onRequestUpdate={handleRequestUpdate}
          />
        )}

        {selectedRequest && showFulfillDialog && (
          <FulfillRequestDialog
            request={selectedRequest}
            availableChemicals={availableChemicals}
            onClose={handleCloseFulfill}
            onSuccess={handleRequestUpdated}
          />
        )}

        {selectedRequest && showUnifiedDialog && (
          <UnifiedAllocateDialog
            request={selectedRequest}
            onClose={handleCloseUnifiedDialog}
            onSuccess={handleRequestUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default AllLabRequestsPage;
