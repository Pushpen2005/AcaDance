"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  Users, 
  Calendar, 
  Bell, 
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useSmartAttendance } from '@/hooks/useSmartAttendance';
import { useRealtimeTimetable } from '@/hooks/useRealtimeTimetable';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { supabase } from '@/lib/supabaseClient';
import RealtimeStatus from './RealtimeStatus';

interface RealtimeTestPageProps {
  className?: string;
}

const RealtimeTestPage: React.FC<RealtimeTestPageProps> = ({ className = '' }) => {
  const [testUser, setTestUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test hooks - using smart attendance that auto-detects realtime availability
  const smartAttendance = useSmartAttendance({ enabled: true });
  const timetable = useRealtimeTimetable({ enabled: true });
  const notifications = useRealtimeNotifications({ 
    userId: testUser?.id,
    enabled: !!testUser 
  });

  // Load current user
  React.useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setTestUser(profile);
      }
    };
    loadUser();
  }, []);

  // Test functions
  const testAttendanceRecord = async () => {
    setIsLoading(true);
    try {
      // Insert a test attendance record
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: 'test-session-' + Date.now(),
          student_id: testUser?.id || 'test-student',
          timestamp: new Date().toISOString(),
          status: 'present',
          scan_method: 'qr_scan'
        });

      if (error) throw error;
      console.log('✅ Test attendance record inserted');
    } catch (error) {
      console.error('❌ Error inserting test attendance:', error);
    }
    setIsLoading(false);
  };

  const testNotification = async () => {
    setIsLoading(true);
    try {
      // Insert a test notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUser?.id || 'test-user',
          title: 'Test Notification',
          message: 'This is a real-time test notification sent at ' + new Date().toLocaleTimeString(),
          type: 'info',
          priority: 'medium'
        });

      if (error) throw error;
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
    setIsLoading(false);
  };

  const testTimetableUpdate = async () => {
    setIsLoading(true);
    try {
      // Update a test timetable entry (you might need to create one first)
      const { error } = await supabase
        .from('timetables')
        .upsert({
          id: 'test-timetable-' + Date.now(),
          course_id: 'test-course',
          faculty_id: testUser?.id || 'test-faculty',
          day_of_week: new Date().getDay(),
          start_time: '10:00:00',
          end_time: '11:00:00',
          room: 'Test Room ' + Math.floor(Math.random() * 100),
          building: 'Test Building',
          capacity: 50
        });

      if (error) throw error;
      console.log('✅ Test timetable updated');
    } catch (error) {
      console.error('❌ Error updating test timetable:', error);
    }
    setIsLoading(false);
  };

  const clearTestData = async () => {
    setIsLoading(true);
    try {
      // Clean up test data (be careful in production!)
      await supabase.from('attendance_records').delete().ilike('session_id', 'test-session-%');
      await supabase.from('notifications').delete().eq('title', 'Test Notification');
      await supabase.from('timetables').delete().ilike('id', 'test-timetable-%');
      console.log('✅ Test data cleared');
    } catch (error) {
      console.error('❌ Error clearing test data:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Features Test</h1>
          <p className="text-gray-600">Test and verify real-time functionality</p>
        </div>
        <RealtimeStatus 
          isConnected={smartAttendance.isConnected && timetable.isConnected && notifications.isConnected}
          connectionStatus={{
            attendance: smartAttendance.isConnected,
            timetable: timetable.isConnected,
            notifications: notifications.isConnected,
            overall: smartAttendance.isConnected && timetable.isConnected && notifications.isConnected
          }}
          showDetails={true}
        />
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Current User</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testUser ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {testUser.name}</p>
              <p><strong>Email:</strong> {testUser.email}</p>
              <p><strong>Role:</strong> <Badge>{testUser.role}</Badge></p>
              <p><strong>ID:</strong> {testUser.id}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user logged in</p>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              {smartAttendance.isConnected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold">Attendance</h3>
                <p className="text-sm text-gray-600">
                  {smartAttendance.isConnected ? 'Connected' : 'Disconnected'}
                </p>
                {smartAttendance.error && (
                  <p className="text-xs text-red-500">{smartAttendance.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              {timetable.isConnected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold">Timetable</h3>
                <p className="text-sm text-gray-600">
                  {timetable.isConnected ? 'Connected' : 'Disconnected'}
                </p>
                {timetable.error && (
                  <p className="text-xs text-red-500">{timetable.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              {notifications.isConnected ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {notifications.isConnected ? 'Connected' : 'Disconnected'}
                </p>
                {notifications.error && (
                  <p className="text-xs text-red-500">{notifications.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Tests</CardTitle>
          <CardDescription>
            Click the buttons below to test real-time functionality. Watch the console and UI for updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={testAttendanceRecord}
              disabled={isLoading || !testUser}
              className="w-full"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Test Attendance
            </Button>

            <Button 
              onClick={testNotification}
              disabled={isLoading || !testUser}
              className="w-full"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
              Test Notification
            </Button>

            <Button 
              onClick={testTimetableUpdate}
              disabled={isLoading || !testUser}
              className="w-full"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              Test Timetable
            </Button>

            <Button 
              onClick={clearTestData}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Clear Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Real-time Attendance</span>
              <Badge variant="secondary">{smartAttendance.attendanceRecords.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {smartAttendance.attendanceRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No attendance records yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {smartAttendance.attendanceRecords.slice(-5).map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Student: {record.student_id}</span>
                      <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Real-time Notifications</span>
              <Badge variant="secondary">{notifications.notifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                        {notification.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      {(smartAttendance.lastUpdate || timetable.lastUpdate || notifications.lastNotification) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {smartAttendance.lastUpdate && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">Attendance Update</p>
                  <p className="text-sm text-gray-600">
                    {smartAttendance.lastUpdate.type} - {smartAttendance.lastUpdate.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {timetable.lastUpdate && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">Timetable Update</p>
                  <p className="text-sm text-gray-600">
                    {timetable.lastUpdate.type} - {timetable.lastUpdate.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {notifications.lastNotification && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">New Notification</p>
                  <p className="text-sm text-gray-600">
                    {notifications.lastNotification.title} - {new Date(notifications.lastNotification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Single Window Testing:</h4>
            <p className="text-sm text-gray-600">Click the test buttons above to insert data and watch real-time updates appear.</p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Multi-Window Testing:</h4>
            <p className="text-sm text-gray-600">
              Open this page in multiple browser windows/tabs, then click test buttons in one window 
              and watch updates appear in all windows instantly.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Console Monitoring:</h4>
            <p className="text-sm text-gray-600">
              Open browser console (F12) to see detailed real-time event logs with 📌 and 📡 emojis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeTestPage;
