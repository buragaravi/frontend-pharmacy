import React from 'react';
import { useResponsiveColors } from '../hooks/useResponsiveColors';

const SafeButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const { getSafeBackground, getSafeClasses, deviceInfo } = useResponsiveColors();

  const getVariantStyles = () => {
    let baseClasses = 'font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2';
    
    switch (size) {
      case 'small':
        baseClasses += ' px-3 py-1.5 text-sm';
        break;
      case 'large':
        baseClasses += ' px-8 py-4 text-lg';
        break;
      case 'medium':
      default:
        baseClasses += ' px-6 py-3 text-base';
        break;
    }

    switch (variant) {
      case 'primary':
        if (deviceInfo.supportsGradients) {
          return {
            classes: `${baseClasses} text-white shadow-lg hover:shadow-xl`,
            style: getSafeBackground('primary', '#2563eb')
          };
        } else {
          return {
            classes: `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white shadow-lg`,
            style: {}
          };
        }
      
      case 'secondary':
        return {
          classes: `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-md`,
          style: {}
        };
      
      case 'success':
        if (deviceInfo.supportsGradients) {
          return {
            classes: `${baseClasses} text-white shadow-lg hover:shadow-xl`,
            style: {
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              backgroundColor: '#16a34a'
            }
          };
        } else {
          return {
            classes: `${baseClasses} bg-green-600 hover:bg-green-700 text-white shadow-lg`,
            style: {}
          };
        }
      
      case 'danger':
        if (deviceInfo.supportsGradients) {
          return {
            classes: `${baseClasses} text-white shadow-lg hover:shadow-xl`,
            style: {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              backgroundColor: '#dc2626'
            }
          };
        } else {
          return {
            classes: `${baseClasses} bg-red-600 hover:bg-red-700 text-white shadow-lg`,
            style: {}
          };
        }
      
      case 'outline':
        return {
          classes: `${baseClasses} border-2 border-blue-600 text-blue-600 hover:bg-blue-50`,
          style: {}
        };
      
      default:
        return {
          classes: baseClasses,
          style: {}
        };
    }
  };

  const { classes, style } = getVariantStyles();
  const safeClasses = getSafeClasses(classes, className);

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`${safeClasses} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}`}
      style={{
        ...style,
        ...(disabled && { transform: 'none', cursor: 'not-allowed' })
      }}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default SafeButton;
