// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import { motion } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import TimetableManagement from "./timetable-management"
import QRAttendanceSystem from "./QRAttendanceSystem"
import MobileQRAttendance from "./MobileQRAttendance"
import AdvancedAnalyticsDashboard from "./AdvancedAnalyticsDashboard"
import RealTimeNotificationSystem from "./RealTimeNotificationSystem"
import { 
"use client"

  Calendar, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Bell, 
  QrCode, 
  Camera,
  Download,
  Upload,
  UserPlus,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Send,
  MapPin,
  Shield,
  Activity,
  FileText,
  Plus,
  Search,
  Filter,
  Smartphone,
  Monitor,
  Zap,
  Award,
  Target,
  Wifi
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  role: 'student' | 'faculty' | 'admin'
  department: string
  avatar_url?: string
  email: string
}

interface AttendanceSession {
  id: string
  class_id: string
  faculty_id: string
  session_id: string
  qr_code: string
  expiry_time: string
  location_lat?: number
  location_lng?: number
  geofence_radius: number
  is_active: boolean
  created_at: string
}

interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: 'present' | 'absent'
  marked_at: string
  location_lat?: number
  location_lng?: number
  device_fingerprint?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read_at?: string
  created_at: string
}

// Performance and Error Handling Enhanced
export default React.memo(function InteractiveDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeClasses: 0,
    attendanceRate: 0,
    todaysClasses: 0,
    yourAttendance: 0
  })
  
  // QR Attendance States
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([])
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [qrSessionData, setQrSessionData] = useState({
    class_id: '',
    duration: 5,
    location_required: true
  })
  
  // Student Management States
  const [students, setStudents] = useState([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [studentFormData, setStudentFormData] = useState({
    student_id: '',
    full_name: '',
    email: '',
    department: '',
    semester: '',
    phone: '',
    batch: ''
  })
  
  // Notification States
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'general',
    target_role: 'all'
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchUserProfile()
    fetchStats()
    fetchNotifications()
    if (profile?.role === 'faculty' || profile?.role === 'admin') {
      fetchActiveSessions()
    }
    if (profile?.role === 'admin') {
      fetchStudents()
    }
  }, [profile?.id])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const responses = await Promise.all([
        fetch('/api/profiles?role=student'),
        fetch('/api/profiles?role=faculty'),
        fetch('/api/qr-attendance'),
        fetch('/api/attendance-records')
      ])

      const [studentsRes, facultyRes, sessionsRes, attendanceRes] = responses
      const [studentsData, facultyData, sessionsData, attendanceData] = await Promise.all([
        studentsRes.json(),
        facultyRes.json(),
        sessionsRes.json(),
        attendanceRes.json()
      ])

      setStats({
        totalStudents: studentsData?.length || 0,
        totalFaculty: facultyData?.length || 0,
        activeClasses: sessionsData?.sessions?.length || 0,
        attendanceRate: 85, // Calculate from attendanceData
        todaysClasses: 4, // Calculate from timetable
        yourAttendance: 78 // Calculate for current user
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?recipient_id=${profile?.id}&target_role=${profile?.role}`)
      const data = await response.json()
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch(`/api/qr-attendance?faculty_id=${profile?.id}&include_records=true`)
      const data = await response.json()
      setActiveSessions(data.sessions || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const createQRSession = async () => {
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Error",
          description: "Geolocation not supported",
          variant: "destructive"
        })
        return
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const sessionData = {
          class_id: qrSessionData.class_id,
          faculty_id: profile?.id,
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
          geofence_radius: 50,
          expiry_minutes: qrSessionData.duration
        }

        const response = await fetch('/api/qr-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Success",
            description: "QR attendance session created!",
          })
          setShowQRGenerator(false)
          fetchActiveSessions()
        } else {
          throw new Error(result.error)
        }
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create QR session",
        variant: "destructive"
      })
    }
  }

  const scanQRCode = async (scannedData: string) => {
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Error",
          description: "Location access required for attendance",
          variant: "destructive"
        })
        return
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const attendanceData = {
          session_id: scannedData,
          student_id: profile?.id,
          device_fingerprint: navigator.userAgent,
          gps_lat: position.coords.latitude,
          gps_lng: position.coords.longitude,
          scanned_qr_data: scannedData
        }

        const response = await fetch('/api/qr-attendance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attendanceData)
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Success",
            description: "Attendance marked successfully!",
          })
          setShowQRScanner(false)
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
          })
        }
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive"
      })
    }
  }

  const addStudent = async () => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentFormData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Student added successfully!",
        })
        setShowAddStudent(false)
        setStudentFormData({
          student_id: '',
          full_name: '',
          email: '',
          department: '',
          semester: '',
          phone: '',
          batch: ''
        })
        fetchStudents()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive"
      })
    }
  }

  const sendNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent successfully!",
        })
        setShowNotificationForm(false)
        setNotificationData({
          title: '',
          message: '',
          type: 'general',
          target_role: 'all'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      })
    }
  }

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read_at: new Date().toISOString() })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color, description }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">{title}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
            <Icon className={`w-8 h-8 ${color.replace('text-', 'text-').replace('-600', '-500')}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'} Dashboard
          </h1>
          <p className="text-green-700">Welcome back, {profile?.full_name}!</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchStats()}
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {profile?.department}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile?.role === 'admin' && (
          <>
            <StatCard 
              title="Total Students" 
              value={stats.totalStudents} 
              icon={Users} 
              color="text-green-600"
              description="Active enrollments"
            />
            <StatCard 
              title="Total Faculty" 
              value={stats.totalFaculty} 
              icon={BookOpen} 
              color="text-green-600"
              description="Teaching staff"
            />
            <StatCard 
              title="Active Classes" 
              value={stats.activeClasses} 
              icon={Calendar} 
              color="text-purple-600"
              description="Currently running"
            />
            <StatCard 
              title="Attendance Rate" 
              value={`${stats.attendanceRate}%`} 
              icon={TrendingUp} 
              color="text-orange-600"
              description="Overall average"
            />
          </>
        )}
        
        {profile?.role === 'faculty' && (
          <>
            <StatCard 
              title="Today's Classes" 
              value={stats.todaysClasses} 
              icon={Calendar} 
              color="text-green-600"
              description="Scheduled for today"
            />
            <StatCard 
              title="Active Sessions" 
              value={activeSessions.length} 
              icon={QrCode} 
              color="text-green-600"
              description="QR attendance active"
            />
            <StatCard 
              title="Attendance Rate" 
              value={`${stats.attendanceRate}%`} 
              icon={TrendingUp} 
              color="text-purple-600"
              description="Your classes average"
            />
            <StatCard 
              title="Students" 
              value={stats.totalStudents} 
              icon={Users} 
              color="text-orange-600"
              description="Under your courses"
            />
          </>
        )}
        
        {profile?.role === 'student' && (
          <>
            <StatCard 
              title="Today's Classes" 
              value={stats.todaysClasses} 
              icon={Calendar} 
              color="text-green-600"
              description="Your schedule"
            />
            <StatCard 
              title="Your Attendance" 
              value={`${stats.yourAttendance}%`} 
              icon={TrendingUp} 
              color={stats.yourAttendance >= 75 ? "text-green-600" : "text-red-600"}
              description={stats.yourAttendance >= 75 ? "Good standing" : "Below requirement"}
            />
            <StatCard 
              title="Total Classes" 
              value="42" 
              icon={BookOpen} 
              color="text-purple-600"
              description="This semester"
            />
            <StatCard 
              title="Alerts" 
              value="2" 
              icon={AlertTriangle} 
              color="text-red-600"
              description="Requires attention"
            />
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          {(profile?.role === 'faculty' || profile?.role === 'admin') && (
            <TabsTrigger value="attendance" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>QR Attendance</span>
            </TabsTrigger>
          )}
          {profile?.role === 'student' && (
            <TabsTrigger value="scan" className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>Mobile Scan</span>
            </TabsTrigger>
          )}
          {(profile?.role === 'admin' || profile?.role === 'faculty') && (
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          )}
          {profile?.role === 'admin' && (
            <TabsTrigger value="timetable" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Timetable</span>
            </TabsTrigger>
          )}
          {profile?.role === 'admin' && (
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Students</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Notifications Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read_at ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-green-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Attendance Tab (Faculty/Admin) */}
        {(profile?.role === 'faculty' || profile?.role === 'admin') && (
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">QR Attendance Management</h2>
              <Button onClick={() => setShowQRGenerator(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                Create QR Session
              </Button>
            </div>

            {/* Active Sessions */}
            <div className="grid gap-4">
              {activeSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Class: {session.class_id}</h3>
                        <p className="text-sm text-green-700">
                          Expires: {new Date(session.expiry_time).toLocaleString()}
                        </p>
                        <p className="text-sm text-green-700">
                          Location: {session.location_lat ? 'Required' : 'Not required'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={session.is_active ? "default" : "secondary"}
                        >
                          {session.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Attendees
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* QR Generator Modal */}
            {showQRGenerator && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Create QR Attendance Session</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="class_id">Class ID</Label>
                      <Input
                        id="class_id"
                        value={qrSessionData.class_id}
                        onChange={(e) => setQrSessionData({
                          ...qrSessionData,
                          class_id: e.target.value
                        })}
                        placeholder="Enter class identifier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select
                        value={qrSessionData.duration.toString()}
                        onValueChange={(value) => setQrSessionData({
                          ...qrSessionData,
                          duration: parseInt(value)
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 minutes</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowQRGenerator(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createQRSession}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Create Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}

        {/* Mobile QR Scanner Tab (Student) */}
        {profile?.role === 'student' && (
          <TabsContent value="scan" className="space-y-6">
            <MobileQRAttendance />
          </TabsContent>
        )}

        {/* Advanced Analytics Tab (Faculty/Admin) */}
        {(profile?.role === 'admin' || profile?.role === 'faculty') && (
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard />
          </TabsContent>
        )}

        {/* Timetable Management Tab (Admin) */}
        {profile?.role === 'admin' && (
          <TabsContent value="timetable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timetable Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimetableManagement />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Students Management Tab (Admin) */}
        {profile?.role === 'admin' && (
          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Student Management</h2>
              <Button onClick={() => setShowAddStudent(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>

            {/* Students List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Students</CardTitle>
                  <div className="flex gap-2">
                    <Input placeholder="Search students..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {students.slice(0, 10).map((student: any) => (
                    <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{student.full_name}</h3>
                        <p className="text-sm text-green-700">{student.email}</p>
                        <p className="text-sm text-green-700">
                          {student.department} - Semester {student.semester}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add Student Modal */}
            {showAddStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle>Add New Student</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input
                          id="student_id"
                          value={studentFormData.student_id}
                          onChange={(e) => setStudentFormData({
                            ...studentFormData,
                            student_id: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={studentFormData.full_name}
                          onChange={(e) => setStudentFormData({
                            ...studentFormData,
                            full_name: e.target.value
                          })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({
                          ...studentFormData,
                          email: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={studentFormData.department}
                          onValueChange={(value) => setStudentFormData({
                            ...studentFormData,
                            department: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CSE">Computer Science</SelectItem>
                            <SelectItem value="ECE">Electronics</SelectItem>
                            <SelectItem value="MECH">Mechanical</SelectItem>
                            <SelectItem value="CIVIL">Civil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                          value={studentFormData.semester}
                          onValueChange={(value) => setStudentFormData({
                            ...studentFormData,
                            semester: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8].map(sem => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddStudent(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={addStudent}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <RealTimeNotificationSystem />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Overall Rate:</span>
                    <span className="font-semibold">{stats.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Classes:</span>
                    <span className="font-semibold">150</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Students Present:</span>
                    <span className="font-semibold">128</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Attendance Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-red-800">John Doe</p>
                      <p className="text-sm text-red-600">58% attendance</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-yellow-800">Jane Smith</p>
                      <p className="text-sm text-yellow-600">72% attendance</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
)
