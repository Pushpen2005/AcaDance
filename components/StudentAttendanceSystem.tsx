'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, QrCode, CheckCircle, AlertTriangle, BookOpen, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  timestamp: string;
  scan_method: 'qr_scan' | 'manual' | 'auto_absent';
  session: {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    qr_code: string;
    qr_expiry: string;
    timetable: {
      course: {
        course_code: string;
        course_name: string;
      };
      room: string;
      building: string;
    };
  };
}

interface AttendanceStats {
  course_id: string;
  course_name: string;
  course_code: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  status: 'good' | 'warning' | 'critical';
}

interface TodaySession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code: string;
  qr_expiry: string;
  session_status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  timetable: {
    course: {
      course_code: string;
      course_name: string;
    };
    faculty: {
      name: string;
    };
    room: string;
    building: string;
  };
  attendance_records?: AttendanceRecord[];
}

const StudentAttendanceSystem: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrScanDialog, setQrScanDialog] = useState<string | null>(null);

  // Real-time subscription for attendance updates
  useEffect(() => {
    const unsubscribe = advancedSupabase.onTableChange(
      'attendance_records',
      (payload: any) => {
        if (payload.new?.student_id === studentId) {
          toast.success('Attendance marked successfully!');
          refreshData();
        }
      }
    );

    return unsubscribe;
  }, [studentId]);

  // Fetch student's attendance statistics
  const fetchAttendanceStats = useCallback(async () => {
    try {
      const { data: enrollments } = await advancedSupabase.query(
        `
        SELECT 
          courses.id as course_id,
          courses.course_name,
          courses.course_code,
          (
            SELECT COUNT(*)
            FROM attendance_sessions 
            JOIN timetables ON attendance_sessions.timetable_id = timetables.id
            WHERE timetables.course_id = courses.id 
            AND attendance_sessions.session_status = 'completed'
          ) as total_sessions,
          (
            SELECT COUNT(*)
            FROM attendance_records 
            JOIN attendance_sessions ON attendance_records.session_id = attendance_sessions.id
            JOIN timetables ON attendance_sessions.timetable_id = timetables.id
            WHERE attendance_records.student_id = $1
            AND timetables.course_id = courses.id
            AND attendance_records.status IN ('present', 'late')
          ) as attended_sessions
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        WHERE enrollments.student_id = $1 AND enrollments.is_active = true
        `,
        [studentId]
      );

      const statsWithPercentage = enrollments?.map((stat: any) => ({
        ...stat,
        attendance_percentage: stat.total_sessions > 0 
          ? Math.round((stat.attended_sessions / stat.total_sessions) * 100) 
          : 0,
        status: stat.total_sessions > 0 
          ? (stat.attended_sessions / stat.total_sessions) >= 0.85 ? 'good'
          : (stat.attended_sessions / stat.total_sessions) >= 0.75 ? 'warning'
          : 'critical'
          : 'good'
      })) || [];

      setAttendanceStats(statsWithPercentage);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      toast.error('Failed to fetch attendance statistics');
    }
  }, [studentId]);

  // Fetch today's sessions
  const fetchTodaySessions = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: sessions } = await advancedSupabase.query(
        `
        SELECT 
          attendance_sessions.*,
          timetables.room,
          timetables.building,
          courses.course_name,
          courses.course_code,
          faculty.name as faculty_name,
          COALESCE(
            json_agg(
              json_build_object(
                'id', attendance_records.id,
                'status', attendance_records.status,
                'timestamp', attendance_records.timestamp
              )
            ) FILTER (WHERE attendance_records.id IS NOT NULL), 
            '[]'
          ) as attendance_records
        FROM attendance_sessions
        JOIN timetables ON attendance_sessions.timetable_id = timetables.id
        JOIN courses ON timetables.course_id = courses.id
        JOIN users faculty ON timetables.faculty_id = faculty.id
        JOIN enrollments ON courses.id = enrollments.course_id
        LEFT JOIN attendance_records ON attendance_sessions.id = attendance_records.session_id 
          AND attendance_records.student_id = $1
        WHERE enrollments.student_id = $1 
        AND attendance_sessions.session_date = $2
        AND enrollments.is_active = true
        GROUP BY attendance_sessions.id, timetables.room, timetables.building, 
                 courses.course_name, courses.course_code, faculty.name
        ORDER BY attendance_sessions.start_time
        `,
        [studentId, today]
      );

      const transformedSessions = sessions?.map((session: any) => ({
        ...session,
        timetable: {
          course: {
            course_code: session.course_code,
            course_name: session.course_name
          },
          faculty: {
            name: session.faculty_name
          },
          room: session.room,
          building: session.building
        }
      })) || [];

      setTodaySessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching today sessions:', error);
      toast.error('Failed to fetch today\'s sessions');
    }
  }, [studentId]);

  // Fetch recent attendance records
  const fetchRecentAttendance = useCallback(async () => {
    try {
      const { data: records } = await advancedSupabase.query(
        `
        SELECT 
          attendance_records.*,
          attendance_sessions.session_date,
          attendance_sessions.start_time,
          attendance_sessions.end_time,
          timetables.room,
          timetables.building,
          courses.course_name,
          courses.course_code
        FROM attendance_records
        JOIN attendance_sessions ON attendance_records.session_id = attendance_sessions.id
        JOIN timetables ON attendance_sessions.timetable_id = timetables.id
        JOIN courses ON timetables.course_id = courses.id
        WHERE attendance_records.student_id = $1
        ORDER BY attendance_records.timestamp DESC
        LIMIT 10
        `,
        [studentId]
      );

      const transformedRecords = records?.map((record: any) => ({
        ...record,
        session: {
          id: record.session_id,
          session_date: record.session_date,
          start_time: record.start_time,
          end_time: record.end_time,
          qr_code: record.qr_code,
          qr_expiry: record.qr_expiry,
          timetable: {
            course: {
              course_code: record.course_code,
              course_name: record.course_name
            },
            room: record.room,
            building: record.building
          }
        }
      })) || [];

      setRecentAttendance(transformedRecords);
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
      toast.error('Failed to fetch recent attendance');
    }
  }, [studentId]);

  // Mark attendance via QR code
  const markAttendanceWithQR = async (sessionId: string, qrCode: string) => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_code: qrCode,
          user_id: studentId,
          location: null // Could add geolocation here
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Attendance marked successfully!');
        await refreshData();
      } else {
        toast.error(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setRefreshing(false);
      setQrScanDialog(null);
    }
  };

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAttendanceStats(),
        fetchTodaySessions(),
        fetchRecentAttendance()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAttendanceStats, fetchTodaySessions, fetchRecentAttendance]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };

    if (studentId) {
      loadData();
    }
  }, [studentId, refreshData]);

  // Get session status for UI
  const getSessionStatus = (session: TodaySession) => {
    const now = new Date();
    const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
    const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
    
    const hasAttendance = session.attendance_records && session.attendance_records.length > 0;
    
    if (hasAttendance) return 'completed';
    if (now < sessionStart) return 'upcoming';
    if (now >= sessionStart && now <= sessionEnd) return 'active';
    return 'missed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading attendance data...
      </div>
    );
  }

  const overallAttendance = attendanceStats.length > 0 
    ? Math.round(attendanceStats.reduce((sum, stat) => sum + stat.attendance_percentage, 0) / attendanceStats.length)
    : 0;

  const criticalCourses = attendanceStats.filter(stat => stat.status === 'critical').length;
  const todayPending = todaySessions.filter(session => getSessionStatus(session) === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance System</h2>
          <p className="text-muted-foreground">Real-time attendance tracking and analytics</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
                <p className="text-2xl font-bold">{overallAttendance}%</p>
              </div>
              <CheckCircle className={`w-8 h-8 ${overallAttendance >= 85 ? 'text-green-500' : overallAttendance >= 75 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sessions</p>
                <p className="text-2xl font-bold">{todaySessions.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Check-ins</p>
                <p className="text-2xl font-bold">{todayPending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Courses</p>
                <p className="text-2xl font-bold">{criticalCourses}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Sessions</TabsTrigger>
          <TabsTrigger value="statistics">Course Statistics</TabsTrigger>
          <TabsTrigger value="history">Recent History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todaySessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sessions today</h3>
                <p className="text-muted-foreground">You have no scheduled classes for today.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {todaySessions.map((session) => {
                const status = getSessionStatus(session);
                const hasAttendance = session.attendance_records && session.attendance_records.length > 0;
                
                return (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            status === 'completed' ? 'bg-green-500' :
                            status === 'active' ? 'bg-blue-500' :
                            status === 'upcoming' ? 'bg-gray-400' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold">{session.timetable.course.course_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {session.start_time} - {session.end_time} • {session.timetable.faculty.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {session.timetable.room}, {session.timetable.building}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {hasAttendance ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {session.attendance_records![0].status === 'late' ? 'Late' : 'Present'}
                            </Badge>
                          ) : status === 'active' ? (
                            <Button 
                              onClick={() => markAttendanceWithQR(session.id, session.qr_code)}
                              disabled={refreshing}
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Mark Attendance
                            </Button>
                          ) : status === 'upcoming' ? (
                            <Badge variant="outline">Upcoming</Badge>
                          ) : status === 'missed' ? (
                            <Badge variant="destructive">Missed</Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {attendanceStats.map((stat) => (
            <Card key={stat.course_id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{stat.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{stat.course_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stat.attendance_percentage}%</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.attended_sessions}/{stat.total_sessions} sessions
                      </p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={stat.attendance_percentage} 
                    className={`h-3 ${
                      stat.status === 'critical' ? '[&>div]:bg-red-500' :
                      stat.status === 'warning' ? '[&>div]:bg-yellow-500' : 
                      '[&>div]:bg-green-500'
                    }`}
                  />
                  
                  {stat.status === 'critical' && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Attendance below 75%. Attend all remaining sessions to avoid shortage.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {stat.status === 'warning' && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Attendance below 85%. Consider attending more sessions to improve.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {recentAttendance.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance history</h3>
                <p className="text-muted-foreground">Your recent attendance records will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentAttendance.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{record.session.timetable.course.course_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.session.session_date).toLocaleDateString()} • 
                          {record.session.start_time} - {record.session.end_time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Marked at: {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          record.status === 'present' ? 'default' :
                          record.status === 'late' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(StudentAttendanceSystem);
