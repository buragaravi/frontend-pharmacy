/**
 * 🌐 BROWSER COMPATIBILITY UTILITIES
 * Detects browser capabilities and provides fallbacks
 */

// Browser detection utilities
export const BrowserDetection = {
  // Check if browser supports modern CSS features
  supportsBackdropFilter: () => {
    return CSS.supports('backdrop-filter', 'blur(1px)') || 
           CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  },

  supportsCSS3Gradients: () => {
    const div = document.createElement('div');
    div.style.background = 'linear-gradient(to right, #000, #fff)';
    return div.style.background.indexOf('gradient') !== -1;
  },

  supportsOpacityColors: () => {
    const div = document.createElement('div');
    div.style.color = 'rgba(0, 0, 0, 0.5)';
    return div.style.color.indexOf('rgba') !== -1;
  },

  isOldSafari: () => {
    const ua = navigator.userAgent;
    const safari = ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
    if (!safari) return false;
    
    const version = ua.match(/Version\/(\d+)/);
    return version && parseInt(version[1]) < 12;
  },

  isIE: () => {
    return navigator.userAgent.indexOf('MSIE') !== -1 || 
           navigator.userAgent.indexOf('Trident') !== -1;
  },

  isOldChrome: () => {
    const ua = navigator.userAgent;
    const chrome = ua.indexOf('Chrome') !== -1;
    if (!chrome) return false;
    
    const version = ua.match(/Chrome\/(\d+)/);
    return version && parseInt(version[1]) < 60;
  }
};

// Theme compatibility utility
export const CompatibleTheme = {
  // Get compatible class names based on browser capabilities
  getThemeClasses: () => {
    const isModernBrowser = BrowserDetection.supportsBackdropFilter() && 
                           BrowserDetection.supportsCSS3Gradients() && 
                           !BrowserDetection.isOldSafari() && 
                           !BrowserDetection.isIE();

    if (isModernBrowser) {
      return {
        background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
        card: 'bg-white border border-blue-200 shadow-xl backdrop-blur-sm',
        button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        modal: 'bg-black bg-opacity-50 backdrop-blur-sm'
      };
    } else {
      // Fallback for older browsers
      return {
        background: 'bg-blue-50',
        card: 'bg-white border border-blue-200 shadow-lg',
        button: 'bg-blue-500 hover:bg-blue-600',
        modal: 'bg-black bg-opacity-75'
      };
    }
  },

  // Get safe gradient styles
  getSafeGradient: (from, to) => {
    if (BrowserDetection.supportsCSS3Gradients()) {
      return `bg-gradient-to-r from-${from} to-${to}`;
    }
    return `bg-${from}`; // Fallback to solid color
  },

  // Get safe opacity classes
  getSafeOpacity: (opacity) => {
    if (BrowserDetection.supportsOpacityColors()) {
      return `bg-opacity-${opacity}`;
    }
    return opacity > 50 ? 'bg-gray-700' : 'bg-gray-300'; // Fallback
  }
};

// Apply compatibility fixes on page load
export const applyCompatibilityFixes = () => {
  const body = document.body;
  
  // Add browser-specific classes
  if (BrowserDetection.isOldSafari()) {
    body.classList.add('old-safari');
  }
  
  if (BrowserDetection.isIE()) {
    body.classList.add('ie-browser');
  }
  
  if (BrowserDetection.isOldChrome()) {
    body.classList.add('old-chrome');
  }
  
  // Apply fallback styles for unsupported features
  if (!BrowserDetection.supportsBackdropFilter()) {
    // Add fallback styles for backdrop-filter
    const style = document.createElement('style');
    style.textContent = `
      .backdrop-blur-sm { background: rgba(255, 255, 255, 0.95) !important; }
      .backdrop-blur-md { background: rgba(255, 255, 255, 0.98) !important; }
      .backdrop-blur-xl { background: rgba(255, 255, 255, 0.98) !important; }
    `;
    document.head.appendChild(style);
  }
  
  if (!BrowserDetection.supportsCSS3Gradients()) {
    // Replace gradients with solid colors
    const style = document.createElement('style');
    style.textContent = `
      .bg-gradient-to-r { background: var(--color-blue-500) !important; }
      .bg-gradient-to-br { background: var(--color-blue-50) !important; }
    `;
    document.head.appendChild(style);
  }
};

// React Hook for browser compatibility
export const useBrowserCompatibility = () => {
  const [isModernBrowser, setIsModernBrowser] = React.useState(true);
  
  React.useEffect(() => {
    const modern = BrowserDetection.supportsBackdropFilter() && 
                   BrowserDetection.supportsCSS3Gradients() && 
                   !BrowserDetection.isOldSafari() && 
                   !BrowserDetection.isIE();
    
    setIsModernBrowser(modern);
    applyCompatibilityFixes();
  }, []);
  
  return {
    isModernBrowser,
    theme: CompatibleTheme.getThemeClasses(),
    BrowserDetection,
    CompatibleTheme
  };
};

// Export default detection object
export default BrowserDetection;
