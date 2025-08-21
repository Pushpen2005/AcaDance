// Enhanced with Advanced Supabase Integration
"use client"

import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import QRAttendanceSystem from './QRAttendanceSystem'
import TimetableManagement from './timetable-management'
import { 
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
  Clock
} from 'lucide-react'

// Import our components

interface UserProfile {
  id: string
  full_name: string
  role: 'student' | 'faculty' | 'admin'
  department: string
  avatar_url?: string
}

interface DashboardStats {
  totalClasses: number
  attendanceRate: number
  studentsCount: number
  facultyCount: number
  lowAttendanceAlerts: number
}

// Performance and Error Handling Enhanced
export default React.memo(function RoleBasedDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    attendanceRate: 0,
    studentsCount: 0,
    facultyCount: 0,
    lowAttendanceAlerts: 0
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetchUserProfile()
    fetchStats()
    fetchNotifications()
  }, [])

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
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch dashboard statistics based on role
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('*')
      
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
      
      const { data: facultyData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'faculty')

      setStats({
        totalClasses: attendanceData?.length || 0,
        attendanceRate: 85, // Calculate from actual data
        studentsCount: studentsData?.length || 0,
        facultyCount: facultyData?.length || 0,
        lowAttendanceAlerts: 3 // Calculate from attendance analytics
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .or(`recipient_id.eq.${user.id},target_role.eq.${profile?.role},target_role.eq.all`)
          .order('created_at', { ascending: false })
          .limit(5)
        
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Student Dashboard
  const StudentDashboard = () => (
    <div className="space-y-6">
      {/* Student Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Attendance Rate</p>
                  <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Classes Today</p>
                  <p className="text-3xl font-bold text-green-600">4</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Shortage Alerts</p>
                  <p className="text-3xl font-bold text-red-600">2</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Student Features */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <QRAttendanceSystem />
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle>My Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="font-semibold text-green-800">Mathematics</div>
                    <div className="text-sm text-green-600">9:00 AM - 10:00 AM</div>
                    <div className="text-sm text-green-600">Room A101</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="font-semibold text-green-900">Physics Lab</div>
                    <div className="text-sm text-green-600">11:00 AM - 12:00 PM</div>
                    <div className="text-sm text-green-600">Lab B205</div>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <div className="font-semibold text-purple-900">Computer Science</div>
                    <div className="text-sm text-purple-600">2:00 PM - 3:00 PM</div>
                    <div className="text-sm text-purple-600">Room C301</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="font-medium">{notif.title}</div>
                    <div className="text-sm text-green-700">{notif.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={profile?.full_name || ''} 
                    className="w-full p-2 border rounded-lg"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <input 
                    type="text" 
                    value={profile?.department || ''} 
                    className="w-full p-2 border rounded-lg"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <Badge variant="secondary">{profile?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Faculty Dashboard
  const FacultyDashboard = () => (
    <div className="space-y-6">
      {/* Faculty Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">My Classes</p>
                  <p className="text-3xl font-bold text-green-600">6</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Students</p>
                  <p className="text-3xl font-bold text-green-600">{stats.studentsCount}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Avg Attendance</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.attendanceRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Pending Approvals</p>
                  <p className="text-3xl font-bold text-red-600">3</p>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Faculty Features */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <QRAttendanceSystem />
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>My Teaching Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold">Mathematics - Section A</div>
                    <div className="text-sm text-green-700">Monday, Wednesday, Friday</div>
                    <div className="text-sm text-green-700">9:00 AM - 10:00 AM</div>
                    <div className="text-sm text-green-700">Room A101</div>
                    <Button size="sm" className="mt-2">
                      <QrCode className="w-4 h-4 mr-1" />
                      Start Attendance
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-semibold">Physics Lab - Section B</div>
                    <div className="text-sm text-green-700">Tuesday, Thursday</div>
                    <div className="text-sm text-green-700">2:00 PM - 4:00 PM</div>
                    <div className="text-sm text-green-700">Lab B205</div>
                    <Button size="sm" className="mt-2">
                      <QrCode className="w-4 h-4 mr-1" />
                      Start Attendance
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">Class Attendance Report</div>
                      <div className="text-sm text-green-700">Download attendance for all classes</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">Student Performance</div>
                      <div className="text-sm text-green-700">Individual student reports</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-green-700">
                  Manage students in your classes and view their attendance records.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Admin Dashboard
  const AdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Students</p>
                  <p className="text-3xl font-bold text-green-600">{stats.studentsCount}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Faculty</p>
                  <p className="text-3xl font-bold text-green-600">{stats.facultyCount}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Attendance Rate</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.attendanceRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Low Attendance Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{stats.lowAttendanceAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Admin Features */}
      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <TimetableManagement />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Faculty
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </div>
                <div className="text-sm text-green-700">
                  Manage all users, roles, and permissions from this section.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">Institution Report</div>
                      <div className="text-sm text-green-700">Overall attendance & analytics</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">Faculty Workload</div>
                      <div className="text-sm text-green-700">Teaching load distribution</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="p-4 h-auto">
                    <div className="text-left">
                      <div className="font-medium">Defaulters List</div>
                      <div className="text-sm text-green-700">Students below 75%</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Send To</label>
                  <select className="w-full p-2 border rounded-lg">
                    <option>All Users</option>
                    <option>All Students</option>
                    <option>All Faculty</option>
                    <option>Specific Department</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    className="w-full p-2 border rounded-lg h-24"
                    placeholder="Enter your message..."
                  />
                </div>
                <Button>Send Notification</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-green-700">
                  Configure system-wide settings, attendance policies, and integrations.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile?.role === 'admin' ? 'Admin' : profile?.role === 'faculty' ? 'Faculty' : 'Student'} Dashboard
              </h1>
              <p className="text-green-700">Welcome back, {profile?.full_name || 'User'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={profile?.role === 'admin' ? 'destructive' : profile?.role === 'faculty' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {profile?.role?.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Role-based Dashboard Content */}
        {profile?.role === 'student' && <StudentDashboard />}
        {profile?.role === 'faculty' && <FacultyDashboard />}
        {profile?.role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  )
}
)
