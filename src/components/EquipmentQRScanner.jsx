import React, { useState, useRef, useEffect, useCallback } from 'react';

const EquipmentQRScanner = ({ onScan, onClose, isOpen }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize camera and start scanning
  const startScanning = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setScanning(true);

        // Start QR code detection
        intervalRef.current = setInterval(() => {
          captureAndDecode();
        }, 500);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Capture frame and decode QR
  const captureAndDecode = () => {
    if (!videoRef.current || !cameraActive) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Simple QR code detection using canvas ImageData
    // In a real implementation, you'd use a proper QR library like @zxing/browser
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // For demo purposes, simulate QR detection
    // Replace this with actual QR library implementation
    simulateQRDetection(canvas.toDataURL());
  };

  // Simulate QR detection (replace with real implementation)
  const simulateQRDetection = (imageData) => {
    // This is a placeholder - integrate with actual QR library
    // For now, we'll just demonstrate the interface
  };

  // Manual input for equipment ID
  const [manualId, setManualId] = useState('');

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      onScan(manualId.trim());
      setManualId('');
      onClose();
    }
  };

  // Cleanup camera
  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setCameraActive(false);
    setScanning(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 1000000 }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Equipment QR Scanner</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Camera View */}
        <div className="mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 bg-gray-100 rounded-lg object-cover"
          />
          {scanning && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Manual Input Alternative */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or enter Equipment ID manually:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Enter equipment ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleManualSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={startScanning}
            disabled={scanning}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentQRScanner;
