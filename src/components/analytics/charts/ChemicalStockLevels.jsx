import React from 'react';
import { Bar } from 'react-chartjs-2';
import { generateLabColors } from './utils/colorPalette';
import { stockLevelOptions } from './utils/chartConfigs';

const ChemicalStockLevels = ({ data, chemicalFilter }) => {
  // Transform API data for Chart.js
  const chartData = {
    labels: data.map(item => item.labId),
    datasets: [{
      label: 'Current Stock',
      data: data.map(item => item.quantity),
      backgroundColor: generateLabColors(data.map(item => item.labId)),
      borderColor: '#2c3e50',
      borderWidth: 1,
    }, {
      label: 'Reorder Level',
      data: data.map(item => item.reorderLevel || item.quantity * 0.3), // 30% as example threshold
      backgroundColor: 'rgba(231, 76, 60, 0.2)',
      borderColor: 'rgba(231, 76, 60, 0.8)',
      borderWidth: 1,
      type: 'line',
      fill: true
    }]
  };

  return (
    <div className="chart-container">
      <h3>Chemical Stock Levels</h3>
      <Bar 
        data={chartData} 
        options={stockLevelOptions}
        height={400}
      />
      <div className="chart-footer">
        <span className="legend-item">
          <span className="color-block" style={{backgroundColor: '#3498db'}}></span>
          Current Stock
        </span>
        <span className="legend-item">
          <span className="color-block" style={{backgroundColor: 'rgba(231, 76, 60, 0.2)'}}></span>
          Reorder Threshold
        </span>
      </div>
    </div>
  );
};

export default ChemicalStockLevels;