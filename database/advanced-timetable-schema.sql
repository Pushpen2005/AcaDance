-- Advanced Timetable Generation Schema Updates
-- This file extends the existing schema.sql with advanced timetable features

-- Enhanced Subjects Table with more detailed information
DROP TABLE IF EXISTS subjects CASCADE;
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  credits INT NOT NULL,
  duration INT NOT NULL, -- in minutes
  type TEXT NOT NULL CHECK (type IN ('lecture', 'lab', 'tutorial', 'seminar')),
  sessions_per_week INT DEFAULT 1,
  department TEXT NOT NULL,
  semester INT NOT NULL,
  prerequisites TEXT[], -- Array of prerequisite subject codes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Faculty Table with availability and constraints
DROP TABLE IF EXISTS faculty CASCADE;
CREATE TABLE faculty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  specialization TEXT[] NOT NULL, -- Array of specializations
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  available_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00"}',
  max_hours_per_day INT DEFAULT 6,
  max_hours_per_week INT DEFAULT 24,
  preferred_time_slots TEXT[], -- Array of preferred slot IDs
  unavailable_slots TEXT[], -- Array of unavailable slot IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Rooms Table with detailed specifications
DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('classroom', 'lab', 'auditorium', 'seminar_hall')),
  capacity INT NOT NULL,
  building TEXT NOT NULL,
  floor INT NOT NULL,
  equipment TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of available equipment
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  available_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00"}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Time Slots Table for standardized scheduling
CREATE TABLE time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_name TEXT NOT NULL, -- e.g., 'Period 1', 'Morning Lab'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Constraints Table for complex scheduling rules
DROP TABLE IF EXISTS constraints CASCADE;
CREATE TABLE constraints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('faculty_unavailable', 'room_unavailable', 'subject_timing', 'batch_restriction', 'custom')),
  entity_id UUID, -- References subjects, faculty, or rooms
  restriction JSONB NOT NULL, -- Flexible constraint data
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Timetable Entries Table
DROP TABLE IF EXISTS timetables CASCADE;
CREATE TABLE timetable_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  batch TEXT NOT NULL, -- e.g., 'CS_SEM3', 'ECE_SEM5'
  semester INT NOT NULL,
  department TEXT NOT NULL,
  week_type TEXT DEFAULT 'both' CHECK (week_type IN ('odd', 'even', 'both')),
  session_type TEXT NOT NULL CHECK (session_type IN ('lecture', 'lab', 'tutorial')),
  conflicts TEXT[], -- Array of conflict descriptions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent double-booking
  UNIQUE(time_slot_id, faculty_id),
  UNIQUE(time_slot_id, room_id),
  UNIQUE(time_slot_id, batch)
);

-- Timetable Generation Settings
CREATE TABLE timetable_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  algorithm TEXT DEFAULT 'smart_ai' CHECK (algorithm IN ('smart_ai', 'genetic', 'constraint_satisfaction', 'greedy')),
  parameters JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timetable Analytics and Reports
CREATE TABLE timetable_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL, -- 'faculty_utilization', 'room_utilization', 'conflict_count'
  department TEXT,
  semester INT,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default time slots
INSERT INTO time_slots (day, start_time, end_time, slot_name) VALUES
-- Monday
('Monday', '08:00', '09:00', 'Period 1'),
('Monday', '09:00', '10:00', 'Period 2'),
('Monday', '10:15', '11:15', 'Period 3'),
('Monday', '11:15', '12:15', 'Period 4'),
('Monday', '13:15', '14:15', 'Period 5'),
('Monday', '14:15', '15:15', 'Period 6'),
('Monday', '15:30', '16:30', 'Period 7'),
('Monday', '16:30', '17:30', 'Period 8'),

-- Tuesday
('Tuesday', '08:00', '09:00', 'Period 1'),
('Tuesday', '09:00', '10:00', 'Period 2'),
('Tuesday', '10:15', '11:15', 'Period 3'),
('Tuesday', '11:15', '12:15', 'Period 4'),
('Tuesday', '13:15', '14:15', 'Period 5'),
('Tuesday', '14:15', '15:15', 'Period 6'),
('Tuesday', '15:30', '16:30', 'Period 7'),
('Tuesday', '16:30', '17:30', 'Period 8'),

-- Wednesday
('Wednesday', '08:00', '09:00', 'Period 1'),
('Wednesday', '09:00', '10:00', 'Period 2'),
('Wednesday', '10:15', '11:15', 'Period 3'),
('Wednesday', '11:15', '12:15', 'Period 4'),
('Wednesday', '13:15', '14:15', 'Period 5'),
('Wednesday', '14:15', '15:15', 'Period 6'),
('Wednesday', '15:30', '16:30', 'Period 7'),
('Wednesday', '16:30', '17:30', 'Period 8'),

-- Thursday
('Thursday', '08:00', '09:00', 'Period 1'),
('Thursday', '09:00', '10:00', 'Period 2'),
('Thursday', '10:15', '11:15', 'Period 3'),
('Thursday', '11:15', '12:15', 'Period 4'),
('Thursday', '13:15', '14:15', 'Period 5'),
('Thursday', '14:15', '15:15', 'Period 6'),
('Thursday', '15:30', '16:30', 'Period 7'),
('Thursday', '16:30', '17:30', 'Period 8'),

-- Friday
('Friday', '08:00', '09:00', 'Period 1'),
('Friday', '09:00', '10:00', 'Period 2'),
('Friday', '10:15', '11:15', 'Period 3'),
('Friday', '11:15', '12:15', 'Period 4'),
('Friday', '13:15', '14:15', 'Period 5'),
('Friday', '14:15', '15:15', 'Period 6'),
('Friday', '15:30', '16:30', 'Period 7'),
('Friday', '16:30', '17:30', 'Period 8'),

-- Saturday (reduced schedule)
('Saturday', '08:00', '09:00', 'Period 1'),
('Saturday', '09:00', '10:00', 'Period 2'),
('Saturday', '10:15', '11:15', 'Period 3'),
('Saturday', '11:15', '12:15', 'Period 4');

-- Insert sample data for testing
INSERT INTO subjects (name, code, credits, duration, type, sessions_per_week, department, semester) VALUES
('Data Structures and Algorithms', 'CS301', 4, 60, 'lecture', 3, 'Computer Science', 3),
('Database Management Systems', 'CS302', 4, 60, 'lecture', 3, 'Computer Science', 3),
('Operating Systems', 'CS303', 4, 60, 'lecture', 3, 'Computer Science', 3),
('Computer Networks', 'CS304', 3, 60, 'lecture', 2, 'Computer Science', 3),
('Software Engineering', 'CS305', 3, 60, 'lecture', 2, 'Computer Science', 3),
('Database Lab', 'CS302L', 2, 180, 'lab', 1, 'Computer Science', 3),
('Operating Systems Lab', 'CS303L', 2, 180, 'lab', 1, 'Computer Science', 3),
('Mathematics III', 'MA301', 4, 60, 'lecture', 3, 'Mathematics', 3),
('Physics II', 'PH201', 3, 60, 'lecture', 2, 'Physics', 2),
('Physics Lab II', 'PH201L', 2, 180, 'lab', 1, 'Physics', 2);

INSERT INTO rooms (name, type, capacity, building, floor, equipment) VALUES
('Room A101', 'classroom', 60, 'Block A', 1, ARRAY['Projector', 'Whiteboard', 'AC']),
('Room A102', 'classroom', 40, 'Block A', 1, ARRAY['Projector', 'Whiteboard']),
('Lab B201', 'lab', 30, 'Block B', 2, ARRAY['Computers', 'Projector', 'AC', 'Network']),
('Lab B202', 'lab', 25, 'Block B', 2, ARRAY['Computers', 'Projector', 'AC']),
('Auditorium C301', 'auditorium', 200, 'Block C', 3, ARRAY['Audio System', 'Projector', 'AC', 'Microphones']),
('Seminar Hall D101', 'seminar_hall', 80, 'Block D', 1, ARRAY['Projector', 'Whiteboard', 'AC']);

-- Create indexes for performance
CREATE INDEX idx_timetable_entries_subject ON timetable_entries(subject_id);
CREATE INDEX idx_timetable_entries_faculty ON timetable_entries(faculty_id);
CREATE INDEX idx_timetable_entries_room ON timetable_entries(room_id);
CREATE INDEX idx_timetable_entries_time_slot ON timetable_entries(time_slot_id);
CREATE INDEX idx_timetable_entries_batch ON timetable_entries(batch);
CREATE INDEX idx_timetable_entries_department ON timetable_entries(department);
CREATE INDEX idx_time_slots_day ON time_slots(day);
CREATE INDEX idx_constraints_type ON constraints(type);
CREATE INDEX idx_constraints_entity ON constraints(entity_id);

-- RLS Policies for enhanced security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_analytics ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to faculty" ON faculty FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to rooms" ON rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to time_slots" ON time_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to timetable_entries" ON timetable_entries FOR SELECT TO authenticated USING (true);

-- Allow admin/faculty to manage subjects, faculty, rooms
CREATE POLICY "Allow admin to manage subjects" ON subjects FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'faculty')
  )
);

CREATE POLICY "Allow admin to manage faculty" ON faculty FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin to manage rooms" ON rooms FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin to manage constraints" ON constraints FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Allow admin to manage timetable_entries" ON timetable_entries FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'faculty')
  )
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON constraints 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_entries_updated_at BEFORE UPDATE ON timetable_entries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
