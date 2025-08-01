import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Shield, Zap } from 'lucide-react';

const AllocationStatusBadge = ({ 
  status, 
  pendingItems = 0, 
  reenabledItems = 0,
  className = '',
  showDetails = true,
  size = 'md'
}) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };
  
  const sizeConfig = sizeClasses[size];
  
  // Status configurations
  const getStatusConfig = () => {
    switch (status?.reasonType) {
      case 'allocatable':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Ready to Allocate',
          description: pendingItems > 0 ? `${pendingItems} items pending` : 'All items ready'
        };
        
      case 'fully_allocated':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Fully Allocated',
          description: 'All items processed'
        };
        
      case 'date_expired_admin_only':
        return {
          icon: Shield,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'Admin Access Only',
          description: 'Date expired - Admin can override'
        };
        
      case 'date_expired_completely':
        return {
          icon: XCircle,
          color: 'text-rose-600',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: 'Date Expired',
          description: 'No allocation allowed'
        };
        
      case 'no_items':
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'No Items',
          description: 'No items to allocate'
        };
        
      default:
        return {
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Pending Review',
          description: 'Status being determined'
        };
    }
  };
  
  const config = getStatusConfig();
  const StatusIcon = config.icon;
  
  return (
    <div className={`
      inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-300
      ${config.bgColor} ${config.color} ${config.borderColor} border
      ${sizeConfig.container}
      hover:shadow-md hover:scale-105
      ${className}
    `}>
      <StatusIcon className={`${sizeConfig.icon} ${config.color}`} />
      
      <div className="flex flex-col">
        <div className={`font-semibold ${sizeConfig.text}`}>
          {config.label}
        </div>
        
        {showDetails && (
          <div className={`text-xs opacity-75 ${config.color}`}>
            {config.description}
            {reenabledItems > 0 && (
              <span className="ml-1 inline-flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                {reenabledItems} re-enabled
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationStatusBadge;
