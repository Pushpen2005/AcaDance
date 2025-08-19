-- Users table (legacy demo)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('Student', 'Faculty', 'Admin')) NOT NULL
);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id text,
  faculty_id uuid REFERENCES users(id),
  student_id uuid REFERENCES users(id),
  time timestamptz
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id text,
  student_id uuid REFERENCES users(id),
  status text CHECK (status IN ('Present', 'Absent')),
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students: can only see their own attendance
CREATE POLICY student_attendance ON attendance
  FOR SELECT USING (auth.uid() = student_id);

-- Faculty: can only see attendance for their classes
CREATE POLICY faculty_attendance ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timetables
      WHERE timetables.class_id = attendance.class_id
      AND timetables.faculty_id = auth.uid()
    )
  );

-- Admin: full access
CREATE POLICY admin_attendance ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- RLS Policies for users table
CREATE POLICY user_self_access ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY admin_user_access ON users
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for timetables table
CREATE POLICY student_timetable_access ON timetables
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY faculty_timetable_access ON timetables
  FOR SELECT USING (auth.uid() = faculty_id);
CREATE POLICY admin_timetable_access ON timetables
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'));

-- Seed initial data
INSERT INTO users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'Admin'),
  ('00000000-0000-0000-0000-000000000002', 'faculty@example.com', 'Faculty User', 'Faculty'),
  ('00000000-0000-0000-0000-000000000003', 'student@example.com', 'Student User', 'Student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO timetables (id, class_id, faculty_id, student_id, time) VALUES
  ('10000000-0000-0000-0000-000000000001', 'C101', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO attendance (id, class_id, student_id, status, timestamp) VALUES
  ('20000000-0000-0000-0000-000000000001', 'C101', '00000000-0000-0000-0000-000000000003', 'Present', now())
ON CONFLICT (id) DO NOTHING;

-- Profiles table for auth.users linkage
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text check (role in ('student','faculty','admin')) not null,
  department text,
  phone text,
  avatar_url text,
  theme text default 'light',
  notification text default 'email',
  created_at timestamp default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Students can only read their own profile
create policy if not exists "Students read own profile"
on profiles for select
using (auth.uid() = id);

-- Admins can view all
create policy if not exists "Admins read all"
on profiles for select
using (exists(select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Users can upsert their own profile
create policy if not exists "Users upsert own profile"
on profiles for insert with check (auth.uid() = id);

create policy if not exists "Users update own profile"
on profiles for update using (auth.uid() = id);
