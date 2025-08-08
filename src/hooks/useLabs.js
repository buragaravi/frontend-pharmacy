import { useState, useEffect } from 'react';
import axios from 'axios';

export const useLabs = (includeInactive = false) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://backend-pharmacy-5541.onrender.com/api/labs`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setLabs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
      setError(error.response?.data?.message || 'Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [includeInactive]);

  return { labs, loading, error, refetch: fetchLabs };
};

export default useLabs;
