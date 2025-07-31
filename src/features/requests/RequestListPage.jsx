import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import RequestCard from './RequestCard';
import RequestDetailsModal from './RequestDetailsModal';

const RequestListPage = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  const token = localStorage.getItem('token');

  // Get user role from token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.user.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [token]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('https://backend-pharmacy-5541.onrender.com/api/requests/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setRequests(data);
        filterRequestsByDate(data, startDate, endDate);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequestsByDate(requests, startDate, endDate);
  }, [startDate, endDate]);

  const filterRequestsByDate = (requests, start, end) => {
    if (!requests.length) return;

    const filtered = requests.filter(req => {
      const requestDate = new Date(req.createdAt || req.date);
      const requestDateStr = format(requestDate, 'yyyy-MM-dd');
      
      if (start && !end) {
        // Filter for dates greater than or equal to start date
        return requestDateStr >= start;
      } else if (start && end) {
        // Filter for dates between start and end
        return requestDateStr >= start && requestDateStr <= end;
      }
      return true;
    });

    setFilteredRequests(filtered);
  };

  const openModal = (req) => {
    setSelectedRequest(req);
    setModalOpen(true);
  };

  const handleRequestUpdate = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://backend-pharmacy-5541.onrender.com/api/requests/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setRequests(data);
      filterRequestsByDate(data, startDate, endDate);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllocationStats = (request) => {
    if (!request?.chemicals?.length) return { total: 0, allocated: 0, unallocated: 0, percentage: 0 };
    
    const total = request.chemicals.length;
    const allocated = request.chemicals.filter(chem => chem.status === 'allocated').length;
    const unallocated = total - allocated;
    const percentage = total > 0 ? Math.round((allocated / total) * 100) : 0;
    
    return { total, allocated, unallocated, percentage };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Chemical Requests Report', 14, 22);
    
    // Add date range info
    doc.setFontSize(10);
    const dateText = startDate && endDate 
      ? `Date Range: ${startDate} to ${endDate}`
      : startDate 
        ? `From: ${startDate} onwards` 
        : 'All Dates';
    doc.text(dateText, 14, 30);
    
    // Define table columns
    const columns = [
      { header: 'S.No', dataKey: 'index' },
      { header: 'Username', dataKey: 'username' },
      { header: 'Lab ID', dataKey: 'labId' },
      { header: 'Total Chemicals', dataKey: 'total' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Allocated', dataKey: 'allocated' },
      { header: 'Unallocated', dataKey: 'unallocated' },
      { header: 'Allocation %', dataKey: 'percentage' }
    ];
    
    // Prepare table data
    const tableData = filteredRequests.map((req, index) => {
      const stats = calculateAllocationStats(req);
      return {
        index: index + 1,
        username: req.user?.username || 'N/A',
        labId: req.labId || 'N/A',
        total: stats.total,
        status: req.status || 'Pending',
        allocated: stats.allocated,
        unallocated: stats.unallocated,
        percentage: `${stats.percentage}%`
      };
    });
    
    // Generate the table
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: tableData.map(data => columns.map(col => data[col.dataKey])),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Save the PDF
    doc.save(`chemical_requests_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Chemical Requests</h2>
        
        <div className="flex space-x-4">
          {/* Date filter */}
          <div className="flex items-center space-x-2">
            <div>
              <label className="block text-sm mb-1">From</label>
              <input
                type="date"
                className="p-2 border rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">To</label>
              <input
                type="date"
                className="p-2 border rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* PDF download button */}
          <button 
            onClick={generatePDF}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={loading || filteredRequests.length === 0}
          >
            Download PDF Report
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <p>No requests found for the selected date range.</p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded shadow">
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold">{filteredRequests.length}</p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-white rounded shadow">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold">
                  {filteredRequests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Requests list */}
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <RequestCard key={req._id} request={req} userRole={userRole} onClick={openModal} />
            ))}
          </div>
        </>
      )}
      
      <RequestDetailsModal
        request={selectedRequest}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRequestUpdate={handleRequestUpdate}
      />
    </div>
  );
};

export default RequestListPage;