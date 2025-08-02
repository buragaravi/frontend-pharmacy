import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminView from './AdminView';
import CentralAdminView from './CentralAdminView';
import LabAssistantView from './LabAssistantView';
import FacultyView from './FacultyView';
import UnauthorizedView from './UnauthorizedView';

const RoleViewWrapper = ({ data, filters }) => {
  const { user } = useAuth();

  const renderView = () => {
    switch(user.role) {
      case 'admin':
        return <AdminView data={data} filters={filters} />;
      case 'central_store_admin':
        return <CentralAdminView data={data} filters={filters} />;
      case 'lab_assistant':
        return <LabAssistantView data={data} filters={filters} />;
      case 'faculty':
        return <FacultyView data={data} filters={filters} />;
      default:
        return <UnauthorizedView />;
    }
  };

  return (
    <div className={`role-view ${user.role.toLowerCase().replace('_', '-')}`}>
      <div className="view-header">
        <h2>
          {user.role === 'admin' && 'System Analytics'}
          {user.role === 'central_store_admin' && 'Central Store Analytics'}
          {user.role === 'lab_assistant' && `${user.labId} Lab Analytics`}
          {user.role === 'faculty' && 'My Chemical Usage'}
        </h2>
        <div className="time-range-display">
          {filters.timeRange.label}: {filters.timeRange.startDate.toLocaleDateString()} - {filters.timeRange.endDate.toLocaleDateString()}
        </div>
      </div>
      
      {renderView()}
    </div>
  );
};

export default RoleViewWrapper;