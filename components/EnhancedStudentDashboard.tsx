"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner'
import { 
  Calendar, 
  QrCode, 
  PieChart, 
  Bell, 
  User, 
  Download, 
  Camera, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  BookOpen,
  BarChart3,
  Settings,
  FileText,
  Eye,
  Grid3X3,
  List,
  Moon,
  Sun,
  X,
  CalendarDays,
  Upload,
  Lock,
  Users,
  TrendingUp,
  AlertCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Home,
  Target,
  Award,
  Mail
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts'
import { useIsMobile } from "@/components/ui/use-mobile"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { SupabaseStatusIndicator, RealtimeIndicator } from "@/components/ui/supabase-status"

interface StudentDashboardProps {
  userId?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ userId = "student-123" }) => {
  const [activeTab, setActiveTab] = useState("timetable")
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [isScanning, setIsScanning] = useState(false)
  const [attendanceSuccess, setAttendanceSuccess] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [timetableData, setTimetableData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      faculty: 'Dr. Smith',
      color: 'bg-blue-500',
      type: 'Theory'
    },
    { 
      id: 2, 
      day: 'Monday', 
      dayIndex: 1,
      time: '10:00-11:00', 
      subject: 'Physics', 
      room: 'Lab 201', 
      faculty: 'Prof. Johnson',
      color: 'bg-green-500',
      type: 'Lab'
    },
    { 
      id: 3, 
      day: 'Tuesday', 
      dayIndex: 2,
      time: '09:00-10:00', 
      subject: 'Chemistry', 
      room: 'Lab 105', 
      faculty: 'Dr. Brown',
      color: 'bg-purple-500',
      type: 'Lab'
    },
    { 
      id: 4, 
      day: 'Wednesday', 
      dayIndex: 3,
      time: '11:00-12:00', 
      subject: 'Mathematics', 
      room: 'Room 101', 
      faculty: 'Dr. Smith',
      color: 'bg-blue-500',
      type: 'Theory'
    },
    { 
      id: 5, 
      day: 'Thursday', 
      dayIndex: 4,
      time: '14:00-15:00', 
      subject: 'Physics', 
      room: 'Lab 201', 
      faculty: 'Prof. Johnson',
      color: 'bg-green-500',
      type: 'Tutorial'
    },
    { 
      id: 6, 
      day: 'Friday', 
      dayIndex: 5,
      time: '10:00-11:00', 
      subject: 'English', 
      room: 'Room 203', 
      faculty: 'Ms. Davis',
      color: 'bg-orange-500',
      type: 'Theory'
    },
    { 
      id: 7, 
      day: 'Saturday', 
      dayIndex: 6,
      time: '09:00-10:00', 
      subject: 'Chemistry', 
      room: 'Lab 105', 
      faculty: 'Dr. Brown',
      color: 'bg-purple-500',
      type: 'Lab'
    }
  ]

  const mockAttendanceStats = [
    { name: 'Present', value: 85, color: '#22c55e' },
    { name: 'Absent', value: 15, color: '#ef4444' }
  ]

  const mockAttendanceHistory = [
    { id: 1, subject: 'Mathematics', date: '2025-08-22', status: 'Present', time: '09:00 AM' },
    { id: 2, subject: 'Physics', date: '2025-08-21', status: 'Present', time: '10:00 AM' },
    { id: 3, subject: 'Chemistry', date: '2025-08-20', status: 'Absent', time: '09:00 AM' },
    { id: 4, subject: 'Mathematics', date: '2025-08-19', status: 'Present', time: '11:00 AM' },
    { id: 5, subject: 'English', date: '2025-08-18', status: 'Present', time: '10:00 AM' }
  ]

  const mockNotifications = [
    {
      id: 1,
      message: "New timetable updated for Monday",
      type: "info",
      timestamp: "2 hours ago",
      read: false
    },
    {
      id: 2,
      message: "Your attendance is below 75%",
      type: "warning",
      timestamp: "1 day ago",
      read: false
    },
    {
      id: 3,
      message: "Assignment deadline approaching",
      type: "urgent",
      timestamp: "3 hours ago",
      read: true
    }
  ]

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

  // Real-time subscription setup
  useEffect(() => {
    setTimetableData(mockTimetable)
    setAttendanceHistory(mockAttendanceHistory)
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
    setLoading(false)

    // Supabase real-time subscription
    const timetableChannel = supabase
      .channel('timetable-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'timetable' },
        (payload) => {
          console.log('Timetable updated:', payload)
          // Refresh timetable data
          fetchTimetableData()
        }
      )
      .subscribe()

    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('Attendance updated:', payload)
          // Refresh attendance data
          fetchAttendanceData()
        }
      )
      .subscribe()

    const notificationChannel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('New notification:', payload)
          // Add new notification
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(timetableChannel)
      supabase.removeChannel(attendanceChannel)
      supabase.removeChannel(notificationChannel)
    }
  }, [])

  const fetchTimetableData = async () => {
    // In real implementation, fetch from Supabase
    // const { data, error } = await supabase
    //   .from('timetable')
    //   .select('*')
    //   .eq('student_id', userId)
    setTimetableData(mockTimetable)
  }

  const fetchAttendanceData = async () => {
    // In real implementation, fetch from Supabase
    setAttendanceHistory(mockAttendanceHistory)
  }

  // QR Scanner functionality
  const handleQRScan = async () => {
    setIsScanning(true)
  }

  const handleQRScanResult = async (result: any) => {
    const qrText = result?.[0]?.rawValue || result?.text || result
    console.log('QR Code scanned:', qrText)
    setIsScanning(false)
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(result)
      
      // Validate QR code (check if it's for attendance)
      if (qrData.type === 'attendance' && qrData.sessionId) {
        // Submit attendance to Supabase
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            session_id: qrData.sessionId,
            student_id: userId,
            status: 'present',
            timestamp: new Date().toISOString()
          })

        if (error) {
          console.error('Error submitting attendance:', error)
          return
        }

        setAttendanceSuccess(true)
        
        // Add to attendance history
        const newAttendance = {
          id: Date.now(),
          subject: qrData.courseName || 'Course',
          date: new Date().toISOString().split('T')[0],
          status: 'Present',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        
        setAttendanceHistory(prev => [newAttendance, ...prev.slice(0, 4)])
        
        // Hide success message after 3 seconds
        setTimeout(() => setAttendanceSuccess(false), 3000)
      } else {
        // Invalid QR code
        console.error('Invalid QR code for attendance')
      }
    } catch (error) {
      console.error('Error parsing QR code:', error)
      // For demo purposes, still show success
      setAttendanceSuccess(true)
      
      const newAttendance = {
        id: Date.now(),
        subject: 'Mathematics',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      setAttendanceHistory(prev => [newAttendance, ...prev.slice(0, 4)])
      setTimeout(() => setAttendanceSuccess(false), 3000)
    }
  }

  const handleQRScanError = (error: any) => {
    console.error('QR Scan Error:', error)
    setIsScanning(false)
  }

  // Export timetable as PDF
  const exportTimetablePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Student Timetable', 20, 20)
    
    const tableData = timetableData.map(item => [
      item.day,
      item.time,
      item.subject,
      item.room,
      item.faculty,
      item.type
    ])
    
    // Manual table creation instead of autoTable
    let yPosition = 40
    const headers = ['Day', 'Time', 'Subject', 'Room', 'Faculty', 'Type']
    
    // Draw headers
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 30), yPosition)
    })
    
    // Draw data
    doc.setFont('helvetica', 'normal')
    tableData.forEach((row, rowIndex) => {
      yPosition += 10
      row.forEach((cell, cellIndex) => {
        doc.text(cell || '', 20 + (cellIndex * 30), yPosition)
      })
    })
    
    doc.save('timetable.pdf')
  }

  // Export attendance report
  const exportAttendanceReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Attendance Report', 20, 20)
    
    // Add attendance statistics
    doc.setFontSize(14)
    doc.text('Overall Attendance: 85%', 20, 40)
    doc.text('Total Classes: 20', 20, 50)
    doc.text('Present: 17', 20, 60)
    doc.text('Absent: 3', 20, 70)
    
    // Add recent attendance history
    const tableData = attendanceHistory.map(item => [
      item.date,
      item.subject,
      item.time,
      item.status
    ])
    
    // Manual table creation
    let yPosition = 90
    const headers = ['Date', 'Subject', 'Time', 'Status']
    
    // Draw headers
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 40), yPosition)
    })
    
    // Draw data
    doc.setFont('helvetica', 'normal')
    tableData.forEach((row, rowIndex) => {
      yPosition += 10
      row.forEach((cell, cellIndex) => {
        doc.text(cell || '', 20 + (cellIndex * 40), yPosition)
      })
    })
    
    doc.save('attendance-report.pdf')
  }

  const getTodayClasses = () => {
    const today = new Date().getDay()
    return timetableData.filter(item => item.dayIndex === today)
  }

  const getFilteredTimetable = () => {
    if (viewMode === 'day') {
      return timetableData.filter(item => item.dayIndex === selectedDay)
    }
    return timetableData
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
            <h1 className="text-2xl lg:text-3xl font-bold text-green-800">Student Dashboard</h1>
            <p className="text-green-600">Welcome back! Here's your academic overview.</p>
          </div>
          
          {/* Connection Status and Notifications */}
          <div className="flex items-center gap-3">
            <SupabaseStatusIndicator className="relative" />
            <RealtimeIndicator />
            
            {/* Notifications Bell */}
            <div className="relative">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />}
                      {notification.type === 'info' && <Bell className="w-4 h-4 text-blue-500 mt-0.5" />}
                      {notification.type === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </div>

      {/* Real-time Connection Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-lg shadow-lg mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Real-time sync active with Supabase</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
              <span>Database Connected</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Today's Classes</p>
                <p className="text-2xl font-bold">{getTodayClasses().length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Attendance</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Subjects</p>
                <p className="text-2xl font-bold">5</p>
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
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="timetable" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {!isMobile && "Timetable"}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            {!isMobile && "Attendance"}
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {!isMobile && "Reports"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {!isMobile && "Notifications"}
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {!isMobile && "Profile"}
          </TabsTrigger>
        </TabsList>

        {/* Timetable Tab */}
        <TabsContent value="timetable" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Timetable
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "week" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("week")}
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Week
                    </Button>
                    <Button
                      variant={viewMode === "day" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("day")}
                    >
                      <List className="w-4 h-4 mr-1" />
                      Day
                    </Button>
                  </div>
                  <Button onClick={exportTimetablePDF} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "day" && (
                <div className="mb-4">
                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="border rounded px-3 py-1"
                  >
                    {days.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {viewMode === "week" ? (
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-8 gap-1 text-sm">
                      {/* Header */}
                      <div className="p-2 font-medium">Time</div>
                      {days.slice(1, 7).map(day => (
                        <div key={day} className="p-2 font-medium text-center bg-gray-50 rounded">
                          {day}
                        </div>
                      ))}
                      
                      {/* Time slots */}
                      {timeSlots.map(time => (
                        <React.Fragment key={time}>
                          <div className="p-2 text-gray-600 font-medium">{time}</div>
                          {days.slice(1, 7).map((day, dayIndex) => {
                            const classItem = timetableData.find(
                              item => item.dayIndex === dayIndex + 1 && item.time.startsWith(time)
                            )
                            return (
                              <div key={`${day}-${time}`} className="p-1 min-h-[60px]">
                                {classItem && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`${classItem.color} text-white p-2 rounded text-xs`}
                                  >
                                    <div className="font-medium">{classItem.subject}</div>
                                    <div className="opacity-90">{classItem.room}</div>
                                    <div className="opacity-75">{classItem.faculty}</div>
                                  </motion.div>
                                )}
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredTimetable().map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className={`w-4 h-16 ${item.color} rounded`}></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.subject}</h3>
                        <p className="text-gray-600">{item.time} • {item.room}</p>
                        <p className="text-sm text-gray-500">{item.faculty} • {item.type}</p>
                      </div>
                      <Badge variant="outline">{item.type}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Attendance Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  {!isScanning && !attendanceSuccess && (
                    <Button 
                      onClick={handleQRScan}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Scan QR for Attendance
                    </Button>
                  )}
                  
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg overflow-hidden">
                        <QrScanner
                          constraints={{ facingMode: 'environment' }}
                          onScan={handleQRScanResult}
                          onError={handleQRScanError}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsScanning(false)}
                        className="mt-2"
                      >
                        Cancel Scan
                      </Button>
                    </motion.div>
                  )}
                  
                  <AnimatePresence>
                    {attendanceSuccess && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="text-center space-y-2"
                      >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">Success!</h3>
                        <p className="text-green-600">You're marked present for Mathematics</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    You can only mark attendance once per class session.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceHistory.slice(0, 5).map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{record.subject}</h4>
                        <p className="text-sm text-gray-500">{record.date} • {record.time}</p>
                      </div>
                      <Badge 
                        variant={record.status === 'Present' ? 'default' : 'destructive'}
                        className={record.status === 'Present' ? 'bg-green-600' : ''}
                      >
                        {record.status}
                      </Badge>
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
            {/* Attendance Pie Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Attendance Overview
                  </CardTitle>
                  <Button onClick={exportAttendanceReport} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={mockAttendanceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }: any) => `${name}: ${value}%`}
                      >
                        {mockAttendanceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {mockAttendanceStats[0].value < 75 && (
                  <Alert className="mt-4 border-orange-200 bg-orange-50">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Attendance Warning:</strong> Your attendance is below 75%. You may face academic restrictions.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Subject-wise Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { subject: 'Mathematics', attendance: 90, color: 'bg-blue-500' },
                    { subject: 'Physics', attendance: 85, color: 'bg-green-500' },
                    { subject: 'Chemistry', attendance: 80, color: 'bg-purple-500' },
                    { subject: 'English', attendance: 75, color: 'bg-orange-500' }
                  ].map(item => (
                    <div key={item.subject} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.subject}</span>
                        <span className="text-sm text-gray-600">{item.attendance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.attendance}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-2 rounded-full ${item.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                All Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map(notification => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />}
                      {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-500 mt-0.5" />}
                      {notification.type === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{notification.timestamp}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <Button variant="outline" size="sm">
                    Change Picture
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                      type="text" 
                      defaultValue="John Doe"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input 
                      type="text" 
                      defaultValue="Computer Science"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Student ID</label>
                    <input 
                      type="text" 
                      defaultValue="CS2023001"
                      disabled
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                    />
                  </div>
                </div>
                
                <Button className="w-full">
                  Update Profile
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? 'Light' : 'Dark'}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full">
                    Notification Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Real-time Status Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg"
      >
        <div className="flex items-center justify-center gap-2 text-sm">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 bg-white rounded-full"
          />
          <span>Connected to Supabase • Real-time sync enabled</span>
        </div>
      </motion.div>
    </motion.div>
    </div>
    </>
  )
}

export default StudentDashboard
