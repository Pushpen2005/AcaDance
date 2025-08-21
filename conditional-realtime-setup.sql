-- 🚀 CONDITIONAL REALTIME SETUP - Only enables realtime for existing tables
-- Run check-existing-tables.sql first to see what tables exist

-- Enable realtime for profiles table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Enable realtime
        ALTER publication supabase_realtime ADD TABLE profiles;
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
            
        RAISE NOTICE 'Profiles table realtime enabled ✅';
    ELSE
        RAISE NOTICE 'Profiles table does not exist ❌';
    END IF;
END $$;

-- Enable realtime for timetables table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timetables' AND table_schema = 'public') THEN
        -- Enable realtime
        ALTER publication supabase_realtime ADD TABLE timetables;
        
        -- Enable RLS
        ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can view timetables" ON timetables;
        DROP POLICY IF EXISTS "Faculty can manage timetables" ON timetables;
        
        -- Create RLS policies
        CREATE POLICY "Anyone can view timetables" ON timetables
            FOR SELECT USING (true);
        
        CREATE POLICY "Faculty can manage timetables" ON timetables
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('faculty', 'admin')
                )
            );
            
        RAISE NOTICE 'Timetables table realtime enabled ✅';
    ELSE
        RAISE NOTICE 'Timetables table does not exist ❌';
    END IF;
END $$;

-- Enable realtime for attendance_records table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_records' AND table_schema = 'public') THEN
        -- Enable realtime
        ALTER publication supabase_realtime ADD TABLE attendance_records;
        
        -- Enable RLS
        ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Students can view own attendance" ON attendance_records;
        DROP POLICY IF EXISTS "Faculty can manage attendance" ON attendance_records;
        
        -- Create RLS policies
        CREATE POLICY "Students can view own attendance" ON attendance_records
            FOR SELECT USING (student_id = auth.uid());
        
        CREATE POLICY "Faculty can manage attendance" ON attendance_records
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('faculty', 'admin')
                )
            );
            
        RAISE NOTICE 'Attendance records table realtime enabled ✅';
    ELSE
        RAISE NOTICE 'Attendance records table does not exist ❌';
    END IF;
END $$;

-- Enable realtime for notifications table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        -- Enable realtime
        ALTER publication supabase_realtime ADD TABLE notifications;
        
        -- Enable RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
        DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own notifications" ON notifications
            FOR SELECT USING (user_id = auth.uid());
        
        CREATE POLICY "Admins can manage notifications" ON notifications
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
            
        RAISE NOTICE 'Notifications table realtime enabled ✅';
    ELSE
        RAISE NOTICE 'Notifications table does not exist ❌';
    END IF;
END $$;

-- Enable realtime for courses table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses' AND table_schema = 'public') THEN
        -- Enable realtime
        ALTER publication supabase_realtime ADD TABLE courses;
        
        -- Enable RLS
        ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
        DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
        
        -- Create RLS policies
        CREATE POLICY "Anyone can view courses" ON courses
            FOR SELECT USING (true);
        
        CREATE POLICY "Admins can manage courses" ON courses
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
            
        RAISE NOTICE 'Courses table realtime enabled ✅';
    ELSE
        RAISE NOTICE 'Courses table does not exist ❌';
    END IF;
END $$;

-- Final summary
SELECT 
  'Setup Complete!' as message,
  COUNT(*) as tables_enabled
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
