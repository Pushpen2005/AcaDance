"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  QrCode, 
  Users, 
  Bell, 
  User, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  Plus,
  Monitor
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Animation refs
  const headerRef = useAdvanced3D({ tiltIntensity: 5 });
  const statsRef = useScrollAnimation('fadeInUp');
  const classesRef = useScrollAnimation('slideInLeft');

  useEffect(() => {
    loadFacultyData();
  }, []);

  const loadFacultyData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth');
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'faculty') {
        router.push('/setup-profile');
        return;
      }

      setProfile(profileData);

      // Load active attendance sessions
      const { data: sessionsData } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setActiveSessions(sessionsData || []);

      // Load today's classes from timetable
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const { data: classesData } = await supabase
        .from('timetables')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('day', today)
        .order('start_time');

      setTodayClasses(classesData || []);

      // Load recent attendance records
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select(`
          *,
          attendance_sessions!inner(
            class_id,
            faculty_id
          ),
          profiles!attendance_records_student_id_fkey(
            full_name
          )
        `)
        .eq('attendance_sessions.faculty_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentAttendance(attendanceData || []);

      // Calculate stats
      const totalSessions = await supabase
        .from('attendance_sessions')
        .select('id', { count: 'exact' })
        .eq('faculty_id', user.id);

      const todaySessionsCount = await supabase
        .from('attendance_sessions')
        .select('id', { count: 'exact' })
        .eq('faculty_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const totalStudentsInSessions = await supabase
        .from('attendance_records')
        .select('student_id', { count: 'exact' })
        .in('session_id', (sessionsData || []).map(s => s.id));

      setStats({
        totalSessions: totalSessions.count || 0,
        todaySessions: todaySessionsCount.count || 0,
        activeNow: sessionsData?.length || 0,
        totalStudents: totalStudentsInSessions.count || 0
      });

    } catch (error) {
      console.error('Error loading faculty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAttendanceSession = () => {
    router.push('/faculty/create-session');
  };

  const viewLiveMonitor = () => {
    router.push('/faculty/live-monitor');
  };

  const viewReports = () => {
    router.push('/faculty/reports');
  };

  const manageClasses = () => {
    router.push('/faculty/classes');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div ref={headerRef as React.RefObject<HTMLDivElement>} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {profile?.department} • Faculty Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={createAttendanceSession}
                className="magnetic-button flex items-center gap-2"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Create Session
              </Button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div ref={statsRef as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    All time
                  </div>
                </div>
                <QrCode className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Today's Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.todaySessions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Created today
                  </div>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.activeNow}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Live sessions
                  </div>
                </div>
                <Monitor className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Students */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Students Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    All sessions
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Classes */}
          <div className="lg:col-span-2">
            <Card ref={classesRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Classes
                  </CardTitle>
                  <Button variant="outline" onClick={manageClasses}>
                    Manage Classes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayClasses.length > 0 ? (
                    todayClasses.map((classItem, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-12 bg-blue-500 rounded"></div>
                          <div>
                            <h3 className="font-semibold">{classItem.subject}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {classItem.batch} • {classItem.room}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{classItem.start_time} - {classItem.end_time}</div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={createAttendanceSession}>
                              <QrCode className="w-4 h-4 mr-1" />
                              Create QR
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No classes scheduled for today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <Card className="glass-card animated-border mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Active Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <h3 className="font-semibold">{session.class_id}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Started: {new Date(session.start_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={viewLiveMonitor}>
                            <Monitor className="w-4 h-4 mr-1" />
                            Monitor
                          </Button>
                          <Button size="sm" variant="outline">
                            <QrCode className="w-4 h-4 mr-1" />
                            Show QR
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={createAttendanceSession}
                  className="w-full justify-start liquid-button"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Create QR Session
                </Button>
                <Button
                  onClick={viewLiveMonitor}
                  className="w-full justify-start magnetic-button"
                  variant="outline"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Live Monitor
                </Button>
                <Button
                  onClick={viewReports}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button
                  onClick={manageClasses}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Classes
                </Button>
                <Button
                  onClick={() => router.push('/faculty/profile')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Profile Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {record.status === 'present' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <h4 className="font-medium text-sm">{record.profiles?.full_name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {record.attendance_sessions?.class_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No recent attendance
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Classes Scheduled</span>
                    <Badge variant="outline">
                      {todayClasses.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sessions Created</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {stats.todaySessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Now</span>
                    <Badge className="bg-green-100 text-green-800">
                      {stats.activeNow}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attendance Marked</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {recentAttendance.filter(r => 
                        new Date(r.created_at).toDateString() === new Date().toDateString()
                      ).length}
                    </Badge>
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
