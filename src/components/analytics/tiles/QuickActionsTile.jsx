import React from 'react';
import { PlusIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const QuickActionsTile = ({ actions }) => {
  const defaultActions = [
    {
      label: 'Add New',
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => console.log('Add new clicked')
    },
    {
      label: 'Generate Report',
      icon: <DocumentTextIcon className="h-4 w-4" />,
      onClick: () => console.log('Generate report clicked')
    },
    {
      label: 'Refresh Data',
      icon: <ArrowPathIcon className="h-4 w-4" />,
      onClick: () => console.log('Refresh clicked')
    }
  ];

  const items = actions || defaultActions;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#BCE0FD] p-4">
      <h3 className="text-sm font-medium text-[#0B3861] mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {items.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-center px-3 py-2 text-sm text-left text-[#0B3861] hover:bg-[#F5F9FD] rounded-md transition-colors border border-transparent hover:border-[#BCE0FD]"
          >
            <span className="mr-2 text-[#64B5F6]">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsTile;