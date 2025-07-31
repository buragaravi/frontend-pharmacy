import React from 'react';

const AcademicYearBadge = ({ 
  year, 
  size = 'sm', 
  variant = 'default', 
  showIcon = true,
  className = "" 
}) => {
  // Determine if the year is current, past, or future
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = January)
    
    // Academic year typically starts in June/July (month 5/6)
    // So if current month is before June, we're still in the previous academic year
    const academicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
    const academicEndYear = academicStartYear + 1;
    
    return `${academicStartYear}-${academicEndYear.toString().slice(-2)}`;
  };

  const currentAcademicYear = getCurrentAcademicYear();
  const isCurrent = year === currentAcademicYear;
  const isPast = year < currentAcademicYear;
  const isFuture = year > currentAcademicYear;

  // Size configurations
  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  // Variant configurations
  const getVariantClasses = () => {
    if (variant === 'current' || (variant === 'default' && isCurrent)) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (variant === 'past' || (variant === 'default' && isPast)) {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    } else if (variant === 'future' || (variant === 'default' && isFuture)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (variant === 'primary') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (variant === 'secondary') {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    } else if (variant === 'success') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (variant === 'warning') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (variant === 'danger') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  // Icon selection based on status
  const getIcon = () => {
    if (!showIcon) return null;

    if (isCurrent) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (isPast) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (isFuture) {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  // Status text for accessibility
  const getStatusText = () => {
    if (isCurrent) return 'Current';
    if (isPast) return 'Past';
    if (isFuture) return 'Future';
    return '';
  };

  if (!year) {
    return null;
  }

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border transition-all duration-200
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
      title={`Academic Year ${year}${getStatusText() ? ` (${getStatusText()})` : ''}`}
    >
      {getIcon()}
      <span>AY {year}</span>
      {variant === 'default' && isCurrent && (
        <span className="ml-1 text-xs opacity-75">(Current)</span>
      )}
    </span>
  );
};

// Utility function to format academic year from date
export const formatAcademicYear = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  // Academic year starts in June/July
  const academicStartYear = month < 6 ? year - 1 : year;
  const academicEndYear = academicStartYear + 1;
  
  return `${academicStartYear}-${academicEndYear.toString().slice(-2)}`;
};

// Utility function to get current academic year
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const academicStartYear = currentMonth < 6 ? currentYear - 1 : currentYear;
  const academicEndYear = academicStartYear + 1;
  
  return `${academicStartYear}-${academicEndYear.toString().slice(-2)}`;
};

// Utility function to generate academic year options
export const generateAcademicYears = (yearsBack = 2, yearsForward = 3) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = -yearsBack; i <= yearsForward; i++) {
    const startYear = currentYear + i;
    const endYear = (startYear + 1).toString().slice(-2);
    years.push(`${startYear}-${endYear}`);
  }
  
  return years;
};

// Multi-year badge component for displaying multiple academic years
export const AcademicYearGroup = ({ years = [], maxDisplay = 3, size = 'sm', className = "" }) => {
  const sortedYears = [...years].sort().reverse(); // Most recent first
  const displayYears = sortedYears.slice(0, maxDisplay);
  const remainingCount = sortedYears.length - maxDisplay;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {displayYears.map(year => (
        <AcademicYearBadge key={year} year={year} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className={`
          inline-flex items-center font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-200
          ${sizeClasses[size] || 'text-xs px-2 py-1'}
        `}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

// Size classes for export
const sizeClasses = {
  xs: 'text-xs px-2 py-0.5',
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1',
  lg: 'text-sm px-3 py-1.5'
};

export default AcademicYearBadge;
