import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Settings, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw, 
  Eye, 
  Share2,
  Bell,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Filter,
  Search,
  Copy,
  Move,
  RotateCcw,
  User,
  Building,
  GraduationCap,
  FileText,
  TrendingUp,
  Activity,
  PieChart,
  Calendar as CalendarIcon
} from 'lucide-react'

interface TimetableAnalytics {
  facultyUtilization: Array<{
    id: string
    name: string
    department: string
    totalHours: number
    maxHours: number
    utilization: number
    classes: number
    peakDays: string[]
  }>
  roomUtilization: Array<{
    id: string
    name: string
    type: string
    capacity: number
    totalBookings: number
    utilization: number
    peakHours: string[]
  }>
  departmentStats: Array<{
    department: string
    totalSubjects: number
    totalFaculty: number
    totalClasses: number
    avgClassSize: number
  }>
  conflictAnalysis: {
    totalConflicts: number
    facultyConflicts: number
    roomConflicts: number
    batchConflicts: number
    resolvedConflicts: number
  }
  timeSlotAnalysis: Array<{
    timeSlot: string
    day: string
    bookingRate: number
    mostPopularSubjects: string[]
  }>
  weeklyDistribution: Array<{
    day: string
    totalClasses: number
    utilization: number
  }>
}

export default function TimetableAnalyticsAndReports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState<TimetableAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [dateRange, setDateRange] = useState('current_week')
  const [reportType, setReportType] = useState('summary')
  
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedDepartment, selectedSemester, dateRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Fetch all required data
      const [
        timetableRes,
        subjectsRes,
        facultyRes,
        roomsRes,
        timeSlotsRes
      ] = await Promise.all([
        supabase.from('timetable_entries').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('faculty').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('time_slots').select('*')
      ])

      const timetable = timetableRes.data || []
      const subjects = subjectsRes.data || []
      const faculty = facultyRes.data || []
      const rooms = roomsRes.data || []
      const timeSlots = timeSlotsRes.data || []

      // Calculate analytics
      const analytics = calculateAnalytics(timetable, subjects, faculty, rooms, timeSlots)
      setAnalyticsData(analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnalytics = (timetable: any[], subjects: any[], faculty: any[], rooms: any[], timeSlots: any[]): TimetableAnalytics => {
    // Faculty Utilization Analysis
    const facultyUtilization = faculty.map(f => {
      const facultyClasses = timetable.filter(t => t.faculty_id === f.id)
      const totalHours = facultyClasses.length
      const utilization = (totalHours / f.max_hours_per_week) * 100
      
      // Calculate peak days
      const dayDistribution: Record<string, number> = {}
      facultyClasses.forEach(fc => {
        const timeSlot = timeSlots.find(ts => ts.id === fc.time_slot_id)
        if (timeSlot) {
          dayDistribution[timeSlot.day] = (dayDistribution[timeSlot.day] || 0) + 1
        }
      })
      
      const peakDays = Object.entries(dayDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([day]) => day)

      return {
        id: f.id,
        name: f.name,
        department: f.department,
        totalHours,
        maxHours: f.max_hours_per_week,
        utilization: Math.round(utilization),
        classes: facultyClasses.length,
        peakDays
      }
    })

    // Room Utilization Analysis
    const roomUtilization = rooms.map(r => {
      const roomBookings = timetable.filter(t => t.room_id === r.id)
      const maxPossibleBookings = timeSlots.length * 0.8 // Assuming 80% max utilization
      const utilization = (roomBookings.length / maxPossibleBookings) * 100
      
      // Calculate peak hours
      const hourDistribution: Record<string, number> = {}
      roomBookings.forEach(rb => {
        const timeSlot = timeSlots.find(ts => ts.id === rb.time_slot_id)
        if (timeSlot) {
          hourDistribution[timeSlot.start_time] = (hourDistribution[timeSlot.start_time] || 0) + 1
        }
      })
      
      const peakHours = Object.entries(hourDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour)

      return {
        id: r.id,
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        totalBookings: roomBookings.length,
        utilization: Math.round(utilization),
        peakHours
      }
    })

    // Department Statistics
    const departments = [...new Set(subjects.map(s => s.department))]
    const departmentStats = departments.map(dept => {
      const deptSubjects = subjects.filter(s => s.department === dept)
      const deptFaculty = faculty.filter(f => f.department === dept)
      const deptClasses = timetable.filter(t => t.department === dept)
      
      return {
        department: dept,
        totalSubjects: deptSubjects.length,
        totalFaculty: deptFaculty.length,
        totalClasses: deptClasses.length,
        avgClassSize: deptClasses.length > 0 ? Math.round(deptClasses.length / deptSubjects.length) : 0
      }
    })

    // Conflict Analysis
    const conflictAnalysis = {
      totalConflicts: 0,
      facultyConflicts: 0,
      roomConflicts: 0,
      batchConflicts: 0,
      resolvedConflicts: 0
    }

    // Calculate conflicts
    timetable.forEach(entry => {
      const conflicts = timetable.filter(other => 
        other.id !== entry.id && other.time_slot_id === entry.time_slot_id
      )
      
      conflicts.forEach(conflict => {
        if (conflict.faculty_id === entry.faculty_id) conflictAnalysis.facultyConflicts++
        if (conflict.room_id === entry.room_id) conflictAnalysis.roomConflicts++
        if (conflict.batch === entry.batch) conflictAnalysis.batchConflicts++
      })
    })

    conflictAnalysis.totalConflicts = conflictAnalysis.facultyConflicts + conflictAnalysis.roomConflicts + conflictAnalysis.batchConflicts

    // Time Slot Analysis
    const timeSlotAnalysis = timeSlots.map(ts => {
      const slotBookings = timetable.filter(t => t.time_slot_id === ts.id)
      const bookingRate = (slotBookings.length / Math.max(rooms.length, 1)) * 100
      
      const subjectCounts: Record<string, number> = {}
      slotBookings.forEach(sb => {
        const subject = subjects.find(s => s.id === sb.subject_id)
        if (subject) {
          subjectCounts[subject.name] = (subjectCounts[subject.name] || 0) + 1
        }
      })
      
      const mostPopularSubjects = Object.entries(subjectCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([subject]) => subject)

      return {
        timeSlot: `${ts.start_time} - ${ts.end_time}`,
        day: ts.day,
        bookingRate: Math.round(bookingRate),
        mostPopularSubjects
      }
    })

    // Weekly Distribution
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weeklyDistribution = days.map(day => {
      const daySlots = timeSlots.filter(ts => ts.day === day)
      const dayClasses = timetable.filter(t => {
        const timeSlot = timeSlots.find(ts => ts.id === t.time_slot_id)
        return timeSlot?.day === day
      })
      
      const utilization = daySlots.length > 0 ? (dayClasses.length / daySlots.length) * 100 : 0

      return {
        day,
        totalClasses: dayClasses.length,
        utilization: Math.round(utilization)
      }
    })

    return {
      facultyUtilization,
      roomUtilization,
      departmentStats,
      conflictAnalysis,
      timeSlotAnalysis,
      weeklyDistribution
    }
  }

  const generateReport = async () => {
    if (!analyticsData) return

    try {
      const reportData = {
        type: reportType,
        filters: {
          department: selectedDepartment,
          semester: selectedSemester,
          dateRange
        },
        data: analyticsData,
        generatedAt: new Date().toISOString()
      }

      // Here you would typically send this to an API to generate the report
      // For now, we'll just download as JSON
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timetable-analytics-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Report Generated",
        description: "Analytics report downloaded successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      })
    }
  }

  const shareAnalytics = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Timetable Analytics Report Available',
          message: 'Latest timetable analytics and utilization reports are now available for review.',
          type: 'announcement',
          priority: 'medium',
          recipient_type: 'faculty_admin'
        })
      })

      toast({
        title: "Analytics Shared",
        description: "Notifications sent to faculty and admin users"
      })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to send notifications",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-lg">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Timetable Analytics & Reports
          </h1>
          <p className="text-green-700 mt-1">Comprehensive insights and utilization reports</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={generateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          <Button onClick={shareAnalytics} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Analytics
          </Button>
          
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search analytics..."
                className="pl-10"
              />
            </div>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full lg:w-[120px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
                <SelectItem value="3">Semester 3</SelectItem>
                <SelectItem value="4">Semester 4</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full lg:w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_week">Current Week</SelectItem>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="current_semester">Current Semester</SelectItem>
                <SelectItem value="academic_year">Academic Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Classes</p>
                    <p className="text-3xl font-bold text-blue-800">
                      {analyticsData?.departmentStats.reduce((sum, dept) => sum + dept.totalClasses, 0) || 0}
                    </p>
                  </div>
                  <Calendar className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Avg Faculty Utilization</p>
                    <p className="text-3xl font-bold text-green-800">
                      {analyticsData?.facultyUtilization.length 
                        ? Math.round(analyticsData.facultyUtilization.reduce((sum, f) => sum + f.utilization, 0) / analyticsData.facultyUtilization.length)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Room Efficiency</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {analyticsData?.roomUtilization.length 
                        ? Math.round(analyticsData.roomUtilization.reduce((sum, r) => sum + r.utilization, 0) / analyticsData.roomUtilization.length)
                        : 0}%
                    </p>
                  </div>
                  <Activity className="w-12 h-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Total Conflicts</p>
                    <p className="text-3xl font-bold text-red-800">
                      {analyticsData?.conflictAnalysis.totalConflicts || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Weekly Class Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.weeklyDistribution.map((day, index) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{day.day}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <motion.div
                        className="bg-indigo-500 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        initial={{ width: 0 }}
                        animate={{ width: `${day.utilization}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      >
                        {day.utilization > 20 && `${day.utilization}%`}
                      </motion.div>
                    </div>
                    <div className="w-16 text-sm text-green-700 text-right">
                      {day.totalClasses} classes
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-yellow-600" />
                <span>Department Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData?.departmentStats.map((dept, index) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <h3 className="font-semibold text-lg mb-2">{dept.department}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subjects:</span>
                        <span className="font-medium">{dept.totalSubjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Faculty:</span>
                        <span className="font-medium">{dept.totalFaculty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Classes:</span>
                        <span className="font-medium">{dept.totalClasses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Class Size:</span>
                        <span className="font-medium">{dept.avgClassSize}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Faculty Utilization Tab */}
        <TabsContent value="faculty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-green-600" />
                <span>Faculty Utilization Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.facultyUtilization.map((faculty, index) => (
                  <motion.div
                    key={faculty.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{faculty.name}</h3>
                        <p className="text-sm text-green-700">{faculty.department}</p>
                      </div>
                      <Badge 
                        variant={faculty.utilization > 80 ? "destructive" : faculty.utilization > 60 ? "default" : "secondary"}
                      >
                        {faculty.utilization}% utilized
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Classes:</span>
                        <span className="ml-2 font-medium">{faculty.classes}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Hours:</span>
                        <span className="ml-2 font-medium">{faculty.totalHours}/{faculty.maxHours}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Peak Days:</span>
                        <span className="ml-2 font-medium">{faculty.peakDays.join(', ')}</span>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            faculty.utilization > 80 ? 'bg-red-500' : 
                            faculty.utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(faculty.utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Room Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Detailed room utilization metrics and efficiency reports will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts">
          <Card>
            <CardHeader>
              <CardTitle>Conflict Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Scheduling conflicts and resolution strategies will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Overall Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Comprehensive utilization metrics across all resources will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trends & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Historical trends and predictive insights will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
