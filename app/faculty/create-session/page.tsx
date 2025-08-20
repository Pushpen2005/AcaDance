"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Clock, 
  MapPin, 
  Copy, 
  Download, 
  ArrowLeft,
  CheckCircle,
  Settings,
  Users
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';
import QRCodeLib from 'qrcode';

interface QRSession {
  id: string;
  session_id: string;
  class_id: string;
  qr_code: string;
  start_time: string;
  expiry_time: string;
  location_lat?: number;
  location_lng?: number;
  geofence_radius: number;
  is_active: boolean;
}

export default function CreateSessionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrSession, setQrSession] = useState<QRSession | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    classId: '',
    duration: '60',
    geofenceEnabled: false,
    geofenceRadius: '50',
    customLocation: false,
    customLat: '',
    customLng: ''
  });

  // Animation refs
  const cardRef = useAdvanced3D({ tiltIntensity: 5 });
  const titleRef = useScrollAnimation('fadeInUp');
  const qrRef = useScrollAnimation('slideInRight');

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSessionId = () => {
    return `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createSession = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.classId) {
        throw new Error('Class ID is required');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Generate session data
      const sessionId = generateSessionId();
      const now = new Date();
      const expiryTime = new Date(now.getTime() + parseInt(formData.duration) * 60000);
      
      // Create QR code data format: session_id:class_id:expiry_timestamp
      const qrData = `${sessionId}:${formData.classId}:${expiryTime.getTime()}`;

      // Determine location for geofencing
      let sessionLat = null;
      let sessionLng = null;
      
      if (formData.geofenceEnabled) {
        if (formData.customLocation) {
          sessionLat = parseFloat(formData.customLat);
          sessionLng = parseFloat(formData.customLng);
          
          if (isNaN(sessionLat) || isNaN(sessionLng)) {
            throw new Error('Invalid custom location coordinates');
          }
        } else if (location) {
          sessionLat = location.lat;
          sessionLng = location.lng;
        } else {
          throw new Error('Location not available for geofencing');
        }
      }

      // Create session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .insert({
          class_id: formData.classId,
          faculty_id: user.id,
          session_id: sessionId,
          qr_code: qrData,
          start_time: now.toISOString(),
          expiry_time: expiryTime.toISOString(),
          location_lat: sessionLat,
          location_lng: sessionLng,
          geofence_radius: formData.geofenceEnabled ? parseInt(formData.geofenceRadius) : null,
          is_active: true
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Generate QR code image
      const qrCodeDataURL = await QRCodeLib.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrSession(sessionData);
      setQrCodeImage(qrCodeDataURL);
      setSuccess('QR attendance session created successfully!');

    } catch (err: any) {
      console.error('Session creation error:', err);
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const copyQRData = () => {
    if (qrSession) {
      navigator.clipboard.writeText(qrSession.qr_code);
      setSuccess('QR data copied to clipboard');
    }
  };

  const downloadQR = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.download = `qr_${formData.classId}_${Date.now()}.png`;
      link.href = qrCodeImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const endSession = async () => {
    if (!qrSession) return;

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ 
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', qrSession.id);

      if (error) throw error;

      setQrSession(prev => prev ? { ...prev, is_active: false } : null);
      setSuccess('Session ended successfully');
    } catch (err: any) {
      setError('Failed to end session');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
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
            Create QR Session
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Generate QR code for student attendance tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Session Form */}
          <Card ref={cardRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Session Configuration
              </CardTitle>
              <CardDescription>
                Configure your attendance session settings
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {!qrSession ? (
                <div className="space-y-4">
                  {/* Class ID */}
                  <div>
                    <Label htmlFor="classId">Class/Subject ID *</Label>
                    <Input
                      id="classId"
                      value={formData.classId}
                      onChange={(e) => updateFormData('classId', e.target.value)}
                      placeholder="e.g., CS101, MATH201"
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration">Session Duration (minutes)</Label>
                    <Select value={formData.duration} onValueChange={(value) => updateFormData('duration', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Geofencing */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="geofenceEnabled"
                        checked={formData.geofenceEnabled}
                        onChange={(e) => updateFormData('geofenceEnabled', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="geofenceEnabled">Enable Location-based Attendance</Label>
                    </div>
                    
                    {formData.geofenceEnabled && (
                      <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                        <div>
                          <Label htmlFor="geofenceRadius">Detection Radius (meters)</Label>
                          <Select value={formData.geofenceRadius} onValueChange={(value) => updateFormData('geofenceRadius', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25 meters</SelectItem>
                              <SelectItem value="50">50 meters</SelectItem>
                              <SelectItem value="100">100 meters</SelectItem>
                              <SelectItem value="200">200 meters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="customLocation"
                            checked={formData.customLocation}
                            onChange={(e) => updateFormData('customLocation', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="customLocation">Use Custom Location</Label>
                        </div>

                        {formData.customLocation ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="customLat">Latitude</Label>
                              <Input
                                id="customLat"
                                value={formData.customLat}
                                onChange={(e) => updateFormData('customLat', e.target.value)}
                                placeholder="e.g., 40.7128"
                              />
                            </div>
                            <div>
                              <Label htmlFor="customLng">Longitude</Label>
                              <Input
                                id="customLng"
                                value={formData.customLng}
                                onChange={(e) => updateFormData('customLng', e.target.value)}
                                placeholder="e.g., -74.0060"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4" />
                            {location ? (
                              <span>Using current location ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
                            ) : (
                              <span>Getting current location...</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={createSession}
                    disabled={loading || !formData.classId}
                    className="w-full liquid-button"
                    size="lg"
                  >
                    {loading ? 'Creating Session...' : 'Create QR Session'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Session Active
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Class:</span>
                        <Badge variant="outline">{qrSession.class_id}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Session ID:</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {qrSession.session_id}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span>{new Date(qrSession.expiry_time).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={qrSession.is_active ? "bg-green-500" : "bg-red-500"}>
                          {qrSession.is_active ? 'Active' : 'Ended'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={copyQRData}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Data
                    </Button>
                    {qrSession.is_active && (
                      <Button
                        onClick={endSession}
                        variant="destructive"
                        className="flex-1"
                      >
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Display */}
          {qrSession && (
            <Card ref={qrRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-6 h-6" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Students scan this code to mark attendance
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    {qrCodeImage ? (
                      <img
                        src={qrCodeImage}
                        alt="QR Code"
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Loading QR...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">{qrSession.class_id}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Valid until: {new Date(qrSession.expiry_time).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {Math.max(0, Math.ceil((new Date(qrSession.expiry_time).getTime() - Date.now()) / 60000))} minutes remaining
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="magnetic-button"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => router.push('/faculty/live-monitor')}
                    className="liquid-button"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Monitor
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Instructions:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Display this QR code to students</li>
                    <li>• Students use their mobile app to scan</li>
                    <li>• Attendance is automatically recorded</li>
                    <li>• Monitor real-time scans in Live Monitor</li>
                    {qrSession.location_lat && (
                      <li>• Location verification is enabled</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
