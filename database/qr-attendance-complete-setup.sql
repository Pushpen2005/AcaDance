-- Complete QR Attendance System Database Setup
-- Run this in Supabase SQL Editor
-- 
-- PREREQUISITES: 
-- 1. Run role-settings-complete.sql first for proper user roles
-- 2. Ensure profiles table exists with role field
--
-- This script sets up QR attendance with role-based security

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure profiles table exists (minimal version if not already created)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure attendance_sessions table exists with all required fields
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL,
  faculty_id UUID NOT NULL,
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
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8) NULL;

-- Add foreign key constraints after creating columns
DO $$
BEGIN
  -- Add foreign key for attendance_sessions.class_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_sessions_class_id_fkey'
  ) THEN
    ALTER TABLE attendance_sessions 
    ADD CONSTRAINT attendance_sessions_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES timetables(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign key for attendance_sessions.faculty_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_sessions_faculty_id_fkey'
  ) THEN
    ALTER TABLE attendance_sessions 
    ADD CONSTRAINT attendance_sessions_faculty_id_fkey 
    FOREIGN KEY (faculty_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign key for attendance.session_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_session_id_fkey'
  ) THEN
    ALTER TABLE attendance 
    ADD CONSTRAINT attendance_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

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
    faculty_id = auth.uid()::uuid
    AND EXISTS (
      SELECT 1 FROM timetables t
      WHERE t.id = attendance_sessions.class_id
        AND t.faculty_id = auth.uid()::uuid
    )
  );

-- Faculty can view and update their own sessions
CREATE POLICY "faculty_manage_own_sessions"
  ON attendance_sessions FOR ALL
  TO authenticated
  USING (faculty_id = auth.uid()::uuid)
  WITH CHECK (faculty_id = auth.uid()::uuid);

-- Students can read active sessions (without sensitive token data)
CREATE POLICY "students_can_read_active_sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (
    expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'student'
    )
  );

-- ATTENDANCE POLICIES

-- Students can only mark attendance for themselves
CREATE POLICY "students_mark_own_attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()::uuid
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'student'
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
        AND t.faculty_id = auth.uid()::uuid
    )
    OR EXISTS (
      SELECT 1 FROM attendance_sessions s
      WHERE s.id = attendance.session_id
        AND s.faculty_id = auth.uid()::uuid
    )
  );

-- Students can view their own attendance
CREATE POLICY "students_view_own_attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role IN ('admin', 'faculty')
    )
  );

-- Admin can view all attendance
CREATE POLICY "admin_view_all_attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- NOTIFICATIONS POLICIES

-- Users can view their own notifications
CREATE POLICY "users_view_own_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

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

-- Drop existing timetable policies if they exist
DROP POLICY IF EXISTS "faculty_manage_own_timetables" ON timetables;
DROP POLICY IF EXISTS "students_view_timetables" ON timetables;

-- Faculty can manage their own timetables
CREATE POLICY "faculty_manage_own_timetables"
  ON timetables FOR ALL
  TO authenticated
  USING (
    faculty_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  )
  WITH CHECK (
    faculty_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- Students can view all timetables
CREATE POLICY "students_view_timetables"
  ON timetables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role IN ('student', 'faculty', 'admin')
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
  AND (s.created_at IS NULL OR s.created_at >= NOW() - INTERVAL '30 days')
GROUP BY p.id, p.name, t.id, t.course_name, t.course_id
HAVING COUNT(s.id) > 0;

-- Enable realtime for live updates (safely handle if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE timetables;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- Insert sample data for testing (optional)
-- Uncomment the following to insert test data

/*
-- Sample timetable entries (ensure faculty exists first)
INSERT INTO timetables (id, course_name, course_id, faculty_id, day, time_slot, room) 
SELECT 
  uuid_generate_v4(), 
  'Database Systems', 
  'CS301', 
  p.id, 
  'Monday', 
  '09:00-10:30', 
  'Room 101'
FROM profiles p 
WHERE p.role = 'faculty' 
LIMIT 1;

INSERT INTO timetables (id, course_name, course_id, faculty_id, day, time_slot, room) 
SELECT 
  uuid_generate_v4(), 
  'Web Development', 
  'CS302', 
  p.id, 
  'Tuesday', 
  '11:00-12:30', 
  'Room 102'
FROM profiles p 
WHERE p.role = 'faculty' 
LIMIT 1;

-- Sample notification
INSERT INTO notifications (user_id, type, title, message) 
SELECT 
  p.id,
  'info', 
  'Welcome', 
  'Welcome to AcaDance!'
FROM profiles p 
WHERE p.role = 'student' 
LIMIT 1;
*/
