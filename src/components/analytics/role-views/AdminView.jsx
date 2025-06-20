import React from 'react';
import ChemicalStockLevels from '../charts/ChemicalStockLevels';
import ChemicalTransferSankey from '../charts/ChemicalTransferSankey';
import ExpiryRiskMatrix from '../charts/ExpiryRiskMatrix';
import SystemMetrics from '../tiles/SystemMetrics';
import AlertTile from '../tiles/AlertTile';
import ConsumptionTrend from '../charts/ConsumptionTrend';
import LabComparison from '../charts/LabComparison';

const AdminView = ({ data, filters }) => {
  return (
    <div className="admin-view">
      <div className="dashboard-row">
        <SystemMetrics 
          metrics={data.metrics} 
          timeRange={filters.timeRange.label}
        />
        <AlertTile 
          alerts={data.alerts} 
          criticalCount={data.criticalAlerts}
        />
      </div>

      <div className="dashboard-row">
        <ChemicalStockLevels 
          data={data.stockLevels} 
          labs={data.labs}
          reorderLevels={data.reorderLevels}
        />
        <ExpiryRiskMatrix 
          expiryData={data.expiryData}
        />
      </div>

      <div className="dashboard-row">
        <ChemicalTransferSankey 
          transferData={data.transfers}
          width={800}
          height={400}
        />
        <ConsumptionTrend 
          consumptionData={data.consumption} 
          forecastData={data.forecast}
        />
      </div>

      <div className="dashboard-row">
        <LabComparison 
          labs={data.labs}
          usageData={data.labUsage}
          timeRange={filters.timeRange}
        />
      </div>
    </div>
  );
};

export default AdminView;