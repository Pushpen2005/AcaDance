"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  MapPin,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Calendar,
  BarChart3,
  UserCheck,
  UserX,
  AlertTriangle,
  Play,
  Square
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  generateAttendanceSession, 
  getFacultyAttendanceSessions, 
  getLiveAttendance,
  manuallyMarkAttendance,
  endAttendanceSession 
} from '@/lib/attendanceAPI';
import { generateAttendanceQR } from '@/lib/qrUtils';
import { supabase } from '@/lib/supabaseClient';

interface AttendanceSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_expiry: string;
  session_status: string;
  total_enrolled: number;
  total_present: number;
  attendance_percentage: number;
  geofence_enabled: boolean;
  timetable: {
    room: string;
    building: string;
    course: {
      course_code: string;
      course_name: string;
    };
  };
}

interface LiveAttendance {
  id: string;
  timestamp: string;
  status: string;
  scan_method: string;
  student: {
    name: string;
    student_id: string;
    email: string;
  };
}

const FacultyAttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [liveAttendance, setLiveAttendance] = useState<LiveAttendance[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  
  // QR Generation form
  const [selectedTimetable, setSelectedTimetable] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Timetables data
  const [timetables, setTimetables] = useState<any[]>([]);

  useEffect(() => {
    loadFacultyData();
    
    // Set up real-time subscription for live attendance
    const subscription = supabase
      .channel('live-attendance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records',
      }, () => {
        if (currentSession) {
          loadLiveAttendance(currentSession.id);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentSession]);

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load faculty timetables
      const { data: timetableData } = await supabase
        .from('timetables')
        .select(`
          *,
          course:courses(course_code, course_name)
        `)
        .eq('faculty_id', user.user.id)
        .eq('is_active', true);

      setTimetables(timetableData || []);

      // Load recent sessions
      const sessionsData = await getFacultyAttendanceSessions(user.user.id);
      setSessions(sessionsData);

      // Check for active session
      const activeSession = sessionsData.find(s => s.session_status === 'active');
      if (activeSession) {
        setCurrentSession(activeSession);
        await loadLiveAttendance(activeSession.id);
      }
    } catch (error) {
      console.error('Error loading faculty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveAttendance = async (sessionId: string) => {
    try {
      const attendanceData = await getLiveAttendance(sessionId);
      setLiveAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading live attendance:', error);
    }
  };

  const handleGenerateQR = async () => {
    try {
      if (!selectedTimetable) {
        alert('Please select a class/timetable');
        return;
      }

      setLoading(true);

      // Generate attendance session
      const { sessionId, qrCode } = await generateAttendanceSession(
        selectedTimetable,
        expiryMinutes,
        geofenceEnabled,
        sessionNotes
      );

      // Generate QR code image
      const qrImage = await QRCode.toDataURL(qrCode, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });

      setQrCodeImage(qrImage);

      // Load the created session
      const sessionsData = await getFacultyAttendanceSessions((await supabase.auth.getUser()).data.user!.id);
      const newSession = sessionsData.find(s => s.id === sessionId);
      
      if (newSession) {
        setCurrentSession(newSession);
        await loadLiveAttendance(sessionId);
        setActiveTab('monitor');
      }

      // Reset form
      setSessionNotes('');
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      await endAttendanceSession(currentSession.id);
      
      // Reload data
      await loadFacultyData();
      setCurrentSession(null);
      setQrCodeImage('');
      setActiveTab('generate');
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!currentSession) return;

    try {
      await manuallyMarkAttendance(currentSession.id, studentId, status);
      await loadLiveAttendance(currentSession.id);
    } catch (error) {
      console.error('Error marking manual attendance:', error);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isQRExpired = () => {
    if (!currentSession) return true;
    return new Date() > new Date(currentSession.qr_expiry);
  };

  const getTimeRemaining = () => {
    if (!currentSession) return '';
    const remaining = new Date(currentSession.qr_expiry).getTime() - new Date().getTime();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Attendance</h1>
          <p className="text-muted-foreground">Generate QR codes and monitor live attendance</p>
        </div>
        {currentSession && (
          <Badge variant={currentSession.session_status === 'active' ? 'default' : 'secondary'}>
            {currentSession.session_status === 'active' ? 'Session Active' : 'Session Ended'}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate QR</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Generate QR Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Generate Attendance QR
                </CardTitle>
                <CardDescription>
                  Create a QR code for students to scan and mark attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timetable">Select Class</Label>
                  <select
                    id="timetable"
                    value={selectedTimetable}
                    onChange={(e) => setSelectedTimetable(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Choose a class...</option>
                    {timetables.map((timetable) => (
                      <option key={timetable.id} value={timetable.id}>
                        {timetable.course?.course_name} ({timetable.course?.course_code}) - {timetable.room}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">QR Code Expiry (minutes)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    min="1"
                    max="60"
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="geofence"
                    checked={geofenceEnabled}
                    onCheckedChange={setGeofenceEnabled}
                  />
                  <Label htmlFor="geofence">Enable Location Verification</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Session Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this session..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerateQR} 
                  className="w-full gap-2"
                  disabled={loading || !selectedTimetable}
                >
                  <QrCode className="h-4 w-4" />
                  {loading ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </CardContent>
            </Card>

            {/* QR Code Display */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Display</CardTitle>
                <CardDescription>
                  Show this QR code to students for scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrCodeImage ? (
                  <div className="text-center space-y-4">
                    <img 
                      src={qrCodeImage} 
                      alt="Attendance QR Code" 
                      className="mx-auto border rounded-lg p-4 bg-white"
                    />
                    
                    {currentSession && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {currentSession.timetable.course.course_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {currentSession.timetable.room} • Expires in {getTimeRemaining()}
                        </div>
                        
                        {isQRExpired() && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>QR code has expired</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>QR code will appear here after generation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          {currentSession ? (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {currentSession.timetable.course.course_name}
                      </CardTitle>
                      <CardDescription>
                        {currentSession.timetable.course.course_code} • {currentSession.timetable.room}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleEndSession}
                      className="gap-2"
                      disabled={loading}
                    >
                      <Square className="h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {currentSession.total_present}
                      </div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {currentSession.total_enrolled - currentSession.total_present}
                      </div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {currentSession.total_enrolled}
                      </div>
                      <div className="text-sm text-muted-foreground">Enrolled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentSession.attendance_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress value={currentSession.attendance_percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Live Attendance List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Live Attendance ({liveAttendance.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {liveAttendance.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No attendance records yet
                      </div>
                    ) : (
                      liveAttendance.map((record) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              record.status === 'present' ? 'bg-green-100 text-green-600' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {record.status === 'present' ? <CheckCircle className="h-4 w-4" /> :
                               record.status === 'late' ? <Clock className="h-4 w-4" /> :
                               <XCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-medium">{record.student.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {record.student.student_id} • {formatTime(record.timestamp)}
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'late' ? 'secondary' : 'destructive'
                          }>
                            {record.status}
                          </Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a QR code first to start monitoring attendance
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                Your attendance session history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sessions found
                  </div>
                ) : (
                  sessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {session.timetable.course.course_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {session.timetable.course.course_code} • {session.timetable.room}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.session_date).toLocaleDateString()} at {formatTime(session.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          session.session_status === 'active' ? 'default' :
                          session.session_status === 'completed' ? 'secondary' : 'destructive'
                        }>
                          {session.session_status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {session.total_present}/{session.total_enrolled} ({session.attendance_percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Attendance Reports
              </CardTitle>
              <CardDescription>
                Download and analyze attendance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export All Sessions
                </Button>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacultyAttendanceDashboard;
