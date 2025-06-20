import { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import { formatAnalyticsData } from '../utils/analyticsHelpers';

const useAnalytics = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decode token to get user data
  const token = localStorage.getItem('token');
  let userId = null;
  let labId = null;
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.userId;
      labId = decoded.labId;
      role = decoded.role;
    } catch (err) {
      console.error('Invalid JWT token:', err);
    }
  }

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (filters.timeRange) {
          params.append('startDate', filters.timeRange.startDate.toISOString());
          params.append('endDate', filters.timeRange.endDate.toISOString());
        }
        if (filters.chemicals?.length) {
          params.append('chemicalIds', filters.chemicals.map(c => c.value).join(','));
        }
        if (filters.labs?.length) {
          params.append('labIds', filters.labs.map(l => l.value).join(','));
        }

        // Build endpoint based on decoded role
        let endpoint = 'https://backend-pharmacy-5541.onrender.com/api/analytics/';
        switch (role) {
          case 'admin':
            endpoint += 'system-overview';
            break;
          case 'central_lab_admin':
            endpoint += 'central';
            break;
          case 'lab_assistant':
            endpoint += `lab/${labId}`;
            break;
          case 'faculty':
            endpoint += `faculty/${userId}`;
            break;
          default:
            throw new Error('Unauthorized role');
        }

        const response = await fetch(`${endpoint}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch analytics data');

        const rawData = await response.json();
        const formattedData = formatAnalyticsData(rawData, role);

        setData(formattedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token && role) {
      fetchAnalyticsData();
    } else {
      setError('No valid token or role found');
      setLoading(false);
    }
  }, [filters, token]);

  return { data, loading, error, refetch: () => setData(null) };
};

export default useAnalytics;
