/**
 * API service functions for date-aware request allocation system
 */

const API_BASE_URL = 'https://backend-jits.onrender.com/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Get comprehensive allocation status for a request
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} Allocation status data
 */
export const getRequestAllocationStatus = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/allocation-status`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching allocation status:', error);
    throw error;
  }
};

/**
 * Set admin override for an experiment
 * @param {string} requestId - The request ID
 * @param {string} experimentId - The experiment ID
 * @param {Object} overrideData - Override configuration
 * @returns {Promise<Object>} Override result
 */
export const setAdminOverride = async (requestId, experimentId, overrideData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/experiments/${experimentId}/admin-override`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(overrideData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error setting admin override:', error);
    throw error;
  }
};

/**
 * Get item edit permissions for a request
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} Edit permissions data
 */
export const getItemEditPermissions = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/edit-permissions`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching edit permissions:', error);
    throw error;
  }
};

/**
 * Update item disabled status
 * @param {string} requestId - The request ID
 * @param {Array} updates - Array of status updates
 * @returns {Promise<Object>} Update result
 */
export const updateItemDisabledStatus = async (requestId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/items/disable-status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ updates })
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating disabled status:', error);
    throw error;
  }
};

/**
 * Enhanced allocation function with date validation
 * @param {string} requestId - The request ID
 * @param {Object} allocationData - Allocation data
 * @returns {Promise<Object>} Allocation result
 */
export const allocateRequestResources = async (requestId, allocationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/allocate-unified`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(allocationData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error allocating resources:', error);
    throw error;
  }
};

/**
 * Enhanced admin edit function with date validation
 * @param {string} requestId - The request ID
 * @param {Object} editData - Edit data
 * @returns {Promise<Object>} Edit result
 */
export const adminEditRequest = async (requestId, editData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/admin-edit`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(editData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error editing request:', error);
    throw error;
  }
};

/**
 * Get request details with enhanced data
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} Request details
 */
export const getRequestDetails = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching request details:', error);
    throw error;
  }
};

/**
 * Batch API call to get both request details and allocation status
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} Combined data
 */
export const getRequestWithAllocationStatus = async (requestId) => {
  try {
    const [requestDetails, allocationStatus] = await Promise.all([
      getRequestDetails(requestId),
      getRequestAllocationStatus(requestId)
    ]);
    
    return {
      request: requestDetails,
      allocationStatus,
      combinedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching combined request data:', error);
    throw error;
  }
};
