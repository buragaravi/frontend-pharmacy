import React from 'react';
import RequestStatusChart from '../charts/RequestStatusChart';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const RequestFulfillmentSection = ({ requests }) => {
  const fulfilled = requests.filter(r => r.status === 'fulfilled').length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const partial = requests.filter(r => r.status === 'partially_fulfilled').length;
  const total = requests.length;

  const fulfillmentRate = total > 0 ? (fulfilled / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Request Fulfillment</h3>
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">
            {fulfillmentRate.toFixed(0)}% Fulfillment Rate
          </span>
          <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${fulfillmentRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64">
          <RequestStatusChart requests={requests} />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-green-800">Fulfilled</p>
              <p className="text-sm text-gray-600">
                {fulfilled} of {total} requests ({fulfillmentRate.toFixed(0)}%)
              </p>
            </div>
          </div>
          
          <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
            <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-yellow-800">Pending</p>
              <p className="text-sm text-gray-600">
                {pending} requests awaiting processing
              </p>
            </div>
          </div>
          
          <div className="flex items-start p-3 bg-orange-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-orange-800">Partial Fulfillment</p>
              <p className="text-sm text-gray-600">
                {partial} requests partially fulfilled
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestFulfillmentSection;