import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, BarChart3, Clock, CheckCircle, AlertTriangle, QrCode, Bell, BookOpen } from "lucide-react";
import ColorCodedTimetableView from './ColorCodedTimetableView';

const StudentDashboard = () => {
  const [activeView, setActiveView] = useState<'overview' | 'timetable' | 'attendance'>('overview');

  const todayClasses = [
    { time: '09:00 AM', subject: 'Computer Science 101', faculty: 'Dr. Smith', room: 'Room A-205', status: 'upcoming' },
    { time: '11:00 AM', subject: 'Data Structures', faculty: 'Prof. Johnson', room: 'Room B-301', status: 'in-progress' },
    { time: '02:00 PM', subject: 'Algorithms', faculty: 'Dr. Wilson', room: 'Room A-102', status: 'upcoming' },
    { time: '04:00 PM', subject: 'Database Systems', faculty: 'Prof. Davis', room: 'Room C-205', status: 'upcoming' },
  ];

  const attendanceStats = [
    { subject: 'Computer Science 101', attended: 18, total: 20, percentage: 90, status: 'good' },
    { subject: 'Data Structures', attended: 16, total: 18, percentage: 89, status: 'good' },
    { subject: 'Algorithms', attended: 14, total: 17, percentage: 82, status: 'warning' },
    { subject: 'Database Systems', attended: 12, total: 16, percentage: 75, status: 'critical' },
  ];

  const quickStats = [
    { label: "Today's Classes", value: '4', icon: Calendar, color: 'blue' },
    { label: 'Overall Attendance', value: '86%', icon: BarChart3, color: 'green' },
    { label: 'Pending Check-ins', value: '1', icon: Clock, color: 'orange' },
    { label: 'Shortage Alerts', value: '1', icon: AlertTriangle, color: 'red' },
  ];

  const recentNotifications = [
    { type: 'info', message: 'New assignment posted for Data Structures', time: '1 hour ago' },
    { type: 'warning', message: 'Attendance shortage in Database Systems (75%)', time: '2 hours ago' },
    { type: 'info', message: 'Timetable updated for next week', time: '1 day ago' },
  ];

  if (activeView === 'timetable') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setActiveView('overview')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <ColorCodedTimetableView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🎓 Student Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your schedule, attendance, and academic progress
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Current: Data Structures
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Schedule
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveView('timetable')}
              >
                View Full Timetable
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((class_, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      class_.status === 'in-progress' ? 'bg-green-500' : 
                      class_.status === 'completed' ? 'bg-gray-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{class_.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {class_.time} • {class_.faculty} • {class_.room}
                      </p>
                    </div>
                  </div>
                  {class_.status === 'in-progress' ? (
                    <Button size="sm">
                      <QrCode className="w-4 h-4 mr-1" />
                      Check In
                    </Button>
                  ) : class_.status === 'upcoming' ? (
                    <Badge variant="outline">Upcoming</Badge>
                  ) : (
                    <Badge variant="secondary">Completed</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {stat.attended}/{stat.total} ({stat.percentage}%)
                      </span>
                      {stat.status === 'critical' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={stat.percentage} 
                    className={`h-2 ${
                      stat.status === 'critical' ? 'bg-red-100' :
                      stat.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Notifications */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code for Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Export Schedule to Calendar
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Attendance History
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              Submit Leave Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications.map((notification, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Attendance Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Good Standing</span>
              </div>
              <p className="text-sm text-green-700">
                Computer Science 101 and Data Structures maintain excellent attendance
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Needs Attention</span>
              </div>
              <p className="text-sm text-yellow-700">
                Algorithms attendance is at 82%. Attend next 3 classes to improve
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">Critical</span>
              </div>
              <p className="text-sm text-red-700">
                Database Systems at 75%. Risk of attendance shortage - attend all remaining classes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Student Access & Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="access">
            <TabsList>
              <TabsTrigger value="access">Available Features</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
            </TabsList>
            <TabsContent value="access" className="space-y-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  View personal timetable and class schedule
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Check in to attendance sessions (QR/NFC/Location)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  View personal attendance history and statistics
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Receive notifications and announcements
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Export schedule to personal calendar
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Submit leave requests and attendance concerns
                </li>
              </ul>
            </TabsContent>
            <TabsContent value="restrictions" className="space-y-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot modify or view master timetable
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot mark attendance after session closes
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot access other students' attendance data
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot view faculty or admin analytics
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot modify attendance records manually
                </li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
