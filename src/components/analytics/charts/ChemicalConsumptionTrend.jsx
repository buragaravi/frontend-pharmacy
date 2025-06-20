import React from 'react';
import { Line } from 'react-chartjs-2';
import { consumptionOptions } from './utils/chartConfigs';

const ChemicalConsumptionTrend = ({ consumptionData, forecastData }) => {
  const chartData = {
    labels: consumptionData.map(item => item.month),
    datasets: [{
      label: 'Actual Consumption',
      data: consumptionData.map(item => item.consumed),
      borderColor: '#3498db',
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      tension: 0.3,
      fill: true
    }, {
      label: 'Forecasted Consumption',
      data: forecastData,
      borderColor: '#e67e22',
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0.3
    }]
  };

  return (
    <div className="chart-container">
      <h3>Consumption Trends</h3>
      <Line 
        data={chartData} 
        options={consumptionOptions}
        height={300}
      />
      <div className="trend-notes">
        <p>Forecast based on 3-month moving average</p>
      </div>
    </div>
  );
};

export default ChemicalConsumptionTrend;