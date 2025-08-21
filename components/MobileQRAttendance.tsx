// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
"use client"

  QrCode, 
  Camera, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Upload,
  RotateCcw,
  Play,
  Square,
  Eye,
  Calendar,
  User,
  Plus
} from 'lucide-react'

interface AttendanceSession {
  id: string
  class_name: string
  faculty_name: string
  session_id: string
  qr_code: string
  start_time: string
  end_time?: string
  expiry_time: string
  is_active: boolean
  location_lat?: number
  location_lng?: number
  geofence_radius: number
  room_number?: string
}

interface AttendanceRecord {
  id: number
  student_id: string
  student_name: string
  status: 'present' | 'absent' | 'late'
  scan_timestamp: string
  device_fingerprint: string
  gps_lat?: number
  gps_lng?: number
  distance_from_class?: number
}

// Performance and Error Handling Enhanced
export default React.memo(function MobileQRAttendance() {
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin'>('student')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('scan')
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  
  // New session creation states
  const [newSession, setNewSession] = useState({
    class_name: '',
    room_number: '',
    duration: 60, // minutes
    geofence_radius: 50 // meters
  })
  
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Generate device fingerprint
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx!.textBaseline = 'top'
      ctx!.font = '14px Arial'
      ctx!.fillText('Device fingerprint', 2, 2)
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|')
      
      return btoa(fingerprint).substring(0, 32)
    }
    
    setDeviceFingerprint(generateFingerprint())
  }, [])

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false)
    const handleOffline = () => setIsOfflineMode(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationPermission('granted')
        },
        () => {
          setLocationPermission('denied')
          toast({
            title: "Location Access Denied",
            description: "Location is required for attendance verification",
            variant: "destructive"
          })
        }
      )
    }
  }, [])

  // Fetch current user and role
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser(profile)
        setUserRole(profile?.role || 'student')
      }
    }
    
    fetchUser()
  }, [])

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera for QR scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      
      setCameraPermission('granted')
      return true
    } catch (error) {
      setCameraPermission('denied')
      toast({
        title: "Camera Access Denied",
        description: "Camera access is required for QR code scanning",
        variant: "destructive"
      })
      return false
    }
  }

  // Start QR code scanning
  const startScanning = async () => {
    if (cameraPermission !== 'granted') {
      const granted = await requestCameraPermission()
      if (!granted) return
    }
    
    setIsScanning(true)
    
    // Simple QR code detection (in production, use a proper QR library)
    const detectQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // This is a placeholder - in production, use a library like jsQR
        // For demo purposes, we'll simulate QR detection after 3 seconds
        setTimeout(() => {
          if (isScanning) {
            const mockQRData = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            setScanResult(mockQRData)
            handleQRScanResult(mockQRData)
          }
        }, 3000)
      }
      
      if (isScanning) {
        requestAnimationFrame(detectQRCode)
      }
    }
    
    detectQRCode()
  }

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Handle QR scan result
  const handleQRScanResult = async (qrData: string) => {
    stopScanning()
    
    try {
      // Fetch session data
      const { data: session, error } = await supabase
        .from('qr_attendance_sessions')
        .select('*')
        .eq('session_id', qrData)
        .eq('is_active', true)
        .single()
      
      if (error || !session) {
        throw new Error('Invalid or expired QR code')
      }
      
      // Check if session is still valid
      const now = new Date()
      const expiry = new Date(session.expiry_time)
      
      if (now > expiry) {
        throw new Error('QR code has expired')
      }
      
      // Verify location if geofencing is enabled
      if (session.location_lat && session.location_lng && location) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          session.location_lat,
          session.location_lng
        )
        
        if (distance > session.geofence_radius) {
          throw new Error(`You must be within ${session.geofence_radius}m of the classroom`)
        }
      }
      
      // Mark attendance
      const { data: attendanceRecord, error: attendanceError } = await supabase
        .from('qr_attendance_records')
        .insert({
          session_id: session.id,
          student_id: currentUser.id,
          status: 'present',
          scan_timestamp: new Date().toISOString(),
          device_fingerprint: deviceFingerprint,
          gps_lat: location?.lat,
          gps_lng: location?.lng,
          distance_from_class: session.location_lat && location 
            ? calculateDistance(location.lat, location.lng, session.location_lat, session.location_lng)
            : null
        })
        .select('*')
        .single()
      
      if (attendanceError) {
        if (attendanceError.code === '23505') { // Unique constraint violation
          throw new Error('Attendance already marked for this session')
        }
        throw attendanceError
      }
      
      toast({
        title: "Attendance Marked Successfully!",
        description: `Present for ${session.class_name}`,
      })
      
      // Log successful attendance
      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        action: 'mark_attendance',
        details: {
          session_id: session.id,
          class_name: session.class_name,
          device_fingerprint: deviceFingerprint,
          location: location
        }
      })
      
      setActiveTab('history')
      
    } catch (error: any) {
      toast({
        title: "Attendance Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lng2-lng1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // Create new QR session (for faculty)
  const createSession = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location access to create a session",
        variant: "destructive"
      })
      return
    }
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiryTime = new Date(Date.now() + newSession.duration * 60 * 1000)
      
      const { data, error } = await supabase
        .from('qr_attendance_sessions')
        .insert({
          class_name: newSession.class_name,
          faculty_id: currentUser.id,
          faculty_name: currentUser.full_name,
          session_id: sessionId,
          qr_code: sessionId, // In production, generate proper QR code image
          start_time: new Date().toISOString(),
          expiry_time: expiryTime.toISOString(),
          is_active: true,
          location_lat: location.lat,
          location_lng: location.lng,
          geofence_radius: newSession.geofence_radius,
          room_number: newSession.room_number
        })
        .select('*')
        .single()
      
      if (error) throw error
      
      setCurrentSession(data)
      
      toast({
        title: "Session Created Successfully!",
        description: `QR code generated for ${newSession.class_name}`,
      })
      
      setActiveTab('manage')
      
    } catch (error: any) {
      toast({
        title: "Session Creation Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // End current session
  const endSession = async () => {
    if (!currentSession) return
    
    try {
      await supabase
        .from('qr_attendance_sessions')
        .update({
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', currentSession.id)
      
      setCurrentSession(null)
      
      toast({
        title: "Session Ended",
        description: "Attendance session has been closed",
      })
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Fetch attendance history
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!currentUser) return
      
      try {
        const { data, error } = await supabase
          .from('qr_attendance_records')
          .select(`
            *,
            qr_attendance_sessions(class_name, faculty_name, start_time, room_number)
          `)
          .eq('student_id', currentUser.id)
          .order('scan_timestamp', { ascending: false })
          .limit(20)
        
        if (!error && data) {
          setAttendanceRecords(data as any)
        }
      } catch (error) {
        console.error('Error fetching attendance history:', error)
      }
    }
    
    if (activeTab === 'history') {
      fetchAttendanceHistory()
    }
  }, [activeTab, currentUser])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading user profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">{currentUser.full_name}</h3>
                <p className="text-sm text-green-700 capitalize">{userRole} • {currentUser.department}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOfflineMode ? (
                  <WifiOff className="w-5 h-5 text-red-500" />
                ) : (
                  <Wifi className="w-5 h-5 text-green-500" />
                )}
                <span className="text-sm">
                  {isOfflineMode ? 'Offline' : 'Online'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span className="text-sm">
                  {locationPermission === 'granted' ? 'Location On' : 'Location Off'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-green-600" />
            <span>QR Attendance System</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan" className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Scan QR</span>
              </TabsTrigger>
              
              {userRole === 'faculty' && (
                <TabsTrigger value="create" className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Session</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>History</span>
              </TabsTrigger>
              
              {userRole === 'faculty' && (
                <TabsTrigger value="manage" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Manage</span>
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* QR Scanning Tab */}
            <TabsContent value="scan" className="space-y-6">
              <div className="text-center space-y-4">
                {!isScanning ? (
                  <div className="space-y-4">
                    <div className="w-32 h-32 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                      <QrCode className="w-16 h-16 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                      <p className="text-green-700 mb-4">
                        Point your camera at the QR code displayed by your instructor
                      </p>
                    </div>
                    
                    <Button
                      onClick={startScanning}
                      disabled={locationPermission !== 'granted'}
                      className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Start Scanning
                    </Button>
                    
                    {locationPermission !== 'granted' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Location access is required for attendance verification
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="relative w-full h-full">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Scanning...</h3>
                      <p className="text-green-700 mb-4">
                        Align the QR code within the frame
                      </p>
                    </div>
                    
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="px-8 py-3"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop Scanning
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Create Session Tab (Faculty only) */}
            {userRole === 'faculty' && (
              <TabsContent value="create" className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="className">Class Name</Label>
                      <Input
                        id="className"
                        placeholder="e.g., Computer Science 101"
                        value={newSession.class_name}
                        onChange={(e) => setNewSession(prev => ({ ...prev, class_name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Input
                        id="roomNumber"
                        placeholder="e.g., Room 203"
                        value={newSession.room_number}
                        onChange={(e) => setNewSession(prev => ({ ...prev, room_number: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select
                        value={newSession.duration.toString()}
                        onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="geofence">Geofence Radius (meters)</Label>
                      <Select
                        value={newSession.geofence_radius.toString()}
                        onValueChange={(value) => setNewSession(prev => ({ ...prev, geofence_radius: parseInt(value) }))}
                      >
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
                  </div>
                  
                  <Button
                    onClick={createSession}
                    disabled={!newSession.class_name || !location}
                    className="w-full bg-green-600 hover:bg-green-700 py-3"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Create QR Session
                  </Button>
                  
                  {!location && (
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Location access is required to create attendance sessions
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            )}
            
            {/* Attendance History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Attendance</h3>
                <Badge variant="outline">{attendanceRecords.length} records</Badge>
              </div>
              
              <div className="space-y-3">
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No attendance records found</p>
                  </div>
                ) : (
                  attendanceRecords.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            record.status === 'present' ? 'bg-green-500' : 
                            record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{(record as any).qr_attendance_sessions?.class_name}</h4>
                            <p className="text-sm text-green-700">
                              {(record as any).qr_attendance_sessions?.faculty_name} • {(record as any).qr_attendance_sessions?.room_number}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant={record.status === 'present' ? 'default' : 'secondary'}
                            className={record.status === 'present' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {record.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.scan_timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            {/* Session Management Tab (Faculty only) */}
            {userRole === 'faculty' && (
              <TabsContent value="manage" className="space-y-4">
                {currentSession ? (
                  <div className="space-y-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-green-800">{currentSession.class_name}</h3>
                            <p className="text-sm text-green-600">
                              Active Session • {currentSession.room_number}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Live
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="text-center space-y-4">
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                        <div className="text-center">
                          <QrCode className="w-24 h-24 mx-auto mb-2" />
                          <p className="text-sm font-mono break-all">{currentSession.session_id}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-green-700">Started</p>
                          <p className="font-medium">{new Date(currentSession.start_time).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-green-700">Expires</p>
                          <p className="font-medium">{new Date(currentSession.expiry_time).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={endSession}
                      variant="destructive"
                      className="w-full"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      End Session
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active session</p>
                    <p className="text-sm">Create a new session to get started</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
)
