"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Database
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Animation refs
  const headerRef = useAdvanced3D({ tiltIntensity: 5 });
  const statsRef = useScrollAnimation('fadeInUp');
  const activityRef = useScrollAnimation('slideInLeft');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
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

      if (!profileData || profileData.role !== 'admin') {
        router.push('/setup-profile');
        return;
      }

      setProfile(profileData);

      // Load system statistics
      const [
        { count: totalUsers },
        { count: totalStudents },
        { count: totalFaculty },
        { count: totalSessions },
        { count: activeSessions }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'faculty'),
        supabase.from('attendance_sessions').select('id', { count: 'exact' }),
        supabase.from('attendance_sessions').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      // Load overall attendance statistics
      const { data: attendanceStats } = await supabase
        .from('attendance')
        .select('present_classes, total_classes');

      const totalClasses = attendanceStats?.reduce((sum, record) => sum + (record.total_classes || 0), 0) || 0;
      const totalPresent = attendanceStats?.reduce((sum, record) => sum + (record.present_classes || 0), 0) || 0;
      const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalStudents: totalStudents || 0,
        totalFaculty: totalFaculty || 0,
        totalSessions: totalSessions || 0,
        activeSessions: activeSessions || 0,
        overallAttendance,
        totalClasses,
        totalPresent
      });

      // Load active sessions with details
      const { data: activeSessionsData } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          profiles!attendance_sessions_faculty_id_fkey(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setActiveSessions(activeSessionsData || []);

      // Load recent activity (attendance records)
      const { data: activityData } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles!attendance_records_student_id_fkey(full_name),
          attendance_sessions!inner(class_id, profiles!attendance_sessions_faculty_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(activityData || []);

      // Generate alerts based on data
      const generatedAlerts = [];
      
      // Low attendance alert
      if (overallAttendance < 75) {
        generatedAlerts.push({
          type: 'warning',
          title: 'Low Overall Attendance',
          message: `System-wide attendance is ${overallAttendance}%, below the 75% threshold`,
          timestamp: new Date().toISOString()
        });
      }

      // High active sessions alert
      if ((activeSessions || 0) > 10) {
        generatedAlerts.push({
          type: 'info',
          title: 'High Activity',
          message: `${activeSessions || 0} attendance sessions are currently active`,
          timestamp: new Date().toISOString()
        });
      }

      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                System Overview & Management • {profile?.full_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateTo('/admin/alerts')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Alerts ({alerts.length})
              </Button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div ref={statsRef as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    System-wide
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalStudents}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Active learners
                  </div>
                </div>
                <GraduationCap className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Faculty */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Faculty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalFaculty}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Teaching staff
                  </div>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* Overall Attendance */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Overall Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.overallAttendance}%
                </div>
                <Progress value={stats.overallAttendance} className="h-2" />
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stats.totalPresent} / {stats.totalClasses} classes
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <Card className="glass-card animated-border border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-5 h-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      alert.type === 'error' ? 'bg-red-50 border-red-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Sessions */}
          <div className="lg:col-span-2">
            <Card ref={activityRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Active Sessions ({stats.activeSessions})
                  </CardTitle>
                  <Button variant="outline" onClick={() => navigateTo('/admin/sessions')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSessions.length > 0 ? (
                    activeSessions.slice(0, 5).map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <h3 className="font-semibold">{session.class_id}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Faculty: {session.profiles?.full_name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Started: {new Date(session.start_time).toLocaleTimeString()}
                          </div>
                          <Badge className="mt-1 bg-green-100 text-green-800">
                            Live
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active attendance sessions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card animated-border mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {activity.status === 'present' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <h4 className="font-medium text-sm">{activity.profiles?.full_name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {activity.attendance_sessions?.class_id} • {activity.attendance_sessions?.profiles?.full_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                  onClick={() => navigateTo('/admin/users')}
                  className="w-full justify-start liquid-button"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button
                  onClick={() => navigateTo('/admin/reports')}
                  className="w-full justify-start magnetic-button"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button
                  onClick={() => navigateTo('/admin/sessions')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Monitor Sessions
                </Button>
                <Button
                  onClick={() => navigateTo('/admin/audit')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Audit Logs
                </Button>
                <Button
                  onClick={() => navigateTo('/admin/settings')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <Badge variant="outline">
                      {stats.activeSessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Time</span>
                    <Badge className="bg-green-100 text-green-800">
                      &lt; 100ms
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-16 h-2" />
                      <span className="text-sm">65%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sessions Created</span>
                    <Badge variant="outline">
                      {stats.activeSessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attendance Marked</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {recentActivity.filter(a => 
                        new Date(a.created_at).toDateString() === new Date().toDateString()
                      ).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Attendance</span>
                    <Badge className={`${stats.overallAttendance >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {stats.overallAttendance}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Alerts</span>
                    <Badge className={`${alerts.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                      {alerts.length}
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
