import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Calendar, Users, Settings, BookOpen, Clock, AlertCircle, Shield, Globe, RefreshCw, Database, Activity } from "lucide-react";
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

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'timetable-generator' | 'analytics' | 'smart-scheduling' | 'access-control' | 'color-view' | 'crud-management' | 'audit-logs' | 'system-analytics' | 'global-settings'>('overview');

  const { data: statsData } = useSupabaseQuery('stats', {
    select: 'label,value,color',
    order: 'created_at.desc',
    limit: 4,
  });

  const { data: recentAlertsData } = useSupabaseQuery('alerts', {
    select: 'type,message,time',
    order: 'time.desc',
    limit: 3,
  });

  const stats = statsData || [
    { label: 'Total Students', value: '1,247', color: 'blue' },
    { label: 'Active Faculty', value: '89', color: 'green' },
    { label: 'Scheduled Classes', value: '156', color: 'orange' },
    { label: 'Room Utilization', value: '87%', color: 'purple' },
  ];

  const recentAlerts = recentAlertsData || [
    { type: 'warning', message: 'Room conflict detected for CS101 on Monday 10:00 AM', time: '2 min ago' },
    { type: 'info', message: 'New timetable export completed for Fall 2024', time: '15 min ago' },
    { type: 'error', message: 'Faculty availability constraint violated', time: '1 hour ago' },
  ];

  useEffect(() => {
    const subscription = advancedSupabase
      .from('stats')
      .on('INSERT', payload => {
        console.log('New stat added:', payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧑‍💼 Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, timetables, analytics, and system settings
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          System Status: Active
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`h-4 w-4 rounded-full bg-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Timetable Management */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timetable Management
            </CardTitle>
            <CardDescription>
              Advanced timetable generation and optimization tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setActiveSection('timetable-generator')} 
              className="w-full justify-start"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Advanced Generator
            </Button>
            <Button 
              onClick={() => setActiveSection('smart-scheduling')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              Smart Scheduling
            </Button>
            <Button 
              onClick={() => setActiveSection('color-view')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Color-Coded View
            </Button>
            <Button 
              onClick={() => setActiveSection('crud-management')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              CRUD Management
            </Button>
          </CardContent>
        </Card>

        {/* Analytics & Reports */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              Comprehensive analytics and reporting tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setActiveSection('analytics')} 
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Timetable Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Attendance Reports
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Utilization Reports
            </Button>
          </CardContent>
        </Card>

        {/* System Management */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Management
            </CardTitle>
            <CardDescription>
              User management, analytics, and access control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setActiveSection('access-control')} 
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Access Control
            </Button>
            <Button 
              onClick={() => setActiveSection('system-analytics')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              System Analytics
            </Button>
            <Button 
              onClick={() => setActiveSection('audit-logs')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Shield className="w-4 h-4 mr-2" />
              Audit Logs
            </Button>
            <Button 
              onClick={() => setActiveSection('global-settings')} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Globe className="w-4 h-4 mr-2" />
              Global Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Recent Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === 'error' ? 'bg-red-500' : 
                  alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Privileges & Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="privileges">
            <TabsList>
              <TabsTrigger value="privileges">Privileges</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            </TabsList>
            <TabsContent value="privileges" className="space-y-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Full timetable generation and management
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  User management and role assignments
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  System-wide analytics and reports
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Attendance monitoring and overrides
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Notification and alert management
                </li>
              </ul>
            </TabsContent>
            <TabsContent value="restrictions" className="space-y-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot mark attendance for students
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot access student private notes/submissions
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot impersonate users without audit logging
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot delete historical attendance records
                </li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Performance and Error Handling Enhanced
export default React.memo(AdminDashboard);
