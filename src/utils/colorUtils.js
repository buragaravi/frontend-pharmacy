// Color utility functions for cross-browser compatibility
export const colorSupport = {
  // Check CSS feature support
  supportsGradients: () => {
    if (typeof document === 'undefined') return true; // SSR fallback
    const testEl = document.createElement('div');
    testEl.style.background = 'linear-gradient(to right, #000, #fff)';
    return testEl.style.background.includes('gradient');
  },

  // Check for P3 color space support (newer devices)
  supportsP3: () => {
    if (typeof window !== 'undefined' && window.CSS && window.CSS.supports) {
      return window.CSS.supports('color', 'color(display-p3 1 0 0)');
    }
    return false;
  },

  // Check for backdrop filter support
  supportsBackdropFilter: () => {
    if (typeof window !== 'undefined' && window.CSS && window.CSS.supports) {
      return window.CSS.supports('backdrop-filter', 'blur(10px)') || 
             window.CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
    }
    return false;
  },

  // Detect iOS
  isIOS: () => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Detect old browsers
  isOldBrowser: () => {
    if (typeof window === 'undefined') return false;
    return !window.CSS || !window.CSS.supports;
  }
};

// Comprehensive color palette with multiple format support
export const colorPalette = {
  // Blue palette
  blue: {
    50: { 
      hex: '#eff6ff', 
      rgb: 'rgb(239, 246, 255)', 
      hsl: 'hsl(214, 100%, 97%)',
      css: 'var(--color-blue-50, #eff6ff)'
    },
    100: { 
      hex: '#dbeafe', 
      rgb: 'rgb(219, 234, 254)', 
      hsl: 'hsl(214, 100%, 93%)',
      css: 'var(--color-blue-100, #dbeafe)'
    },
    200: { 
      hex: '#bfdbfe', 
      rgb: 'rgb(191, 219, 254)', 
      hsl: 'hsl(213, 97%, 87%)',
      css: 'var(--color-blue-200, #bfdbfe)'
    },
    600: { 
      hex: '#2563eb', 
      rgb: 'rgb(37, 99, 235)', 
      hsl: 'hsl(217, 91%, 60%)',
      css: 'var(--color-blue-600, #2563eb)'
    },
    700: { 
      hex: '#1d4ed8', 
      rgb: 'rgb(29, 78, 216)', 
      hsl: 'hsl(217, 91%, 48%)',
      css: 'var(--color-blue-700, #1d4ed8)'
    },
    800: { 
      hex: '#1e40af', 
      rgb: 'rgb(30, 64, 175)', 
      hsl: 'hsl(217, 83%, 40%)',
      css: 'var(--color-blue-800, #1e40af)'
    }
  },
  
  // Indigo palette
  indigo: {
    100: { 
      hex: '#e0e7ff', 
      rgb: 'rgb(224, 231, 255)', 
      hsl: 'hsl(226, 100%, 94%)',
      css: 'var(--color-indigo-100, #e0e7ff)'
    },
    600: { 
      hex: '#7c3aed', 
      rgb: 'rgb(124, 58, 237)', 
      hsl: 'hsl(262, 83%, 58%)',
      css: 'var(--color-indigo-600, #7c3aed)'
    },
    700: { 
      hex: '#6d28d9', 
      rgb: 'rgb(109, 40, 217)', 
      hsl: 'hsl(263, 84%, 50%)',
      css: 'var(--color-indigo-700, #6d28d9)'
    }
  },

  // Purple palette
  purple: {
    50: { 
      hex: '#faf5ff', 
      rgb: 'rgb(250, 245, 255)', 
      hsl: 'hsl(270, 100%, 98%)',
      css: 'var(--color-purple-50, #faf5ff)'
    },
    100: { 
      hex: '#f3e8ff', 
      rgb: 'rgb(243, 232, 255)', 
      hsl: 'hsl(270, 100%, 95%)',
      css: 'var(--color-purple-100, #f3e8ff)'
    },
    200: { 
      hex: '#e9d5ff', 
      rgb: 'rgb(233, 213, 255)', 
      hsl: 'hsl(270, 100%, 92%)',
      css: 'var(--color-purple-200, #e9d5ff)'
    },
    500: { 
      hex: '#a855f7', 
      rgb: 'rgb(168, 85, 247)', 
      hsl: 'hsl(271, 91%, 65%)',
      css: 'var(--color-purple-500, #a855f7)'
    },
    600: { 
      hex: '#9333ea', 
      rgb: 'rgb(147, 51, 234)', 
      hsl: 'hsl(271, 81%, 56%)',
      css: 'var(--color-purple-600, #9333ea)'
    },
    800: { 
      hex: '#6b21a8', 
      rgb: 'rgb(107, 33, 168)', 
      hsl: 'hsl(273, 67%, 39%)',
      css: 'var(--color-purple-800, #6b21a8)'
    }
  },

  // Green palette
  green: {
    50: { 
      hex: '#f0fdf4', 
      rgb: 'rgb(240, 253, 244)', 
      hsl: 'hsl(138, 76%, 97%)',
      css: 'var(--color-green-50, #f0fdf4)'
    },
    100: { 
      hex: '#dcfce7', 
      rgb: 'rgb(220, 252, 231)', 
      hsl: 'hsl(138, 76%, 93%)',
      css: 'var(--color-green-100, #dcfce7)'
    },
    200: { 
      hex: '#bbf7d0', 
      rgb: 'rgb(187, 247, 208)', 
      hsl: 'hsl(141, 84%, 85%)',
      css: 'var(--color-green-200, #bbf7d0)'
    },
    600: { 
      hex: '#16a34a', 
      rgb: 'rgb(22, 163, 74)', 
      hsl: 'hsl(142, 76%, 36%)',
      css: 'var(--color-green-600, #16a34a)'
    },
    700: { 
      hex: '#15803d', 
      rgb: 'rgb(21, 128, 61)', 
      hsl: 'hsl(140, 72%, 29%)',
      css: 'var(--color-green-700, #15803d)'
    }
  },

  // Gray palette
  gray: {
    50: { 
      hex: '#f9fafb', 
      rgb: 'rgb(249, 250, 251)', 
      hsl: 'hsl(210, 20%, 98%)',
      css: 'var(--color-gray-50, #f9fafb)'
    },
    100: { 
      hex: '#f3f4f6', 
      rgb: 'rgb(243, 244, 246)', 
      hsl: 'hsl(220, 14%, 96%)',
      css: 'var(--color-gray-100, #f3f4f6)'
    },
    200: { 
      hex: '#e5e7eb', 
      rgb: 'rgb(229, 231, 235)', 
      hsl: 'hsl(220, 13%, 91%)',
      css: 'var(--color-gray-200, #e5e7eb)'
    },
    300: { 
      hex: '#d1d5db', 
      rgb: 'rgb(209, 213, 219)', 
      hsl: 'hsl(212, 13%, 84%)',
      css: 'var(--color-gray-300, #d1d5db)'
    },
    600: { 
      hex: '#4b5563', 
      rgb: 'rgb(75, 85, 99)', 
      hsl: 'hsl(215, 14%, 34%)',
      css: 'var(--color-gray-600, #4b5563)'
    },
    700: { 
      hex: '#374151', 
      rgb: 'rgb(55, 65, 81)', 
      hsl: 'hsl(217, 19%, 27%)',
      css: 'var(--color-gray-700, #374151)'
    },
    800: { 
      hex: '#1f2937', 
      rgb: 'rgb(31, 41, 55)', 
      hsl: 'hsl(215, 28%, 17%)',
      css: 'var(--color-gray-800, #1f2937)'
    }
  },

  // Red palette
  red: {
    50: { 
      hex: '#fef2f2', 
      rgb: 'rgb(254, 242, 242)', 
      hsl: 'hsl(0, 86%, 97%)',
      css: 'var(--color-red-50, #fef2f2)'
    },
    200: { 
      hex: '#fecaca', 
      rgb: 'rgb(254, 202, 202)', 
      hsl: 'hsl(0, 93%, 89%)',
      css: 'var(--color-red-200, #fecaca)'
    },
    600: { 
      hex: '#dc2626', 
      rgb: 'rgb(220, 38, 38)', 
      hsl: 'hsl(0, 84%, 51%)',
      css: 'var(--color-red-600, #dc2626)'
    },
    700: { 
      hex: '#b91c1c', 
      rgb: 'rgb(185, 28, 28)', 
      hsl: 'hsl(0, 74%, 42%)',
      css: 'var(--color-red-700, #b91c1c)'
    }
  },

  // Yellow palette
  yellow: {
    50: { 
      hex: '#fffbeb', 
      rgb: 'rgb(255, 251, 235)', 
      hsl: 'hsl(48, 100%, 96%)',
      css: 'var(--color-yellow-50, #fffbeb)'
    },
    200: { 
      hex: '#fde68a', 
      rgb: 'rgb(253, 230, 138)', 
      hsl: 'hsl(48, 96%, 77%)',
      css: 'var(--color-yellow-200, #fde68a)'
    },
    800: { 
      hex: '#92400e', 
      rgb: 'rgb(146, 64, 14)', 
      hsl: 'hsl(23, 83%, 31%)',
      css: 'var(--color-yellow-800, #92400e)'
    }
  }
};

// Gradient definitions with fallbacks
export const gradients = {
  primary: {
    modern: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    fallback: '#2563eb',
    css: 'var(--gradient-primary, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))'
  },
  secondary: {
    modern: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    fallback: '#7c3aed',
    css: 'var(--gradient-secondary, linear-gradient(135deg, #7c3aed 0%, #a855f7 100%))'
  },
  header: {
    modern: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #7c3aed 100%)',
    fallback: '#1d4ed8',
    css: 'var(--gradient-header, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #7c3aed 100%))'
  },
  background: {
    modern: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
    fallback: '#f9fafb',
    css: 'var(--gradient-background, linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%))'
  }
};

// Get color with automatic fallback
export const getColor = (family, shade, format = 'css') => {
  const color = colorPalette[family]?.[shade];
  if (!color) return '#000000';
  
  // Return appropriate format
  switch (format) {
    case 'hex':
      return color.hex;
    case 'rgb':
      return color.rgb;
    case 'hsl':
      return color.hsl;
    case 'css':
    default:
      return color.css;
  }
};

// Get gradient with automatic fallback
export const getGradient = (gradientName, supportLevel = 'auto') => {
  const gradient = gradients[gradientName];
  if (!gradient) return gradients.primary.fallback;
  
  if (supportLevel === 'auto') {
    supportLevel = colorSupport.supportsGradients() ? 'modern' : 'fallback';
  }
  
  return supportLevel === 'modern' ? gradient.modern : gradient.fallback;
};

// Apply safe styles to element
export const applySafeStyles = (element, styles) => {
  if (!element || typeof element.style === 'undefined') return;
  
  Object.entries(styles).forEach(([property, value]) => {
    try {
      element.style[property] = value;
    } catch (error) {
      console.warn(`Failed to apply style ${property}: ${value}`, error);
    }
  });
};

// Test color support and log results
export const testColorSupport = () => {
  const results = {
    gradients: colorSupport.supportsGradients(),
    p3Colors: colorSupport.supportsP3(),
    backdropFilter: colorSupport.supportsBackdropFilter(),
    isIOS: colorSupport.isIOS(),
    isOldBrowser: colorSupport.isOldBrowser(),
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    timestamp: new Date().toISOString()
  };

  console.log('🎨 Color Support Test Results:', results);
  return results;
};

// React hook for responsive colors
export const useResponsiveColors = () => {
  const supportsGradients = colorSupport.supportsGradients();
  const supportsBackdrop = colorSupport.supportsBackdropFilter();
  
  return {
    primary: supportsGradients ? colorPalette.blue : { main: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
    secondary: supportsGradients ? colorPalette.indigo : { main: '#6366f1', light: '#818cf8', dark: '#4338ca' },
    accent: supportsGradients ? colorPalette.purple : { main: '#8b5cf6', light: '#a78bfa', dark: '#6d28d9' },
    background: {
      main: '#ffffff',
      light: '#f8fafc',
      dark: '#1e293b'
    },
    supportsGradients,
    supportsBackdrop
  };
};

// Safe background function
export const getSafeBackground = (type = 'default', fallbackColor = '#3b82f6') => {
  const supportsGradients = colorSupport.supportsGradients();
  
  if (!supportsGradients) {
    return { backgroundColor: fallbackColor };
  }
  
  switch (type) {
    case 'primary':
      return { backgroundColor: '#3b82f6' };
    case 'secondary':
      return { backgroundColor: '#6366f1' };
    case 'header':
      return { backgroundColor: '#1d4ed8' };
    case 'light':
      return { backgroundColor: '#f8fafc' };
    case 'overlay':
      return { backgroundColor: fallbackColor };
    default:
      return { backgroundColor: fallbackColor };
  }
};

// Safe backdrop function
export const getSafeBackdrop = (blurAmount = '4px', backgroundColor = 'rgba(255, 255, 255, 0.8)') => {
  const supportsBackdrop = colorSupport.supportsBackdropFilter();
  
  if (!supportsBackdrop) {
    return { 
      backgroundColor: backgroundColor.replace(/rgba?\([^)]+\)/, 'rgba(255, 255, 255, 0.9)')
    };
  }
  
  return {
    backgroundColor,
    backdropFilter: `blur(${blurAmount})`,
    WebkitBackdropFilter: `blur(${blurAmount})`
  };
};
