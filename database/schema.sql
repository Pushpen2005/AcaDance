-- Academic System Database Schema
-- Complete schema for Student, Faculty, Admin system with QR Attendance

-- 1. Profiles Table (with default role = student)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student','faculty','admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  device_fingerprint TEXT, -- For QR attendance security
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Attendance Table (auto-linked to user)
CREATE TABLE attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  total_classes INT DEFAULT 0,
  present_classes INT DEFAULT 0,
  absent_classes INT DEFAULT 0,
  percentage NUMERIC GENERATED ALWAYS AS 
    (CASE WHEN total_classes = 0 THEN 0 
          ELSE ROUND((present_classes::DECIMAL / total_classes) * 100, 2) END) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Role-Specific Feature Tables
-- For Students
CREATE TABLE student_features (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  timetable_enabled BOOLEAN DEFAULT TRUE,
  attendance_alerts BOOLEAN DEFAULT TRUE,
  exam_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- For Faculty
CREATE TABLE faculty_features (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  class_schedule_enabled BOOLEAN DEFAULT TRUE,
  can_mark_attendance BOOLEAN DEFAULT TRUE,
  can_edit_attendance BOOLEAN DEFAULT TRUE,
  report_access BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- For Admin
CREATE TABLE admin_features (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  can_manage_timetable BOOLEAN DEFAULT TRUE,
  can_manage_users BOOLEAN DEFAULT TRUE,
  can_send_notifications BOOLEAN DEFAULT TRUE,
  view_all_reports BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Timetable Management Tables
CREATE TABLE subjects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  credits INT NOT NULL,
  duration INT NOT NULL, -- in minutes
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teachers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  max_hours INT DEFAULT 20, -- max hours per week
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE constraints (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- e.g., 'teacher_unavailable', 'room_conflict'
  value TEXT NOT NULL, -- e.g., 'Monday', 'Room A101'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timetables (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  teacher TEXT NOT NULL,
  slot TEXT NOT NULL, -- e.g., 'Day 1, 10:00-11:00'
  batch TEXT,
  semester INT,
  course TEXT,
  faculty_id TEXT,
  room TEXT,
  room_type TEXT,
  day TEXT,
  start_time TIME,
  end_time TIME,
  credits INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. QR Attendance System Tables
CREATE TABLE attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id TEXT NOT NULL,
  faculty_id UUID REFERENCES auth.users ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  qr_code TEXT NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  expiry_time TIMESTAMP NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  geofence_radius INT DEFAULT 50, -- meters
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance_records (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES attendance_sessions ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users ON DELETE CASCADE,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  device_fingerprint TEXT,
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, student_id) -- Prevent duplicate scans
);

-- 6. Notifications System
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IN ('student', 'faculty', 'admin', 'all')),
  type TEXT NOT NULL, -- 'attendance_alert', 'timetable_update', 'exam_notice'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Analytics & Reports Tables
CREATE TABLE attendance_analytics (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users ON DELETE CASCADE,
  subject_id BIGINT REFERENCES subjects ON DELETE CASCADE,
  total_classes INT DEFAULT 0,
  attended_classes INT DEFAULT 0,
  attendance_percentage DECIMAL GENERATED ALWAYS AS 
    (CASE WHEN total_classes = 0 THEN 0 
          ELSE ROUND((attended_classes::DECIMAL / total_classes) * 100, 2) END) STORED,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'attendance_scan', 'timetable_edit'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Trigger Functions
-- Function to auto-create profile + attendance + student features
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with default role 'student'
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'student');

  -- Insert into attendance
  INSERT INTO attendance (user_id)
  VALUES (NEW.id);

  -- Insert student default features
  INSERT INTO student_features (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update attendance analytics
CREATE OR REPLACE FUNCTION update_attendance_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics when attendance record is created
  INSERT INTO attendance_analytics (student_id, subject_id, total_classes, attended_classes)
  VALUES (NEW.student_id, 1, 1, CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END)
  ON CONFLICT (student_id, subject_id) 
  DO UPDATE SET
    total_classes = attendance_analytics.total_classes + 1,
    attended_classes = attendance_analytics.attended_classes + CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers
-- Trigger runs after every signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Trigger to update analytics on attendance
CREATE TRIGGER on_attendance_record_created
AFTER INSERT ON attendance_records
FOR EACH ROW EXECUTE PROCEDURE update_attendance_analytics();

-- 10. Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Students can only see their own data
CREATE POLICY "Students can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id AND role = 'student');

CREATE POLICY "Students can view own attendance" ON attendance
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own attendance records" ON attendance_records
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Faculty can see their classes and students
CREATE POLICY "Faculty can view assigned sessions" ON attendance_sessions
FOR SELECT USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty can create sessions" ON attendance_sessions
FOR INSERT WITH CHECK (auth.uid() = faculty_id);

-- Admin has full access
CREATE POLICY "Admin full access profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin full access attendance" ON attendance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 11. Indexes for Performance
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_timetables_faculty ON timetables(faculty_id);
