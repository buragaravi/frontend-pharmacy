import React, { useState } from 'react';
import {
  AddEquipmentToCentralForm,
  ReturnEquipmentToCentralForm,
  ScanEquipmentQRCodeForm,
  EquipmentStockList,
  AllocateEquipmentToLabByScanForm
} from './index';

const EquipmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">Equipment Management Dashboard</h1>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded ${activeTab === 'stock' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Stock</button>
        <button onClick={() => setActiveTab('add')} className={`px-4 py-2 rounded ${activeTab === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Add Equipment</button>
        <button onClick={() => setActiveTab('return')} className={`px-4 py-2 rounded ${activeTab === 'return' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Return Equipment</button>
        <button onClick={() => setActiveTab('scan')} className={`px-4 py-2 rounded ${activeTab === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Scan QR/History</button>
        <button onClick={() => setActiveTab('allocate')} className={`px-4 py-2 rounded ${activeTab === 'allocate' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Allocate Equipment</button>
      </div>
      <div className="mt-4">
        {activeTab === 'stock' && <EquipmentStockList />}
        {activeTab === 'add' && <AddEquipmentToCentralForm />}
        {activeTab === 'return' && <ReturnEquipmentToCentralForm />}
        {activeTab === 'scan' && <ScanEquipmentQRCodeForm />}
        {activeTab === 'allocate' && <AllocateEquipmentToLabByScanForm />}
      </div>
    </div>
  );
};

export default EquipmentDashboard;
