'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useAuth } from './auth-context';

interface QRScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          scanQRCode();
        };
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      setIsScanning(false);
      onScanError?.('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // Retry in 100ms
      setTimeout(scanQRCode, 100);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to decode QR code using a simple approach
      // In a real app, you'd use a library like jsQR
      const qrData = detectQRCode(imageData);
      
      if (qrData) {
        handleQRDetected(qrData);
      } else {
        // Continue scanning
        if (isScanning) {
          requestAnimationFrame(scanQRCode);
        }
      }
    } catch (err) {
      console.error('QR scanning error:', err);
      // Continue scanning
      if (isScanning) {
        requestAnimationFrame(scanQRCode);
      }
    }
  };

  // Simple QR detection - in production, use jsQR library
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - in a real app, use jsQR or similar
    // For demo purposes, we'll simulate QR detection
    
    // Check if there's sufficient contrast in the image (basic QR detection)
    const data = imageData.data;
    let blackPixels = 0;
    let whitePixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 100) blackPixels++;
      else if (brightness > 200) whitePixels++;
    }
    
    // If we have good contrast, simulate QR detection
    if (blackPixels > 1000 && whitePixels > 1000) {
      // For demo, return a fake QR payload
      // In production, this would be the actual decoded QR data
      return JSON.stringify({
        sessionId: 'demo-session-id',
        facultyId: 'demo-faculty-id',
        timestamp: Date.now(),
        expiry: Date.now() + 600000,
        secret: 'demo-secret'
      });
    }
    
    return null;
  };

  const handleQRDetected = async (qrData: string) => {
    try {
      stopCamera();
      
      const qrPayload = JSON.parse(qrData);
      
      // Validate QR code
      if (!qrPayload.sessionId || !qrPayload.timestamp || !qrPayload.expiry) {
        throw new Error('Invalid QR code format');
      }

      // Check if QR code is expired
      if (Date.now() > qrPayload.expiry) {
        throw new Error('QR code has expired');
      }

      // Mark attendance
      await markAttendance(qrPayload.sessionId);
      
    } catch (err: any) {
      setError(err.message || 'Failed to process QR code');
      onScanError?.(err.message);
    }
  };

  const markAttendance = async (sessionId: string) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    try {
      // Check if already marked
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', user.id)
        .single();

      if (existingRecord) {
        throw new Error('Attendance already marked for this session');
      }

      // Get device fingerprint for security
      const deviceId = await getDeviceFingerprint();

      // Mark attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_id: user.id,
          status: 'present',
          scan_method: 'qr_scan',
          device_id: deviceId,
          ip_address: await getUserIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess('Attendance marked successfully!');
      onScanSuccess?.('Attendance marked');

      // Auto close after success
      setTimeout(() => {
        onClose?.();
      }, 2000);

    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark attendance');
    }
  };

  const getDeviceFingerprint = async (): Promise<string> => {
    // Simple device fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    }));

    return fingerprint;
  };

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleManualEntry = () => {
    // For demo purposes - in production, this would show a manual entry form
    const sessionId = prompt('Enter Session ID for manual attendance:');
    if (sessionId) {
      markAttendance(sessionId).catch(err => {
        setError(err.message);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {success}
            </motion.div>
          )}

          {!isScanning && !success && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Scan className="w-12 h-12 text-blue-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Scan
                </p>
                <p className="text-sm text-gray-600">
                  Point your camera at the QR code displayed by your instructor
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
                
                <button
                  onClick={handleManualEntry}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Manual Entry (Demo)
                </button>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
                </div>

                {/* Scanning line animation */}
                <motion.div
                  animate={{ y: [0, 256, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-blue-500 opacity-75"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Position the QR code within the frame
                </p>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel Scanning
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Manual QR Input Component (for testing/demo)
export function ManualQRInput({ onSubmit, onClose }: {
  onSubmit: (sessionId: string) => void;
  onClose: () => void;
}) {
  const [sessionId, setSessionId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      onSubmit(sessionId.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl max-w-md w-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Manual Entry</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter session ID"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
