"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  Download, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  BarChart3,
  FileText
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late';
  teacher: string;
  time: string;
}

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<any>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const router = useRouter();

  // Animation refs
  const cardRef = useAdvanced3D({ tiltIntensity: 5 });
  const titleRef = useScrollAnimation('fadeInUp');
  const chartRef = useScrollAnimation('slideInLeft');

  useEffect(() => {
    loadAttendanceData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [filter, records]);

  const loadAttendanceData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth');
        return;
      }

      // Load overall attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setAttendance(attendanceData);

      // Load detailed attendance records
      const { data: recordsData } = await supabase
        .from('attendance_records')
        .select(`
          *,
          attendance_sessions!inner(
            class_id,
            faculty_id,
            start_time
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      // Transform the data
      const formattedRecords: AttendanceRecord[] = (recordsData || []).map(record => ({
        id: record.id,
        date: new Date(record.scan_timestamp).toLocaleDateString(),
        subject: record.attendance_sessions.class_id,
        status: record.status,
        teacher: 'Faculty', // Would need to join with profiles table for actual name
        time: new Date(record.scan_timestamp).toLocaleTimeString()
      }));

      setRecords(formattedRecords);

    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (filter !== 'all') {
      filtered = records.filter(record => record.status === filter);
    }

    setFilteredRecords(filtered);
  };

  const downloadReport = async () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Subject', 'Status', 'Teacher', 'Time'];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => [
          record.date,
          record.subject,
          record.status,
          record.teacher,
          record.time
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateWeeklyStats = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyRecords = records.filter(record => 
      new Date(record.date) >= oneWeekAgo
    );

    const present = weeklyRecords.filter(r => r.status === 'present').length;
    const total = weeklyRecords.length;
    
    return { present, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="loading-animation text-blue-600">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const attendancePercentage = attendance?.percentage || 0;
  const weeklyStats = calculateWeeklyStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={titleRef as React.RefObject<HTMLDivElement>} className="mb-8 pt-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track your attendance record and download reports
              </p>
            </div>
            <Button onClick={downloadReport} className="magnetic-button flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Overall Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {attendancePercentage}%
                </div>
                <Progress value={attendancePercentage} className="h-2" />
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {attendance?.present_classes || 0} / {attendance?.total_classes || 0} classes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {weeklyStats.percentage}%
                </div>
                <Progress value={weeklyStats.percentage} className="h-2" />
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {weeklyStats.present} / {weeklyStats.total} classes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Present Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {attendance?.present_classes || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Attended
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Absent Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {attendance?.absent_classes || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Missed
                  </div>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Attendance Chart */}
          <div className="lg:col-span-3">
            <Card ref={chartRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Attendance Records
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="all">All Records</option>
                      <option value="present">Present Only</option>
                      <option value="absent">Absent Only</option>
                      <option value="late">Late Only</option>
                    </select>
                  </div>
                </div>
                <CardDescription>
                  Detailed attendance history ({filteredRecords.length} records)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(record.status)}
                          <div>
                            <h3 className="font-semibold">{record.subject}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {record.teacher} • {record.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{record.date}</div>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No attendance records found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Classes</span>
                  <Badge variant="outline">
                    {attendance?.total_classes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Present</span>
                  <Badge className="bg-green-100 text-green-800">
                    {attendance?.present_classes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Absent</span>
                  <Badge className="bg-red-100 text-red-800">
                    {attendance?.absent_classes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Percentage</span>
                  <Badge className={`${attendancePercentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {attendancePercentage}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={downloadReport}
                  className="w-full justify-start liquid-button"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
                <Button
                  onClick={() => router.push('/student/qr-scanner')}
                  className="w-full justify-start magnetic-button"
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
                <Button
                  onClick={() => router.push('/student-dashboard')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Attendance Goal */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Attendance Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">75%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Minimum Required</div>
                  </div>
                  <Progress value={Math.min((attendancePercentage / 75) * 100, 100)} className="h-2" />
                  <div className="text-sm text-center">
                    {attendancePercentage >= 75 ? (
                      <span className="text-green-600">✓ Goal achieved!</span>
                    ) : (
                      <span className="text-red-600">
                        {Math.ceil((75 * (attendance?.total_classes || 0) / 100) - (attendance?.present_classes || 0))} more classes needed
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
