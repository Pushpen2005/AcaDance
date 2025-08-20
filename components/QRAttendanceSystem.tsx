"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabaseClient"
import { QrCode, Camera, MapPin, Clock, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AttendanceSession {
  id: string
  class_id: string
  faculty_id: string
  session_id: string
  qr_code: string
  start_time: string
  end_time?: string
  expiry_time: string
  is_active: boolean
  location_lat?: number
  location_lng?: number
  geofence_radius: number
}

interface AttendanceRecord {
  id: number
  student_id: string
  status: 'present' | 'absent' | 'late'
  scan_timestamp: string
  device_fingerprint: string
  gps_lat?: number
  gps_lng?: number
}

interface Student {
  id: string
  full_name: string
  department: string
}

export default function QRAttendanceSystem() {
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin'>('student')
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Get device fingerprint for security
  const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('fingerprint', 10, 10)
    const fingerprint = canvas.toDataURL() + navigator.userAgent + screen.width + screen.height
    return btoa(fingerprint).slice(0, 32)
  }

  // Get user location
  const getUserLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Check if user is within geofence
  const isWithinGeofence = (userLat: number, userLng: number, sessionLat: number, sessionLng: number, radius: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (userLat * Math.PI) / 180
    const φ2 = (sessionLat * Math.PI) / 180
    const Δφ = ((sessionLat - userLat) * Math.PI) / 180
    const Δλ = ((sessionLng - userLng) * Math.PI) / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    return distance <= radius
  }

  // Fetch user profile and role
  useEffect(() => {
    async function fetchUserProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserProfile()
  }, [])

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (currentSession) {
      const channel = supabase
        .channel('attendance-updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'attendance_records',
            filter: `session_id=eq.${currentSession.id}`
          }, 
          (payload) => {
            setAttendanceRecords(prev => [...prev, payload.new as AttendanceRecord])
            setLiveCount(prev => prev + 1)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [currentSession])

  // Faculty: Generate QR Code for Attendance Session
  const generateQRSession = async () => {
    if (userRole !== 'faculty' && userRole !== 'admin') return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get faculty location
      const location = await getUserLocation()
      setUserLocation(location)

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      
      const sessionData = {
        class_id: 'MATH101', // This should come from selected class
        faculty_id: user.id,
        session_id: sessionId,
        qr_code: btoa(sessionId), // Simple encoding, use proper QR library in production
        expiry_time: expiryTime.toISOString(),
        location_lat: location.lat,
        location_lng: location.lng,
        geofence_radius: 50,
        is_active: true
      }

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([sessionData])
        .select()
        .single()

      if (error) throw error

      setCurrentSession(data)
      setSuccess('QR Session created successfully!')
      
      // Auto-expire session after 5 minutes
      setTimeout(() => {
        endSession()
      }, 5 * 60 * 1000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Faculty: End attendance session
  const endSession = async () => {
    if (!currentSession) return

    await supabase
      .from('attendance_sessions')
      .update({ 
        is_active: false, 
        end_time: new Date().toISOString() 
      })
      .eq('id', currentSession.id)

    setCurrentSession(null)
    setAttendanceRecords([])
    setLiveCount(0)
  }

  // Student: Start camera for QR scanning
  const startQRScanner = async () => {
    if (userRole !== 'student') return

    setIsScanning(true)
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err: any) {
      setError('Camera access denied: ' + err.message)
      setIsScanning(false)
    }
  }

  // Student: Stop camera
  const stopQRScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setIsScanning(false)
  }

  // Student: Process QR scan and mark attendance
  const processQRScan = async (scannedData: string) => {
    if (userRole !== 'student') return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please log in to mark attendance')

      // Decode QR data (should contain session_id)
      const sessionId = atob(scannedData)

      // Fetch session details
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single()

      if (!session) {
        throw new Error('Invalid or expired QR code')
      }

      // Check if session is still valid
      if (new Date() > new Date(session.expiry_time)) {
        throw new Error('QR code has expired')
      }

      // Get student location
      const studentLocation = await getUserLocation()

      // Check geofence if location is set
      if (session.location_lat && session.location_lng) {
        const withinGeofence = isWithinGeofence(
          studentLocation.lat,
          studentLocation.lng,
          session.location_lat,
          session.location_lng,
          session.geofence_radius
        )

        if (!withinGeofence) {
          throw new Error('You must be in the classroom to mark attendance')
        }
      }

      // Check for duplicate attendance
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .single()

      if (existingRecord) {
        throw new Error('You have already marked attendance for this session')
      }

      // Mark attendance
      const attendanceData = {
        session_id: session.id,
        student_id: user.id,
        status: 'present',
        device_fingerprint: getDeviceFingerprint(),
        gps_lat: studentLocation.lat,
        gps_lng: studentLocation.lng,
        ip_address: '' // Will be set by server
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert([attendanceData])

      if (error) throw error

      setSuccess('Attendance marked successfully! ✅')
      stopQRScanner()

      // Log the action
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: 'attendance_scan',
          details: { session_id: session.id, class_id: session.class_id }
        }])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Mock QR scanning (for demo - replace with actual QR scanner library)
  const simulateQRScan = () => {
    if (currentSession) {
      processQRScan(currentSession.qr_code)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Attendance System
            <Badge variant={userRole === 'admin' ? 'destructive' : userRole === 'faculty' ? 'default' : 'secondary'}>
              {userRole.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className="mb-4" variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className="mb-4" variant="default">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Faculty/Admin: Generate QR */}
          {(userRole === 'faculty' || userRole === 'admin') && (
            <div className="space-y-4">
              {!currentSession ? (
                <div className="text-center">
                  <Button 
                    onClick={generateQRSession} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {loading ? 'Creating Session...' : 'Start Attendance Session'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-4xl font-mono">
                        📱 {/* Replace with actual QR code */}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-green-700">Students scan this QR code</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          Expires: {currentSession.expiry_time ? new Date(currentSession.expiry_time).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                      {userLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">Location Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Counter */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{liveCount}</div>
                        <div className="text-sm text-green-700">Students Present</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={endSession} variant="outline" className="flex-1">
                      End Session
                    </Button>
                    <Button onClick={() => setAttendanceRecords([])} variant="outline">
                      Clear Records
                    </Button>
                  </div>

                  {/* Live Attendance List */}
                  {attendanceRecords.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Live Attendance ({attendanceRecords.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {attendanceRecords.map((record, idx) => (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex justify-between items-center p-2 bg-green-50 rounded"
                            >
                              <span className="font-medium">Student {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{record.status}</Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(record.scan_timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student: QR Scanner */}
          {userRole === 'student' && (
            <div className="space-y-4">
              {!isScanning ? (
                <div className="text-center">
                  <Button 
                    onClick={startQRScanner}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR for Attendance
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg object-cover"
                      autoPlay
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={stopQRScanner} variant="outline" className="flex-1">
                      Stop Scanner
                    </Button>
                    <Button onClick={simulateQRScan} className="flex-1 bg-green-600 hover:bg-green-700">
                      Demo Scan
                    </Button>
                  </div>

                  <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
