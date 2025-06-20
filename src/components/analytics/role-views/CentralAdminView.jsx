import React from 'react';
import InventoryOverview from '../sections/InventoryOverview';
import ReorderAlert from '../tiles/ReorderAlert';
import VendorPerformance from '../charts/VendorPerformance';
import PurchaseTimeline from '../charts/PurchaseTimeline';
import ChemicalConsumption from '../charts/ChemicalConsumption';

const CentralAdminView = ({ data, filters }) => {
  return (
    <div className="central-admin-view">
      <div className="dashboard-row">
        <InventoryOverview 
          stock={data.stockLevels} 
          reorderLevels={data.reorderLevels}
        />
        <ReorderAlert 
          chemicals={data.lowStockChemicals}
        />
      </div>

      <div className="dashboard-row">
        <ChemicalConsumption 
          data={data.consumption}
          timeRange={filters.timeRange}
        />
        <VendorPerformance 
          vendors={data.vendors}
        />
      </div>

      <div className="dashboard-row">
        <PurchaseTimeline 
          purchases={data.purchases}
          allocations={data.allocations}
        />
      </div>
    </div>
  );
};

export default CentralAdminView;