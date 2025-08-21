import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AttendanceRecord, AttendanceSession } from '@/lib/supabaseClient';

interface UsePollingAttendanceProps {
  sessionId?: string;
  facultyId?: string;
  studentId?: string;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
}

interface AttendanceUpdate {
  type: 'new_attendance' | 'session_update' | 'session_completed';
  data: AttendanceRecord | AttendanceSession;
  timestamp: Date;
}

// Fallback hook using polling instead of realtime (works on any Supabase plan)
export function usePollingAttendance({
  sessionId,
  facultyId,
  studentId,
  enabled = true,
  pollingInterval = 3000 // 3 seconds
}: UsePollingAttendanceProps = {}) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [lastUpdate, setLastUpdate] = useState<AttendanceUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Setting up polling-based attendance updates');
    setIsConnected(true);

    const fetchUpdates = async () => {
      try {
        // Fetch new attendance records
        let recordsQuery = supabase
          .from('attendance_records')
          .select('*')
          .gte('created_at', lastFetchRef.current.toISOString())
          .order('created_at', { ascending: false });

        if (sessionId) {
          recordsQuery = recordsQuery.eq('session_id', sessionId);
        }
        if (studentId) {
          recordsQuery = recordsQuery.eq('student_id', studentId);
        }

        const { data: newRecords, error: recordsError } = await recordsQuery;

        if (recordsError) throw recordsError;

        // Fetch updated attendance sessions
        let sessionsQuery = supabase
          .from('attendance_sessions')
          .select('*')
          .gte('updated_at', lastFetchRef.current.toISOString())
          .order('updated_at', { ascending: false });

        if (facultyId) {
          sessionsQuery = sessionsQuery.eq('faculty_id', facultyId);
        }
        if (sessionId) {
          sessionsQuery = sessionsQuery.eq('id', sessionId);
        }

        const { data: updatedSessions, error: sessionsError } = await sessionsQuery;

        if (sessionsError) throw sessionsError;

        // Update state with new records
        if (newRecords && newRecords.length > 0) {
          console.log('📌 New attendance records found:', newRecords.length);
          
          setAttendanceRecords(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const uniqueNewRecords = newRecords.filter(r => !existingIds.has(r.id));
            
            if (uniqueNewRecords.length > 0) {
              setLastUpdate({
                type: 'new_attendance',
                data: uniqueNewRecords[0] as AttendanceRecord,
                timestamp: new Date()
              });
              return [...prev, ...uniqueNewRecords];
            }
            return prev;
          });
        }

        // Update state with modified sessions
        if (updatedSessions && updatedSessions.length > 0) {
          console.log('📌 Updated attendance sessions found:', updatedSessions.length);
          
          setAttendanceSessions(prev => {
            let hasChanges = false;
            const updated = prev.map(session => {
              const updatedSession = updatedSessions.find(s => s.id === session.id);
              if (updatedSession && updatedSession.updated_at !== session.updated_at) {
                hasChanges = true;
                return updatedSession as AttendanceSession;
              }
              return session;
            });

            // Add new sessions
            const existingIds = new Set(prev.map(s => s.id));
            const newSessions = updatedSessions.filter(s => !existingIds.has(s.id));
            
            if (newSessions.length > 0) {
              hasChanges = true;
              updated.push(...newSessions as AttendanceSession[]);
            }

            if (hasChanges && updatedSessions[0]) {
              setLastUpdate({
                type: updatedSessions[0].session_status === 'completed' ? 'session_completed' : 'session_update',
                data: updatedSessions[0] as AttendanceSession,
                timestamp: new Date()
              });
            }

            return hasChanges ? updated : prev;
          });
        }

        lastFetchRef.current = new Date();
        setError(null);
      } catch (err) {
        console.error('❌ Polling error:', err);
        setError(`Polling error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    // Initial fetch
    fetchUpdates();

    // Set up polling interval
    intervalRef.current = setInterval(fetchUpdates, pollingInterval);

    return () => {
      console.log('🔄 Cleaning up polling-based attendance updates');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [sessionId, facultyId, studentId, enabled, pollingInterval]);

  // Helper functions (same as realtime version)
  const addAttendanceRecord = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      if (prev.some(r => r.id === record.id)) return prev;
      return [...prev, record];
    });
  };

  const updateAttendanceSession = (session: AttendanceSession) => {
    setAttendanceSessions(prev => 
      prev.map(s => s.id === session.id ? session : s)
    );
  };

  const getSessionById = (id: string) => {
    return attendanceSessions.find(session => session.id === id);
  };

  const getRecordsBySession = (sessionId: string) => {
    return attendanceRecords.filter(record => record.session_id === sessionId);
  };

  return {
    // State
    attendanceRecords,
    attendanceSessions,
    lastUpdate,
    isConnected,
    error,
    
    // Actions
    addAttendanceRecord,
    updateAttendanceSession,
    
    // Helpers
    getSessionById,
    getRecordsBySession,
    
    // Setters for manual updates
    setAttendanceRecords,
    setAttendanceSessions,
    
    // Polling-specific info
    pollingInterval,
    lastFetch: lastFetchRef.current
  };
}
