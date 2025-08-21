"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserCheck, 
  Clock, 
  QrCode, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Play,
  Square
} from 'lucide-react';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { Profile } from '@/lib/supabaseClient';
import { formatDistanceToNow, format } from 'date-fns';

interface RealtimeAttendanceDashboardProps {
  user: Profile;
  className?: string;
}

const SessionCard: React.FC<{
  session: any;
  attendanceRecords: any[];
  onGenerateQR?: (sessionId: string) => void;
  onEndSession?: (sessionId: string) => void;
}> = ({ session, attendanceRecords, onGenerateQR, onEndSession }) => {
  const sessionAttendance = attendanceRecords.filter(r => r.session_id === session.id);
  const attendancePercentage = session.total_enrolled > 0 ? 
    (sessionAttendance.length / session.total_enrolled) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'completed': return 'Completed';
      case 'scheduled': return 'Scheduled';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>{session.timetable?.course?.course_name || 'Class Session'}</span>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(session.session_status)} text-white`}
              >
                {getStatusText(session.session_status)}
              </Badge>
            </CardTitle>
            <CardDescription>
              {format(new Date(session.session_date), 'MMM dd, yyyy')} • {session.start_time}
              {session.end_time && ` - ${session.end_time}`}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {session.session_status === 'scheduled' && onGenerateQR && (
              <Button size="sm" onClick={() => onGenerateQR(session.id)}>
                <QrCode className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            
            {session.session_status === 'active' && onEndSession && (
              <Button size="sm" variant="destructive" onClick={() => onEndSession(session.id)}>
                <Square className="w-4 h-4 mr-1" />
                End
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{sessionAttendance.length}</div>
            <div className="text-xs text-gray-500">Present</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{session.total_enrolled}</div>
            <div className="text-xs text-gray-500">Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(attendancePercentage)}%</div>
            <div className="text-xs text-gray-500">Attendance</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Attendance Progress</span>
            <span>{sessionAttendance.length}/{session.total_enrolled}</span>
          </div>
          <Progress value={attendancePercentage} className="h-2" />
        </div>
        
        {session.qr_code && session.session_status === 'active' && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <QrCode className="w-4 h-4" />
              <span className="text-sm font-medium">QR Code Active</span>
            </div>
            {session.qr_expiry && (
              <div className="text-xs text-green-600 mt-1">
                Expires {formatDistanceToNow(new Date(session.qr_expiry), { addSuffix: true })}
              </div>
            )}
          </div>
        )}
        
        {sessionAttendance.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="text-sm font-medium">Recent Attendance</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sessionAttendance
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-xs">
                    <span>{record.student?.name || 'Student'}</span>
                    <span className="text-gray-500">
                      {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AttendanceStats: React.FC<{
  sessions: any[];
  attendanceRecords: any[];
}> = ({ sessions, attendanceRecords }) => {
  const todaysSessions = sessions.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.session_date).toDateString() === today;
  });

  const activeSessions = sessions.filter(s => s.session_status === 'active');
  const completedSessions = sessions.filter(s => s.session_status === 'completed');

  const totalStudentsToday = todaysSessions.reduce((sum, session) => sum + session.total_enrolled, 0);
  const totalPresentToday = attendanceRecords.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.timestamp).toDateString() === today;
  }).length;

  const avgAttendanceToday = totalStudentsToday > 0 ? (totalPresentToday / totalStudentsToday) * 100 : 0;

  const stats = [
    {
      label: "Today's Sessions",
      value: todaysSessions.length,
      icon: Clock,
      color: "text-blue-600"
    },
    {
      label: "Active Sessions",
      value: activeSessions.length,
      icon: Play,
      color: "text-green-600"
    },
    {
      label: "Students Present Today",
      value: totalPresentToday,
      icon: UserCheck,
      color: "text-green-600"
    },
    {
      label: "Avg Attendance Today",
      value: `${Math.round(avgAttendanceToday)}%`,
      icon: TrendingUp,
      color: avgAttendanceToday >= 75 ? "text-green-600" : 
             avgAttendanceToday >= 50 ? "text-yellow-600" : "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const RealtimeAttendanceDashboard: React.FC<RealtimeAttendanceDashboardProps> = ({
  user,
  className = ''
}) => {
  const {
    attendanceRecords,
    attendanceSessions,
    lastUpdate,
    isConnected,
    error,
    setAttendanceSessions
  } = useRealtimeAttendance({
    facultyId: user.role === 'faculty' ? user.id : undefined,
    studentId: user.role === 'student' ? user.id : undefined,
    enabled: true
  });

  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    if (lastUpdate) {
      setLastUpdateTime(new Date());
    }
  }, [lastUpdate]);

  const handleGenerateQR = async (sessionId: string) => {
    // This would integrate with your QR generation logic
    console.log('Generating QR for session:', sessionId);
    // Update session status to active
    setAttendanceSessions(prev => 
      prev.map(s => s.id === sessionId ? { ...s, session_status: 'active' } : s)
    );
  };

  const handleEndSession = async (sessionId: string) => {
    // This would integrate with your session end logic
    console.log('Ending session:', sessionId);
    setAttendanceSessions(prev => 
      prev.map(s => s.id === sessionId ? { ...s, session_status: 'completed' } : s)
    );
  };

  const activeSessions = attendanceSessions.filter(s => s.session_status === 'active');
  const todaysSessions = attendanceSessions.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.session_date).toDateString() === today;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h2>
          <p className="text-gray-500">
            Real-time attendance tracking and management
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdateTime && (
            <div className="text-sm text-gray-500">
              Last update: {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Connection Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <AttendanceStats sessions={attendanceSessions} attendanceRecords={attendanceRecords} />

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Active Sessions</h3>
          <div className="grid gap-4">
            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                attendanceRecords={attendanceRecords}
                onGenerateQR={handleGenerateQR}
                onEndSession={handleEndSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Sessions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Today's Sessions</h3>
        {todaysSessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No sessions scheduled for today</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todaysSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                attendanceRecords={attendanceRecords}
                onGenerateQR={handleGenerateQR}
                onEndSession={handleEndSession}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {lastUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-medium">
                  {lastUpdate.type === 'new_attendance' ? 'New attendance recorded' : 'Session updated'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(lastUpdate.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtimeAttendanceDashboard;
