import React from 'react';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

const MetricToggleControl = ({ value, onChange, options }) => {
  return (
    <div className="metric-toggle-control">
      <ToggleButtonGroup
        type="radio"
        name="metric-options"
        value={value}
        onChange={onChange}
      >
        {options.map(option => (
          <ToggleButton
            key={option.value}
            value={option.value}
            variant="outline-primary"
            size="sm"
          >
            {option.icon && <span className="metric-icon">{option.icon}</span>}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
};

export default MetricToggleControl;