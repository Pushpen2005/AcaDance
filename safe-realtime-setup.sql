-- 🚀 SAFE REALTIME SETUP - Copy this entire script and run in Supabase SQL Editor

-- Step 1: Enable realtime for tables (ignore errors if already enabled)
DO $$
BEGIN
    -- Try to add each table, ignore if already exists
    BEGIN
        ALTER publication supabase_realtime ADD TABLE profiles;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'profiles already enabled for realtime';
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE timetables;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'timetables already enabled for realtime';
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE attendance_sessions;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'attendance_sessions already enabled for realtime';
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE attendance_records;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'attendance_records already enabled for realtime';
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'notifications already enabled for realtime';
    END;
    
    BEGIN
        ALTER publication supabase_realtime ADD TABLE courses;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'courses already enabled for realtime';
    END;
END $$;

-- Step 2: Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'attendance_shortage', 'timetable_update', 'assignment', 'exam')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (true);

-- Step 5: Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Step 7: Verify success
SELECT 
  CASE 
    WHEN COUNT(*) >= 6 THEN '🎉 SUCCESS: Realtime enabled for ' || COUNT(*) || ' tables!'
    WHEN COUNT(*) > 0 THEN '⚠️ PARTIAL: ' || COUNT(*) || ' tables enabled (some may have failed)'
    ELSE '❌ ERROR: No tables enabled for realtime'
  END as status,
  array_agg(tablename) as enabled_tables
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('profiles', 'timetables', 'attendance_sessions', 'attendance_records', 'notifications', 'courses');

-- Step 8: Test notification insert
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  priority
) VALUES (
  auth.uid(),
  'System Test',
  'Realtime setup completed successfully! 🎉',
  'success',
  'medium'
) ON CONFLICT DO NOTHING;

-- Final message
SELECT '✅ Setup complete! Test at: http://localhost:3000/realtime-test' as next_step;
