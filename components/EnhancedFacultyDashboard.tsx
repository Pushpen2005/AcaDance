"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import QRCode from 'qrcode'
import { 
  Calendar, 
  QrCode, 
  Users, 
  Bell, 
  User, 
  Download, 
  Plus,
  Edit,
  Clock,
  BookOpen,
  BarChart3,
  Settings,
  FileText,
  Eye,
  Grid3X3,
  List,
  Timer,
  CheckCircle,
  X,
  Filter,
  AlertTriangle
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useIsMobile } from "@/components/ui/use-mobile"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from 'jspdf'
import { SupabaseStatusIndicator, RealtimeIndicator } from "@/components/ui/supabase-status"

interface FacultyDashboardProps {
  userId?: string;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ userId = "faculty-123" }) => {
  const [activeTab, setActiveTab] = useState("timetable")
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>("")
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null)
  const [isQrActive, setIsQrActive] = useState(false)
  const [attendanceList, setAttendanceList] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [timetableData, setTimetableData] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ day: 'all', course: 'all' })
  const isMobile = useIsMobile()

  // Mock data for demonstration
  const mockTimetable = [
    { 
      id: 1, 
      day: 'Monday', 
      dayIndex: 1,
      time: '09:00-10:00', 
      subject: 'Mathematics', 
      room: 'Room 101', 
      course: 'CS101',
      students: 45,
      type: 'Theory'
    },
    { 
      id: 2, 
      day: 'Tuesday', 
      dayIndex: 2,
      time: '10:00-11:00', 
      subject: 'Advanced Calculus', 
      room: 'Room 102', 
      course: 'MATH201',
      students: 32,
      type: 'Theory'
    },
    { 
      id: 3, 
      day: 'Wednesday', 
      dayIndex: 3,
      time: '14:00-15:00', 
      subject: 'Mathematics Lab', 
      room: 'Lab 201', 
      course: 'CS101L',
      students: 25,
      type: 'Lab'
    },
    { 
      id: 4, 
      day: 'Thursday', 
      dayIndex: 4,
      time: '11:00-12:00', 
      subject: 'Statistics', 
      room: 'Room 103', 
      course: 'STAT101',
      students: 38,
      type: 'Theory'
    },
    { 
      id: 5, 
      day: 'Friday', 
      dayIndex: 5,
      time: '15:00-16:00', 
      subject: 'Mathematics Tutorial', 
      room: 'Room 101', 
      course: 'CS101T',
      students: 20,
      type: 'Tutorial'
    }
  ]

  const mockCourses = [
    { id: 'CS101', name: 'Mathematics', students: 45, attendance_avg: 87 },
    { id: 'MATH201', name: 'Advanced Calculus', students: 32, attendance_avg: 92 },
    { id: 'CS101L', name: 'Mathematics Lab', students: 25, attendance_avg: 95 },
    { id: 'STAT101', name: 'Statistics', students: 38, attendance_avg: 83 },
    { id: 'CS101T', name: 'Mathematics Tutorial', students: 20, attendance_avg: 90 }
  ]

  const mockStudents = [
    { id: 1, name: 'John Doe', roll: 'CS001', attendance: 85, present: true },
    { id: 2, name: 'Jane Smith', roll: 'CS002', attendance: 92, present: true },
    { id: 3, name: 'Bob Johnson', roll: 'CS003', attendance: 78, present: false },
    { id: 4, name: 'Alice Brown', roll: 'CS004', attendance: 95, present: true },
    { id: 5, name: 'Charlie Wilson', roll: 'CS005', attendance: 89, present: true }
  ]

  const mockAttendanceData = [
    { date: '2025-08-18', present: 42, absent: 3, percentage: 93 },
    { date: '2025-08-19', present: 40, absent: 5, percentage: 89 },
    { date: '2025-08-20', present: 44, absent: 1, percentage: 98 },
    { date: '2025-08-21', present: 38, absent: 7, percentage: 84 },
    { date: '2025-08-22', present: 43, absent: 2, percentage: 96 }
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Real-time subscription setup
  useEffect(() => {
    setTimetableData(mockTimetable)
    setCourses(mockCourses)
    setStudents(mockStudents)
    setLoading(false)

    // Supabase real-time subscription
    const timetableChannel = supabase
      .channel('faculty-timetable')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'timetable' },
        (payload) => {
          console.log('Timetable updated:', payload)
          fetchTimetableData()
        }
      )
      .subscribe()

    const attendanceChannel = supabase
      .channel('faculty-attendance')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('Attendance updated:', payload)
          fetchAttendanceData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(timetableChannel)
      supabase.removeChannel(attendanceChannel)
    }
  }, [])

  // QR Code expiry timer
  useEffect(() => {
    if (qrExpiry && isQrActive) {
      const timer = setInterval(() => {
        if (new Date() >= qrExpiry) {
          setIsQrActive(false)
          setQrCode("")
          setQrExpiry(null)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [qrExpiry, isQrActive])

  const fetchTimetableData = async () => {
    // In real implementation, fetch from Supabase
    setTimetableData(mockTimetable)
  }

  const fetchAttendanceData = async () => {
    // In real implementation, fetch from Supabase
    setStudents(mockStudents)
  }

  // Generate QR Code for attendance
  const generateQRCode = async (classItem: any) => {
    const sessionId = `session_${Date.now()}_${classItem.id}`
    const timestamp = Date.now()
    const expiryTime = new Date(timestamp + 5 * 60 * 1000) // 5 minutes from now
    
    const qrData = {
      type: 'attendance',
      sessionId,
      classId: classItem.id,
      courseName: classItem.course,
      facultyId: userId,
      timestamp,
      expiry: expiryTime.getTime()
    }

    try {
      // Create attendance session in Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .insert({
          id: sessionId,
          timetable_id: classItem.id,
          faculty_id: userId,
          session_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          session_status: 'active',
          total_enrolled: 50, // This should come from enrollment data
          qr_data: JSON.stringify(qrData),
          expires_at: expiryTime.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating attendance session:', sessionError)
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData))
      setQrCode(qrCodeDataURL)
      setQrExpiry(expiryTime)
      setIsQrActive(true)
      setSelectedClass(classItem)
      
      // Reset attendance list for new session
      setAttendanceList([])
      
      // Auto-expire QR code after 5 minutes
      setTimeout(() => {
        setIsQrActive(false)
        setQrCode("")
      }, 5 * 60 * 1000)
      
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  // Manual attendance toggle
  const toggleStudentAttendance = (studentId: number) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, present: !student.present }
        : student
    ))
  }

  // Export attendance to Excel (simplified as CSV)
  const exportAttendanceCSV = () => {
    const csvContent = [
      ['Roll No', 'Name', 'Status', 'Date', 'Time'],
      ...students.map(student => [
        student.roll,
        student.name,
        student.present ? 'Present' : 'Absent',
        new Date().toLocaleDateString(),
        new Date().toLocaleTimeString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Send notification to students
  const sendNotification = async (message: string, type: 'info' | 'warning' | 'urgent' = 'info') => {
    // In real implementation, insert into Supabase notifications table
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      faculty_id: userId
    }
    
    setNotifications(prev => [notification, ...prev])
    
    // Show success message
    alert('Notification sent to all students!')
  }

  // Add/Edit class
  const addEditClass = (classData: any) => {
    if (classData.id) {
      // Edit existing class
      setTimetableData(prev => prev.map(item => 
        item.id === classData.id ? classData : item
      ))
    } else {
      // Add new class
      const newClass = {
        ...classData,
        id: Date.now()
      }
      setTimetableData(prev => [...prev, newClass])
    }
  }

  // Reschedule class (drag & drop simulation)
  const rescheduleClass = (classId: number, newTime: string, newDay: string) => {
    setTimetableData(prev => prev.map(item => 
      item.id === classId 
        ? { ...item, time: newTime, day: newDay }
        : item
    ))
  }

  const getFilteredTimetable = () => {
    return timetableData.filter(item => {
      const dayMatch = filter.day === 'all' || item.day === filter.day
      const courseMatch = filter.course === 'all' || item.course === filter.course
      return dayMatch && courseMatch
    })
  }

  const getTimeRemaining = () => {
    if (!qrExpiry) return 0
    return Math.max(0, Math.floor((qrExpiry.getTime() - Date.now()) / 1000))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Enhanced Header with Supabase Status */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-green-800">Faculty Dashboard</h1>
            <p className="text-green-600">Manage your classes and track student attendance.</p>
          </div>
          
          {/* Connection Status and Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <SupabaseStatusIndicator className="relative" />
            <RealtimeIndicator />
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Supabase Connected
            </Badge>
          </div>
        </div>
        
        {/* Real-time Status Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">QR sessions sync in real-time with students</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span>Live QR Generation</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                <span>Attendance Tracking</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input type="text" className="w-full border rounded px-3 py-2" placeholder="Enter subject name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Day</label>
                    <select className="w-full border rounded px-3 py-2">
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input type="text" className="w-full border rounded px-3 py-2" placeholder="09:00-10:00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Room</label>
                    <input type="text" className="w-full border rounded px-3 py-2" placeholder="Room 101" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select className="w-full border rounded px-3 py-2">
                      <option value="Theory">Theory</option>
                      <option value="Lab">Lab</option>
                      <option value="Tutorial">Tutorial</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full">Add Class</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => sendNotification("Class rescheduled to 10 AM tomorrow")}>
            <Bell className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Classes</p>
                <p className="text-2xl font-bold">{timetableData.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Avg Attendance</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Students</p>
                <p className="text-2xl font-bold">160</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Next Class</p>
                <p className="text-2xl font-bold">2:00 PM</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="timetable" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {!isMobile && "Timetable"}
          </TabsTrigger>
          <TabsTrigger value="qr-attendance" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            {!isMobile && "QR Attendance"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {!isMobile && "Reports"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {!isMobile && "Notifications"}
          </TabsTrigger>
        </TabsList>

        {/* Timetable Management Tab */}
        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Timetable
                </CardTitle>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={filter.day} 
                    onChange={(e) => setFilter(prev => ({ ...prev, day: e.target.value }))}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Days</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select 
                    value={filter.course} 
                    onChange={(e) => setFilter(prev => ({ ...prev, course: e.target.value }))}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredTimetable().map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.subject}</h3>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><Clock className="w-4 h-4 inline mr-1" />{item.day} • {item.time}</p>
                        <p><BookOpen className="w-4 h-4 inline mr-1" />{item.room} • {item.students} students</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3 lg:mt-0">
                      <Button
                        onClick={() => generateQRCode(item)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        Generate QR
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-1" />
                        View Students
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Attendance Tab */}
        <TabsContent value="qr-attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isQrActive ? (
                  <div className="text-center space-y-4">
                    <p className="text-gray-600">Select a class from your timetable to generate QR code</p>
                    <Button 
                      disabled
                      className="w-full"
                    >
                      No Active QR Session
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <img src={qrCode} alt="Attendance QR Code" className="w-48 h-48" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{selectedClass?.subject}</h3>
                      <p className="text-gray-600">{selectedClass?.room} • {selectedClass?.time}</p>
                      
                      <div className="flex items-center justify-center gap-2 text-orange-600">
                        <Timer className="w-4 h-4" />
                        <span className="font-medium">
                          Expires in: {Math.floor(getTimeRemaining() / 60)}:
                          {String(getTimeRemaining() % 60).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        setIsQrActive(false)
                        setQrCode("")
                        setSelectedClass(null)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
            
            {/* Real-time Attendance List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Live Attendance ({students.filter(s => s.present).length}/{students.length})
                  </CardTitle>
                  <Button onClick={exportAttendanceCSV} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-gray-500">{student.roll} • Avg: {student.attendance}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={student.present ? 'default' : 'destructive'}
                          className={student.present ? 'bg-green-600' : ''}
                        >
                          {student.present ? 'Present' : 'Absent'}
                        </Badge>
                        <Button
                          onClick={() => toggleStudentAttendance(student.id)}
                          size="sm"
                          variant="outline"
                        >
                          Toggle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Attendance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockAttendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#22c55e" name="Present" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Course-wise Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Course-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map(course => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{course.name}</span>
                        <span className="text-sm text-gray-600">{course.attendance_avg}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.attendance_avg}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-2 rounded-full ${
                            course.attendance_avg >= 90 ? 'bg-green-500' :
                            course.attendance_avg >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{course.students} students</span>
                        <span>
                          {course.attendance_avg >= 90 ? 'Excellent' :
                           course.attendance_avg >= 80 ? 'Good' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Shortage List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Students with Low Attendance (&lt;75%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.filter(s => s.attendance < 75).map(student => (
                  <Alert key={student.id} className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>{student.name} ({student.roll})</strong> - {student.attendance}% attendance
                    </AlertDescription>
                  </Alert>
                ))}
                {students.filter(s => s.attendance < 75).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No students with attendance shortage 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Send Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2 h-24" 
                    placeholder="Enter your message to students..."
                    id="notification-message"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const message = (document.getElementById('notification-message') as HTMLTextAreaElement)?.value
                      if (message) sendNotification(message, 'info')
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Send Info
                  </Button>
                  <Button 
                    onClick={() => {
                      const message = (document.getElementById('notification-message') as HTMLTextAreaElement)?.value
                      if (message) sendNotification(message, 'warning')
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Send Warning
                  </Button>
                  <Button 
                    onClick={() => {
                      const message = (document.getElementById('notification-message') as HTMLTextAreaElement)?.value
                      if (message) sendNotification(message, 'urgent')
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Send Urgent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No notifications sent yet</p>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant={
                            notification.type === 'urgent' ? 'destructive' :
                            notification.type === 'warning' ? 'default' : 'secondary'
                          }
                          className={
                            notification.type === 'warning' ? 'bg-orange-600' : ''
                          }
                        >
                          {notification.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}

export default FacultyDashboard
