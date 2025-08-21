'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth, ProtectedRoute } from '../../lib/auth-context';
import { supabase } from '../../lib/supabaseClient';
import { QRScanner } from '../../lib/qr-scanner';
import { 
  QrCode, 
  Calendar, 
  ClockIcon, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Bell,
  Settings,
  LogOut,
  User
} from 'lucide-react';

function StudentDashboardContent() {
  const { user, profile, signOut } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    percentage: 0,
    recentSessions: [] as any[]
  });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadAttendanceStats(),
        loadUpcomingClasses(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceStats = async () => {
    if (!user) return;

    try {
      // Get attendance statistics
      const { data: stats, error } = await supabase
        .from('attendance_statistics')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;

      // Calculate overall stats
      const totalSessions = stats?.reduce((sum, stat) => sum + stat.total_sessions, 0) || 0;
      const attendedSessions = stats?.reduce((sum, stat) => sum + stat.attended_sessions, 0) || 0;
      const percentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      // Get recent attendance records
      const { data: recentRecords, error: recentError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          session:attendance_sessions(
            *,
            timetable:timetables(
              *,
              course:courses(*)
            )
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setAttendanceStats({
        totalSessions,
        attendedSessions,
        percentage,
        recentSessions: recentRecords || []
      });
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const loadUpcomingClasses = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('timetables')
        .select(`
          *,
          course:courses(*),
          faculty:users(*)
        `)
        .gte('start_time', today.toISOString())
        .lte('start_time', nextWeek.toISOString())
        .eq('is_active', true)
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      setUpcomingClasses(data || []);
    } catch (error) {
      console.error('Error loading upcoming classes:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to new attendance records
    const attendanceSubscription = supabase
      .channel(`student-attendance-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          loadAttendanceStats();
        }
      )
      .subscribe();

    // Subscribe to new notifications
    const notificationSubscription = supabase
      .channel(`student-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      attendanceSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  };

  const handleQRScanSuccess = (result: string) => {
    setShowQRScanner(false);
    // Refresh attendance data
    loadAttendanceStats();
  };

  const handleQRScanError = (error: string) => {
    console.error('QR Scan Error:', error);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome, {profile?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.department} • {profile?.student_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-6 h-6" />
              </button>
              <button 
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQRScanner(true)}
                  className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-4"
                >
                  <QrCode className="w-8 h-8" />
                  <div className="text-left">
                    <h3 className="font-semibold">Scan QR Code</h3>
                    <p className="text-blue-100 text-sm">Mark your attendance</p>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-4"
                >
                  <Calendar className="w-8 h-8" />
                  <div className="text-left">
                    <h3 className="font-semibold">View Timetable</h3>
                    <p className="text-green-100 text-sm">Check your schedule</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Attendance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.totalSessions}</p>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.attendedSessions}</p>
                  <p className="text-sm text-gray-600">Attended</p>
                </div>
                
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    attendanceStats.percentage >= 75 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={`w-8 h-8 ${
                      attendanceStats.percentage >= 75 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <p className={`text-2xl font-bold ${
                    attendanceStats.percentage >= 75 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {attendanceStats.percentage}%
                  </p>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                </div>
              </div>

              {/* Attendance Alert */}
              {attendanceStats.percentage < 75 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-red-800 font-medium">Low Attendance Warning</p>
                    <p className="text-red-600 text-sm">
                      Your attendance is below 75%. Please attend more classes to meet the requirement.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Recent Attendance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Attendance</h2>
              
              <div className="space-y-4">
                {attendanceStats.recentSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No attendance records yet</p>
                ) : (
                  attendanceStats.recentSessions.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          record.status === 'present' ? 'bg-green-500' :
                          record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {record.session?.timetable?.course?.course_name || 'Unknown Course'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(record.created_at).toLocaleDateString()} • 
                            {new Date(record.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Upcoming Classes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Upcoming Classes
              </h3>
              
              <div className="space-y-3">
                {upcomingClasses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming classes</p>
                ) : (
                  upcomingClasses.slice(0, 5).map((timetable: any) => (
                    <div key={timetable.id} className="p-3 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm">
                        {timetable.course?.course_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(timetable.start_time).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {timetable.room} • {timetable.building}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h3>
              
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No new notifications</p>
                ) : (
                  notifications.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <p className="font-medium text-gray-900 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onScanError={handleQRScanError}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
