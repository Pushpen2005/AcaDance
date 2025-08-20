'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, MapPin, Activity, Eye, UserCheck, UserX, 
  AlertCircle, CheckCircle, RefreshCw, Search, Filter,
  Download, BarChart3, TrendingUp, Calendar, Bell
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AttendanceSession {
  id: string;
  class_name: string;
  subject: string;
  room: string;
  start_time: string;
  end_time: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  status: 'active' | 'completed' | 'upcoming';
  qr_code: string;
  location_required: boolean;
}

interface StudentAttendance {
  id: string;
  student_id: string;
  student_name: string;
  check_in_time: string;
  status: 'present' | 'absent' | 'late';
  location_verified: boolean;
  device_info: string;
}

interface LiveStats {
  totalSessions: number;
  activeSessions: number;
  totalStudents: number;
  averageAttendance: number;
  recentActivity: any[];
}

export default function FacultyLiveMonitorPage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchLiveStats();
      // Set up real-time subscription
      const subscription = supabase
        .channel('attendance_monitor')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        }, () => {
          fetchSessions();
          fetchLiveStats();
          if (selectedSession) {
            fetchAttendanceData(selectedSession.id);
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, selectedSession?.id]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_records(count)
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedSessions = data?.map(session => ({
        ...session,
        present_count: session.attendance_records?.filter((r: any) => r.status === 'present').length || 0,
        absent_count: session.attendance_records?.filter((r: any) => r.status === 'absent').length || 0,
        late_count: session.attendance_records?.filter((r: any) => r.status === 'late').length || 0,
      })) || [];

      setSessions(processedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async () => {
    if (!user) return;

    try {
      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('faculty_id', user.id);

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('faculty_id', user.id)
        .eq('status', 'active');

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('attendance_records')
        .select(`
          *,
          attendance_sessions(class_name, subject),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setLiveStats({
        totalSessions: totalSessions || 0,
        activeSessions: activeSessions || 0,
        totalStudents: 0, // Will be calculated based on enrolled students
        averageAttendance: 85, // Calculate from actual data
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  const fetchAttendanceData = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles(full_name, student_id)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedData = data?.map(record => ({
        id: record.id,
        student_id: record.profiles?.student_id || '',
        student_name: record.profiles?.full_name || '',
        check_in_time: record.created_at,
        status: record.status,
        location_verified: record.location_verified || false,
        device_info: record.device_info || ''
      })) || [];

      setAttendanceData(processedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-in-left flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Live Attendance Monitor
          </h1>
          <p className="text-gray-600 animate-slide-in-right">
            Real-time monitoring of attendance sessions and student check-ins
          </p>
        </div>

        {/* Live Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Sessions',
              value: liveStats.totalSessions,
              icon: Calendar,
              color: 'blue',
              change: '+12%'
            },
            {
              title: 'Active Sessions',
              value: liveStats.activeSessions,
              icon: Activity,
              color: 'green',
              change: '+3'
            },
            {
              title: 'Total Students',
              value: liveStats.totalStudents,
              icon: Users,
              color: 'purple',
              change: '+5%'
            },
            {
              title: 'Avg Attendance',
              value: `${liveStats.averageAttendance}%`,
              icon: TrendingUp,
              color: 'orange',
              change: '+2%'
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
                    <p className={`text-sm font-medium text-${stat.color}-600`}>
                      {stat.change} from last week
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <Card className="animate-slide-in-left glass-effect">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Attendance Sessions
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchSessions}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Search and Filter */}
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredSessions.map((session, index) => (
                    <div
                      key={session.id}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                        ${selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                        animate-slide-in-up
                      `}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        setSelectedSession(session);
                        fetchAttendanceData(session.id);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{session.class_name}</h4>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{session.subject}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {session.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(session.start_time).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.present_count}/{session.total_students}
                        </div>
                      </div>
                      
                      {/* Attendance Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Attendance Progress</span>
                          <span>{Math.round((session.present_count / session.total_students) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(session.present_count / session.total_students) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredSessions.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">No sessions found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Attendance Details */}
          <div className="space-y-6">
            {selectedSession ? (
              <>
                {/* Session Details */}
                <Card className="animate-slide-in-right glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Session Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedSession.class_name}</h4>
                        <p className="text-sm text-gray-600">{selectedSession.subject}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Room:</span>
                          <p className="font-medium">{selectedSession.room}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <Badge className={getStatusColor(selectedSession.status)}>
                            {selectedSession.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">Start Time:</span>
                          <p className="font-medium">
                            {new Date(selectedSession.start_time).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">End Time:</span>
                          <p className="font-medium">
                            {new Date(selectedSession.end_time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="flex items-center justify-center mb-1">
                              <UserCheck className="h-4 w-4 text-green-600 mr-1" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{selectedSession.present_count}</p>
                            <p className="text-xs text-gray-500">Present</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center mb-1">
                              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{selectedSession.late_count}</p>
                            <p className="text-xs text-gray-500">Late</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-center mb-1">
                              <UserX className="h-4 w-4 text-red-600 mr-1" />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{selectedSession.absent_count}</p>
                            <p className="text-xs text-gray-500">Absent</p>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Attendance List */}
                <Card className="animate-slide-in-right glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Live Check-ins
                      <Badge className="ml-auto animate-pulse bg-green-500">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {attendanceData.map((attendance, index) => (
                        <div
                          key={attendance.id}
                          className={`
                            p-3 border border-gray-200 rounded-lg
                            animate-slide-in-up
                          `}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{attendance.student_name}</h5>
                            <Badge className={getAttendanceStatusColor(attendance.status)}>
                              {attendance.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{attendance.student_id}</span>
                            <span>{new Date(attendance.check_in_time).toLocaleTimeString()}</span>
                          </div>
                          {attendance.location_verified && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Location verified
                            </div>
                          )}
                        </div>
                      ))}

                      {attendanceData.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">No check-ins yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="animate-slide-in-right glass-effect">
                <CardContent className="text-center py-16">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Session</h3>
                  <p className="text-gray-500">Choose a session from the list to view live attendance details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
