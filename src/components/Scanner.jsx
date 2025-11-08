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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
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
        if (code.data !== lastScannedRef.current || now - lastScanTimeRef.current > 2000) {
          lastScannedRef.current = code.data;
          lastScanTimeRef.current = now;
          
          if (onScan) {
            onScan(code.data);
          }
          
          stopScanning();
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto'
    },
    errorBox: {
      padding: '20px',
      backgroundColor: 'rgba(244, 67, 54, 0.2)',
      color: '#ff6b6b',
      borderRadius: '6px',
      textAlign: 'center',
      border: '2px solid #f44336',
      fontSize: '14px',
      fontWeight: '600'
    },
    videoContainer: {
      position: 'relative',
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '3px solid #ffa500',
      backgroundColor: '#2d2d2d'
    },
    video: {
      width: '100%',
      display: scanning ? 'block' : 'none'
    },
    loadingBox: {
      padding: '60px 20px',
      textAlign: 'center',
      color: '#888',
      fontSize: '14px',
      fontWeight: '600'
    },
    scanLine: {
      position: 'absolute',
      width: '100%',
      height: '3px',
      background: 'linear-gradient(90deg, transparent, #ffa500, transparent)',
      animation: 'scan 2s linear infinite',
      top: 0
    }
  };

  return (
    <div>
      {error ? (
        <div style={styles.errorBox}>
          {error}
        </div>
      ) : (
        <div style={styles.videoContainer}>
          <video
            ref={videoRef}
            style={styles.video}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          {!scanning && (
            <div style={styles.loadingBox}>
              Initializing camera...
            </div>
          )}
          {scanning && (
            <div style={styles.scanLine}></div>
          )}
        </div>
      )}
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}