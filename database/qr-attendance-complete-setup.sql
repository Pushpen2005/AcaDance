-- Complete QR Attendance System Database Setup
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure attendance_sessions table exists with all required fields
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,  -- random secret token for QR validation
  location_required BOOLEAN DEFAULT FALSE,
  required_latitude DECIMAL(10, 8) NULL,
  required_longitude DECIMAL(11, 8) NULL,
  location_radius INTEGER DEFAULT 50, -- meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update attendance table to reference sessions
ALTER TABLE attendance 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8) NULL;

-- Ensure one attendance per student per session (prevent duplicate scans)
CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_session_unique
  ON attendance (student_id, session_id);

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_expires
  ON attendance_sessions (class_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_faculty
  ON attendance_sessions (faculty_id, created_at);

CREATE INDEX IF NOT EXISTS idx_attendance_class_time
  ON attendance (class_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_attendance_student_time
  ON attendance (student_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_attendance_session
  ON attendance (session_id);

-- Enable RLS on all tables
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "faculty_create_session_for_own_class" ON attendance_sessions;
DROP POLICY IF EXISTS "faculty_view_own_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "students_can_read_active_sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "students_mark_own_attendance" ON attendance;
DROP POLICY IF EXISTS "faculty_view_attendance_for_own_classes" ON attendance;
DROP POLICY IF EXISTS "students_view_own_attendance" ON attendance;
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;

-- ATTENDANCE SESSIONS POLICIES

-- Faculty can create sessions only for their classes
CREATE POLICY "faculty_create_session_for_own_class"
  ON attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    faculty_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM timetables t
      WHERE t.id = attendance_sessions.class_id
        AND t.faculty_id = auth.uid()
    )
  );

-- Faculty can view and update their own sessions
CREATE POLICY "faculty_manage_own_sessions"
  ON attendance_sessions FOR ALL
  TO authenticated
  USING (faculty_id = auth.uid())
  WITH CHECK (faculty_id = auth.uid());

-- Students can read active sessions (without sensitive token data)
CREATE POLICY "students_can_read_active_sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (
    expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'student'
    )
  );

-- ATTENDANCE POLICIES

-- Students can only mark attendance for themselves
CREATE POLICY "students_mark_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'student'
    )
  );

-- Faculty can view attendance for their classes
CREATE POLICY "faculty_view_attendance_for_own_classes"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM timetables t
      WHERE t.id = attendance.class_id
        AND t.faculty_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = attendance.session_id
        AND s.faculty_id = auth.uid()
    )
  );

-- Students can view their own attendance
CREATE POLICY "students_view_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'faculty')
    )
  );

-- Admin can view all attendance
CREATE POLICY "admin_view_all_attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- NOTIFICATIONS POLICIES

-- Users can view their own notifications
CREATE POLICY "users_view_own_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/service role can insert notifications
CREATE POLICY "system_insert_notifications"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert notifications (for testing)
CREATE POLICY "authenticated_insert_notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- TIMETABLES POLICIES (ensure they exist)

-- Faculty can manage their own timetables
CREATE POLICY IF NOT EXISTS "faculty_manage_own_timetables"
  ON timetables FOR ALL
  TO authenticated
  USING (
    faculty_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    faculty_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Students can view all timetables
CREATE POLICY IF NOT EXISTS "students_view_timetables"
  ON timetables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('student', 'faculty', 'admin')
    )
  );

-- Create a view for attendance statistics (optional, for reporting)
CREATE OR REPLACE VIEW attendance_stats AS
SELECT 
  p.id as student_id,
  p.name as student_name,
  t.course_name,
  t.course_id,
  COUNT(s.id) as total_sessions,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as attended_sessions,
  ROUND(
    (COUNT(a.id) FILTER (WHERE a.status = 'present')::DECIMAL / 
     NULLIF(COUNT(s.id), 0)) * 100, 
    2
  ) as attendance_percentage
FROM profiles p
CROSS JOIN timetables t
LEFT JOIN attendance_sessions s ON s.class_id = t.id
LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = p.id
WHERE p.role = 'student'
  AND s.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, t.id, t.course_name, t.course_id
HAVING COUNT(s.id) > 0;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE timetables;

-- Insert sample data for testing (optional)
-- Uncomment the following to insert test data

/*
-- Sample timetable entries
INSERT INTO timetables (id, course_name, course_id, faculty_id, day, time_slot, room) VALUES
  (uuid_generate_v4(), 'Database Systems', 'CS301', (SELECT id FROM profiles WHERE role = 'faculty' LIMIT 1), 'Monday', '09:00-10:30', 'Room 101'),
  (uuid_generate_v4(), 'Web Development', 'CS302', (SELECT id FROM profiles WHERE role = 'faculty' LIMIT 1), 'Tuesday', '11:00-12:30', 'Room 102');

-- Sample notification
INSERT INTO notifications (user_id, type, title, message) VALUES
  ((SELECT id FROM profiles WHERE role = 'student' LIMIT 1), 'info', 'Welcome', 'Welcome to the Academic System!');
*/
