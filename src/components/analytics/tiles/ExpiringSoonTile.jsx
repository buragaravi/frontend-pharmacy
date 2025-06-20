import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const ExpiringSoonTile = ({ chemicals }) => {
  const expiringSoon = chemicals.filter(chem => chem.daysToExpiry < 60);

  if (!expiringSoon.length) {
    return (
      <div className="bg-[#F5F9FD] rounded-lg shadow-lg border border-[#BCE0FD] p-4">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-[#64B5F6] mr-2" />
          <h3 className="text-sm font-medium text-[#0B3861]">No chemicals expiring soon</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] p-4">
      <div className="flex items-center mb-2">
        <ClockIcon className="h-5 w-5 text-[#0B3861] mr-2" />
        <h3 className="text-sm font-medium text-[#0B3861]">
          {expiringSoon.length} {expiringSoon.length === 1 ? 'chemical' : 'chemicals'} expiring soon
        </h3>
      </div>
      <div className="mt-3 space-y-2">
        {expiringSoon.slice(0, 3).map((chemical, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-[#F5F9FD] rounded border border-[#BCE0FD]">
            <span className="text-sm text-[#0B3861]">{chemical.name}</span>
            <span className="text-xs font-medium text-[#64B5F6]">
              {chemical.daysToExpiry} days left
            </span>
          </div>
        ))}
        {expiringSoon.length > 3 && (
          <p className="text-xs text-[#1E88E5] text-center mt-2">
            + {expiringSoon.length - 3} more...
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpiringSoonTile;