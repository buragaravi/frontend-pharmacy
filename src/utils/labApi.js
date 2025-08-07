// API utilities for lab management
const API_BASE_URL = '/api/labs';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const labApi = {
  // Get all labs
  async getLabs(includeInactive = false) {
    const response = await fetch(
      `${API_BASE_URL}?includeInactive=${includeInactive}`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch labs');
    }

    return response.json();
  },

  // Get single lab
  async getLab(labId) {
    const response = await fetch(`${API_BASE_URL}/${labId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch lab');
    }

    return response.json();
  },

  // Create new lab
  async createLab(labData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create lab');
    }

    return response.json();
  },

  // Update lab
  async updateLab(labId, labData) {
    const response = await fetch(`${API_BASE_URL}/${labId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(labData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update lab');
    }

    return response.json();
  },

  // Delete lab
  async deleteLab(labId) {
    const response = await fetch(`${API_BASE_URL}/${labId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete lab');
    }

    return response.json();
  },

  // Get lab statistics
  async getLabStats() {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch lab statistics');
    }

    return response.json();
  },

  // Bulk sync all labs
  async bulkSync() {
    const response = await fetch(`${API_BASE_URL}/bulk-sync`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync labs');
    }

    return response.json();
  },

  // Check lab consistency
  async checkConsistency() {
    const response = await fetch(`${API_BASE_URL}/consistency-check`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check consistency');
    }

    return response.json();
  },

  // Get lab options for dropdowns
  async getLabOptions(includeInactive = false) {
    try {
      const response = await this.getLabs(includeInactive);
      return response.data.map(lab => ({
        value: lab.labId,
        label: lab.labName,
        description: lab.description,
        isSystem: lab.isSystem,
        isActive: lab.isActive
      }));
    } catch (error) {
      console.error('Error getting lab options:', error);
      // Return fallback options
      return [
        {
          value: 'central-store',
          label: 'Central Store',
          isSystem: true,
          isActive: true
        }
      ];
    }
  },

  // Validate lab ID
  async validateLabId(labId) {
    try {
      await this.getLab(labId);
      return true;
    } catch {
      return false;
    }
  }
};

export default labApi;
