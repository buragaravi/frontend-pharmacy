import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';

const EquipmentQRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  // Enhanced QR code data extraction function
  const extractIdFromData = useCallback((data) => {
    if (!data || typeof data !== 'string') return '';
    
    const normalizedData = data.trim();
    console.log('Raw QR data:', normalizedData);
    
    // Simple alphanumeric ID pattern (most common for equipment)
    const simpleIdMatch = normalizedData.match(/^[a-zA-Z0-9-_\.]{3,50}$/);
    if (simpleIdMatch) {
      console.log('Found simple ID:', simpleIdMatch[0]);
      return simpleIdMatch[0];
    }
    
    // JSON parsing with multiple field attempts
    if (/^[\{\[].*[\}\]]$/.test(normalizedData)) {
      try {
        const parsed = JSON.parse(normalizedData);
        console.log('Parsed JSON:', parsed);
        
        const idFields = [
          'itemId', 'item_id', 'ItemId', 'ITEM_ID',
          'id', 'Id', 'ID',
          'equipmentId', 'equipment_id', 'EquipmentId', 'EQUIPMENT_ID',
          'assetId', 'asset_id', 'AssetId', 'ASSET_ID',
          'serialNumber', 'serial_number', 'SerialNumber', 'SERIAL_NUMBER',
          'code', 'Code', 'CODE',
          'barcode', 'Barcode', 'BARCODE'
        ];
        
        for (const field of idFields) {
          if (parsed[field] && String(parsed[field]).trim()) {
            const extractedId = String(parsed[field]).trim();
            console.log(`Found ID in field '${field}':`, extractedId);
            return extractedId;
          }
        }
        
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          const firstItem = parsed[0];
          if (typeof firstItem === 'string') {
            return firstItem.trim();
          } else if (typeof firstItem === 'object') {
            for (const field of idFields) {
              if (firstItem[field] && String(firstItem[field]).trim()) {
                const extractedId = String(firstItem[field]).trim();
                console.log(`Found ID in array[0].${field}:`, extractedId);
                return extractedId;
              }
            }
          }
        }
      } catch (e) {
        console.log('JSON parse error:', e);
      }
    }
    
    // URL parameters extraction
    if (normalizedData.includes('?')) {
      try {
        const urlToProcess = normalizedData.startsWith('http') 
          ? normalizedData 
          : `http://dummy.com?${normalizedData.split('?')[1]}`;
        const url = new URL(urlToProcess);
        const params = new URLSearchParams(url.search);
        
        const paramNames = ['itemId', 'id', 'equipmentId', 'assetId', 'code'];
        for (const param of paramNames) {
          if (params.has(param)) {
            const value = params.get(param);
            if (value && value.trim()) {
              console.log(`Found ID in URL param '${param}':`, value.trim());
              return value.trim();
            }
          }
        }
      } catch (e) {
        console.log('URL parse error:', e);
      }
    }
    
    // Key-value pairs (separated by = or :)
    const keyValueMatch = normalizedData.match(/(?:id|itemid|equipmentid|assetid|code)[=:]\s*([a-zA-Z0-9-_\.]+)/i);
    if (keyValueMatch && keyValueMatch[1]) {
      console.log('Found ID in key-value:', keyValueMatch[1]);
      return keyValueMatch[1];
    }
    
    // Fallback - return raw data if it's reasonable length and format
    if (normalizedData.length >= 3 && normalizedData.length <= 100 && 
        /^[a-zA-Z0-9\-_\.\s]+$/.test(normalizedData)) {
      console.log('Using normalized data as ID:', normalizedData);
      return normalizedData;
    }
    
    console.log('No valid ID found');
    return '';
  }, []);

  // Handle successful scan
  const handleScanSuccess = useCallback((data) => {
    if (!data) return;

    console.log('Scan successful, raw data:', data);
    const itemId = extractIdFromData(data);

    if (!itemId || itemId.length < 2) {
      console.log('Invalid ID extracted:', itemId);
      setError(`Invalid QR code. Expected equipment ID but got: "${itemId || 'empty'}"`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (itemId.length > 100) {
      console.log('ID too long:', itemId.length);
      setError('QR code contains too much data. Expected a simple equipment ID.');
      setTimeout(() => setError(''), 3000);
      return;
    }    console.log('Successfully extracted equipment ID:', itemId);
    setScanning(false);

    // Cleanup camera stream
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      
      const stream = videoRef.current?.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped camera track after scan:', track.label);
        });
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.log('Cleanup error:', e);
    }

    if (onScan) onScan(itemId);
    if (onClose) onClose();
  }, [extractIdFromData, onScan, onClose]);
  useEffect(() => {
    let active = true;
    codeReaderRef.current = new BrowserQRCodeReader();    const startScanner = async () => {
      try {
        setError('');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported by this browser');
        }

        // First, request camera permission to get proper device enumeration
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop the temporary stream
          stream.getTracks().forEach(track => track.stop());
        } catch (permissionError) {
          console.error('Camera permission error:', permissionError);
          throw new Error('Camera permission denied. Please allow camera access and refresh the page.');
        }

        // Now enumerate devices (should have proper IDs after permission grant)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available video devices:', videoDevices);
        
        if (videoDevices.length === 0) {
          throw new Error('No camera found on this device');
        }

        // Try to find a back camera first (better for QR scanning)
        let selectedDeviceId = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )?.deviceId;

        // If no back camera, use the first available
        if (!selectedDeviceId) {
          selectedDeviceId = videoDevices[0]?.deviceId;
        }

        // Fallback: if still no device ID, use undefined (default camera)
        if (!selectedDeviceId) {
          selectedDeviceId = undefined;
        }

        if (!active) return;
        
        console.log('Using camera device:', selectedDeviceId || 'default');
        
        await codeReaderRef.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (!active) return;
            
            if (result) {
              handleScanSuccess(result.getText());
            } else if (err && !(err instanceof DOMException) && !err.name?.includes('NotFoundException')) {
              console.error('QR scan error:', err);
              setError('QR scan error: ' + err.message);
            }
          }
        );
      } catch (e) {
        console.error('Camera error:', e);
        setError(e.message || 'Camera access failed. Please check camera permissions.');
        setScanning(false);
      }
    };

    startScanner();    return () => {
      active = false;
      try {
        // Stop the QR code reader
        if (codeReaderRef.current) {
          codeReaderRef.current.reset();
        }
        
        // Stop video stream
        const stream = videoRef.current?.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped camera track:', track.label);
          });
          videoRef.current.srcObject = null;
        }
      } catch (e) {
        console.error('Error stopping camera:', e);
      }
    };
  }, [handleScanSuccess]);
  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 backdrop-blur-lg">
      <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Scan QR Code</h3>
            <p className="text-sm text-gray-600">Align equipment QR code within frame</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
            aria-label="Close scanner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
          {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <span className="text-red-700 text-sm font-medium block">{error}</span>
                {error.includes('permission') && (
                  <div className="mt-2 text-xs text-red-600">
                    <p>• Click the camera icon in your browser's address bar</p>
                    <p>• Select "Allow" for camera access</p>
                    <p>• Refresh the page and try again</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Camera Feed */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border-4 border-blue-200 mb-4">
          <video
            ref={videoRef}
            className="w-full aspect-square object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-blue-500 rounded-2xl relative">
                {/* Animated corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg animate-pulse"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg animate-pulse"></div>
                
                {/* Scanning line */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 animate-pulse shadow-lg shadow-blue-400/50"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Text */}
        {!error && scanning && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-gray-700 font-medium">Scanning for QR code...</span>
            </div>
            <p className="text-xs text-gray-500">Position the QR code within the blue frame</p>
          </div>
        )}

        {!scanning && !error && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">QR Code Detected!</span>
            </div>
            <p className="text-xs text-gray-500">Processing equipment information...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentQRScanner;