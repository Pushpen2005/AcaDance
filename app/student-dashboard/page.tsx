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
  BookOpen, 
  Bell, 
  User, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Camera
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAdvanced3D, useScrollAnimation } from '@/hooks/use-enhanced-animations';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  // Animation refs
  const headerRef = useAdvanced3D({ tiltIntensity: 5 });
  const statsRef = useScrollAnimation('fadeInUp');
  const timetableRef = useScrollAnimation('slideInLeft');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
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

      if (!profileData) {
        router.push('/setup-profile');
        return;
      }

      setProfile(profileData);

      // Load attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setAttendance(attendanceData);

      // Load timetable
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('*')
        .eq('course', profileData.department)
        .limit(5);

      setTimetable(timetableData || []);

      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${user.id},target_role.eq.student,target_role.eq.all`)
        .order('created_at', { ascending: false })
        .limit(5);

      setNotifications(notificationsData || []);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    router.push('/student/qr-scanner');
  };

  const handleViewTimetable = () => {
    router.push('/student/timetable');
  };

  const handleViewAttendance = () => {
    router.push('/student/attendance');
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
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 80) return { icon: CheckCircle, text: 'Good', color: 'bg-green-500' };
    if (percentage >= 60) return { icon: AlertTriangle, text: 'Warning', color: 'bg-yellow-500' };
    return { icon: XCircle, text: 'Critical', color: 'bg-red-500' };
  };

  const status = getAttendanceStatus(attendancePercentage);
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div ref={headerRef as React.RefObject<HTMLDivElement>} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {profile?.department} • Student Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleQRScan}
                className="magnetic-button flex items-center gap-2"
                size="lg"
              >
                <QrCode className="w-5 h-5" />
                Scan QR
              </Button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div ref={statsRef as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Attendance Card */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                    {attendancePercentage}%
                  </div>
                  <Progress value={attendancePercentage} className="mt-2" />
                </div>
                <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center`}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {attendance?.present_classes || 0} / {attendance?.total_classes || 0} classes
              </div>
            </CardContent>
          </Card>

          {/* Total Classes */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {attendance?.total_classes || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    This semester
                  </div>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Present Days */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Present Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
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

          {/* Notifications */}
          <Card className="glass-card animated-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {notifications.filter(n => !n.is_read).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Unread
                  </div>
                </div>
                <Bell className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card ref={timetableRef as React.RefObject<HTMLDivElement>} className="glass-card animated-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Schedule
                  </CardTitle>
                  <Button variant="outline" onClick={handleViewTimetable}>
                    View Full Timetable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timetable.length > 0 ? (
                    timetable.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-12 bg-blue-500 rounded"></div>
                          <div>
                            <h3 className="font-semibold">{item.subject}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {item.teacher} • {item.room}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.start_time} - {item.end_time}</div>
                          <Badge variant="outline" className="mt-1">
                            {item.day}
                          </Badge>
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
                  onClick={handleQRScan}
                  className="w-full justify-start liquid-button"
                  variant="outline"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button
                  onClick={handleViewAttendance}
                  className="w-full justify-start magnetic-button"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Attendance
                </Button>
                <Button
                  onClick={() => router.push('/student/notifications')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  onClick={() => router.push('/student/profile')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map((notification, index) => (
                      <div key={index} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            variant={notification.is_read ? "outline" : "default"}
                            className="text-xs"
                          >
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card className="glass-card animated-border">
              <CardHeader>
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <Badge className="bg-green-100 text-green-800">
                      85%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {attendancePercentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall</span>
                    <Badge className={`${getAttendanceColor(attendancePercentage)} bg-gray-100`}>
                      {attendancePercentage}%
                    </Badge>
                  </div>
                  <Button
                    onClick={handleViewAttendance}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
