// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { 
import QrScanner from 'qr-scanner';
import { scanAttendanceQR, getStudentAttendanceHistory, getStudentAttendanceStats } from '@/lib/attendanceAPI';
import { getDeviceInfo } from '@/lib/deviceFingerprinting';
import { supabase } from '@/lib/supabaseClient';
"use client";

  Camera, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  BookOpen,
  TrendingUp,
  Download,
  Bell,
  History,
  User,
  Calendar,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scan_method: string;
  session: {
    session_date: string;
    start_time: string;
    timetable: {
      room: string;
      building: string;
      course: {
        course_code: string;
        course_name: string;
      };
    };
  };
}

interface AttendanceStats {
  course: {
    course_code: string;
    course_name: string;
  };
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
}

const StudentAttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStudentData();
    loadDeviceInfo();
    subscribeToNotifications();
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const [historyData, statsData] = await Promise.all([
        getStudentAttendanceHistory(user.user.id),
        getStudentAttendanceStats(user.user.id)
      ]);

      setAttendanceHistory(historyData as any);
      setAttendanceStats(statsData as any);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  };

  const subscribeToNotifications = async () => {
    // Subscribe to real-time notifications
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const subscription = supabase
      .channel('student-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${user.user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const startQRScanner = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);

      if (!videoRef.current) return;

      // Check camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Initialize QR Scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleQRScan(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setScanResult({
        success: false,
        message: 'Failed to access camera. Please check permissions.'
      });
      setIsScanning(false);
    }
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleQRScan = async (qrData: string) => {
    try {
      stopQRScanner();
      setLoading(true);

      const result = await scanAttendanceQR(qrData);
      setScanResult(result);

      if (result.success) {
        // Reload attendance data
        await loadStudentData();
        
        // Show success notification
        setTimeout(() => setScanResult(null), 5000);
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Failed to process QR code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'bg-green-100 text-green-800 border-green-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      excused: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return variants[status as keyof typeof variants] || variants.absent;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Attendance</h1>
          <p className="text-muted-foreground">Scan QR codes and track your attendance</p>
        </div>
        {deviceInfo && (
          <Badge variant="outline" className="gap-2">
            <Smartphone className="h-4 w-4" />
            {deviceInfo.browser} on {deviceInfo.os}
          </Badge>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            {notifications[0].message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* QR Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Attendance QR Scanner
              </CardTitle>
              <CardDescription>
                Scan the QR code displayed by your instructor to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scanner Interface */}
              <div className="relative">
                {!isScanning ? (
                  <div className="flex flex-col items-center space-y-4 p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Camera className="h-16 w-16 text-gray-400" />
                    <div className="text-center">
                      <h3 className="font-semibold">Ready to Scan</h3>
                      <p className="text-sm text-muted-foreground">
                        Click the button below to start scanning
                      </p>
                    </div>
                    <Button onClick={startQRScanner} className="gap-2">
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full max-w-md mx-auto rounded-lg border"
                      style={{ aspectRatio: '1/1' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse" />
                    </div>
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={stopQRScanner}>
                        Stop Scanner
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Result */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert className={scanResult.success ? 'border-green-500' : 'border-red-500'}>
                      {scanResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>{scanResult.message}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-blue-100 mb-2">
                  How to use:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ensure you're in the correct classroom</li>
                  <li>• Point your camera at the QR code on the projector/board</li>
                  <li>• Wait for the automatic scan to complete</li>
                  <li>• Your attendance will be marked automatically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Attendance History
              </CardTitle>
              <CardDescription>
                Your recent attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found
                  </div>
                ) : (
                  attendanceHistory.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {record.session.timetable.course.course_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {record.session.timetable.course.course_code} • {record.session.timetable.room}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.session.session_date)} at {formatTime(record.session.start_time)}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendanceStats.map((stat) => (
              <Card key={stat.course.course_code}>
                <CardHeader>
                  <CardTitle className="text-lg">{stat.course.course_name}</CardTitle>
                  <CardDescription>{stat.course.course_code}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getAttendanceColor(stat.attendance_percentage)}`}>
                      {stat.attendance_percentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                  
                  <Progress value={stat.attendance_percentage} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Present: {stat.attended_sessions}</span>
                    <span>Total: {stat.total_sessions}</span>
                  </div>
                  
                  {stat.attendance_percentage < 75 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Below minimum attendance requirement (75%)
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Device Information
              </CardTitle>
              <CardDescription>
                Security information for attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Device Fingerprint</label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {deviceInfo.fingerprint.substring(0, 16)}...
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Browser</label>
                    <p className="text-sm text-muted-foreground">{deviceInfo.browser}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Operating System</label>
                    <p className="text-sm text-muted-foreground">{deviceInfo.os}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Screen Resolution</label>
                    <p className="text-sm text-muted-foreground">{deviceInfo.screenResolution}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <p className="text-sm text-muted-foreground">{deviceInfo.timezone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <p className="text-sm text-muted-foreground">{deviceInfo.language}</p>
                  </div>
                </div>
              )}
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your device is registered for attendance security. 
                  Attendance marked from other devices will be flagged for review.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Performance and Error Handling Enhanced
export default React.memo(StudentAttendanceDashboard;
)
