-- Complete Database Role Settings for Academic QR Attendance System
-- Run this FIRST to establish the user role foundation
-- Then run qr-attendance-complete-setup.sql

-- ============================================================================
-- 1. ENSURE PROFILES TABLE EXISTS WITH PROPER ROLE CONFIGURATION
-- ============================================================================

-- Create or update profiles table with proper role constraints
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  device_fingerprint TEXT, -- For QR attendance security
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles (department);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at);

-- ============================================================================
-- 2. USER CREATION TRIGGER AND FUNCTION
-- ============================================================================

-- Function to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. ROLE-BASED ACCESS CONTROL POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "faculty_can_view_student_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_can_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_can_manage_all_profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid()::uuid);

-- Users can update their own profile (except role changes)
CREATE POLICY "users_can_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::uuid)
  WITH CHECK (
    id = auth.uid()::uuid 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()::uuid)
  );

-- Allow profile creation during signup
CREATE POLICY "users_can_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()::uuid);

-- Faculty can view student profiles in their classes
CREATE POLICY "faculty_can_view_student_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'faculty'
    )
  );

-- Admin can view all profiles
CREATE POLICY "admin_can_view_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- Admin can manage all profiles (including role changes)
CREATE POLICY "admin_can_manage_all_profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid AND p.role = 'admin'
    )
  );

-- ============================================================================
-- 4. ROLE-SPECIFIC FEATURE TABLES
-- ============================================================================

-- Student-specific features and permissions
CREATE TABLE IF NOT EXISTS student_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  can_view_attendance BOOLEAN DEFAULT TRUE,
  can_scan_qr BOOLEAN DEFAULT TRUE,
  can_view_timetable BOOLEAN DEFAULT TRUE,
  can_receive_notifications BOOLEAN DEFAULT TRUE,
  attendance_privacy BOOLEAN DEFAULT FALSE, -- Hide from other students
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty-specific features and permissions
CREATE TABLE IF NOT EXISTS faculty_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  can_create_sessions BOOLEAN DEFAULT TRUE,
  can_mark_attendance BOOLEAN DEFAULT TRUE,
  can_edit_attendance BOOLEAN DEFAULT TRUE,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_export_data BOOLEAN DEFAULT TRUE,
  session_duration_limit INTEGER DEFAULT 180, -- minutes
  max_sessions_per_day INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-specific features and permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  can_manage_users BOOLEAN DEFAULT TRUE,
  can_manage_roles BOOLEAN DEFAULT TRUE,
  can_view_all_data BOOLEAN DEFAULT TRUE,
  can_export_all_data BOOLEAN DEFAULT TRUE,
  can_configure_system BOOLEAN DEFAULT TRUE,
  can_access_logs BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ROLE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION can_perform_action(action_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid()::uuid;
  
  CASE action_type
    WHEN 'create_session' THEN
      RETURN user_role = 'faculty' OR user_role = 'admin';
    WHEN 'mark_attendance' THEN
      RETURN user_role = 'student' OR user_role = 'faculty' OR user_role = 'admin';
    WHEN 'view_reports' THEN
      RETURN user_role = 'faculty' OR user_role = 'admin';
    WHEN 'manage_users' THEN
      RETURN user_role = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. AUTOMATIC PERMISSION ASSIGNMENT TRIGGERS
-- ============================================================================

-- Function to create default permissions based on role
CREATE OR REPLACE FUNCTION create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Create permissions based on role
  CASE NEW.role
    WHEN 'student' THEN
      INSERT INTO student_permissions (student_id) VALUES (NEW.id);
    WHEN 'faculty' THEN
      INSERT INTO faculty_permissions (faculty_id) VALUES (NEW.id);
    WHEN 'admin' THEN
      INSERT INTO admin_permissions (admin_id) VALUES (NEW.id);
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic permission assignment
DROP TRIGGER IF EXISTS create_permissions_on_profile_insert ON profiles;
CREATE TRIGGER create_permissions_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_permissions();

-- ============================================================================
-- 7. ROLE CHANGE HANDLING
-- ============================================================================

-- Function to handle role changes and update permissions
CREATE OR REPLACE FUNCTION handle_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow role changes by admin
  IF OLD.role != NEW.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::uuid AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
    
    -- Clean up old role permissions
    DELETE FROM student_permissions WHERE student_id = NEW.id;
    DELETE FROM faculty_permissions WHERE faculty_id = NEW.id;
    DELETE FROM admin_permissions WHERE admin_id = NEW.id;
    
    -- Create new role permissions
    CASE NEW.role
      WHEN 'student' THEN
        INSERT INTO student_permissions (student_id) VALUES (NEW.id);
      WHEN 'faculty' THEN
        INSERT INTO faculty_permissions (faculty_id) VALUES (NEW.id);
      WHEN 'admin' THEN
        INSERT INTO admin_permissions (admin_id) VALUES (NEW.id);
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change handling
DROP TRIGGER IF EXISTS handle_role_change_on_update ON profiles;
CREATE TRIGGER handle_role_change_on_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_role_change();

-- ============================================================================
-- 8. SECURITY VIEWS FOR ROLE-BASED DATA ACCESS
-- ============================================================================

-- View for current user's profile with permissions
CREATE OR REPLACE VIEW current_user_profile AS
SELECT 
  p.*,
  CASE p.role
    WHEN 'student' THEN row_to_json(sp.*)
    WHEN 'faculty' THEN row_to_json(fp.*)
    WHEN 'admin' THEN row_to_json(ap.*)
  END as permissions
FROM profiles p
LEFT JOIN student_permissions sp ON p.id = sp.student_id
LEFT JOIN faculty_permissions fp ON p.id = fp.faculty_id
LEFT JOIN admin_permissions ap ON p.id = ap.admin_id
WHERE p.id = auth.uid()::uuid;

-- View for role statistics (admin only)
CREATE OR REPLACE VIEW role_statistics AS
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_signups
FROM profiles
GROUP BY role;

-- ============================================================================
-- 9. INITIAL ADMIN SETUP (OPTIONAL)
-- ============================================================================

-- Create initial admin user if none exists
-- Note: Replace 'admin@yourdomain.com' with your actual admin email
/*
INSERT INTO profiles (id, name, email, role, employee_id)
SELECT 
  au.id,
  'System Administrator',
  'admin@yourdomain.com',
  'admin',
  'ADMIN001'
FROM auth.users au
WHERE au.email = 'admin@yourdomain.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/

-- ============================================================================
-- 10. EXAMPLE ROLE-BASED POLICIES FOR OTHER TABLES (Run after other tables exist)
-- ============================================================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Notifications table policies based on roles
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_based_notification_access" ON notifications;
CREATE POLICY "role_based_notification_access"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::uuid
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()::uuid 
        AND p.role IN ('admin', 'faculty')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES (Run after setup to verify everything works)
-- ============================================================================

-- Check role distribution
-- SELECT role, COUNT(*) FROM profiles GROUP BY role;

-- Check if current user has permissions
-- SELECT * FROM current_user_profile;

-- Check role-based access functions
-- SELECT can_perform_action('create_session');
-- SELECT has_role(auth.uid()::uuid, 'admin');
