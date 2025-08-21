'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth, ProtectedRoute } from '../../lib/auth-context';
import { supabase } from '../../lib/supabaseClient';
import { QRGenerator } from '../../lib/qr-generator';
import { 
  QrCode, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Plus,
  FileText,
  Bell,
  Settings,
  LogOut,
  User,
  Monitor,
  Play,
  Square
} from 'lucide-react';

function FacultyDashboardContent() {
  const { user, profile, signOut } = useAuth();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
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
        loadActiveSessions(),
        loadTodayClasses(),
        loadCourseStats(),
        loadRecentAttendance()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          timetable:timetables(
            *,
            course:courses(*)
          )
        `)
        .eq('faculty_id', user.id)
        .in('session_status', ['scheduled', 'active'])
        .order('start_time', { ascending: true });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const loadTodayClasses = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const { data, error } = await supabase
        .from('timetables')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('faculty_id', user.id)
        .eq('day_of_week', dayOfWeek === 0 ? 7 : dayOfWeek) // Convert to 1-7 format
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTodayClasses(data || []);
    } catch (error) {
      console.error('Error loading today classes:', error);
    }
  };

  const loadCourseStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('timetables')
        .select(`
          course_id,
          course:courses(course_name, course_code),
          attendance_sessions(
            id,
            total_enrolled,
            total_present,
            attendance_percentage
          )
        `)
        .eq('faculty_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Group by course and calculate stats
      const courseStatsMap = new Map();
      
      data?.forEach((timetable: any) => {
        const courseId = timetable.course_id;
        if (!courseStatsMap.has(courseId)) {
          courseStatsMap.set(courseId, {
            course: timetable.course,
            totalSessions: 0,
            totalEnrolled: 0,
            totalPresent: 0,
            averageAttendance: 0
          });
        }

        const stats = courseStatsMap.get(courseId);
        timetable.attendance_sessions?.forEach((session: any) => {
          stats.totalSessions++;
          stats.totalEnrolled += session.total_enrolled || 0;
          stats.totalPresent += session.total_present || 0;
        });

        if (stats.totalEnrolled > 0) {
          stats.averageAttendance = Math.round((stats.totalPresent / stats.totalEnrolled) * 100);
        }
      });

      setCourseStats(Array.from(courseStatsMap.values()));
    } catch (error) {
      console.error('Error loading course stats:', error);
    }
  };

  const loadRecentAttendance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          timetable:timetables(
            *,
            course:courses(*)
          ),
          attendance_records(count)
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentAttendance(data || []);
    } catch (error) {
      console.error('Error loading recent attendance:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to attendance session updates
    const sessionSubscription = supabase
      .channel(`faculty-sessions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sessions',
          filter: `faculty_id=eq.${user.id}`
        },
        () => {
          loadActiveSessions();
          loadRecentAttendance();
        }
      )
      .subscribe();

    return () => {
      sessionSubscription.unsubscribe();
    };
  };

  const startAttendanceSession = async (timetableId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          timetable_id: timetableId,
          faculty_id: user?.id,
          session_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          session_status: 'active',
          total_enrolled: 50, // This should come from enrollment data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setSelectedSession(data.id);
      loadActiveSessions();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endAttendanceSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({
          session_status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      setSelectedSession(null);
      loadActiveSessions();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Prof. {profile?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.department} • {profile?.employee_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-6 h-6" />
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
            
            {/* Active Sessions */}
            {selectedSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-green-600" />
                    Active QR Session
                  </h2>
                  <button
                    onClick={() => endAttendanceSession(selectedSession)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    End Session
                  </button>
                </div>
                
                <QRGenerator 
                  sessionId={selectedSession}
                  onAttendanceUpdate={(count) => {
                    // Handle attendance updates
                  }}
                />
              </motion.div>
            )}

            {/* Today's Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                Today's Classes
              </h2>
              
              <div className="space-y-4">
                {todayClasses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No classes scheduled for today</p>
                ) : (
                  todayClasses.map((timetable: any) => (
                    <div key={timetable.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {timetable.course?.course_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {timetable.start_time} - {timetable.end_time}
                          </p>
                          <p className="text-sm text-gray-500">
                            {timetable.room} • {timetable.building}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startAttendanceSession(timetable.id)}
                          disabled={selectedSession !== null}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="w-4 h-4" />
                          Start Session
                        </motion.button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Course Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Course Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courseStats.map((course: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {course.course?.course_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {course.course?.course_code}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sessions</span>
                        <span className="font-medium">{course.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg. Attendance</span>
                        <span className={`font-medium ${
                          course.averageAttendance >= 75 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {course.averageAttendance}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            course.averageAttendance >= 75 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${course.averageAttendance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Plus className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Create Session</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">View Reports</span>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 text-left bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <Monitor className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-700">Analytics</span>
                </button>
              </div>
            </motion.div>

            {/* Recent Attendance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Sessions
              </h3>
              
              <div className="space-y-3">
                {recentAttendance.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent sessions</p>
                ) : (
                  recentAttendance.map((session: any) => (
                    <div key={session.id} className="p-3 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm">
                        {session.timetable?.course?.course_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(session.session_date).toLocaleDateString()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {session.total_present}/{session.total_enrolled} present
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.session_status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : session.session_status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.session_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FacultyDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <FacultyDashboardContent />
    </ProtectedRoute>
  );
}
