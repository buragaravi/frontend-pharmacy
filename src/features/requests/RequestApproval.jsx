import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import RequestCard from './RequestCard';
import RequestDetailsModal from './RequestDetailsModal';
import FulfillRequestDialog from './FulfillRequestDialog';
import FulfillRemainingRequestDialog from './FulfillRemainingRequestDialog'; // Add this import
import { useNavigate } from 'react-router-dom';

const RequestApprovalPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showFulfillRemainingDialog, setShowFulfillRemainingDialog] = useState(false); // New state
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [userRole, setUserRole] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [labId, setLabId] = React.useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { labId } = decoded.user;
        setLabId(labId);
        setUserRole(decoded.user.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      } 
    }
  }, []);

  // Fetch lab-specific requests
  const fetchLabRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/requests/lab/${labId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available central chemicals
  const fetchAvailableChemicals = async () => {
    try {
      const res = await axios.get('https://backend-pharmacy-5541.onrender.com/api/chemicals/central/available', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAvailableChemicals(res.data);
    } catch (err) {
      console.error('Error fetching available chemicals:', err);
    }
  };

  useEffect(() => {
    if (labId) {
      fetchLabRequests();
      fetchAvailableChemicals();
    }
  }, [token, labId]);

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handleRequestUpdate = () => {
    fetchLabRequests(); // Refresh the data
  };

  const handleOpenFulfill = (request) => {
    setSelectedRequest(request);
    setShowFulfillDialog(true);
  };

  const handleOpenFulfillRemaining = (request) => {
    setSelectedRequest(request);
    setShowFulfillRemainingDialog(true);
  };

  const handleCloseFulfill = () => {
    setSelectedRequest(null);
    setShowFulfillDialog(false);
  };

  const handleCloseFulfillRemaining = () => {
    setSelectedRequest(null);
    setShowFulfillRemainingDialog(false);
  };

  const handleRequestUpdated = () => {
    fetchLabRequests();
    fetchAvailableChemicals();
    handleCloseFulfill();
    handleCloseFulfillRemaining();
  };

  const getActionButtons = (request) => {
    // Add debug logging to inspect the entire request object
    console.log('Request in getActionButtons:', request);
    
    // Make status check more robust
    const status = request?.status?.toLowerCase().trim();
    
    if (status === 'partially_fulfilled') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenFulfill(request)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Fulfill / Reject
          </button>
        </div>
      );
    } else if (status === 'pending') {
      return (
        <button
          onClick={() => handleOpenFulfillRemaining(request)}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Fulfill Remaining
        </button>
      );
    }
    return null;
  };
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Approve / Fulfill Requests</h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No requests for this lab.</p>
      ) : (
        <div className="grid gap-4 mb-8">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              userRole={userRole}
              showStatus
              onClick={() => handleOpenDetails(req)}
              actionButton={getActionButtons(req)}
            />
          ))}
        </div>
      )}

      {selectedRequest && !showFulfillDialog && !showFulfillRemainingDialog && (
        <RequestDetailsModal 
          open={true} 
          request={selectedRequest} 
          onClose={handleCloseDetails} 
          onRequestUpdate={handleRequestUpdate}
          actionButton={getActionButtons(selectedRequest)}
        />
      )}

      {selectedRequest && showFulfillDialog && (
        <FulfillRequestDialog
          request={selectedRequest}
          onClose={handleCloseFulfill}
          onSuccess={handleRequestUpdated}
        />
      )}

      {selectedRequest && showFulfillRemainingDialog && (
        <FulfillRemainingRequestDialog
          request={selectedRequest}
          onClose={handleCloseFulfillRemaining}
          onSuccess={handleRequestUpdated}
          actionButton ={getActionButtons(selectedRequest)}
        />
      )}
    </div>
  );
};

export default RequestApprovalPage;