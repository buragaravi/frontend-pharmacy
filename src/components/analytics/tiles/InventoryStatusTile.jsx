import React from 'react';

const InventoryStatusTile = ({ totalItems, inStock, lowStock, outOfStock }) => {
  const calculatePercentage = (value) => (value / totalItems) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Inventory Status</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">In Stock</span>
            <span className="font-medium">{inStock} ({calculatePercentage(inStock).toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${calculatePercentage(inStock)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Low Stock</span>
            <span className="font-medium text-yellow-600">{lowStock} ({calculatePercentage(lowStock).toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${calculatePercentage(lowStock)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Out of Stock</span>
            <span className="font-medium text-red-600">{outOfStock} ({calculatePercentage(outOfStock).toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${calculatePercentage(outOfStock)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatusTile;