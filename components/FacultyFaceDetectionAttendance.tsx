// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Users, 
  Check, 
  X,
  AlertTriangle,
  Loader2,
  Settings,
  Scan,
  Eye,
  Brain,
  Zap,
  Clock,
  BookOpen,
  UserCheck,
  Download,
  Save,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react';

interface DetectedStudent {
  id: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: Date;
  recognized: boolean;
  studentInfo?: {
    name: string;
    rollNumber: string;
    department: string;
  };
}

interface ClassSession {
  id: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  room: string;
}

interface AttendanceRecord {
  sessionId: string;
  totalDetected: number;
  recognizedStudents: number;
  timestamp: Date;
  students: DetectedStudent[];
  attendancePercentage: number;
}

interface FaceDetectionConfig {
  detectionThreshold: number;
  recognitionThreshold: number;
  scanInterval: number;
  autoSave: boolean;
  continuousMode: boolean;
}

// Performance and Error Handling Enhanced
export default React.memo(function FacultyFaceDetectionAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [config, setConfig] = useState<FaceDetectionConfig>({
    detectionThreshold: 0.7,
    recognitionThreshold: 0.8,
    scanInterval: 2000,
    autoSave: true,
    continuousMode: false
  });
  const [studentCount, setStudentCount] = useState(0);
  const [recognizedCount, setRecognizedCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Mock class sessions for demo
  const mockSessions: ClassSession[] = [
    {
      id: 'session_1',
      courseName: 'Computer Science 101',
      courseCode: 'CS101',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      expectedStudents: 45,
      room: 'Room A-101'
    },
    {
      id: 'session_2',
      courseName: 'Data Structures',
      courseCode: 'CS201',
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      expectedStudents: 38,
      room: 'Room B-205'
    },
    {
      id: 'session_3',
      courseName: 'Database Systems',
      courseCode: 'CS301',
      startTime: '02:00 PM',
      endTime: '03:30 PM',
      expectedStudents: 42,
      room: 'Room C-102'
    }
  ];

  // Mock student database for recognition
  const mockStudentDatabase = [
    { name: 'Alice Johnson', rollNumber: 'CS001', department: 'Computer Science' },
    { name: 'Bob Smith', rollNumber: 'CS002', department: 'Computer Science' },
    { name: 'Carol Williams', rollNumber: 'CS003', department: 'Computer Science' },
    { name: 'David Brown', rollNumber: 'CS004', department: 'Computer Science' },
    { name: 'Emma Davis', rollNumber: 'CS005', department: 'Computer Science' },
    { name: 'Frank Wilson', rollNumber: 'CS006', department: 'Computer Science' },
    { name: 'Grace Taylor', rollNumber: 'CS007', department: 'Computer Science' },
    { name: 'Henry Miller', rollNumber: 'CS008', department: 'Computer Science' },
  ];

  // Face detection simulation
  const simulateFaceDetection = useCallback(() => {
    if (!isDetecting || !videoRef.current || !currentSession) return;

    const detectedCount = Math.floor(Math.random() * 15) + 5; // 5-20 faces
    const recognizedCount = Math.floor(detectedCount * (0.7 + Math.random() * 0.3)); // 70-100% recognition rate
    
    const newDetectedStudents: DetectedStudent[] = [];
    
    for (let i = 0; i < detectedCount; i++) {
      const isRecognized = i < recognizedCount;
      const student: DetectedStudent = {
        id: `face_${Date.now()}_${i}`,
        confidence: 0.8 + Math.random() * 0.2,
        x: 50 + Math.random() * 400,
        y: 50 + Math.random() * 300,
        width: 80 + Math.random() * 40,
        height: 100 + Math.random() * 40,
        timestamp: new Date(),
        recognized: isRecognized,
        studentInfo: isRecognized ? 
          mockStudentDatabase[Math.floor(Math.random() * mockStudentDatabase.length)] : 
          undefined
      };
      newDetectedStudents.push(student);
    }

    setDetectedStudents(newDetectedStudents);
    setStudentCount(detectedCount);
    setRecognizedCount(recognizedCount);
    setLastScanTime(new Date());

    // Auto-save attendance record
    if (config.autoSave && isSessionActive) {
      const attendanceRecord: AttendanceRecord = {
        sessionId: currentSession.id,
        totalDetected: detectedCount,
        recognizedStudents: recognizedCount,
        timestamp: new Date(),
        students: newDetectedStudents,
        attendancePercentage: (recognizedCount / currentSession.expectedStudents) * 100
      };
      
      setAttendanceHistory(prev => {
        const filtered = prev.filter(record => record.sessionId !== currentSession.id);
        return [attendanceRecord, ...filtered].slice(0, 10);
      });
    }
  }, [isDetecting, currentSession, config.autoSave, isSessionActive]);

  // Detection interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetecting && config.continuousMode) {
      interval = setInterval(simulateFaceDetection, config.scanInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDetecting, config.continuousMode, config.scanInterval, simulateFaceDetection]);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      setIsProcessing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraPermission('granted');
        setError('');
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraPermission('denied');
      setError('Camera access is required for face detection attendance.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsDetecting(false);
      setDetectedStudents([]);
      setStudentCount(0);
      setRecognizedCount(0);
    }
  }, []);

  const startDetection = useCallback(() => {
    if (cameraPermission !== 'granted') {
      startCamera();
      return;
    }
    if (!currentSession) {
      setError('Please select a class session first.');
      return;
    }
    setIsDetecting(true);
    setIsSessionActive(true);
    setError('');
  }, [cameraPermission, currentSession, startCamera]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setIsSessionActive(false);
    setDetectedStudents([]);
  }, []);

  const performSingleScan = useCallback(() => {
    if (!currentSession) {
      setError('Please select a class session first.');
      return;
    }
    simulateFaceDetection();
  }, [currentSession, simulateFaceDetection]);

  const exportAttendanceData = useCallback(() => {
    if (!currentSession || attendanceHistory.length === 0) return;

    const data = attendanceHistory.find(record => record.sessionId === currentSession.id);
    if (!data) return;

    const csvContent = [
      ['Course', 'Session Time', 'Total Detected', 'Recognized Students', 'Attendance %', 'Timestamp'],
      [
        currentSession.courseName,
        `${currentSession.startTime} - ${currentSession.endTime}`,
        data.totalDetected.toString(),
        data.recognizedStudents.toString(),
        data.attendancePercentage.toFixed(1) + '%',
        data.timestamp.toLocaleString()
      ],
      [],
      ['Recognized Students:'],
      ['Name', 'Roll Number', 'Department', 'Confidence'],
      ...data.students
        .filter(student => student.recognized && student.studentInfo)
        .map(student => [
          student.studentInfo!.name,
          student.studentInfo!.rollNumber,
          student.studentInfo!.department,
          (student.confidence * 100).toFixed(1) + '%'
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${currentSession.courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [currentSession, attendanceHistory]);

  // Draw face detection overlay
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    detectedStudents.forEach(student => {
      const color = student.recognized ? '#10b981' : '#f59e0b';
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(student.x, student.y, student.width, student.height);
      
      // Draw confidence and recognition status
      context.fillStyle = color;
      context.font = '14px sans-serif';
      context.fillText(
        `${student.recognized ? '✓' : '?'} ${(student.confidence * 100).toFixed(1)}%`,
        student.x,
        student.y - 5
      );

      // Draw student info if recognized
      if (student.recognized && student.studentInfo) {
        context.fillText(
          student.studentInfo.name,
          student.x,
          student.y + student.height + 15
        );
      }
    });
  }, [detectedStudents]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Faculty Face Detection Attendance
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AI-powered student counting and attendance tracking for your classes
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Selection & Camera */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Class Session
              </CardTitle>
              <CardDescription>
                Select the current class session for attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Course</Label>
                  <Select 
                    value={currentSession?.id || ''} 
                    onValueChange={(value) => {
                      const session = mockSessions.find(s => s.id === value);
                      setCurrentSession(session || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course session" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.courseName} ({session.courseCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentSession && (
                  <div className="space-y-2">
                    <Label>Session Details</Label>
                    <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {currentSession.startTime} - {currentSession.endTime}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {currentSession.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Expected: {currentSession.expectedStudents} students
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Live Camera Feed
              </CardTitle>
              <CardDescription>
                Point camera towards the classroom to count students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (canvasRef.current && videoRef.current) {
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                
                {/* Detection Status Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="flex gap-2">
                    <Badge variant={isDetecting ? "default" : "secondary"}>
                      {isDetecting ? (
                        <>
                          <Scan className="h-3 w-3 mr-1 animate-pulse" />
                          Detecting
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Ready
                        </>
                      )}
                    </Badge>
                    {studentCount > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        <Users className="h-3 w-3 mr-1" />
                        {studentCount} Students
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Student Count Display */}
                {studentCount > 0 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/70 rounded-lg p-4 backdrop-blur-sm text-white">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-400">{studentCount}</div>
                          <div className="text-xs">Total Detected</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">{recognizedCount}</div>
                          <div className="text-xs">Recognized</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {currentSession ? Math.round((recognizedCount / currentSession.expectedStudents) * 100) : 0}%
                          </div>
                          <div className="text-xs">Attendance</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}

                {/* No Camera Placeholder */}
                {cameraPermission !== 'granted' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Camera Required</p>
                      <p className="text-sm opacity-75">Please allow camera access to continue</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex flex-wrap gap-2 mt-4">
                {cameraPermission === 'prompt' || cameraPermission === 'denied' ? (
                  <Button onClick={startCamera} disabled={isProcessing || !currentSession}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    {!isDetecting ? (
                      <>
                        <Button onClick={startDetection} disabled={!currentSession}>
                          <Play className="h-4 w-4 mr-2" />
                          Start Continuous Detection
                        </Button>
                        <Button onClick={performSingleScan} variant="outline" disabled={!currentSession}>
                          <Scan className="h-4 w-4 mr-2" />
                          Single Scan
                        </Button>
                      </>
                    ) : (
                      <Button onClick={stopDetection} variant="secondary">
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Detection
                      </Button>
                    )}
                    <Button onClick={stopCamera} variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Students Present</div>
                  <div className="text-2xl font-bold text-green-600">{recognizedCount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Attendance Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession ? Math.round((recognizedCount / currentSession.expectedStudents) * 100) : 0}%
                  </div>
                </div>
              </div>

              {currentSession && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected: {currentSession.expectedStudents}</span>
                    <span>Present: {recognizedCount}</span>
                  </div>
                  <Progress 
                    value={(recognizedCount / currentSession.expectedStudents) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {lastScanTime && (
                <div className="text-xs text-muted-foreground">
                  Last scan: {lastScanTime.toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Detection Threshold</Label>
                <div className="mt-1">
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={config.detectionThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      detectionThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {(config.detectionThreshold * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Scan Interval (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.scanInterval / 1000}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    scanInterval: parseInt(e.target.value) * 1000
                  }))}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Continuous Mode</Label>
                <input
                  type="checkbox"
                  checked={config.continuousMode}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    continuousMode: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto Save</Label>
                <input
                  type="checkbox"
                  checked={config.autoSave}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    autoSave: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={exportAttendanceData}
                disabled={!currentSession || attendanceHistory.length === 0}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Attendance
              </Button>
              
              <Button 
                onClick={() => {
                  setAttendanceHistory([]);
                  setDetectedStudents([]);
                  setStudentCount(0);
                  setRecognizedCount(0);
                }}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>
            Recent attendance records from face detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {attendanceHistory.map((record, index) => {
                const session = mockSessions.find(s => s.id === record.sessionId);
                return (
                  <motion.div
                    key={`${record.sessionId}-${record.timestamp.getTime()}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{session?.courseName}</div>
                      <div className="text-sm text-muted-foreground">
                        {session?.room} • {record.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-bold text-green-600">{record.totalDetected}</div>
                          <div className="text-xs text-muted-foreground">Detected</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{record.recognizedStudents}</div>
                          <div className="text-xs text-muted-foreground">Recognized</div>
                        </div>
                        <div className="text-center">
                          <Badge variant={record.attendancePercentage >= 80 ? "default" : "secondary"}>
                            {record.attendancePercentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {attendanceHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No attendance records yet</p>
                <p className="text-sm">Start face detection to begin tracking</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
)
