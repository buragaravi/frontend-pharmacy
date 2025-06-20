import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import axios from 'axios';
import Swal from 'sweetalert2';

const GlasswareQRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Start camera and scanning
  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      setError('Camera access denied or not available');
      setIsScanning(false);
    }
  };

  // Stop camera and scanning
  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Scan frame for QR codes
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data !== qrData) {
        handleScan(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleScan = async (data) => {
    if (data && data !== qrData) {
      setQrData(data);
      setLoading(true);
      setError(null);
      stopScanning();
      
      try {
        const response = await axios.post('/api/glassware/scan', { qrCodeData: data });
        setScanResult(response.data);
        Swal.fire({
          icon: 'success',
          title: 'QR Code Scanned',
          text: 'Stock and transaction history loaded.',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Scan failed');
        Swal.fire({
          icon: 'error',
          title: 'Scan Failed',
          text: err.response?.data?.message || 'Could not fetch data from server.',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h2>Scan Glassware QR Code</h2>
      
      <div style={{ marginBottom: 20 }}>
        {!isScanning ? (
          <button
            onClick={startScanning}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Stop Scanning
          </button>
        )}
      </div>

      {isScanning && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxWidth: '300px',
              border: '2px solid #007bff',
              borderRadius: '10px'
            }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      )}
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {scanResult && (
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <h3>Stock Info</h3>
          <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4 }}>
            {JSON.stringify(scanResult.stock, null, 2)}
          </pre>
          <h3>Transaction History</h3>
          <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4 }}>
            {JSON.stringify(scanResult.transactions, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GlasswareQRScanner;
