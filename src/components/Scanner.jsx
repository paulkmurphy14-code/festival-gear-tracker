import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function Scanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const animationFrameRef = useRef(null);
  const lastScannedRef = useRef('');
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

 const stopScanning = () => {
  // Cancel animation frame
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  // Stop and clear video
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.srcObject = null;
  }

  // Stop all tracks
  if (streamRef.current) {
    const tracks = streamRef.current.getTracks();
    tracks.forEach(track => {
      track.stop();
      console.log('Track stopped:', track.kind);
    });
    streamRef.current = null;
  }

  setScanning(false);
};

  const tick = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        const now = Date.now();
        // Prevent duplicate scans within 2 seconds
        if (code.data !== lastScannedRef.current || now - lastScanTimeRef.current > 2000) {
          lastScannedRef.current = code.data;
          lastScanTimeRef.current = now;
          
          console.log('QR Code detected:', code.data);
          
          if (onScan) {
            onScan(code.data);
          }
          
          // Stop scanning after successful scan
          stopScanning();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      {error ? (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              borderRadius: '10px',
              display: scanning ? 'block' : 'none'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          {!scanning && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#666'
            }}>
              Initializing camera...
            </div>
          )}
        </>
      )}
    </div>
  );
}