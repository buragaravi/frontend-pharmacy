
import React, { useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { addDays } from 'date-fns';

const TimeRangeControl = ({ value, onChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const presetRanges = [
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'Custom Range', value: 'custom' }
  ];

  const handlePresetChange = (rangeValue) => {
    if (rangeValue === 'custom') {
      setShowCustomPicker(true);
    } else {
      let startDate, endDate = new Date();
      
      switch(rangeValue) {
        case '7days':
          startDate = addDays(endDate, -7);
          break;
        case '30days':
          startDate = addDays(endDate, -30);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(endDate.getMonth() / 3);
          startDate = new Date(endDate.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = addDays(endDate, -7);
      }
      
      onChange({
        startDate,
        endDate,
        key: 'selection',
        label: presetRanges.find(r => r.value === rangeValue)?.label || 'Custom'
      });
    }
  };

  const handleDateChange = (ranges) => {
    onChange({
      ...ranges.selection,
      label: 'Custom'
    });
    setShowCustomPicker(false);
  };

  return (
    <div className="time-range-control">
      <div className="preset-buttons">
        {presetRanges.map((range) => (
          <button
            key={range.value}
            className={`preset-btn ${value?.value === range.value ? 'active' : ''}`}
            onClick={() => handlePresetChange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {showCustomPicker && (
        <div className="custom-picker-container">
          <DateRangePicker
            ranges={[value || {
              startDate: new Date(),
              endDate: addDays(new Date(), 7),
              key: 'selection'
            }]}
            onChange={handleDateChange}
            months={2}
            direction="horizontal"
          />
          <button 
            className="apply-btn"
            onClick={() => setShowCustomPicker(false)}
          >
            Apply
          </button>
        </div>
      )}

      {value && (
        <div className="selected-range">
          {value.label}: {value.startDate.toLocaleDateString()} - {value.endDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default TimeRangeControl;