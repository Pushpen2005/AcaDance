'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, PieChart, TrendingUp, Download, Calendar, 
  Users, Clock, Filter, Search, FileSpreadsheet, 
  FileText, Printer, Share2, AlertTriangle, CheckCircle,
  Target, Award, BookOpen, GraduationCap
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AttendanceReport {
  student_id: string;
  student_name: string;
  total_classes: number;
  attended_classes: number;
  attendance_percentage: number;
  late_count: number;
  absent_count: number;
  department: string;
  semester: string;
}

interface ClassReport {
  id: string;
  class_name: string;
  subject: string;
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

interface ReportFilters {
  dateRange: 'week' | 'month' | 'semester' | 'custom';
  startDate: string;
  endDate: string;
  class: string;
  department: string;
  semester: string;
}

export default function FacultyReportsPage() {
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([]);
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'classes' | 'analytics'>('attendance');
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    class: 'all',
    department: 'all',
    semester: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    totalClasses: 0,
    lowAttendanceCount: 0
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, filters]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = filters.endDate || new Date().toISOString().split('T')[0];
      let startDate = filters.startDate;
      
      if (!startDate) {
        const end = new Date(endDate);
        switch (filters.dateRange) {
          case 'week':
            end.setDate(end.getDate() - 7);
            break;
          case 'month':
            end.setMonth(end.getMonth() - 1);
            break;
          case 'semester':
            end.setMonth(end.getMonth() - 6);
            break;
        }
        startDate = end.toISOString().split('T')[0];
      }

      // Fetch attendance reports
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_reports_view') // Assuming a view that aggregates attendance data
        .select('*')
        .eq('faculty_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // Fetch class reports
      const { data: classData, error: classError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          class_name,
          subject,
          created_at,
          total_students,
          attendance_records(count)
        `)
        .eq('faculty_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (classError) throw classError;

      // Process class data
      const processedClassData = classData?.map(session => {
        const presentCount = session.attendance_records?.filter((r: any) => r.status === 'present').length || 0;
        const lateCount = session.attendance_records?.filter((r: any) => r.status === 'late').length || 0;
        const absentCount = session.total_students - presentCount - lateCount;
        
        return {
          id: session.id,
          class_name: session.class_name,
          subject: session.subject,
          date: session.created_at,
          total_students: session.total_students,
          present_count: presentCount,
          absent_count: absentCount,
          late_count: lateCount,
          attendance_percentage: session.total_students > 0 ? (presentCount / session.total_students) * 100 : 0
        };
      }) || [];

      setAttendanceReports(attendanceData || []);
      setClassReports(processedClassData);

      // Calculate summary
      const totalStudents = new Set(attendanceData?.map(r => r.student_id)).size || 0;
      const averageAttendance = attendanceData?.length > 0 
        ? attendanceData.reduce((sum, r) => sum + r.attendance_percentage, 0) / attendanceData.length 
        : 0;
      const lowAttendanceCount = attendanceData?.filter(r => r.attendance_percentage < 75).length || 0;

      setSummary({
        totalStudents,
        averageAttendance,
        totalClasses: processedClassData.length,
        lowAttendanceCount
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    // In a real application, you would use a library like jsPDF or html2pdf
    alert('PDF export functionality would be implemented here');
  };

  const filteredAttendanceReports = attendanceReports.filter(report => {
    const matchesSearch = report.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filters.department === 'all' || report.department === filters.department;
    const matchesSemester = filters.semester === 'all' || report.semester === filters.semester;
    
    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const filteredClassReports = classReports.filter(report => {
    const matchesSearch = report.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filters.class === 'all' || report.class_name === filters.class;
    
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-in-left flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 animate-slide-in-right">
            Generate detailed reports and analyze attendance patterns
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Students',
              value: summary.totalStudents,
              icon: Users,
              color: 'blue',
              description: 'Active students'
            },
            {
              title: 'Average Attendance',
              value: `${summary.averageAttendance.toFixed(1)}%`,
              icon: Target,
              color: 'green',
              description: 'Overall performance'
            },
            {
              title: 'Total Classes',
              value: summary.totalClasses,
              icon: BookOpen,
              color: 'purple',
              description: 'Classes conducted'
            },
            {
              title: 'Low Attendance',
              value: summary.lowAttendanceCount,
              icon: AlertTriangle,
              color: 'red',
              description: 'Students < 75%'
            }
          ].map((stat, index) => (
            <Card 
              key={stat.title}
              className={`animate-slide-in-up glass-effect hover:shadow-lg transition-all duration-200`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm text-${stat.color}-600`}>{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6 animate-slide-in-up glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="semester">This Semester</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 animate-slide-in-up">
          {[
            { id: 'attendance', label: 'Student Attendance', icon: Users },
            { id: 'classes', label: 'Class Reports', icon: BookOpen },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'outline'}
              onClick={() => setActiveTab(id as any)}
              className="transition-all duration-200"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'attendance' && (
          <Card className="animate-slide-in-up glass-effect">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Student Attendance Reports</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportToCSV(filteredAttendanceReports, 'attendance_report')}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Student ID</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Semester</th>
                      <th className="text-center p-3 font-medium">Total Classes</th>
                      <th className="text-center p-3 font-medium">Attended</th>
                      <th className="text-center p-3 font-medium">Late</th>
                      <th className="text-center p-3 font-medium">Attendance %</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceReports.map((report, index) => (
                      <tr 
                        key={report.student_id}
                        className={`border-b hover:bg-gray-50 animate-slide-in-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-3">{report.student_id}</td>
                        <td className="p-3 font-medium">{report.student_name}</td>
                        <td className="p-3">{report.department}</td>
                        <td className="p-3">{report.semester}</td>
                        <td className="p-3 text-center">{report.total_classes}</td>
                        <td className="p-3 text-center">{report.attended_classes}</td>
                        <td className="p-3 text-center">{report.late_count}</td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${
                            report.attendance_percentage >= 90 ? 'text-green-600' :
                            report.attendance_percentage >= 75 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {report.attendance_percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={
                            report.attendance_percentage >= 90 ? 'bg-green-100 text-green-800' :
                            report.attendance_percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {report.attendance_percentage >= 90 ? 'Excellent' :
                             report.attendance_percentage >= 75 ? 'Good' : 'Low'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAttendanceReports.length === 0 && (
                  <div className="text-center py-16">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No attendance data available for the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'classes' && (
          <Card className="animate-slide-in-up glass-effect">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Class Attendance Reports</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportToCSV(filteredClassReports, 'class_report')}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Class</th>
                      <th className="text-left p-3 font-medium">Subject</th>
                      <th className="text-center p-3 font-medium">Total Students</th>
                      <th className="text-center p-3 font-medium">Present</th>
                      <th className="text-center p-3 font-medium">Late</th>
                      <th className="text-center p-3 font-medium">Absent</th>
                      <th className="text-center p-3 font-medium">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClassReports.map((report, index) => (
                      <tr 
                        key={report.id}
                        className={`border-b hover:bg-gray-50 animate-slide-in-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-3">{new Date(report.date).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{report.class_name}</td>
                        <td className="p-3">{report.subject}</td>
                        <td className="p-3 text-center">{report.total_students}</td>
                        <td className="p-3 text-center text-green-600">{report.present_count}</td>
                        <td className="p-3 text-center text-yellow-600">{report.late_count}</td>
                        <td className="p-3 text-center text-red-600">{report.absent_count}</td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${
                            report.attendance_percentage >= 90 ? 'text-green-600' :
                            report.attendance_percentage >= 75 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {report.attendance_percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredClassReports.length === 0 && (
                  <div className="text-center py-16">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No class data available for the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-slide-in-left glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Attendance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Chart would be rendered here</p>
                    <p className="text-sm text-gray-400">Using a charting library like Chart.js or Recharts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-slide-in-right glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Attendance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Trend chart would be rendered here</p>
                    <p className="text-sm text-gray-400">Showing attendance patterns over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 animate-slide-in-up glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-green-800">High Performers</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {attendanceReports.filter(r => r.attendance_percentage >= 90).length}
                    </p>
                    <p className="text-sm text-green-600">Students with 90%+ attendance</p>
                  </div>
                  
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Average Performers</h4>
                    <p className="text-2xl font-bold text-yellow-600">
                      {attendanceReports.filter(r => r.attendance_percentage >= 75 && r.attendance_percentage < 90).length}
                    </p>
                    <p className="text-sm text-yellow-600">Students with 75-89% attendance</p>
                  </div>
                  
                  <div className="text-center p-6 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <h4 className="font-medium text-red-800">At Risk</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {attendanceReports.filter(r => r.attendance_percentage < 75).length}
                    </p>
                    <p className="text-sm text-red-600">Students with &lt;75% attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
