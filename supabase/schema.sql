-- Enhanced Attendance System Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For GPS/location features

-- Users table with device fingerprinting
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'faculty', 'admin')) NOT NULL,
    department VARCHAR(100),
    student_id VARCHAR(50) UNIQUE, -- For students
    employee_id VARCHAR(50) UNIQUE, -- For faculty/admin
    device_fingerprint TEXT, -- Browser/device unique ID
    phone VARCHAR(20),
    profile_image_url TEXT,
    attendance_threshold DECIMAL(5,2) DEFAULT 75.00, -- Minimum attendance required
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses/Subjects table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    credits INTEGER DEFAULT 3,
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timetables - class schedules
CREATE TABLE timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    building VARCHAR(100),
    capacity INTEGER DEFAULT 60,
    location_coordinates POINT, -- GPS coordinates for geofencing
    geofence_radius INTEGER DEFAULT 50, -- meters
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course enrollments (students in courses)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, course_id)
);

-- Attendance sessions - each class instance
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    qr_code TEXT UNIQUE, -- Encoded session data
    qr_expiry TIMESTAMP WITH TIME ZONE,
    location_coordinates POINT,
    geofence_enabled BOOLEAN DEFAULT false,
    session_status VARCHAR(20) CHECK (session_status IN ('scheduled', 'active', 'completed', 'cancelled')) DEFAULT 'scheduled',
    total_enrolled INTEGER DEFAULT 0,
    total_present INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual attendance records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
    scan_method VARCHAR(20) CHECK (scan_method IN ('qr_scan', 'manual', 'auto_absent')) DEFAULT 'qr_scan',
    device_id TEXT, -- Browser fingerprint
    gps_coordinates POINT,
    ip_address INET,
    user_agent TEXT,
    is_suspicious BOOLEAN DEFAULT false, -- Flagged by system
    marked_by UUID REFERENCES users(id), -- Who marked (for manual entries)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id) -- One record per student per session
);

-- Alerts and notifications
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('low_attendance', 'session_started', 'session_ending', 'suspicious_activity', 'admin_notification')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data (course_id, session_id, etc.)
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs for security tracking
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    device_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance statistics (materialized view for performance)
CREATE TABLE attendance_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    attended_sessions INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Device registrations for security
CREATE TABLE device_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name VARCHAR(255),
    browser_info TEXT,
    os_info TEXT,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_trusted BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    UNIQUE(user_id, device_fingerprint)
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX idx_attendance_sessions_faculty ON attendance_sessions(faculty_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_timestamp ON attendance_records(timestamp);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Students can only see their own attendance records
CREATE POLICY "Students view own attendance" ON attendance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.id = attendance_records.student_id)
        )
    );

-- Students can only insert their own attendance
CREATE POLICY "Students insert own attendance" ON attendance_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.id = attendance_records.student_id 
            AND users.role = 'student'
        )
    );

-- Faculty can see sessions they own
CREATE POLICY "Faculty view own sessions" ON attendance_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.id = attendance_sessions.faculty_id)
        )
    );

-- Faculty can manage their own sessions
CREATE POLICY "Faculty manage own sessions" ON attendance_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.id = attendance_sessions.faculty_id)
        )
    );

-- Users can see their own alerts
CREATE POLICY "Users view own alerts" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_attendance_sessions_modtime BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to calculate attendance percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
    p_student_id UUID,
    p_course_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    total_sessions INTEGER;
    attended_sessions INTEGER;
    percentage DECIMAL(5,2);
BEGIN
    -- Count total sessions for the course that the student is enrolled in
    SELECT COUNT(*)
    INTO total_sessions
    FROM attendance_sessions ass
    JOIN timetables t ON t.id = ass.timetable_id
    WHERE t.course_id = p_course_id
    AND ass.session_status = 'completed';

    -- Count attended sessions
    SELECT COUNT(*)
    INTO attended_sessions
    FROM attendance_records ar
    JOIN attendance_sessions ass ON ass.id = ar.session_id
    JOIN timetables t ON t.id = ass.timetable_id
    WHERE ar.student_id = p_student_id
    AND t.course_id = p_course_id
    AND ar.status IN ('present', 'late');

    -- Calculate percentage
    IF total_sessions > 0 THEN
        percentage := (attended_sessions * 100.0) / total_sessions;
    ELSE
        percentage := 0.00;
    END IF;

    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update attendance statistics
CREATE OR REPLACE FUNCTION update_attendance_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for the affected student and course
    INSERT INTO attendance_statistics (student_id, course_id, total_sessions, attended_sessions, attendance_percentage)
    SELECT 
        NEW.student_id,
        t.course_id,
        (SELECT COUNT(*) FROM attendance_sessions ass2 
         JOIN timetables t2 ON t2.id = ass2.timetable_id 
         WHERE t2.course_id = t.course_id AND ass2.session_status = 'completed'),
        (SELECT COUNT(*) FROM attendance_records ar2 
         JOIN attendance_sessions ass3 ON ass3.id = ar2.session_id
         JOIN timetables t3 ON t3.id = ass3.timetable_id
         WHERE ar2.student_id = NEW.student_id 
         AND t3.course_id = t.course_id 
         AND ar2.status IN ('present', 'late')),
        calculate_attendance_percentage(NEW.student_id, t.course_id)
    FROM attendance_sessions ass
    JOIN timetables t ON t.id = ass.timetable_id
    WHERE ass.id = NEW.session_id
    ON CONFLICT (student_id, course_id) 
    DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        attended_sessions = EXCLUDED.attended_sessions,
        attendance_percentage = EXCLUDED.attendance_percentage,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when attendance is recorded
CREATE TRIGGER attendance_statistics_trigger
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_attendance_statistics();

-- Sample data for testing
INSERT INTO users (id, email, name, role, department, student_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@student.edu', 'John Doe', 'student', 'Computer Science', 'CS2024001'),
    ('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@student.edu', 'Jane Smith', 'student', 'Computer Science', 'CS2024002'),
    ('550e8400-e29b-41d4-a716-446655440003', 'prof.wilson@faculty.edu', 'Dr. Robert Wilson', 'faculty', 'Computer Science', NULL),
    ('550e8400-e29b-41d4-a716-446655440004', 'admin@university.edu', 'Admin User', 'admin', 'Administration', NULL);

INSERT INTO courses (id, course_code, course_name, department, credits, semester) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'CS101', 'Introduction to Programming', 'Computer Science', 4, 'Fall 2024'),
    ('660e8400-e29b-41d4-a716-446655440002', 'CS201', 'Data Structures', 'Computer Science', 3, 'Fall 2024'),
    ('660e8400-e29b-41d4-a716-446655440003', 'MATH101', 'Calculus I', 'Mathematics', 4, 'Fall 2024');

INSERT INTO enrollments (student_id, course_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003');

INSERT INTO timetables (id, course_id, faculty_id, day_of_week, start_time, end_time, room, building) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 1, '09:00:00', '10:30:00', 'Room 101', 'CS Building'),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 3, '11:00:00', '12:30:00', 'Room 201', 'CS Building');
