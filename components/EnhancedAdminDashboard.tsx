"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  Shield,
  Settings,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Monitor,
  UserCheck,
  Database,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  UserPlus,
  Eye,
  EyeOff,
  Key,
  RefreshCw
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useIsMobile } from "@/components/ui/use-mobile"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { SupabaseStatusIndicator, RealtimeIndicator } from "@/components/ui/supabase-status"

interface AdminDashboardProps {
  userId?: string;
}

const EnhancedAdminDashboard: React.FC<AdminDashboardProps> = ({ userId = "admin-123" }) => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [timetables, setTimetables] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState<any>({})
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false)
  const [isTimetableEditorOpen, setIsTimetableEditorOpen] = useState(false)
  const [conflictWarnings, setConflictWarnings] = useState<any[]>([])
  const [draggedClass, setDraggedClass] = useState<any>(null)
  const isMobile = useIsMobile()

  // Mock data for demonstration
  const mockUsers = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@university.edu', 
      role: 'student', 
      department: 'Computer Science',
      year: '3rd Year',
      status: 'active',
      lastLogin: '2025-08-22T10:30:00Z',
      attendance: 85
    },
    { 
      id: 2, 
      name: 'Dr. Jane Smith', 
      email: 'jane.smith@university.edu', 
      role: 'faculty', 
      department: 'Mathematics',
      specialization: 'Applied Mathematics',
      status: 'active',
      lastLogin: '2025-08-22T09:15:00Z',
      courses: 3
    },
    { 
      id: 3, 
      name: 'Alice Johnson', 
      email: 'alice@university.edu', 
      role: 'student', 
      department: 'Physics',
      year: '2nd Year',
      status: 'active',
      lastLogin: '2025-08-21T16:45:00Z',
      attendance: 92
    }
  ]

  const mockCourses = [
    {
      id: 1,
      code: 'CS101',
      name: 'Introduction to Computer Science',
      department: 'Computer Science',
      credits: 3,
      faculty: 'Dr. Smith',
      enrolled: 45,
      capacity: 50,
      status: 'active'
    },
    {
      id: 2,
      code: 'MATH201',
      name: 'Calculus II',
      department: 'Mathematics',
      credits: 4,
      faculty: 'Prof. Johnson',
      enrolled: 38,
      capacity: 40,
      status: 'active'
    },
    {
      id: 3,
      code: 'PHY101',
      name: 'Physics I',
      department: 'Physics',
      credits: 3,
      faculty: 'Dr. Brown',
      enrolled: 42,
      capacity: 45,
      status: 'active'
    }
  ]

  const mockTimetable = [
    {
      id: 1,
      courseId: 1,
      courseName: 'CS101',
      faculty: 'Dr. Smith',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      room: 'CS-101',
      type: 'Theory'
    },
    {
      id: 2,
      courseId: 2,
      courseName: 'MATH201',
      faculty: 'Prof. Johnson',
      day: 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      room: 'MATH-201',
      type: 'Theory'
    },
    {
      id: 3,
      courseId: 3,
      courseName: 'PHY101',
      faculty: 'Dr. Brown',
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '10:00',
      room: 'PHY-101',
      type: 'Lab'
    }
  ]

  const mockSystemStats = {
    totalUsers: 1248,
    totalStudents: 1156,
    totalFaculty: 89,
    totalCourses: 156,
    activeSessions: 23,
    systemUptime: '99.8%',
    avgAttendance: 87.5,
    storageUsed: '2.3 GB'
  }

  const mockAttendanceStats = [
    { department: 'Computer Science', attendance: 89, students: 345 },
    { department: 'Mathematics', attendance: 92, students: 298 },
    { department: 'Physics', attendance: 85, students: 267 },
    { department: 'Chemistry', attendance: 88, students: 246 }
  ]

  const mockCourseAttendance = [
    { course: 'CS101', rate: 89 },
    { course: 'MATH201', rate: 92 },
    { course: 'PHY101', rate: 85 },
    { course: 'CHEM101', rate: 88 }
  ]

  const mockFacultyWorkload = [
    { name: 'Dr. Smith', courses: 3, students: 145, workload: 85 },
    { name: 'Prof. Johnson', courses: 4, students: 178, workload: 92 },
    { name: 'Dr. Brown', courses: 2, students: 89, workload: 65 }
  ]

  const mockStudentShortage = [
    { name: 'John Doe', course: 'CS101', attendance: 68 },
    { name: 'Mike Wilson', course: 'MATH201', attendance: 72 },
    { name: 'Sara Davis', course: 'PHY101', attendance: 65 }
  ]

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Real-time subscription setup
  useEffect(() => {
    setUsers(mockUsers)
    setCourses(mockCourses)
    setTimetables(mockTimetable)
    setSystemStats(mockSystemStats)
    setAttendanceData(mockAttendanceStats)
    setLoading(false)

    // Supabase real-time subscriptions
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Users updated:', payload)
          fetchUsers()
        }
      )
      .subscribe()

    const timetableChannel = supabase
      .channel('admin-timetable-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'timetables' },
        (payload) => {
          console.log('Timetable updated:', payload)
          fetchTimetables()
        }
      )
      .subscribe()

    const attendanceChannel = supabase
      .channel('admin-attendance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        (payload) => {
          console.log('Attendance updated:', payload)
          fetchAttendanceData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(timetableChannel)
      supabase.removeChannel(attendanceChannel)
    }
  }, [])

  const fetchUsers = async () => {
    // In real implementation, fetch from Supabase
    setUsers(mockUsers)
  }

  const fetchTimetables = async () => {
    // In real implementation, fetch from Supabase
    setTimetables(mockTimetable)
  }

  const fetchAttendanceData = async () => {
    // In real implementation, fetch from Supabase
    setAttendanceData(mockAttendanceStats)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = async (userData: any) => {
    // In real implementation, add to Supabase
    console.log('Adding user:', userData)
    setIsAddUserOpen(false)
  }

  const handleEditUser = async (userId: string, userData: any) => {
    // In real implementation, update in Supabase
    console.log('Editing user:', userId, userData)
  }

  const handleDeleteUser = async (userId: string) => {
    // In real implementation, delete from Supabase
    console.log('Deleting user:', userId)
  }

  const handleResetPassword = async (userId: string) => {
    // In real implementation, reset password in Supabase
    console.log('Resetting password for user:', userId)
  }

  const handleAddCourse = async (courseData: any) => {
    // In real implementation, add to Supabase
    console.log('Adding course:', courseData)
    setIsAddCourseOpen(false)
  }

  const handleTimetableConflictCheck = (newClass: any) => {
    const conflicts = timetables.filter(existing => 
      existing.day === newClass.day &&
      existing.startTime === newClass.startTime &&
      (existing.room === newClass.room || existing.faculty === newClass.faculty) &&
      existing.id !== newClass.id
    )
    
    if (conflicts.length > 0) {
      setConflictWarnings(conflicts)
      return false
    }
    
    setConflictWarnings([])
    return true
  }

  const handleDragStart = (e: React.DragEvent, classItem: any) => {
    setDraggedClass(classItem)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, day: string, timeSlot: string) => {
    e.preventDefault()
    if (draggedClass) {
      const updatedClass = {
        ...draggedClass,
        day,
        startTime: timeSlot,
        endTime: `${parseInt(timeSlot.split(':')[0]) + 1}:00`
      }
      
      if (handleTimetableConflictCheck(updatedClass)) {
        // Update timetable
        setTimetables(prev => prev.map(item => 
          item.id === draggedClass.id ? updatedClass : item
        ))
      }
      
      setDraggedClass(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const sendNotification = async (notificationData: any) => {
    // In real implementation, send via Supabase
    console.log('Sending notification:', notificationData)
  }

  const exportData = (type: string) => {
    // In real implementation, export data
    console.log('Exporting:', type)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">System Administration & Management</p>
            </div>
            <div className="flex items-center gap-4">
              <SupabaseStatusIndicator className="relative" showDetails={true} />
              <RealtimeIndicator />
              <Badge variant="outline" className="bg-green-100 text-green-800">
                System Online
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Supabase Connected
              </Badge>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Real-time Status Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg shadow-lg mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <Database className="w-5 h-5" />
              </motion.div>
              <div>
                <span className="font-semibold">System Administration Panel</span>
                <p className="text-xs text-purple-100">Real-time monitoring and management via Supabase</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span>Live User Management</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                <span>Database Sync</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-600">{systemStats.totalUsers}</div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {systemStats.totalStudents} students, {systemStats.totalFaculty} faculty
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-600">{systemStats.activeSessions}</div>
                <Monitor className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Real-time attendance tracking</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">{systemStats.avgAttendance}%</div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all departments</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-emerald-600">{systemStats.systemUptime}</div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Uptime this month</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-gray-100">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {!isMobile && "Analytics"}
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {!isMobile && "Users"}
              </TabsTrigger>
              <TabsTrigger value="timetable" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {!isMobile && "Timetable"}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                {!isMobile && "Attendance"}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {!isMobile && "Notifications"}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {!isMobile && "Settings"}
              </TabsTrigger>
            </TabsList>

            {/* Analytics Dashboard */}
            <TabsContent value="dashboard" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Attendance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Department Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendance" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Course Attendance Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Course Attendance Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mockCourseAttendance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="course" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Faculty Workload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Faculty Workload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockFacultyWorkload.map((faculty, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{faculty.name}</p>
                            <p className="text-sm text-gray-600">{faculty.courses} courses, {faculty.students} students</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{faculty.workload}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${faculty.workload}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Student Shortage List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Attendance Shortage (&lt;75%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockStudentShortage.map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div>
                            <p className="font-medium text-red-800">{student.name}</p>
                            <p className="text-sm text-red-600">{student.course}</p>
                          </div>
                          <Badge variant="destructive">{student.attendance}%</Badge>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Shortage Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* User Management */}
            <TabsContent value="users" className="p-6">
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="Enter full name" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="Enter email" />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="faculty">Faculty</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cs">Computer Science</SelectItem>
                              <SelectItem value="math">Mathematics</SelectItem>
                              <SelectItem value="physics">Physics</SelectItem>
                              <SelectItem value="chemistry">Chemistry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => handleAddUser({})}>
                            Add User
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Users List */}
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold">
                                {user.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'faculty' ? 'secondary' : 'outline'}>
                                  {user.role}
                                </Badge>
                                <span className="text-xs text-gray-500">{user.department}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.role === 'student' && (
                              <Badge variant={user.attendance >= 75 ? 'default' : 'destructive'}>
                                {user.attendance}% attendance
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id)}>
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Timetable Management */}
            <TabsContent value="timetable" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Drag & Drop Timetable Editor</h3>
                  <Button onClick={() => setIsTimetableEditorOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </div>

                {/* Conflict Warnings */}
                {conflictWarnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Scheduling conflict detected! Same room or faculty already booked at this time.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Timetable Grid */}
                <div className="bg-white rounded-lg p-4 overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-[800px]">
                    {/* Header */}
                    <div className="font-semibold p-2 text-center bg-gray-100 rounded">Time</div>
                    {days.map(day => (
                      <div key={day} className="font-semibold p-2 text-center bg-gray-100 rounded">
                        {day}
                      </div>
                    ))}

                    {/* Time slots */}
                    {timeSlots.map(timeSlot => (
                      <React.Fragment key={timeSlot}>
                        <div className="p-2 text-center bg-gray-50 rounded font-medium">
                          {timeSlot}
                        </div>
                        {days.map(day => {
                          const classInSlot = timetables.find(
                            cls => cls.day === day && cls.startTime === timeSlot
                          )
                          
                          return (
                            <div
                              key={`${day}-${timeSlot}`}
                              className="min-h-[80px] border-2 border-dashed border-gray-200 rounded p-1 hover:border-blue-300 transition-colors"
                              onDrop={(e) => handleDrop(e, day, timeSlot)}
                              onDragOver={handleDragOver}
                            >
                              {classInSlot && (
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, classInSlot)}
                                  className="bg-blue-100 border border-blue-300 rounded p-2 cursor-move hover:bg-blue-200 transition-colors h-full"
                                >
                                  <div className="text-xs font-semibold text-blue-800">
                                    {classInSlot.courseName}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {classInSlot.faculty}
                                  </div>
                                  <div className="text-xs text-blue-500">
                                    {classInSlot.room}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Attendance Monitoring */}
            <TabsContent value="attendance" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Attendance Monitoring</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportData('attendance')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportData('pdf')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                {/* Department Filter */}
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="cs">Computer Science</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>

                {/* Attendance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Real-time Attendance Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { course: 'CS101', faculty: 'Dr. Smith', students: '23/45', status: 'active' },
                          { course: 'MATH201', faculty: 'Prof. Johnson', students: '31/38', status: 'active' },
                          { course: 'PHY101', faculty: 'Dr. Brown', students: '28/42', status: 'completed' }
                        ].map((session, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{session.course}</p>
                              <p className="text-sm text-gray-600">{session.faculty}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{session.students}</p>
                              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Department Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={attendanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="attendance"
                            label={({ department, attendance }) => `${department}: ${attendance}%`}
                          >
                            {attendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">System Notifications</h3>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Send Announcement
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Send Notification */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Send</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="target">Send To</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="students">All Students</SelectItem>
                            <SelectItem value="faculty">All Faculty</SelectItem>
                            <SelectItem value="department">Specific Department</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Enter your message..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">
                        <Bell className="w-4 h-4 mr-2" />
                        Send Notification
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { title: 'System Maintenance', message: 'Scheduled maintenance tonight', time: '2 hours ago', priority: 'high' },
                          { title: 'Exam Schedule', message: 'Mid-term exam dates announced', time: '1 day ago', priority: 'normal' },
                          { title: 'Holiday Notice', message: 'Campus closed tomorrow', time: '2 days ago', priority: 'urgent' }
                        ].map((notification, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{notification.title}</p>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                              </div>
                              <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'default'}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="settings" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">System Configuration</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="institution">Institution Name</Label>
                        <Input id="institution" defaultValue="HH310 University" />
                      </div>
                      <div>
                        <Label htmlFor="semester">Current Semester</Label>
                        <Select defaultValue="fall2025">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fall2025">Fall 2025</SelectItem>
                            <SelectItem value="spring2026">Spring 2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="utc">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="est">Eastern Time</SelectItem>
                            <SelectItem value="pst">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Database Status</span>
                        <Badge variant="default" className="bg-green-500">Connected</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Real-time Sync</span>
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Storage Usage</span>
                        <span className="text-sm">{systemStats.storageUsed} / 10 GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>System Version</span>
                        <span className="text-sm">v2.1.0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

export default EnhancedAdminDashboard
