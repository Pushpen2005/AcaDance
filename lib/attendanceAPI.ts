/**
 * Attendance API Functions
 * Handles all attendance-related API calls to Supabase
 */

import { supabase } from './supabaseClient';
import { getDeviceFingerprint } from './deviceFingerprinting';
import { getCurrentPosition } from './qrUtils';

export interface AttendanceSession {
  id: string;
  timetable_id: string;
  faculty_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code: string;
  qr_expiry: string;
  location_coordinates?: { lat: number; lng: number };
  geofence_enabled: boolean;
  session_status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  total_enrolled: number;
  total_present: number;
  attendance_percentage: number;
  notes?: string;
  course?: {
    course_code: string;
    course_name: string;
  };
  room?: string;
  building?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scan_method: 'qr_scan' | 'manual' | 'auto_absent';
  device_id?: string;
  gps_coordinates?: { lat: number; lng: number };
  ip_address?: string;
  user_agent?: string;
  is_suspicious: boolean;
  marked_by?: string;
  notes?: string;
  student?: {
    name: string;
    student_id: string;
    email: string;
  };
}

export interface StudentStats {
  student_id: string;
  course_id: string;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  last_updated: string;
}

/**
 * Generate QR code for attendance session (Faculty)
 */
export async function generateAttendanceSession(
  timetableId: string,
  expiryMinutes: number = 10,
  geofenceEnabled: boolean = false,
  notes?: string
): Promise<{ sessionId: string; qrCode: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Get timetable details
    const { data: timetable, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        *,
        course:courses(course_code, course_name),
        faculty:users!timetables_faculty_id_fkey(name)
      `)
      .eq('id', timetableId)
      .single();

    if (timetableError) throw timetableError;

    const sessionDate = new Date().toISOString().split('T')[0];
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // Default 2-hour session

    const qrExpiry = new Date(startTime);
    qrExpiry.setMinutes(qrExpiry.getMinutes() + expiryMinutes);

    // Generate session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create QR code data
    const qrData = {
      type: 'attendance',
      sessionId,
      courseCode: timetable.course?.course_code,
      room: `${timetable.room} ${timetable.building}`,
      expiryTime: qrExpiry.toISOString(),
      checksum: generateChecksum(sessionId + qrExpiry.toISOString())
    };

    const qrCodeString = JSON.stringify(qrData);

    // Get current location if geofence is enabled
    let locationCoordinates = null;
    if (geofenceEnabled) {
      try {
        const position = await getCurrentPosition();
        locationCoordinates = `POINT(${position.lng} ${position.lat})`;
      } catch (error) {
        console.warn('Could not get location for geofence:', error);
      }
    }

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert({
        id: sessionId,
        timetable_id: timetableId,
        faculty_id: user.user.id,
        session_date: sessionDate,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        qr_code: qrCodeString,
        qr_expiry: qrExpiry.toISOString(),
        location_coordinates: locationCoordinates,
        geofence_enabled: geofenceEnabled,
        session_status: 'active',
        notes
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Get enrolled students count
    const { count: enrolledCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', timetable.course_id)
      .eq('is_active', true);

    // Update total enrolled
    await supabase
      .from('attendance_sessions')
      .update({ total_enrolled: enrolledCount || 0 })
      .eq('id', sessionId);

    return {
      sessionId,
      qrCode: qrCodeString
    };
  } catch (error) {
    console.error('Error generating attendance session:', error);
    throw error;
  }
}

/**
 * Scan QR code and mark attendance (Student)
 */
export async function scanAttendanceQR(qrData: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Parse QR code
    let sessionData;
    try {
      sessionData = JSON.parse(qrData);
    } catch {
      throw new Error('Invalid QR code format');
    }

    // Validate QR code structure
    if (sessionData.type !== 'attendance' || !sessionData.sessionId) {
      throw new Error('Invalid attendance QR code');
    }

    // Validate checksum
    const expectedChecksum = generateChecksum(sessionData.sessionId + sessionData.expiryTime);
    if (sessionData.checksum !== expectedChecksum) {
      throw new Error('QR code validation failed');
    }

    // Check if QR code has expired
    const expiryTime = new Date(sessionData.expiryTime);
    const currentTime = new Date();
    if (currentTime > expiryTime) {
      throw new Error('QR code has expired');
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        timetable:timetables(
          course_id,
          geofence_radius,
          course:courses(course_code, course_name)
        )
      `)
      .eq('id', sessionData.sessionId)
      .eq('session_status', 'active')
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found or not active');
    }

    // Check if student is enrolled in the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.user.id)
      .eq('course_id', session.timetable.course_id)
      .eq('is_active', true)
      .single();

    if (!enrollment) {
      throw new Error('You are not enrolled in this course');
    }

    // Check if already marked present
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionData.sessionId)
      .eq('student_id', user.user.id)
      .single();

    if (existingRecord) {
      throw new Error('Attendance already marked for this session');
    }

    // Get device fingerprint
    const deviceId = await getDeviceFingerprint();

    // Validate device (check if student is using registered device)
    const { data: userProfile } = await supabase
      .from('users')
      .select('device_fingerprint')
      .eq('id', user.user.id)
      .single();

    if (userProfile?.device_fingerprint && userProfile.device_fingerprint !== deviceId) {
      // Register device if not already registered
      await supabase
        .from('device_registrations')
        .upsert({
          user_id: user.user.id,
          device_fingerprint: deviceId,
          device_name: navigator.platform,
          browser_info: navigator.userAgent,
          os_info: navigator.platform,
          last_seen: new Date().toISOString()
        });
    }

    // Get GPS coordinates
    let gpsCoordinates = null;
    let isWithinGeofence = true;

    if (session.geofence_enabled && session.location_coordinates) {
      try {
        const position = await getCurrentPosition();
        gpsCoordinates = `POINT(${position.lng} ${position.lat})`;

        // Extract coordinates from PostGIS POINT format
        const sessionCoords = session.location_coordinates as any;
        if (sessionCoords) {
          const distance = calculateDistance(
            position.lat,
            position.lng,
            sessionCoords.coordinates[1], // lat
            sessionCoords.coordinates[0]  // lng
          );
          
          const radiusMeters = session.timetable.geofence_radius || 50;
          isWithinGeofence = distance <= radiusMeters;
        }
      } catch (error) {
        console.warn('Could not get GPS coordinates:', error);
        // Allow attendance without GPS if geofence fails
      }
    }

    if (session.geofence_enabled && !isWithinGeofence) {
      throw new Error('You are not within the allowed location for this class');
    }

    // Determine attendance status
    const sessionStart = new Date(session.start_time);
    const currentTime2 = new Date();
    const minutesLate = (currentTime2.getTime() - sessionStart.getTime()) / (1000 * 60);
    
    let status: 'present' | 'late' = 'present';
    if (minutesLate > 15) { // Consider late if more than 15 minutes
      status = 'late';
    }

    // Record attendance
    const { error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionData.sessionId,
        student_id: user.user.id,
        timestamp: currentTime.toISOString(),
        status,
        scan_method: 'qr_scan',
        device_id: deviceId,
        gps_coordinates: gpsCoordinates,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        is_suspicious: false
      });

    if (recordError) throw recordError;

    // Update session statistics
    await updateSessionStats(sessionData.sessionId);

    const message = status === 'late' 
      ? `Attendance marked as late (${Math.round(minutesLate)} minutes)`
      : 'Attendance marked successfully';

    return { success: true, message };
  } catch (error) {
    console.error('Error scanning attendance QR:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to mark attendance'
    };
  }
}

/**
 * Get attendance sessions for faculty
 */
export async function getFacultyAttendanceSessions(facultyId: string): Promise<AttendanceSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      timetable:timetables(
        room,
        building,
        course:courses(course_code, course_name)
      )
    `)
    .eq('faculty_id', facultyId)
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get live attendance for a session
 */
export async function getLiveAttendance(sessionId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      student:users!attendance_records_student_id_fkey(name, student_id, email)
    `)
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get student attendance history
 */
export async function getStudentAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      session:attendance_sessions(
        session_date,
        start_time,
        timetable:timetables(
          room,
          building,
          course:courses(course_code, course_name)
        )
      )
    `)
    .eq('student_id', studentId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get attendance statistics for student
 */
export async function getStudentAttendanceStats(studentId: string): Promise<StudentStats[]> {
  const { data, error } = await supabase
    .from('attendance_statistics')
    .select(`
      *,
      course:courses(course_code, course_name)
    `)
    .eq('student_id', studentId);

  if (error) throw error;
  return data || [];
}

/**
 * Manually mark attendance (Faculty)
 */
export async function manuallyMarkAttendance(
  sessionId: string,
  studentId: string,
  status: 'present' | 'absent' | 'late' | 'excused',
  notes?: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Verify faculty owns this session
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('faculty_id')
    .eq('id', sessionId)
    .single();

  if (!session || session.faculty_id !== user.user.id) {
    throw new Error('Not authorized to mark attendance for this session');
  }

  // Upsert attendance record
  const { error } = await supabase
    .from('attendance_records')
    .upsert({
      session_id: sessionId,
      student_id: studentId,
      timestamp: new Date().toISOString(),
      status,
      scan_method: 'manual',
      marked_by: user.user.id,
      notes,
      is_suspicious: false
    });

  if (error) throw error;

  // Update session statistics
  await updateSessionStats(sessionId);
}

/**
 * End attendance session
 */
export async function endAttendanceSession(sessionId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Mark all enrolled students who didn't attend as absent
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select(`
      faculty_id,
      timetable:timetables(course_id)
    `)
    .eq('id', sessionId)
    .single();

  if (!session || session.faculty_id !== user.user.id) {
    throw new Error('Not authorized to end this session');
  }

  // Get enrolled students who haven't been marked
  const { data: absentStudents } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('course_id', (session.timetable as any).course_id)
    .eq('is_active', true)
    .not('student_id', 'in', `(
      SELECT student_id FROM attendance_records WHERE session_id = '${sessionId}'
    )`);

  // Mark absent students
  if (absentStudents && absentStudents.length > 0) {
    const absentRecords = absentStudents.map(student => ({
      session_id: sessionId,
      student_id: student.student_id,
      timestamp: new Date().toISOString(),
      status: 'absent' as const,
      scan_method: 'auto_absent' as const,
      marked_by: user.user.id,
      is_suspicious: false
    }));

    await supabase
      .from('attendance_records')
      .insert(absentRecords);
  }

  // Update session status
  await supabase
    .from('attendance_sessions')
    .update({
      session_status: 'completed',
      end_time: new Date().toISOString()
    })
    .eq('id', sessionId);

  // Update final statistics
  await updateSessionStats(sessionId);
}

// Helper functions
function generateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

async function updateSessionStats(sessionId: string): Promise<void> {
  // Get present count
  const { count: presentCount } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .in('status', ['present', 'late']);

  // Get total enrolled
  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('total_enrolled')
    .eq('id', sessionId)
    .single();

  const totalEnrolled = session?.total_enrolled || 0;
  const totalPresent = presentCount || 0;
  const percentage = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;

  // Update session stats
  await supabase
    .from('attendance_sessions')
    .update({
      total_present: totalPresent,
      attendance_percentage: Number(percentage.toFixed(2))
    })
    .eq('id', sessionId);
}
