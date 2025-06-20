import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RotateCcw, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import jsQR from 'jsqr';

const UniversalQRScanner = () => {
  const [scanMode, setScanMode] = useState('camera');
  const [qrText, setQrText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backendResponse, setBackendResponse] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Real QR detection using jsQR
  const detectQRFromCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      return code ? code.data : null;
    } catch (error) {
      console.error('QR detection error:', error);
      return null;
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setLoading(true);

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          setLoading(false);
          startQRDetection();
        };
      }
    } catch (err) {
      setLoading(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera: ' + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    const detectFrame = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const qrData = detectQRFromCanvas(canvas);

        if (qrData) {
          setQrText(qrData);
          stopCamera();
          sendToBackend(qrData);
          return;
        }
      }

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const qrData = detectQRFromCanvas(canvas);

        setLoading(false);

        if (qrData) {
          setQrText(qrData);
          sendToBackend(qrData);
        } else {
          setError('No QR code found in the uploaded image');
        }
      };
      img.onerror = () => {
        setLoading(false);
        setError('Failed to load the image');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Failed to read the file');
    };
    reader.readAsDataURL(file);
  };

  const getCategoryFromQR = (qrData) => {
    try {
      const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      if (parsed.type) return parsed.type;
      if (parsed.batchId) {
        if (parsed.batchId.startsWith('GLASS-')) return 'glassware';
        if (parsed.batchId.startsWith('EQUIP-')) return 'equipment';
        if (parsed.batchId.startsWith('OTHER-')) return 'other';
      }
    } catch {
      // If not JSON, return as other
    }
    return 'other';
  };

  const sendToBackend = async (qrData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const category = getCategoryFromQR(qrData);
      const endpoints = {
        glassware: 'https://backend-pharmacy-5541.onrender.com/api/glassware/scan',
        equipment: 'https://backend-pharmacy-5541.onrender.com/api/equipment/scan',
        other: 'https://backend-pharmacy-5541.onrender.com/api/other/scan'
      };

      const endpoint = endpoints[category] || endpoints.other;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeData: qrData })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBackendResponse(data);
      setSuccess(`Successfully processed ${category} item!`);

    } catch (err) {
      setError('Failed to send data to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setQrText('');
    setError('');
    setSuccess('');
    setBackendResponse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isScanning && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isScanning]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Universal QR Scanner</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => {
              setScanMode('camera');
              stopCamera();
              resetScanner();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${scanMode === 'camera'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <Camera size={20} />
            Camera Scan
          </button>

          <button
            onClick={() => {
              setScanMode('upload');
              stopCamera();
              resetScanner();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${scanMode === 'upload'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <Upload size={20} />
            Upload Image
          </button>
        </div>
      </div>

      {scanMode === 'camera' && (
        <div className="mb-6">
          {!isScanning ? (
            <div className="text-center">
              <button
                onClick={startCamera}
                disabled={loading}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                <Camera size={20} />
                {loading ? 'Starting Camera...' : 'Start Camera'}
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative mx-auto max-w-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border-2 border-gray-300"
                />
                <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-red-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-red-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-red-500"></div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-sm p-2 rounded text-center">
                  <Scan size={16} className="inline mr-1" />
                  Position QR code within the frame
                </div>
              </div>
              <button
                onClick={stopCamera}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>
      )}

      {scanMode === 'upload' && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Select an image containing a QR code</p>
            <p className="text-sm text-gray-500 mb-4">Supported formats: JPG, PNG, GIF, BMP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Choose Image'}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {loading && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            {scanMode === 'camera' ? 'Scanning for QR codes...' : 'Processing image...'}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {qrText && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Extracted QR Data:</h3>
          <div className="bg-gray-100 p-4 rounded-lg border">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
              {qrText}
            </pre>
          </div>
        </div>
      )}

      {backendResponse && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Backend Response:</h3>

          {backendResponse.stock && (
            <div className="bg-white border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-3">Stock Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(backendResponse.stock).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {backendResponse.transactions && (
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Transaction History</h4>
              {backendResponse.transactions.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {backendResponse.transactions.map((transaction, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      {Object.entries(transaction).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-gray-800">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No transaction history available</p>
              )}
            </div>
          )}
        </div>
      )}

      {(qrText || error || success) && (
        <div className="text-center">
          <button
            onClick={resetScanner}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={20} />
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalQRScanner;