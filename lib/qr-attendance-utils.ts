// Complete QR Attendance utilities with realtime features
import { supabase } from './supabaseClient';
import { useEffect, useState } from 'react';

export interface AttendanceSession {
  id: string;
  class_id: string;
  faculty_id: string;
  starts_at: string;
  expires_at: string;
  token: string;
  location_required: boolean;
  required_latitude?: number;
  required_longitude?: number;
  location_radius?: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  status: 'present' | 'absent' | 'late';
  location_latitude?: number;
  location_longitude?: number;
  timestamp: string;
  student_name?: string;
}

// Create an attendance session (Faculty)
export async function createAttendanceSession(data: {
  class_id: string;
  duration_minutes?: number;
  location_required?: boolean;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
}) {
  try {
    const { data: response, error } = await supabase.functions.invoke(
      'create-attendance-session',
      { body: data }
    );

    if (error) throw error;

    if (!response.success) {
      throw new Error(response.error || 'Failed to create session');
    }

    return { success: true, session: response.session };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create attendance session'
    };
  }
}

// Mark attendance (Student)
export async function markAttendance(data: {
  sid: string;
  t: string;
  latitude?: number;
  longitude?: number;
}) {
  try {
    const { data: response, error } = await supabase.functions.invoke(
      'mark-attendance',
      { body: data }
    );

    if (error) throw error;

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark attendance');
    }

    return { success: true, message: response.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance'
    };
  }
}

// Get attendance for a session (Faculty)
export async function getSessionAttendance(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(name, student_id)
      `)
      .eq('session_id', sessionId)
      .order('timestamp');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session attendance'
    };
  }
}

// Get student's attendance history
export async function getStudentAttendance(studentId: string, classId?: string) {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        session:attendance_sessions!attendance_session_id_fkey(*),
        class:timetables!attendance_class_id_fkey(course_name, course_id)
      `)
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get student attendance'
    };
  }
}

// Calculate attendance percentage
export function calculateAttendancePercentage(attendanceRecords: AttendanceRecord[]): {
  total: number;
  present: number;
  percentage: number;
} {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(record => record.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { total, present, percentage };
}

// React hook for realtime attendance updates
export function useAttendanceRealtime(sessionId: string) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = async () => {
    setLoading(true);
    const result = await getSessionAttendance(sessionId);
    
    if (result.success) {
      setAttendance(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Unknown error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionId) return;

    loadAttendance();

    // Set up realtime subscription for attendance updates
    const channel = supabase
      .channel(`attendance-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          console.log('New attendance record:', payload);
          
          // Fetch the complete record with student info
          const { data } = await supabase
            .from('attendance')
            .select(`
              *,
              student:profiles!attendance_student_id_fkey(name, student_id)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setAttendance(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return {
    attendance,
    loading,
    error,
    refetch: loadAttendance
  };
}

// Validate QR payload
export function validateQRPayload(qrData: string): {
  valid: boolean;
  payload?: { sid: string; t: string; exp: number };
  error?: string;
} {
  try {
    const payload = JSON.parse(qrData);
    
    if (!payload.sid || !payload.t || !payload.exp) {
      return { valid: false, error: 'Invalid QR format' };
    }

    // Check if session has expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'QR code has expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid QR data' };
  }
}

// Get current location
export function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if location is within required range
export function isLocationValid(
  userLat: number,
  userLon: number,
  requiredLat: number,
  requiredLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLon, requiredLat, requiredLon);
  return distance <= radiusMeters;
}

// Get attendance statistics for a course
export async function getCourseAttendanceStats(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('attendance_stats')
      .select('*')
      .eq('course_id', courseId);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attendance stats'
    };
  }
}

// Generate attendance report
export async function generateAttendanceReport(filters: {
  course_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(name, student_id),
        class:timetables!attendance_class_id_fkey(course_name, course_id),
        session:attendance_sessions!attendance_session_id_fkey(starts_at, expires_at)
      `)
      .order('timestamp', { ascending: false });

    if (filters.course_id) {
      query = query.eq('class_id', filters.course_id);
    }

    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters.date_from) {
      query = query.gte('timestamp', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('timestamp', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report'
    };
  }
}

// Export attendance to CSV
export function exportAttendanceToCSV(attendanceData: any[]): string {
  const headers = [
    'Student Name',
    'Student ID', 
    'Course',
    'Date',
    'Status',
    'Timestamp'
  ];

  const rows = attendanceData.map(record => [
    record.student?.name || 'Unknown',
    record.student?.student_id || 'N/A',
    record.class?.course_name || 'Unknown',
    new Date(record.timestamp).toLocaleDateString(),
    record.status,
    new Date(record.timestamp).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
