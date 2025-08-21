import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types for TypeScript
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  student_id?: string;
  employee_id?: string;
  phone?: string;
  profile_image_url?: string;
  attendance_threshold?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  credits: number;
  semester: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export interface Timetable {
  id: string;
  course_id: string;
  faculty_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  building: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  course?: Course;
  faculty?: Profile;
}

export interface AttendanceSession {
  id: string;
  timetable_id: string;
  faculty_id: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  qr_code?: string;
  qr_expiry?: string;
  session_status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  total_enrolled: number;
  total_present: number;
  attendance_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  timetable?: Timetable;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  scan_method: 'qr_scan' | 'manual' | 'auto_absent';
  device_id?: string;
  ip_address?: string;
  is_suspicious: boolean;
  marked_by?: string;
  notes?: string;
  created_at: string;
  student?: Profile;
  session?: AttendanceSession;
}
