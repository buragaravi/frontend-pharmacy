import React, { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setShowOnlineMessage(true);
      
      // Hide online message after 3 seconds
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkConnection = () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setShowOfflineMessage(true);
      }
    };

    const intervalId = setInterval(checkConnection, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  if (!showOfflineMessage && !showOnlineMessage) return null;

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 shadow-lg border-b border-red-400/30 z-[99999] animate-slide-down">
          <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              {/* Offline Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
              <span className="font-medium text-sm">You're currently offline. Some features may not be available.</span>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              title="Retry connection"
            >
              {/* Refresh Icon */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Online notification (temporary) */}
      {isOnline && showOnlineMessage && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 shadow-lg border-b border-green-400/30 z-[99999] animate-slide-down">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            {/* Online Icon */}
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">You're back online!</span>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default OfflineIndicator;