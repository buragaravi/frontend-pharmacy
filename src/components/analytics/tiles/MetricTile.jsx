import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

const MetricTile = ({ title, value, change, unit, icon }) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-[#0B3861]">{title}</h3>
        {icon && (
          <div className="p-2 rounded-md bg-[#F5F9FD] text-[#0B3861]">
            {React.cloneElement(icon, { className: 'h-5 w-5' })}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-[#0B3861]">
            {value} {unit && <span className="text-sm font-normal text-[#64B5F6]">{unit}</span>}
          </p>
        </div>
        
        {change !== undefined && (
          <div className={`flex items-center ${isPositive ? 'text-[#0B3861]' : isNeutral ? 'text-[#64B5F6]' : 'text-[#1E88E5]'}`}>
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : isNeutral ? (
              <MinusIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm font-medium">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricTile;