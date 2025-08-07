import React from 'react';

const LABASSISTANT_STATUS = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  fulfilled: 'bg-blue-100 text-blue-800',
  partially_fulfilled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-200 text-gray-800',
};

const RequestStatusBadge = ({ status }) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${LABASSISTANT_STATUS[status] || 'bg-gray-200 text-gray-800'}`}
      style={{ textTransform: 'capitalize' }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

export default RequestStatusBadge;
