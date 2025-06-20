import React from 'react';
import { Bubble } from 'react-chartjs-2';
import { expiryRiskOptions } from './utils/chartConfigs';

const ExpiryRiskMatrix = ({ expiryData }) => {
  // Categorize by risk level
  const data = {
    datasets: [
      {
        label: 'High Risk (<30 days)',
        data: expiryData
          .filter(item => item.daysToExpiry < 30)
          .map(item => ({
            x: item.daysToExpiry,
            y: item.quantity,
            r: Math.min(item.quantity / 5, 20)
          })),
        backgroundColor: 'rgba(231, 76, 60, 0.7)'
      },
      {
        label: 'Medium Risk (30-90 days)',
        data: expiryData
          .filter(item => item.daysToExpiry >= 30 && item.daysToExpiry < 90)
          .map(item => ({
            x: item.daysToExpiry,
            y: item.quantity,
            r: Math.min(item.quantity / 5, 20)
          })),
        backgroundColor: 'rgba(241, 196, 15, 0.7)'
      },
      {
        label: 'Low Risk (>90 days)',
        data: expiryData
          .filter(item => item.daysToExpiry >= 90)
          .map(item => ({
            x: item.daysToExpiry,
            y: item.quantity,
            r: Math.min(item.quantity / 5, 20)
          })),
        backgroundColor: 'rgba(46, 204, 113, 0.7)'
      }
    ]
  };

  return (
    <div className="chart-container">
      <h3>Expiry Risk Matrix</h3>
      <Bubble
        data={data}
        options={expiryRiskOptions}
        height={350}
      />
      <div className="risk-legend">
        <div className="risk-category high-risk">High Risk</div>
        <div className="risk-category medium-risk">Medium Risk</div>
        <div className="risk-category low-risk">Low Risk</div>
      </div>
    </div>
  );
};

export default ExpiryRiskMatrix;