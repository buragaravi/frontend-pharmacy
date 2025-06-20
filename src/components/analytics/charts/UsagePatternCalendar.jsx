import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './UsagePatternCalendar.css'; // Custom styles

const UsagePatternCalendar = ({ usageData, year }) => {
  // Transform data for heatmap
  const heatmapData = usageData.map(entry => ({
    date: entry.date,
    count: entry.usageCount,
    quantity: entry.totalQuantity
  }));

  // Custom color scale based on usage
  const colorScale = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#c6e48b';
    if (count <= 5) return '#7bc96f';
    if (count <= 10) return '#239a3b';
    return '#196127';
  };

  return (
    <div className="calendar-container">
      <h3>Usage Patterns {year}</h3>
      <CalendarHeatmap
        startDate={new Date(`${year}-01-01`)}
        endDate={new Date(`${year}-12-31`)}
        values={heatmapData}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          return `color-scale-${colorScale(value.count)}`;
        }}
        tooltipDataAttrs={(value) => ({
          'data-tip': value.date 
            ? `${value.date}: ${value.count} uses (${value.quantity} units)`
            : 'No data'
        })}
        showWeekdayLabels
      />
      <div className="calendar-legend">
        <span>Less</span>
        <span className="color-block" style={{backgroundColor: '#ebedf0'}}></span>
        <span className="color-block" style={{backgroundColor: '#c6e48b'}}></span>
        <span className="color-block" style={{backgroundColor: '#7bc96f'}}></span>
        <span className="color-block" style={{backgroundColor: '#239a3b'}}></span>
        <span className="color-block" style={{backgroundColor: '#196127'}}></span>
        <span>More</span>
      </div>
    </div>
  );
};

export default UsagePatternCalendar;