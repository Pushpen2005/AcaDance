import { useEffect, useState } from 'react';
import { useRealtimeAttendance } from './useRealtimeAttendance';
import { useRealtimeTimetable } from './useRealtimeTimetable';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { supabase, Profile } from '@/lib/supabaseClient';

interface UseRealtimeDashboardProps {
  user?: Profile | null;
  enabled?: boolean;
}

interface RealtimeStatus {
  attendance: boolean;
  timetable: boolean;
  notifications: boolean;
  overall: boolean;
}

export function useRealtimeDashboard({
  user,
  enabled = true
}: UseRealtimeDashboardProps = {}) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeStatus>({
    attendance: false,
    timetable: false,
    notifications: false,
    overall: false
  });

  // Configure hooks based on user role
  const attendanceHook = useRealtimeAttendance({
    facultyId: user?.role === 'faculty' ? user.id : undefined,
    studentId: user?.role === 'student' ? user.id : undefined,
    enabled: enabled && !!user
  });

  const timetableHook = useRealtimeTimetable({
    facultyId: user?.role === 'faculty' ? user.id : undefined,
    studentId: user?.role === 'student' ? user.id : undefined,
    enabled: enabled && !!user
  });

  const notificationsHook = useRealtimeNotifications({
    userId: user?.id,
    enabled: enabled && !!user,
    markAsReadOnReceive: false // Let user manually mark as read
  });

  // Update connection status
  useEffect(() => {
    const newStatus = {
      attendance: attendanceHook.isConnected,
      timetable: timetableHook.isConnected,
      notifications: notificationsHook.isConnected,
      overall: attendanceHook.isConnected && timetableHook.isConnected && notificationsHook.isConnected
    };

    setConnectionStatus(newStatus);

    console.log('📡 Real-time dashboard status:', newStatus);
  }, [
    attendanceHook.isConnected,
    timetableHook.isConnected,
    notificationsHook.isConnected
  ]);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && user) {
      notificationsHook.requestNotificationPermission();
    }
  }, [enabled, user]);

  // Get combined errors
  const errors = [
    attendanceHook.error,
    timetableHook.error,
    notificationsHook.error
  ].filter(Boolean);

  // Dashboard-specific helper functions
  const getDashboardStats = () => {
    const stats = {
      totalNotifications: notificationsHook.notifications.length,
      unreadNotifications: notificationsHook.unreadCount,
      activeSessions: attendanceHook.attendanceSessions.filter(s => s.session_status === 'active').length,
      todaysSessions: attendanceHook.attendanceSessions.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.session_date).toDateString() === today;
      }).length,
      totalTimetables: timetableHook.timetables.length,
      todaysTimetables: timetableHook.timetables.filter(t => {
        const today = new Date().getDay();
        return t.day_of_week === today;
      }).length
    };

    return stats;
  };

  const getRecentActivity = () => {
    const activities = [];

    // Add recent attendance
    if (attendanceHook.lastUpdate) {
      activities.push({
        type: 'attendance',
        message: `New attendance recorded`,
        timestamp: attendanceHook.lastUpdate.timestamp,
        data: attendanceHook.lastUpdate
      });
    }

    // Add recent timetable changes
    if (timetableHook.lastUpdate) {
      activities.push({
        type: 'timetable',
        message: `Timetable ${timetableHook.lastUpdate.type}`,
        timestamp: timetableHook.lastUpdate.timestamp,
        data: timetableHook.lastUpdate
      });
    }

    // Add recent notifications
    if (notificationsHook.lastNotification) {
      activities.push({
        type: 'notification',
        message: notificationsHook.lastNotification.title,
        timestamp: new Date(notificationsHook.lastNotification.created_at),
        data: notificationsHook.lastNotification
      });
    }

    // Sort by timestamp, most recent first
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  };

  const getTodaysSchedule = () => {
    const today = new Date().getDay();
    return timetableHook.timetables
      .filter(t => t.day_of_week === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getActiveAttendanceSessions = () => {
    return attendanceHook.attendanceSessions.filter(s => s.session_status === 'active');
  };

  const getHighPriorityNotifications = () => {
    return notificationsHook.notifications.filter(n => 
      n.priority === 'high' || n.priority === 'urgent'
    ).slice(0, 5);
  };

  // Faculty-specific helpers
  const getFacultyStats = () => {
    if (user?.role !== 'faculty') return null;

    const todaysSessions = attendanceHook.attendanceSessions.filter(s => {
      const today = new Date().toDateString();
      return new Date(s.session_date).toDateString() === today;
    });

    const totalStudentsToday = todaysSessions.reduce((sum, session) => sum + session.total_enrolled, 0);
    const totalPresentToday = todaysSessions.reduce((sum, session) => sum + session.total_present, 0);
    const avgAttendanceToday = totalStudentsToday > 0 ? (totalPresentToday / totalStudentsToday) * 100 : 0;

    return {
      todaysSessions: todaysSessions.length,
      activeSessions: attendanceHook.attendanceSessions.filter(s => s.session_status === 'active').length,
      totalStudentsToday,
      totalPresentToday,
      avgAttendanceToday: Math.round(avgAttendanceToday * 100) / 100
    };
  };

  // Student-specific helpers
  const getStudentStats = () => {
    if (user?.role !== 'student') return null;

    const myAttendance = attendanceHook.attendanceRecords.filter(r => r.student_id === user.id);
    const todaysAttendance = myAttendance.filter(r => {
      const today = new Date().toDateString();
      return new Date(r.timestamp).toDateString() === today;
    });

    return {
      totalAttendance: myAttendance.length,
      todaysAttendance: todaysAttendance.length,
      todaysClasses: timetableHook.getTimetablesByDay(new Date().getDay()).length,
      attendancePercentage: 0 // This would need to be calculated based on total enrolled sessions
    };
  };

  return {
    // Individual hook data
    attendance: attendanceHook,
    timetable: timetableHook,
    notifications: notificationsHook,

    // Connection status
    connectionStatus,
    isConnected: connectionStatus.overall,
    errors,

    // Dashboard helpers
    getDashboardStats,
    getRecentActivity,
    getTodaysSchedule,
    getActiveAttendanceSessions,
    getHighPriorityNotifications,
    getFacultyStats,
    getStudentStats,

    // User info
    user,
    userRole: user?.role
  };
}
