import React, { useState } from 'react';
import useAnalytics from '../hooks/useAnalytics';
import AnalyticsControls from '../components/analytics/controls/AnalyticsControls';
import RoleViewWrapper from '../components/analytics/role-views/RoleViewWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { generateDateRanges } from '../utils/analyticsHelpers';

const AnalyticsPage = () => {
  const dateRanges = generateDateRanges();
  const [filters, setFilters] = useState({
    timeRange: dateRanges.last30Days,
    chemicals: [],
    labs: [],
    metric: 'quantity'
  });

  const { data, loading, error, refetch } = useAnalytics(filters);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleReset = () => {
    setFilters({
      timeRange: dateRanges.last30Days,
      chemicals: [],
      labs: [],
      metric: 'quantity'
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert 
          message={error} 
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          View and analyze chemical inventory and usage patterns
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <AnalyticsControls 
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <RoleViewWrapper 
            data={data} 
            filters={filters} 
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;