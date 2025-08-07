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
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50/90 via-blue-50/80 to-blue-100/90">
      {/* Enhanced Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-blue-800/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Equipment Management</h1>
                <p className="text-blue-100 text-sm lg:text-base">Comprehensive equipment tracking and allocation system</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 bg-white/10 rounded-full"></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full bg-white/40 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <button 
              onClick={() => setActiveTab('stock')} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeTab === 'stock' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/30'
              }`}
            >
              Stock Management
            </button>
            <button 
              onClick={() => setActiveTab('add')} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeTab === 'add' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/30'
              }`}
            >
              Add Equipment
            </button>
            <button 
              onClick={() => setActiveTab('return')} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeTab === 'return' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/30'
              }`}
            >
              Return Equipment
            </button>
            <button 
              onClick={() => setActiveTab('scan')} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeTab === 'scan' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/30'
              }`}
            >
              Scan QR / History
            </button>
            <button 
              onClick={() => setActiveTab('allocate')} 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeTab === 'allocate' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/30'
              }`}
            >
              Allocate Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Tab Content */}
          <div className="relative z-10">
            {activeTab === 'stock' && <EquipmentStockList />}
            {activeTab === 'add' && <AddEquipmentToCentralForm />}
            {activeTab === 'return' && <ReturnEquipmentToCentralForm />}
            {activeTab === 'scan' && <ScanEquipmentQRCodeForm />}
            {activeTab === 'allocate' && <AllocateEquipmentToLabByScanForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDashboard;
