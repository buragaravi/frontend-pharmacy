import { useState, useEffect } from 'react';
import { colorSupport, colorPalette, gradients } from '../utils/colorUtils';

export const useResponsiveColors = () => {
  const [colorMode, setColorMode] = useState('standard');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isOldBrowser: false,
    supportsGradients: true,
    supportsBackdropFilter: true
  });

  useEffect(() => {
    // Detect device capabilities on mount
    const detectColorSupport = () => {
      const isIOS = colorSupport.isIOS();
      const isOldBrowser = colorSupport.isOldBrowser();
      const supportsGradients = colorSupport.supportsGradients();
      const supportsBackdropFilter = colorSupport.supportsBackdropFilter();
      const isHighContrastMode = typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-contrast: high)').matches 
        : false;

      setIsHighContrast(isHighContrastMode);
      setDeviceInfo({
        isIOS,
        isOldBrowser,
        supportsGradients,
        supportsBackdropFilter
      });
      
      // Determine color mode
      if (isOldBrowser || !supportsGradients) {
        setColorMode('fallback');
      } else if (isIOS && colorSupport.supportsP3()) {
        setColorMode('p3');
      } else {
        setColorMode('standard');
      }
    };

    detectColorSupport();

    // Listen for color scheme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      const handleChange = () => detectColorSupport();
      
      if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      } else if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, []);

  // Get optimized color based on device capabilities
  const getColor = (colorFamily, shade, format = 'css') => {
    const color = colorPalette[colorFamily]?.[shade];
    if (!color) return '#000000';

    switch (colorMode) {
      case 'p3':
        return color.p3 || color.hex;
      case 'fallback':
        return color.hex;
      default:
        return isHighContrast ? (color.highContrast || color.hex) : color[format] || color.hex;
    }
  };

  // Get optimized gradient
  const getGradient = (gradientName) => {
    const gradient = gradients[gradientName];
    if (!gradient) return gradients.primary.fallback;
    
    return deviceInfo.supportsGradients ? gradient.modern : gradient.fallback;
  };

  // Get safe background style (with fallback)
  const getSafeBackground = (gradientName, fallbackColor = null) => {
    if (!deviceInfo.supportsGradients) {
      return { backgroundColor: fallbackColor || gradients[gradientName]?.fallback || '#ffffff' };
    }
    
    return {
      background: gradients[gradientName]?.modern || '#ffffff',
      backgroundColor: fallbackColor || gradients[gradientName]?.fallback || '#ffffff'
    };
  };

  // Get safe backdrop filter style
  const getSafeBackdrop = (blurAmount = '10px', backgroundColor = 'rgba(255, 255, 255, 0.9)') => {
    if (!deviceInfo.supportsBackdropFilter) {
      return { backgroundColor: 'rgba(255, 255, 255, 0.95)' };
    }
    
    return {
      backdropFilter: `blur(${blurAmount})`,
      WebkitBackdropFilter: `blur(${blurAmount})`,
      backgroundColor
    };
  };

  // Generate safe CSS classes
  const getSafeClasses = (baseClasses, fallbackClasses = '') => {
    if (colorMode === 'fallback') {
      return `${baseClasses} ${fallbackClasses}`.trim();
    }
    return baseClasses;
  };

  return {
    colorMode,
    isHighContrast,
    deviceInfo,
    getColor,
    getGradient,
    getSafeBackground,
    getSafeBackdrop,
    getSafeClasses
  };
};
