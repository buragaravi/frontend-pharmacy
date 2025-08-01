// API utilities for request management

const API_BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api';

// Get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Admin approval API function
export const adminApproveRequest = async (requestId, action, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/admin-approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action,
        reason: reason?.trim() || undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Failed to ${action} request`);
    }

    return data;
  } catch (error) {
    console.error(`Error ${action}ing request:`, error);
    throw error;
  }
};

// Get all requests
export const getAllRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

// Get approved requests
export const getApprovedRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/approved`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch approved requests');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching approved requests:', error);
    throw error;
  }
};

// Get unapproved requests
export const getUnapprovedRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/unapproved`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unapproved requests');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching unapproved requests:', error);
    throw error;
  }
};

// Get request statistics
export const getRequestStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/stats`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch request statistics');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching request stats:', error);
    throw error;
  }
};

// Allocate resources to approved request
export const allocateResources = async (requestId, allocationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/allocate-unified`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(allocationData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to allocate resources');
    }

    return data;
  } catch (error) {
    console.error('Error allocating resources:', error);
    throw error;
  }
};
