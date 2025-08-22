'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Scan, 
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface QRAttendanceScannerProps {
  onClose?: () => void;
  onScanSuccess?: (message: string) => void;
}

export function QRAttendanceScanner({ 
  onClose, 
  onScanSuccess 
}: QRAttendanceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Get user location
  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Start camera and scanning
  const startScanning = async () => {
    try {
      setLoading(true);
      setMessage('Starting camera...');
      setMessageType('info');

      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsScanning(true);
        setMessage('Point your camera at the QR code');
        setMessageType('info');
        
        // Start scanning for QR codes
        startQRScan();
      }
    } catch (error: any) {
      setMessage(`Camera error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Stop scanning and camera
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setIsScanning(false);
  };

  // QR Code scanning using canvas
  const startQRScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 500); // Scan every 500ms
  };

  // Scan current video frame for QR codes
  const scanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use a QR code library to decode (you'd need to install jsqr or similar)
      // For now, we'll use a simple simulation
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Note: In a real implementation, you'd use a library like jsqr:
      // npm install jsqr
      // import jsQR from 'jsqr';
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // For demo purposes, we'll simulate QR detection
      // You should replace this with actual QR code detection
      
    } catch (error) {
      console.error('QR scanning error:', error);
    }
  };

  // Handle QR code detection (this would be called when a QR code is found)
  const handleQRDetected = async (qrData: string) => {
    if (!isScanning) return;

    setIsScanning(false);
    setLoading(true);

    try {
      // Parse QR code data
      const qrPayload = JSON.parse(qrData);
      const { sid, t, exp } = qrPayload;

      // Check if session is expired
      if (exp && Date.now() / 1000 > exp) {
        throw new Error('QR code has expired');
      }

      // Get location if needed
      setLocationLoading(true);
      let currentLocation = null;
      try {
        currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
      } catch (locError) {
        console.warn('Location access denied:', locError);
        // Continue without location - the server will check if it's required
      }
      setLocationLoading(false);

      // Call mark attendance function
      const requestBody: any = { sid, t };
      if (currentLocation) {
        requestBody.latitude = currentLocation.lat;
        requestBody.longitude = currentLocation.lng;
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        'mark-attendance',
        { body: requestBody }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to mark attendance');
      }

      // Success
      setMessage(data.message || 'Attendance marked successfully!');
      setMessageType('success');
      stopScanning();
      
      if (onScanSuccess) {
        onScanSuccess(data.message || 'Attendance marked successfully!');
      }

    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      
      // Allow retry
      setTimeout(() => {
        if (!isScanning) {
          setIsScanning(true);
          startQRScan();
        }
      }, 3000);
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  // Manual QR input for testing
  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data (for testing):');
    if (qrData) {
      handleQRDetected(qrData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scan QR Code for Attendance
            </CardTitle>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Wifi className="w-4 h-4" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="w-4 h-4" />
                  Offline
                </Badge>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg flex items-center gap-2 ${
                  messageType === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : messageType === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
                {messageType === 'error' && <AlertCircle className="w-5 h-5" />}
                {messageType === 'info' && <Scan className="w-5 h-5" />}
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera View */}
          <div className="relative">
            <video
              ref={videoRef}
              className={`w-full rounded-lg bg-gray-900 ${
                isScanning ? 'block' : 'hidden'
              }`}
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white rounded-lg w-64 h-64 opacity-50">
                  <div className="border-4 border-blue-500 rounded-lg w-full h-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Canvas for QR processing (hidden) */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          {/* Location Status */}
          {location && (
            <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}

          {locationLoading && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Getting your location...
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!isScanning ? (
              <Button
                onClick={startScanning}
                disabled={loading || !isOnline}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                {loading ? 'Starting...' : 'Start Scanning'}
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="destructive"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
            )}
            
            {/* Test button for development */}
            <Button
              onClick={handleManualInput}
              variant="outline"
              size="sm"
            >
              Test Input
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Make sure you're in the classroom</p>
            <p>• Hold your device steady and point at the QR code</p>
            <p>• Ensure good lighting for best results</p>
            <p>• You can only mark attendance once per session</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for QR attendance scanner
export function useQRAttendanceScanner() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openScanner = () => setIsOpen(true);
  const closeScanner = () => setIsOpen(false);
  
  return {
    isOpen,
    openScanner,
    closeScanner,
    QRScanner: (props: Omit<QRAttendanceScannerProps, 'onClose'>) => (
      isOpen ? (
        <QRAttendanceScanner
          {...props}
          onClose={closeScanner}
        />
      ) : null
    )
  };
}
