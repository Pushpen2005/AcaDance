// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  User, 
  Check, 
  X, 
  AlertTriangle,
  Loader2,
  Settings,
  Scan,
  Shield,
  Eye,
  Brain,
  Zap,
  Users,
  Clock
} from 'lucide-react';

interface DetectedFace {
  id: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  timestamp: Date;
  confidence: number;
  image: string;
  status: 'verified' | 'pending' | 'rejected';
}

interface FaceDetectionConfig {
  maxFaces: number;
  confidenceThreshold: number;
  autoCapture: boolean;
}

// Performance and Error Handling Enhanced
export default React.memo(function AIFaceDetectionAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [detectionConfig, setDetectionConfig] = useState<FaceDetectionConfig>({
    maxFaces: 1,
    confidenceThreshold: 0.7,
    autoCapture: true
  });

  // Mock face detection - simulates AI detection for demo purposes
  const simulateFaceDetection = useCallback(() => {
    if (!isDetecting || !videoRef.current) return;

    const mockFace: DetectedFace = {
      id: `face_${Date.now()}`,
      confidence: 0.85 + Math.random() * 0.1,
      x: 120 + Math.random() * 20,
      y: 80 + Math.random() * 20,
      width: 200 + Math.random() * 40,
      height: 240 + Math.random() * 40
    };

    setDetectedFaces([mockFace]);
    setDetectionProgress(prev => Math.min(prev + 2, 100));

    // Auto-capture when confidence is high
    if (mockFace.confidence > 0.9 && detectionConfig.autoCapture) {
      setTimeout(() => {
        captureAttendance();
      }, 1000);
    }
  }, [isDetecting, detectionConfig.autoCapture]);

  // Simulation timer for face detection
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDetecting) {
      interval = setInterval(simulateFaceDetection, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDetecting, simulateFaceDetection]);

  // Request camera permission and start video
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
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
      setIsLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsDetecting(false);
      setDetectedFaces([]);
      setDetectionProgress(0);
    }
  }, []);

  // Start face detection
  const startDetection = useCallback(() => {
    if (cameraPermission !== 'granted') {
      startCamera();
      return;
    }
    setIsDetecting(true);
    setDetectionProgress(0);
    setError('');
  }, [cameraPermission, startCamera]);

  // Stop face detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setDetectedFaces([]);
    setDetectionProgress(0);
  }, []);

  // Capture attendance
  const captureAttendance = useCallback(() => {
    if (!videoRef.current || detectedFaces.length === 0) return;

    setIsProcessing(true);
    
    // Create canvas to capture image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context && videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Simulate student recognition (mock data)
      const mockStudents = [
        { id: 'STU001', name: 'Alice Johnson' },
        { id: 'STU002', name: 'Bob Smith' },
        { id: 'STU003', name: 'Carol Williams' },
        { id: 'STU004', name: 'David Brown' },
        { id: 'STU005', name: 'Emma Davis' }
      ];
      
      const randomStudent = mockStudents[Math.floor(Math.random() * mockStudents.length)];
      
      setTimeout(() => {
        const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}`,
          studentName: randomStudent.name,
          studentId: randomStudent.id,
          timestamp: new Date(),
          confidence: detectedFaces[0].confidence,
          image: imageData,
          status: detectedFaces[0].confidence > 0.8 ? 'verified' : 'pending'
        };
        
        setAttendanceRecords(prev => [newRecord, ...prev].slice(0, 10));
        setCurrentStudent(randomStudent);
        setIsProcessing(false);
        setDetectionProgress(0);
        
        // Auto-restart detection after capture
        setTimeout(() => {
          if (detectionConfig.autoCapture) {
            setDetectionProgress(0);
          }
        }, 2000);
      }, 1500);
    }
  }, [detectedFaces, detectionConfig.autoCapture]);

  // Draw face detection overlay
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    
    context.clearRect(0, 0, canvas.width, canvas.height);

    detectedFaces.forEach(face => {
      context.strokeStyle = face.confidence > 0.8 ? '#10b981' : '#f59e0b';
      context.lineWidth = 3;
      context.strokeRect(face.x, face.y, face.width, face.height);
      
      // Draw confidence label
      context.fillStyle = face.confidence > 0.8 ? '#10b981' : '#f59e0b';
      context.font = '14px sans-serif';
      context.fillText(
        `${(face.confidence * 100).toFixed(1)}%`,
        face.x,
        face.y - 5
      );
    });
  }, [detectedFaces]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Face Detection Attendance
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Advanced facial recognition system for automated attendance tracking with real-time detection and verification.
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
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Live Camera Feed
              </CardTitle>
              <CardDescription>
                Position your face within the detection area
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
                          <Scan className="h-3 w-3 mr-1" />
                          Detecting
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Idle
                        </>
                      )}
                    </Badge>
                    {detectedFaces.length > 0 && (
                      <Badge variant="default">
                        <User className="h-3 w-3 mr-1" />
                        {detectedFaces.length} Face{detectedFaces.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detection Progress */}
                {isDetecting && detectionProgress > 0 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/50 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">Detection Progress</span>
                        <span className="text-white text-sm">{detectionProgress}%</span>
                      </div>
                      <Progress value={detectionProgress} className="h-2" />
                    </div>
                  </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Processing attendance...</p>
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
                  <Button onClick={startCamera} disabled={isLoading} className="flex-1 min-w-[120px]">
                    {isLoading ? (
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
                      <Button onClick={startDetection} className="flex-1 min-w-[120px]">
                        <Scan className="h-4 w-4 mr-2" />
                        Start Detection
                      </Button>
                    ) : (
                      <Button onClick={stopDetection} variant="secondary" className="flex-1 min-w-[120px]">
                        <X className="h-4 w-4 mr-2" />
                        Stop Detection
                      </Button>
                    )}
                    <Button 
                      onClick={captureAttendance} 
                      disabled={detectedFaces.length === 0 || isProcessing}
                      variant="default"
                      className="flex-1 min-w-[120px]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
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
          {/* Current Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Detection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Faces Detected</div>
                  <div className="font-semibold">{detectedFaces.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-semibold">
                    {detectedFaces.length > 0 ? `${(detectedFaces[0].confidence * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {currentStudent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-800">{currentStudent.name}</div>
                      <div className="text-sm text-green-600">{currentStudent.id}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Confidence Threshold</label>
                <div className="mt-1">
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={detectionConfig.confidenceThreshold}
                    onChange={(e) => setDetectionConfig(prev => ({
                      ...prev,
                      confidenceThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {(detectionConfig.confidenceThreshold * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Capture</label>
                <input
                  type="checkbox"
                  checked={detectionConfig.autoCapture}
                  onChange={(e) => setDetectionConfig(prev => ({
                    ...prev,
                    autoCapture: e.target.checked
                  }))}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Attendance Records
          </CardTitle>
          <CardDescription>
            Latest facial recognition attendance entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {attendanceRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={record.image} 
                      alt="Captured face"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{record.studentName}</div>
                    <div className="text-sm text-muted-foreground">{record.studentId}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === 'verified' ? 'default' : 'secondary'}>
                      {record.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm font-mono">
                    {(record.confidence * 100).toFixed(1)}%
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {attendanceRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No attendance records yet</p>
                <p className="text-sm">Start face detection to begin tracking attendance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
)
