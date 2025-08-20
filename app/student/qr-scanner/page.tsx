"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Clock,
  ArrowLeft,
  Scan
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Animation refs
  const cardRef = useAdvanced3D({ tiltIntensity: 8 });
  const titleRef = useScrollAnimation('fadeInUp');

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setResult({
        success: false,
        message: 'Camera access denied. Please allow camera permissions.'
      });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleManualEntry = () => {
    const qrData = prompt('Enter QR Code data manually:');
    if (qrData) {
      setScannedData(qrData);
      processQRCode(qrData);
    }
  };

  const processQRCode = async (qrData: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      // Parse QR code data (expecting format: session_id:class_id:expiry_timestamp)
      const parts = qrData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid QR code format');
      }

      const [sessionId, classId, expiryTimestamp] = parts;
      const now = Date.now();
      const expiry = parseInt(expiryTimestamp);

      // Check if QR code is expired
      if (now > expiry) {
        throw new Error('QR code has expired');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Verify session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or inactive attendance session');
      }

      // Check location if geofencing is enabled
      if (session.location_lat && session.location_lng && location) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          session.location_lat,
          session.location_lng
        );

        if (distance > session.geofence_radius) {
          throw new Error('You are not within the required location range');
        }
      }

      // Check for duplicate attendance
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .single();

      if (existingRecord) {
        throw new Error('Attendance already marked for this session');
      }

      // Record attendance
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: user.id,
          status: 'present',
          device_fingerprint: navigator.userAgent,
          gps_lat: location?.lat,
          gps_lng: location?.lng,
          ip_address: await getClientIP()
        });

      if (attendanceError) {
        throw new Error('Failed to record attendance');
      }

      // Update student's overall attendance
      const { data: currentAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (currentAttendance) {
        await supabase
          .from('attendance')
          .update({
            total_classes: currentAttendance.total_classes + 1,
            present_classes: currentAttendance.present_classes + 1
          })
          .eq('user_id', user.id);
      }

      setResult({
        success: true,
        message: `Attendance marked successfully for ${classId}`
      });

      // Send success notification
      await supabase
        .from('notifications')
        .insert({
          recipient_id: user.id,
          type: 'attendance_success',
          title: 'Attendance Marked',
          message: `Your attendance has been successfully recorded for ${classId}`,
          is_read: false
        });

    } catch (error: any) {
      console.error('QR processing error:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to process QR code'
      });
    } finally {
      setLoading(false);
      stopScanning();
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div ref={titleRef as React.RefObject<HTMLDivElement>} className="mb-8 pt-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            QR Code Scanner
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Scan QR code to mark your attendance
          </p>
        </div>

        {/* Scanner Card */}
        <Card ref={cardRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-6 h-6" />
              Attendance Scanner
            </CardTitle>
            <CardDescription>
              Position the QR code within the camera frame
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Location Status */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>
                Location: {location ? (
                  <Badge variant="outline" className="ml-1">Detected</Badge>
                ) : (
                  <Badge variant="destructive" className="ml-1">Not Available</Badge>
                )}
              </span>
            </div>

            {/* Camera View */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {scanning ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/70 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">
                      <Scan className="w-3 h-3 mr-1" />
                      Scanning...
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Camera Ready</p>
                    <p className="text-sm opacity-70">Tap start to begin scanning</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              {!scanning ? (
                <Button
                  onClick={startScanning}
                  className="flex-1 liquid-button"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanning
                </Button>
              ) : (
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Stop Scanning
                </Button>
              )}
              
              <Button
                onClick={handleManualEntry}
                variant="outline"
                size="lg"
                className="magnetic-button"
              >
                Manual Entry
              </Button>
            </div>

            {/* Manual Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Or enter QR code manually:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedData}
                  onChange={(e) => setScannedData(e.target.value)}
                  placeholder="Paste QR code data here..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                />
                <Button
                  onClick={() => processQRCode(scannedData)}
                  disabled={!scannedData || loading}
                  className="magnetic-button"
                >
                  {loading ? 'Processing...' : 'Submit'}
                </Button>
              </div>
            </div>

            {/* Result */}
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <AlertDescription>{result.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How to scan:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Make sure you're in the classroom or designated area</li>
                <li>• Point your camera at the QR code displayed by your faculty</li>
                <li>• Keep the code within the scanning frame</li>
                <li>• Wait for automatic detection and processing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
