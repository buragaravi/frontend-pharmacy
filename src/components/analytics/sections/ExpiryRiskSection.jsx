import React from 'react';
import ExpiryRiskMatrix from '../charts/ExpiryRiskMatrix';

const ExpiryRiskSection = ({ expiryData }) => {
  const highRisk = expiryData.filter(item => item.daysToExpiry < 30);
  const mediumRisk = expiryData.filter(item => item.daysToExpiry >= 30 && item.daysToExpiry < 90);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Expiry Risk</h3>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">High Risk ({highRisk.length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Medium Risk ({mediumRisk.length})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96">
          <ExpiryRiskMatrix expiryData={expiryData} />
        </div>
        
        <div className="space-y-4">
          {highRisk.length > 0 && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r">
              <h4 className="font-medium text-red-800 mb-2">Immediate Attention Needed</h4>
              <ul className="space-y-2">
                {highRisk.slice(0, 3).map(chem => (
                  <li key={chem._id} className="text-sm">
                    <span className="font-medium">{chem.chemicalName}</span> - 
                    Expires in {Math.floor(chem.daysToExpiry)} days ({chem.quantity} {chem.unit})
                  </li>
                ))}
              </ul>
              {highRisk.length > 3 && (
                <p className="text-xs text-red-700 mt-2">
                  + {highRisk.length - 3} more chemicals
                </p>
              )}
            </div>
          )}
          
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r">
            <h4 className="font-medium text-yellow-800 mb-2">Upcoming Expirations</h4>
            <ul className="space-y-2">
              {mediumRisk.slice(0, 3).map(chem => (
                <li key={chem._id} className="text-sm">
                  <span className="font-medium">{chem.chemicalName}</span> - 
                  Expires in {Math.floor(chem.daysToExpiry)} days ({chem.quantity} {chem.unit})
                </li>
              ))}
            </ul>
            {mediumRisk.length > 3 && (
              <p className="text-xs text-yellow-700 mt-2">
                + {mediumRisk.length - 3} more chemicals
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryRiskSection;