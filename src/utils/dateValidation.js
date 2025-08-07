/**
 * Date validation utilities for frontend request allocation system
 */

/**
 * Check if allocation is allowed based on experiment date and user role
 * @param {Date|string} experimentDate - The experiment date
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Object} Validation result with allowed status and reason
 */
export const isAllocationAllowed = (experimentDate, isAdmin = false) => {
  const today = new Date();
  const expDate = new Date(experimentDate);
  const gracePeriod = new Date(expDate);
  gracePeriod.setDate(gracePeriod.getDate() + 2);
  
  // Remove time component for accurate date comparison
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  gracePeriod.setHours(0, 0, 0, 0);
  
  if (today <= expDate) {
    return { 
      allowed: true, 
      reason: null,
      status: 'valid',
      daysRemaining: Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)),
      message: null
    };
  }
  
  if (isAdmin && today <= gracePeriod) {
    const daysOverdue = Math.ceil((today - expDate) / (1000 * 60 * 60 * 24));
    return { 
      allowed: true, 
      reason: 'admin_grace',
      status: 'admin_grace',
      daysOverdue,
      message: `Experiment date expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago - Admin access available`
    };
  }
  
  const daysOverdue = Math.ceil((today - expDate) / (1000 * 60 * 60 * 24));
  return { 
    allowed: false, 
    reason: today > gracePeriod ? 'date_expired_completely' : 'date_expired_admin_only',
    status: today > gracePeriod ? 'expired_completely' : 'expired_admin_only',
    daysOverdue,
    message: today > gracePeriod 
      ? `Experiment date expired ${daysOverdue} days ago - No access allowed`
      : `Experiment date expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago - Admin access only`
  };
};

/**
 * Get a human-readable status message for experiment date
 * @param {Date|string} experimentDate - The experiment date
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Object} Status information with styling
 */
export const getExperimentDateStatus = (experimentDate, isAdmin = false) => {
  const validation = isAllocationAllowed(experimentDate, isAdmin);
  
  switch (validation.status) {
    case 'valid':
      if (validation.daysRemaining === 0) {
        return {
          ...validation,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: '⚠️',
          label: 'Today',
          urgency: 'high'
        };
      } else if (validation.daysRemaining <= 3) {
        return {
          ...validation,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '🕒',
          label: `${validation.daysRemaining} day${validation.daysRemaining > 1 ? 's' : ''} left`,
          urgency: 'medium'
        };
      } else {
        return {
          ...validation,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: '✅',
          label: `${validation.daysRemaining} days left`,
          urgency: 'low'
        };
      }
    
    case 'admin_grace':
      return {
        ...validation,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '🔑',
        label: `Admin Grace (${validation.daysOverdue} day${validation.daysOverdue > 1 ? 's' : ''} overdue)`,
        urgency: 'admin'
      };
    
    case 'expired_admin_only':
      return {
        ...validation,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '🔒',
        label: `Admin Only (${validation.daysOverdue} day${validation.daysOverdue > 1 ? 's' : ''} overdue)`,
        urgency: 'admin_required'
      };
    
    case 'expired_completely':
      return {
        ...validation,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        icon: '❌',
        label: `Expired (${validation.daysOverdue} days overdue)`,
        urgency: 'blocked'
      };
    
    default:
      return {
        ...validation,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '❓',
        label: 'Unknown',
        urgency: 'unknown'
      };
  }
};

/**
 * Format date for display
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time for display
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 days")
 * @param {Date|string} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((targetDate - now) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (Math.abs(diffInDays) >= 1) {
    if (diffInDays > 0) {
      return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) > 1 ? 's' : ''} ago`;
    }
  } else if (Math.abs(diffInHours) >= 1) {
    if (diffInHours > 0) {
      return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else {
      return `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) > 1 ? 's' : ''} ago`;
    }
  } else {
    if (diffInMinutes > 0) {
      return `in ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInMinutes < 0) {
      return `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) > 1 ? 's' : ''} ago`;
    } else {
      return 'now';
    }
  }
};
