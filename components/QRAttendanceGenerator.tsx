'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';
import { 
  QrCode, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  MapPin,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AttendanceSessionData {
  id: string;
  class_id: string;
  expires_at: string;
  token: string;
  qr_payload: string;
  location_required?: boolean;
  required_latitude?: number;
  required_longitude?: number;
  location_radius?: number;
}

interface QRAttendanceGeneratorProps {
  classId: string;
  className: string;
  onClose?: () => void;
}

export function QRAttendanceGenerator({ 
  classId, 
  className, 
  onClose 
}: QRAttendanceGeneratorProps) {
  const [session, setSession] = useState<AttendanceSessionData | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [presentStudents, setPresentStudents] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  // Get current location
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

  // Create attendance session
  const createSession = async (durationMinutes: number = 5) => {
    setLoading(true);
    setError('');

    try {
      let sessionData: any = {
        class_id: classId,
        duration_minutes: durationMinutes
      };

      // Add location if enabled
      if (locationEnabled && currentLocation) {
        sessionData = {
          ...sessionData,
          location_required: true,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          radius_meters: 50
        };
      }

      const { data, error: functionError } = await supabase.functions.invoke(
        'create-attendance-session',
        { body: sessionData }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create session');
      }

      setSession(data.session);
      setTimeLeft(durationMinutes * 60);
      
      // Start realtime subscription
      setupRealtimeSubscription(data.session.id);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Session creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription for attendance updates
  const setupRealtimeSubscription = (sessionId: string) => {
    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New attendance:', payload);
          loadAttendanceData(sessionId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Load attendance data
  const loadAttendanceData = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          timestamp,
          profiles!inner (
            name,
            student_id
          )
        `)
        .eq('session_id', sessionId)
        .eq('status', 'present');

      if (error) throw error;

      setPresentStudents(data || []);
      setAttendanceCount(data?.length || 0);
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Session expired
          setSession(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time remaining
  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle location toggle
  const handleLocationToggle = async () => {
    if (!locationEnabled) {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        setLocationEnabled(true);
      } catch (err: any) {
        setError(`Location access required: ${err.message}`);
      }
    } else {
      setLocationEnabled(false);
      setCurrentLocation(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Attendance</h2>
          <p className="text-gray-600">{className}</p>
        </div>
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
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Controls */}
      {!session && (
        <Card>
          <CardHeader>
            <CardTitle>Create Attendance Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <h4 className="font-medium">Location Verification</h4>
                  <p className="text-sm text-gray-600">
                    Require students to be physically present in classroom
                  </p>
                </div>
              </div>
              <Button
                variant={locationEnabled ? "default" : "outline"}
                onClick={handleLocationToggle}
                disabled={loading}
              >
                {locationEnabled ? "Enabled" : "Enable"}
              </Button>
            </div>

            {/* Current Location Display */}
            {locationEnabled && currentLocation && (
              <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                <strong>Current Location:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                <br />
                <em>Students must be within 50 meters to mark attendance</em>
              </div>
            )}

            {/* Duration Options */}
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((minutes) => (
                <Button
                  key={minutes}
                  onClick={() => createSession(minutes)}
                  disabled={loading || !isOnline}
                  className="h-16 flex flex-col"
                >
                  <Clock className="w-5 h-5 mb-1" />
                  {minutes} min
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Session */}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scan to Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* QR Code */}
              <div className="bg-white p-6 rounded-lg shadow-inner mx-auto inline-block">
                <QRCodeSVG
                  value={session.qr_payload}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* Session Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                  <Clock className="w-5 h-5" />
                  {formatTimeLeft(timeLeft)}
                </div>
                <p className="text-sm text-gray-600">
                  Session expires in {formatTimeLeft(timeLeft)}
                </p>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={() => createSession(5)}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Present Students ({attendanceCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {presentStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No students have marked attendance yet
                  </p>
                ) : (
                  presentStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">{student.profiles.name}</div>
                        <div className="text-sm text-gray-600">
                          {student.profiles.student_id} • {new Date(student.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
