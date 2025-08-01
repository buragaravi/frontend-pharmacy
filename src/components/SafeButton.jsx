import React from 'react';
import { useResponsiveColors, getSafeBackground } from '../utils/colorUtils';

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
  const colors = useResponsiveColors();

  const getVariantStyles = () => {
    let baseClasses = 'font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2';
    
    // Size classes
    switch (size) {
      case 'small':
      case 'sm':
        baseClasses += ' px-3 py-1.5 text-sm';
        break;
      case 'large':
      case 'lg':
        baseClasses += ' px-8 py-4 text-lg';
        break;
      case 'medium':
      case 'md':
      default:
        baseClasses += ' px-6 py-3 text-base';
        break;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        return {
          classes: `${baseClasses} text-white shadow-lg hover:shadow-xl`,
          style: {
            backgroundColor: getSafeBackground('primary', '#2563eb').backgroundColor || '#2563eb'
          }
        };
      
      case 'secondary':
        return {
          classes: `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-md`,
          style: {}
        };

      case 'success':
        return {
          classes: `${baseClasses} bg-green-600 hover:bg-green-700 text-white shadow-lg`,
          style: {}
        };

      case 'danger':
        return {
          classes: `${baseClasses} bg-red-600 hover:bg-red-700 text-white shadow-lg`,
          style: {}
        };

      case 'warning':
        return {
          classes: `${baseClasses} bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg`,
          style: {}
        };

      case 'info':
        return {
          classes: `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white shadow-lg`,
          style: {}
        };

      case 'outline':
        return {
          classes: `${baseClasses} border-2 border-blue-600 text-blue-600 hover:bg-blue-50`,
          style: {}
        };
      
      default:
        return {
          classes: `${baseClasses} text-white shadow-lg hover:shadow-xl`,
          style: {
            backgroundColor: getSafeBackground('primary', '#2563eb').backgroundColor || '#2563eb'
          }
        };
    }
  };

  const { classes, style } = getVariantStyles();

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={`${classes} ${className} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}`}
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
