import React, { useState, useEffect } from 'react';
import TimeRangeControl from './TimeRangeControl';
import ChemicalFilterControl from './ChemicalFilterControl';
import LabFilterControl from './LabFilterControl';
import MetricToggleControl from './MetricToggleControl';
import { Button } from 'react-bootstrap';

const AnalyticsControlsContainer = ({ 
  initialFilters,
  chemicals,
  labs,
  onFilterChange 
}) => {
  const [filters, setFilters] = useState(initialFilters || {
    timeRange: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
      key: 'selection',
      label: 'Last 30 Days'
    },
    chemicals: [],
    labs: [],
    metric: 'quantity'
  });

  // Update parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleTimeRangeChange = (timeRange) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };

  const handleChemicalChange = (selectedChemicals) => {
    setFilters(prev => ({ ...prev, chemicals: selectedChemicals }));
  };

  const handleLabChange = (selectedLabs) => {
    setFilters(prev => ({ ...prev, labs: selectedLabs }));
  };

  const handleMetricChange = (metric) => {
    setFilters(prev => ({ ...prev, metric }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="analytics-controls-container">
      <div className="control-group">
        <label>Time Period</label>
        <TimeRangeControl 
          value={filters.timeRange} 
          onChange={handleTimeRangeChange} 
        />
      </div>

      <div className="control-group">
        <label>Chemicals</label>
        <ChemicalFilterControl
          chemicals={chemicals}
          value={filters.chemicals}
          onChange={handleChemicalChange}
        />
      </div>

      <div className="control-group">
        <label>Labs</label>
        <LabFilterControl
          labs={labs}
          value={filters.labs}
          onChange={handleLabChange}
          isMulti={true}
        />
      </div>

      <div className="control-group">
        <label>View Metrics As</label>
        <MetricToggleControl
          value={filters.metric}
          onChange={handleMetricChange}
          options={[
            { value: 'quantity', label: 'Quantity' },
            { value: 'percentage', label: 'Percentage' },
            { value: 'value', label: 'Monetary Value' }
          ]}
        />
      </div>

      <div className="control-actions">
        <Button 
          variant="outline-secondary" 
          size="sm"
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsControlsContainer;