import React from 'react';
import { getExperimentDateStatus, formatDate, getRelativeTime } from '../../utils/dateValidation';
import { Clock, Calendar, Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const ExperimentDateBadge = ({ 
  date, 
  isAdmin = false, 
  className = '', 
  showIcon = true, 
  showRelativeTime = true,
  size = 'md',
  adminOverride = false 
}) => {
  const status = getExperimentDateStatus(date, isAdmin);
  
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
  
  // Icon selection based on status
  const getStatusIcon = () => {
    if (adminOverride) return Shield;
    
    switch (status.urgency) {
      case 'low': return CheckCircle;
      case 'medium': return Clock;
      case 'high': return AlertTriangle;
      case 'admin': return Shield;
      case 'admin_required': return Lock;
      case 'blocked': return AlertTriangle;
      default: return Calendar;
    }
  };
  
  const StatusIcon = getStatusIcon();
  
  // Override styling if admin override is active
  const finalStatus = adminOverride ? {
    ...status,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    label: 'Admin Override',
    icon: '🛡️'
  } : status;
  
  return (
    <div className={`
      inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-300
      ${finalStatus.bgColor} ${finalStatus.color} ${finalStatus.borderColor} border
      ${sizeConfig.container}
      hover:shadow-md hover:scale-105
      ${className}
    `}>
      {showIcon && (
        <StatusIcon className={`${sizeConfig.icon} ${finalStatus.color}`} />
      )}
      
      <div className="flex flex-col">
        <div className={`font-semibold ${sizeConfig.text}`}>
          {finalStatus.label}
        </div>
        
        {showRelativeTime && (
          <div className={`text-xs opacity-75 ${finalStatus.color}`}>
            {formatDate(date)}
          </div>
        )}
      </div>
      
      {adminOverride && (
        <div className="ml-1 text-violet-500">
          <Shield className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default ExperimentDateBadge;
