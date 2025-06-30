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
  { status: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { status: 'fulfilled', label: 'Fulfilled', color: 'bg-blue-100 text-blue-800' },
  { status: 'partially_fulfilled', label: 'Partially Fulfilled', color: 'bg-purple-100 text-purple-800' },
  { status: 'completed', label: 'Completed', color: 'bg-gray-200 text-gray-800' }
];

const labList = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08'];

const AllLabRequestsPage = () => {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchAllLabRequests()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className={`${THEME.card} rounded-lg md:rounded-xl shadow p-3 md:p-4 ${THEME.border}`}> 
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div className="flex items-center">
            <div className={`${THEME.primaryBg} p-2 rounded-lg mr-2`}>
              <RequestIcon />
            </div>
            <h2 className={`text-lg md:text-xl font-bold ${THEME.secondaryText}`}>All Lab Requests</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="flex items-center space-x-1">
              <label className={`text-xs ${THEME.primaryText}`}>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`border ${THEME.border} rounded px-1 py-0.5 text-xs ${THEME.inputFocus}`}
              />
            </div>
            <div className="flex items-center space-x-1">
              <label className={`text-xs ${THEME.primaryText}`}>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`border ${THEME.border} rounded px-1 py-0.5 text-xs ${THEME.inputFocus}`}
              />
            </div>
            <button
              onClick={generatePDF}
              className={`flex items-center px-2 py-1 ${THEME.primaryBg} text-white rounded text-xs ${THEME.hoverBg}`}
            >
              <DownloadIcon />
              Export PDF
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-1 mb-4">
          {statusCategories.map(category => (
            <button
              key={category.status}
              onClick={() => handleStatusClick(category.status)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${category.color} ${
                selectedStatus === category.status ? `ring-1 ring-[${THEME.secondaryText}]` : ''
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredRequests.length === 0 ? (
          <div className={`text-center p-4 ${THEME.background} rounded ${THEME.border}`}>
            <p className={`text-base font-medium ${THEME.primaryText}`}>No requests found</p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedStatus === 'all' 
                ? "There are no requests from any lab at the moment"
                : `No ${selectedStatus.replace('_', ' ')} requests`}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredRequests.map(req => (
              <RequestCard
                key={req._id}
                request={req}
                onClick={() => handleOpenDetails(req)}
                showStatus
                showLabId={true}
                className={`${THEME.card} ${THEME.border} hover:shadow-lg transition-shadow`}
                actionButton={
                  <>
                    {(req.status === 'pending' || req.status === 'partially_fulfilled') && isCentralAdmin && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenUnifiedDialog(req);
                        }}
                        className={`px-3 py-1 ${THEME.primaryBg} text-white rounded-lg font-medium ${THEME.hoverBg} transition-colors text-xs`}
                      >
                        Allocate
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {selectedRequest && modalOpen && (
          <RequestDetailsModal
            open={true}
            request={selectedRequest}
            onClose={handleCloseDetails}
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
