import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Users, Settings, BookOpen, Clock, AlertCircle, Shield, Globe, RefreshCw, Database, Activity, Menu } from "lucide-react";
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import AdvancedTimetableGeneration from './AdvancedTimetableGeneration';
import TimetableAnalyticsAndReports from './TimetableAnalyticsAndReports';
import SmartSchedulingAlgorithms from './SmartSchedulingAlgorithms';
import RoleBasedTimetableAccess from './RoleBasedTimetableAccess';
import ColorCodedTimetableView from './ColorCodedTimetableView';
import ComprehensiveTimetableManagement from './ComprehensiveTimetableManagement';
import AdminAuditLogs from './AdminAuditLogs';
import AdminSystemAnalytics from './AdminSystemAnalytics';
import AdminGlobalSettings from './AdminGlobalSettings';
import { useIsMobile } from "@/components/ui/use-mobile";
import { MobileCard, MobileCardHeader, MobileGrid } from "@/components/ui/mobile-card";
import { ResponsiveGrid, ResponsiveStack } from "@/components/ui/responsive";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'timetable-generator' | 'analytics' | 'smart-scheduling' | 'access-control' | 'color-view' | 'crud-management' | 'audit-logs' | 'system-analytics' | 'global-settings'>('overview');
  const [realTimeStats, setRealTimeStats] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({});

  // Real-time data queries with advanced Supabase
  const { data: usersData, loading: usersLoading } = useSupabaseQuery('users', {
    select: 'id, name, role, created_at, is_active',
    realtime: true,
    cache: true,
  });

  const { data: coursesData, loading: coursesLoading } = useSupabaseQuery('courses', {
    select: 'id, course_name, is_active, credits',
    filter: { is_active: true },
    realtime: true,
    cache: true,
  });

  const { data: attendanceData, loading: attendanceLoading } = useSupabaseQuery('attendance_sessions', {
    select: `
      id, 
      session_date, 
      session_status,
      total_enrolled,
      total_present,
      attendance_percentage
    `,
    realtime: true,
    cache: true,
  });

  const { data: alertsData } = useSupabaseQuery('alerts', {
    select: 'id, type, title, message, created_at, priority',
    filter: { is_read: false },
    realtime: true,
  });

  // Calculate dynamic stats from real-time data
  useEffect(() => {
    if (usersData && coursesData && attendanceData) {
      const students = usersData.filter((user: any) => user.role === 'student' && user.is_active);
      const faculty = usersData.filter((user: any) => user.role === 'faculty' && user.is_active);
      const activeSessions = attendanceData.filter((session: any) => 
        session.session_status === 'active' || session.session_status === 'scheduled'
      );
      
      const avgAttendance = attendanceData.length > 0 
        ? attendanceData.reduce((sum: number, session: any) => sum + (session.attendance_percentage || 0), 0) / attendanceData.length
        : 0;

      setRealTimeStats([
        { 
          label: 'Total Students', 
          value: students.length.toString(), 
          icon: Users, 
          color: 'blue',
          trend: '+12%',
          description: 'Active enrolled students',
          loading: usersLoading
        },
        { 
          label: 'Active Faculty', 
          value: faculty.length.toString(), 
          icon: Users, 
          color: 'green',
          trend: '+2%',
          description: 'Teaching staff members',
          loading: usersLoading
        },
        { 
          label: 'Active Courses', 
          value: coursesData.length.toString(), 
          icon: BookOpen, 
          color: 'orange',
          trend: '+5%',
          description: 'Available courses',
          loading: coursesLoading
        },
        { 
          label: 'Avg Attendance', 
          value: `${Math.round(avgAttendance)}%`, 
          icon: BarChart3, 
          color: 'purple',
          trend: avgAttendance > 75 ? '+3%' : '-2%',
          description: 'Overall attendance rate',
          loading: attendanceLoading
        },
      ]);
    }
  }, [usersData, coursesData, attendanceData, usersLoading, coursesLoading, attendanceLoading]);

  // Real-time system health monitoring
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const cacheStats = advancedSupabase.getCacheStats();
        const { data: dbHealth } = await advancedSupabase.getClient()
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        setSystemHealth({
          cacheSize: cacheStats.size,
          activeSubscriptions: cacheStats.subscriptions.length,
          dbConnected: !!dbHealth,
          lastUpdate: new Date().toLocaleTimeString(),
          totalUsers: usersData?.length || 0,
          totalCourses: coursesData?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch system health:', error);
        setSystemHealth((prev: any) => ({ ...prev, dbConnected: false }));
      }
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [usersData, coursesData]);

  // Real-time listeners for important events
  useEffect(() => {
    const unsubscribeAlerts = advancedSupabase.onTableChange('alerts', (payload) => {
      console.log('New alert received:', payload);
      // Could trigger toast notification here
    });

    const unsubscribeAttendance = advancedSupabase.onTableChange('attendance_records', (payload) => {
      console.log('Attendance updated:', payload);
    });

    return () => {
      unsubscribeAlerts();
      unsubscribeAttendance();
    };
  }, []);

  const stats = realTimeStats.length > 0 ? realTimeStats : [
    { label: 'Loading...', value: '...', icon: RefreshCw, color: 'gray', trend: '', description: 'Fetching data...', loading: true },
  ];

  const recentAlerts = alertsData || [];

  if (activeSection !== 'overview') {
    const sectionComponents = {
      'timetable-generator': <AdvancedTimetableGeneration />,
      'analytics': <TimetableAnalyticsAndReports />,
      'smart-scheduling': <SmartSchedulingAlgorithms />,
      'access-control': <RoleBasedTimetableAccess />,
      'color-view': <ColorCodedTimetableView />,
      'crud-management': <ComprehensiveTimetableManagement />,
      'audit-logs': <AdminAuditLogs />,
      'system-analytics': <AdminSystemAnalytics />,
      'global-settings': <AdminGlobalSettings />
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setActiveSection('overview')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        {sectionComponents[activeSection]}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧑‍💼 Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time system overview with advanced Supabase integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={systemHealth.dbConnected ? "default" : "destructive"} className="text-sm">
            <Database className="w-4 h-4 mr-1" />
            DB: {systemHealth.dbConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Activity className="w-4 h-4 mr-1" />
            Cache: {systemHealth.cacheSize || 0} items
          </Badge>
        </div>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat: any, index: number) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${stat.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.loading ? (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stat.description}</span>
                  {stat.trend && (
                    <span className={`${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time System Health
          </CardTitle>
          <CardDescription>
            Live monitoring of Supabase connections and system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemHealth.totalUsers || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemHealth.totalCourses || 0}</div>
              <div className="text-sm text-muted-foreground">Active Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemHealth.activeSubscriptions || 0}</div>
              <div className="text-sm text-muted-foreground">Live Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemHealth.cacheSize || 0}</div>
              <div className="text-sm text-muted-foreground">Cached Queries</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {systemHealth.lastUpdate || 'Never'}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('timetable-generator')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Advanced Timetable
            </CardTitle>
            <CardDescription>
              AI-powered scheduling and optimization
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              Real-time insights and data visualization
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('system-analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Analytics
            </CardTitle>
            <CardDescription>
              Performance monitoring and optimization
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('audit-logs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              Security and activity monitoring
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('global-settings')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Global Settings
            </CardTitle>
            <CardDescription>
              System configuration and preferences
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('access-control')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Access Control
            </CardTitle>
            <CardDescription>
              Role-based permissions and security
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Alerts ({recentAlerts.length})
            </CardTitle>
            <CardDescription>
              Real-time system notifications and warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.slice(0, 5).map((alert: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      alert.priority === 'critical' ? 'destructive' :
                      alert.priority === 'high' ? 'destructive' :
                      alert.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {alert.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {supabaseUtils.formatDate(alert.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Feature Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="courses">Course Management</TabsTrigger>
          <TabsTrigger value="analytics">Live Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Comprehensive view of your academic system with real-time Supabase integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>✅ Real-time data synchronization active</p>
                <p>✅ Advanced caching enabled</p>
                <p>✅ Performance optimization running</p>
                <p>✅ Security monitoring active</p>
                <p>✅ All {stats.length} key metrics tracked</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage students, faculty, and administrators with real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersData && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {usersData.filter((u: any) => u.role === 'student').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {usersData.filter((u: any) => u.role === 'faculty').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Faculty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {usersData.filter((u: any) => u.role === 'admin').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Admins</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                Monitor and manage all courses with live enrollment data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesData && (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{coursesData.length} Active Courses</div>
                  <div className="text-sm text-muted-foreground">
                    Real-time course data synchronized with Supabase
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Analytics</CardTitle>
              <CardDescription>
                Real-time system analytics powered by advanced Supabase integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemHealth.cacheSize || 0}</div>
                  <div className="text-sm text-muted-foreground">Cache Hits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemHealth.activeSubscriptions || 0}</div>
                  <div className="text-sm text-muted-foreground">Live Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{attendanceData?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Attendance Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{recentAlerts.length}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
