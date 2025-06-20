import React from 'react';
import LabInventoryStatusSection from '../sections/LabInventoryStatusSection';
import RequestFulfillment from '../charts/RequestFulfillment';
import ChemicalUsagePattern from '../charts/ChemicalUsagePattern';
import ExpiringSoonTile from '../tiles/ExpiringSoonTile';
import QuickActions from '../tiles/QuickActions';

const LabAssistantView = ({ data, filters }) => {
  return (
    <div className="lab-assistant-view">
      <div className="dashboard-row">
        <LabInventoryStatusSection 
          inventory={data.inventory}
          labId={data.labId}
        />
        <QuickActions 
          labId={data.labId}
          pendingRequests={data.pendingRequests}
        />
      </div>

      <div className="dashboard-row">
        <RequestFulfillment 
          requests={data.requests}
          timeRange={filters.timeRange}
        />
        <ExpiringSoonTile 
          chemicals={data.expiringSoon}
        />
      </div>

      <div className="dashboard-row">
        <ChemicalUsagePattern 
          usageData={data.usagePattern}
          labId={data.labId}
        />
      </div>
    </div>
  );
};

export default LabAssistantView;