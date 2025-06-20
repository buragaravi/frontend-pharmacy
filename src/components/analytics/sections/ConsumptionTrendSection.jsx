import React from 'react';
import ChemicalConsumption from '../charts/ChemicalConsumption';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const ConsumptionTrendSection = ({ consumptionData, forecastData }) => {
  const calculateTrend = () => {
    if (consumptionData.length < 2) return 0;
    const last = consumptionData[consumptionData.length - 1].consumed;
    const prev = consumptionData[consumptionData.length - 2].consumed;
    return ((last - prev) / prev) * 100;
  };

  const trend = calculateTrend();
  const isIncreasing = trend > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0B3861]">Consumption Trends</h3>
        <div className={`flex items-center ${isIncreasing ? 'text-[#0B3861]' : 'text-[#64B5F6]'}`}>
          {isIncreasing ? (
            <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-5 w-5 mr-1" />
          )}
          <span className="text-sm font-medium">
            {Math.abs(trend).toFixed(1)}% {isIncreasing ? 'Increase' : 'Decrease'}
          </span>
        </div>
      </div>

      <div className="h-80">
        <ChemicalConsumption 
          consumptionData={consumptionData} 
          forecastData={forecastData}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#F5F9FD] p-4 rounded-lg">
          <p className="text-sm text-[#0B3861]">Current Usage</p>
          <p className="text-xl font-semibold">
            {consumptionData[consumptionData.length - 1]?.consumed || 0} units
          </p>
        </div>
        <div className="bg-[#E3F2FD] p-4 rounded-lg">
          <p className="text-sm text-[#0B3861]">30-Day Forecast</p>
          <p className="text-xl font-semibold text-[#0B3861]">
            {forecastData.slice(-1)[0] || 0} units
          </p>
        </div>
        <div className="bg-[#D1C4E9] p-4 rounded-lg">
          <p className="text-sm text-[#0B3861]">Peak Usage</p>
          <p className="text-xl font-semibold text-[#0B3861]">
            {Math.max(...consumptionData.map(d => d.consumed))} units
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionTrendSection;