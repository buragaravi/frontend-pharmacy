import React from 'react';
import PersonalUsageStats from '../sections/PersonalUsageStats';
import RequestHistory from '../charts/RequestHistory';
import DepartmentComparison from '../charts/DepartmentComparison';
import ChemicalPreferences from '../charts/ChemicalPreferences';

const FacultyView = ({ data, filters }) => {
  return (
    <div className="faculty-view">
      <div className="dashboard-row">
        <PersonalUsageStats 
          usage={data.personalUsage}
          timeRange={filters.timeRange}
        />
      </div>

      <div className="dashboard-row">
        <RequestHistory 
          requests={data.requests}
          statusBreakdown={data.statusBreakdown}
        />
        <ChemicalPreferences 
          chemicals={data.topChemicals}
        />
      </div>

      {data.departmentComparison && (
        <div className="dashboard-row">
          <DepartmentComparison 
            comparison={data.departmentComparison}
            userUsage={data.personalUsage.total}
          />
        </div>
      )}
    </div>
  );
};

export default FacultyView;