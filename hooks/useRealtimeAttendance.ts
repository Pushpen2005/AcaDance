import { useEffect, useState } from 'react';

// Mock types since attendance tables don't exist
interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  created_at: string;
}

interface AttendanceSession {
  id: string;
  course_id: string;
  faculty_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

interface UseRealtimeAttendanceProps {
  sessionId?: string;
  facultyId?: string;
  studentId?: string;
  enabled?: boolean;
}

interface AttendanceUpdate {
  type: 'new_attendance' | 'session_update' | 'session_completed';
  data: AttendanceRecord | AttendanceSession;
  timestamp: Date;
}

export function useRealtimeAttendance({
  sessionId,
  facultyId,
  studentId,
  enabled = true
}: UseRealtimeAttendanceProps = {}) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [lastUpdate, setLastUpdate] = useState<AttendanceUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('⚠️ Attendance tables do not exist - using mock data mode');
    setError('Attendance tables not available - using demo mode');
    
    // Simulate connection success for demo purposes
    setIsConnected(true);
    
    // Generate mock data for demonstration
    const mockAttendanceRecords: AttendanceRecord[] = [
      {
        id: '1',
        student_id: 'student-1',
        session_id: sessionId || 'demo-session',
        status: 'present',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        student_id: 'student-2', 
        session_id: sessionId || 'demo-session',
        status: 'late',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        created_at: new Date(Date.now() - 300000).toISOString()
      }
    ];

    const mockAttendanceSessions: AttendanceSession[] = [
      {
        id: sessionId || 'demo-session',
        course_id: 'course-1',
        faculty_id: facultyId || 'faculty-1',
        title: 'Mathematics 101 - Demo Session',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    setAttendanceRecords(mockAttendanceRecords);
    setAttendanceSessions(mockAttendanceSessions);

    // Simulate periodic updates for demo
    const interval = setInterval(() => {
      const mockUpdate: AttendanceUpdate = {
        type: 'new_attendance',
        data: {
          id: `mock-${Date.now()}`,
          student_id: `student-${Math.floor(Math.random() * 100)}`,
          session_id: sessionId || 'demo-session',
          status: Math.random() > 0.8 ? 'late' : 'present',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        } as AttendanceRecord,
        timestamp: new Date()
      };
      
      setLastUpdate(mockUpdate);
      setAttendanceRecords(prev => [...prev, mockUpdate.data as AttendanceRecord]);
    }, 10000); // New mock attendance every 10 seconds

    // Cleanup function
    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [sessionId, facultyId, studentId, enabled]);

  // Mock functions for API compatibility
  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id' | 'created_at'>) => {
    console.log('📝 Mock: Adding attendance record', record);
    const newRecord: AttendanceRecord = {
      ...record,
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setAttendanceRecords(prev => [...prev, newRecord]);
    return Promise.resolve(newRecord);
  };

  const updateAttendanceSession = (sessionId: string, updates: Partial<AttendanceSession>) => {
    console.log('📝 Mock: Updating attendance session', sessionId, updates);
    setAttendanceSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
    return Promise.resolve();
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    console.log('📝 Mock: Marking attendance', { studentId, status });
    return addAttendanceRecord({
      student_id: studentId,
      session_id: sessionId || 'demo-session',
      status,
      timestamp: new Date().toISOString()
    });
  };

  return {
    attendanceRecords,
    attendanceSessions,
    lastUpdate,
    isConnected,
    error,
    addAttendanceRecord,
    updateAttendanceSession,
    markAttendance,
    // Computed properties
    totalStudents: attendanceRecords.length,
    presentCount: attendanceRecords.filter(r => r.status === 'present').length,
    lateCount: attendanceRecords.filter(r => r.status === 'late').length,
    absentCount: attendanceRecords.filter(r => r.status === 'absent').length
  };
}
