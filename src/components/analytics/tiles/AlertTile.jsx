import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AlertTile = ({ alerts, criticalCount }) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || !alerts?.length) return null;

  return (
    <div className="bg-[#F5F9FD] rounded-lg shadow-lg border-l-4 border-[#0B3861] p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-[#0B3861] hover:text-[#1E88E5]"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-[#0B3861] mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-[#0B3861]">
            {criticalCount > 1 
              ? `${criticalCount} critical alerts need attention` 
              : '1 critical alert needs attention'}
          </h3>
          <div className="mt-2 space-y-1">
            {alerts.slice(0, 2).map((alert, index) => (
              <p key={index} className="text-sm text-[#64B5F6]">
                • {alert.message}
              </p>
            ))}
            {alerts.length > 2 && (
              <p className="text-xs text-[#1E88E5]">
                + {alerts.length - 2} more alerts...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertTile;