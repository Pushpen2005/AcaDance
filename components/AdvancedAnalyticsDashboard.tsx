"use client"

// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { motion } from 'framer-motion'
import { useToast } from "@/hooks/use-toast"
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  Award,
  Zap,
  Activity,
  BookOpen,
  GraduationCap
} from 'lucide-react'

interface AnalyticsData {
  totalStudents: number
  totalClasses: number
  averageAttendance: number
  attendanceTrend: 'up' | 'down' | 'stable'
  topPerformers: Array<{
    student_name: string
    attendance_rate: number
    department: string
  }>
  lowPerformers: Array<{
    student_name: string
    attendance_rate: number
    department: string
  }>
  classPerformance: Array<{
    class_name: string
    attendance_rate: number
    total_sessions: number
  }>
  dailyAttendance: Array<{
    date: string
    attendance_count: number
    total_expected: number
  }>
  departmentStats: Array<{
    department: string
    total_students: number
    average_attendance: number
  }>
}

export default function AdvancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin'>('admin')
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const { toast } = useToast()

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    
    try {
      // Get date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(selectedTimeRange))
      
      // Fetch attendance records with related data
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('qr_attendance_records')
        .select(`
          *,
          profiles!qr_attendance_records_student_id_fkey(full_name, department),
          qr_attendance_sessions(class_name, start_time)
        `)
        .gte('scan_timestamp', startDate.toISOString())
        .lte('scan_timestamp', endDate.toISOString())
      
      if (attendanceError) throw attendanceError
      
      // Get total students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .ilike('department', selectedDepartment === 'all' ? '%' : selectedDepartment)
      
      // Get total unique classes
      const { data: uniqueClasses } = await supabase
        .from('qr_attendance_sessions')
        .select('class_name')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
      
      const totalClasses = new Set(uniqueClasses?.map(c => c.class_name)).size
      
      // Calculate analytics
      const analytics = calculateAnalytics(attendanceRecords || [], totalStudents || 0, totalClasses)
      setAnalyticsData(analytics)
      
    } catch (error: any) {
      toast({
        title: "Analytics Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
      console.error('Analytics error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate analytics from raw data
  const calculateAnalytics = (records: any[], totalStudents: number, totalClasses: number): AnalyticsData => {
    // Student performance analysis
    const studentStats = new Map()
    
    records.forEach(record => {
      const studentId = record.student_id
      const studentName = record.profiles?.full_name || 'Unknown'
      const department = record.profiles?.department || 'Unknown'
      
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          student_name: studentName,
          department,
          total_sessions: 0,
          present_sessions: 0
        })
      }
      
      const stats = studentStats.get(studentId)
      stats.total_sessions++
      if (record.status === 'present') {
        stats.present_sessions++
      }
    })
    
    // Calculate attendance rates
    const studentsWithRates = Array.from(studentStats.values()).map(student => ({
      ...student,
      attendance_rate: student.total_sessions > 0 ? (student.present_sessions / student.total_sessions) * 100 : 0
    }))
    
    // Sort by attendance rate
    const sortedStudents = studentsWithRates.sort((a, b) => b.attendance_rate - a.attendance_rate)
    
    // Top and low performers
    const topPerformers = sortedStudents.slice(0, 5)
    const lowPerformers = sortedStudents.slice(-5).reverse()
    
    // Class performance
    const classStats = new Map()
    records.forEach(record => {
      const className = record.qr_attendance_sessions?.class_name || 'Unknown'
      
      if (!classStats.has(className)) {
        classStats.set(className, {
          class_name: className,
          total_sessions: 0,
          present_count: 0
        })
      }
      
      const stats = classStats.get(className)
      stats.total_sessions++
      if (record.status === 'present') {
        stats.present_count++
      }
    })
    
    const classPerformance = Array.from(classStats.values()).map(cls => ({
      ...cls,
      attendance_rate: cls.total_sessions > 0 ? (cls.present_count / cls.total_sessions) * 100 : 0
    }))
    
    // Daily attendance trend
    const dailyStats = new Map()
    records.forEach(record => {
      const date = new Date(record.scan_timestamp).toISOString().split('T')[0]
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          date,
          attendance_count: 0,
          total_expected: 0
        })
      }
      
      const stats = dailyStats.get(date)
      stats.total_expected++
      if (record.status === 'present') {
        stats.attendance_count++
      }
    })
    
    const dailyAttendance = Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date))
    
    // Department statistics
    const deptStats = new Map()
    studentsWithRates.forEach(student => {
      const dept = student.department
      
      if (!deptStats.has(dept)) {
        deptStats.set(dept, {
          department: dept,
          total_students: 0,
          total_attendance_rate: 0
        })
      }
      
      const stats = deptStats.get(dept)
      stats.total_students++
      stats.total_attendance_rate += student.attendance_rate
    })
    
    const departmentStats = Array.from(deptStats.values()).map(dept => ({
      department: dept.department,
      total_students: dept.total_students,
      average_attendance: dept.total_students > 0 ? dept.total_attendance_rate / dept.total_students : 0
    }))
    
    // Overall statistics
    const totalPresentRecords = records.filter(r => r.status === 'present').length
    const averageAttendance = records.length > 0 ? (totalPresentRecords / records.length) * 100 : 0
    
    // Determine trend (simplified)
    const recentAttendance = dailyAttendance.slice(-7)
    const olderAttendance = dailyAttendance.slice(-14, -7)
    
    const recentAvg = recentAttendance.length > 0 
      ? recentAttendance.reduce((sum, day) => sum + (day.attendance_count / day.total_expected * 100), 0) / recentAttendance.length
      : 0
    
    const olderAvg = olderAttendance.length > 0
      ? olderAttendance.reduce((sum, day) => sum + (day.attendance_count / day.total_expected * 100), 0) / olderAttendance.length
      : 0
    
    const attendanceTrend = recentAvg > olderAvg + 2 ? 'up' : recentAvg < olderAvg - 2 ? 'down' : 'stable'
    
    return {
      totalStudents,
      totalClasses,
      averageAttendance,
      attendanceTrend,
      topPerformers: topPerformers.slice(0, 5),
      lowPerformers: lowPerformers.slice(0, 5),
      classPerformance: classPerformance.slice(0, 10),
      dailyAttendance,
      departmentStats
    }
  }

  // Export analytics data
  const exportData = async (format: 'csv' | 'pdf') => {
    if (!analyticsData) return
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'analytics_export',
          format,
          data: analyticsData,
          timeRange: selectedTimeRange,
          department: selectedDepartment
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics_${format}_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Export Successful",
          description: `Analytics data exported as ${format.toUpperCase()}`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export analytics data",
        variant: "destructive"
      })
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedTimeRange, selectedDepartment])

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeRange, selectedDepartment])

  // Get user role
  useEffect(() => {
    const fetchUserRole = async () => {
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
    
    fetchUserRole()
  }, [])

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-green-700 mt-1">Comprehensive attendance insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="computer-science">Computer Science</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="biology">Biology</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-blue-800">{analyticsData.totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Average Attendance</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold text-green-800">
                        {analyticsData.averageAttendance.toFixed(1)}%
                      </p>
                      {analyticsData.attendanceTrend === 'up' && (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      )}
                      {analyticsData.attendanceTrend === 'down' && (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Total Classes</p>
                    <p className="text-3xl font-bold text-purple-800">{analyticsData.totalClasses}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Trend</p>
                    <p className="text-lg font-bold text-orange-800 capitalize">
                      {analyticsData.attendanceTrend}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Detailed Analytics */}
      {analyticsData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <span>Detailed Analytics</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button onClick={() => exportData('csv')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportData('pdf')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="students" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="students">Student Performance</TabsTrigger>
                <TabsTrigger value="classes">Class Performance</TabsTrigger>
                <TabsTrigger value="trends">Attendance Trends</TabsTrigger>
                <TabsTrigger value="departments">Department Stats</TabsTrigger>
              </TabsList>
              
              {/* Student Performance */}
              <TabsContent value="students" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span>Top Performers</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsData.topPerformers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No data available</p>
                      ) : (
                        analyticsData.topPerformers.map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{student.student_name}</p>
                                <p className="text-sm text-green-700">{student.department}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {student.attendance_rate.toFixed(1)}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Low Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span>Needs Attention</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analyticsData.lowPerformers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No data available</p>
                      ) : (
                        analyticsData.lowPerformers.map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                                !
                              </div>
                              <div>
                                <p className="font-medium">{student.student_name}</p>
                                <p className="text-sm text-green-700">{student.department}</p>
                              </div>
                            </div>
                            <Badge variant="destructive">
                              {student.attendance_rate.toFixed(1)}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Class Performance */}
              <TabsContent value="classes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                      <span>Class Attendance Rates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.classPerformance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No class data available</p>
                      ) : (
                        analyticsData.classPerformance.map((cls, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{cls.class_name}</p>
                              <p className="text-sm text-green-700">{cls.total_sessions} sessions</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    cls.attendance_rate >= 80 ? 'bg-green-500' :
                                    cls.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(cls.attendance_rate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {cls.attendance_rate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Attendance Trends */}
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span>Daily Attendance Trend</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.dailyAttendance.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No trend data available</p>
                      ) : (
                        analyticsData.dailyAttendance.slice(-14).map((day, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                              <p className="text-sm text-green-700">
                                {day.attendance_count} of {day.total_expected} present
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ 
                                    width: `${day.total_expected > 0 ? (day.attendance_count / day.total_expected) * 100 : 0}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {day.total_expected > 0 ? ((day.attendance_count / day.total_expected) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Department Stats */}
              <TabsContent value="departments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      <span>Department Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analyticsData.departmentStats.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 col-span-2">No department data available</p>
                      ) : (
                        analyticsData.departmentStats.map((dept, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg capitalize">{dept.department}</h3>
                              <Badge variant="outline">
                                {dept.total_students} students
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Average Attendance</span>
                                <span className="font-medium">{dept.average_attendance.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    dept.average_attendance >= 80 ? 'bg-green-500' :
                                    dept.average_attendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(dept.average_attendance, 100)}%` }}
                                />
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
