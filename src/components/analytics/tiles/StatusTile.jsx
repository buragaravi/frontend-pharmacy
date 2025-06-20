import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const StatusTile = ({ status, title, description, timestamp }) => {
  const statusConfig = {
    operational: {
      icon: <CheckCircleIcon className="h-5 w-5 text-[#64B5F6]" />,
      bgColor: 'bg-[#F5F9FD]',
      textColor: 'text-[#0B3861]'
    },
    degraded: {
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-[#1E88E5]" />,
      bgColor: 'bg-[#F5F9FD]',
      textColor: 'text-[#0B3861]'
    },
    critical: {
      icon: <XCircleIcon className="h-5 w-5 text-[#0B3861]" />,
      bgColor: 'bg-[#F5F9FD]',
      textColor: 'text-[#0B3861]'
    }
  };

  const config = statusConfig[status] || statusConfig.operational;

  return (
    <div className={`${config.bgColor} rounded-lg shadow-lg border border-[#BCE0FD] p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {config.icon}
        </div>
        <div>
          <h3 className={`text-sm font-medium ${config.textColor}`}>{title}</h3>
          <p className="text-sm text-[#64B5F6]">{description}</p>
          {timestamp && (
            <p className="text-xs text-[#1E88E5] mt-1">
              Last updated: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusTile;