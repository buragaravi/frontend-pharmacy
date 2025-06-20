import React, { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
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

  if (!showOfflineMessage && isOnline) return null;

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #ff4757, #ff3838)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(255, 71, 87, 0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ marginRight: '8px' }}>📡</span>
          You're currently offline. Some features may not be available.
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginLeft: '15px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Online notification (temporary) */}
      {isOnline && showOfflineMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #2ed573, #1dd1a1)',
          color: 'white',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(46, 213, 115, 0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ marginRight: '8px' }}>✅</span>
          You're back online!
        </div>
      )}

      <style>{`
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
