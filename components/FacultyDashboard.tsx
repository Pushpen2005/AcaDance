// Enhanced with Advanced Supabase Integration
import React, { useState, useEffect } from 'react';
import { advancedSupabase, useSupabaseQuery, supabaseUtils } from "@/lib/advancedSupabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, BarChart3, Clock, CheckCircle, AlertTriangle, QrCode, RefreshCw, Database, Activity } from "lucide-react";
import ColorCodedTimetableView from './ColorCodedTimetableView';

const FacultyDashboard = () => {
  const [activeView, setActiveView] = useState<'overview' | 'timetable' | 'attendance'>('overview');

  const todayClasses = [
    { time: '09:00 AM', subject: 'Computer Science 101', room: 'Room A-205', students: 45, status: 'upcoming' },
    { time: '11:00 AM', subject: 'Data Structures', room: 'Room B-301', students: 38, status: 'in-progress' },
    { time: '02:00 PM', subject: 'Algorithms', room: 'Room A-102', students: 42, status: 'upcoming' },
    { time: '04:00 PM', subject: 'Database Systems', room: 'Room C-205', students: 35, status: 'upcoming' },
  ];

  const attendanceStats = [
    { subject: 'Computer Science 101', present: 42, total: 45, percentage: 93 },
    { subject: 'Data Structures', present: 36, total: 38, percentage: 95 },
    { subject: 'Algorithms', present: 38, total: 42, percentage: 90 },
    { subject: 'Database Systems', present: 33, total: 35, percentage: 94 },
  ];

  const quickStats = [
    { label: "Today's Classes", value: '4', icon: Calendar, color: 'blue' },
    { label: 'Active Sessions', value: '1', icon: Clock, color: 'green' },
    { label: 'Avg Attendance', value: '93%', icon: BarChart3, color: 'orange' },
    { label: 'At-Risk Students', value: '3', icon: AlertTriangle, color: 'red' },
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
          <h1 className="text-3xl font-bold tracking-tight">👩‍🏫 Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your classes, attendance, and student performance
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Active Session: Data Structures
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
                        {class_.time} • {class_.room} • {class_.students} students
                      </p>
                    </div>
                  </div>
                  {class_.status === 'in-progress' ? (
                    <Button size="sm">
                      <QrCode className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  ) : class_.status === 'upcoming' ? (
                    <Button variant="outline" size="sm">
                      Start Session
                    </Button>
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
              <Users className="w-5 h-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceStats.map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.subject}</span>
                    <span className="text-sm text-muted-foreground">
                      {stat.present}/{stat.total} ({stat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stat.percentage >= 95 ? 'bg-green-600' :
                        stat.percentage >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Attendance Session
            </CardTitle>
            <CardDescription>
              Start or manage attendance sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Start New Session</Button>
            <Button variant="outline" className="w-full">View Active Sessions</Button>
            <Button variant="outline" className="w-full">Session History</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Student performance and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Student Analytics</Button>
            <Button variant="outline" className="w-full">At-Risk Students</Button>
            <Button variant="outline" className="w-full">Performance Reports</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Management
            </CardTitle>
            <CardDescription>
              Manage your teaching schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">Request Changes</Button>
            <Button variant="outline" className="w-full">Leave Requests</Button>
            <Button variant="outline" className="w-full">Substitute Requests</Button>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Privileges & Restrictions</CardTitle>
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
                  View personal class schedule and timetable
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Start and manage attendance sessions
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Access student attendance records for own classes
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  View performance analytics for assigned students
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">✓</Badge>
                  Request timetable changes and leave
                </li>
              </ul>
            </TabsContent>
            <TabsContent value="restrictions" className="space-y-2">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot modify master timetable directly
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot access other faculty's class sessions
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot edit global system analytics
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive">✗</Badge>
                  Cannot manage user accounts or roles
                </li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyDashboard;
