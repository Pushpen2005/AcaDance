-- 🚀 QUICK REALTIME SETUP - Run this in Supabase SQL Editor
-- This enables realtime directly through SQL (bypasses UI restrictions)

-- Step 1: Enable realtime for tables
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS profiles;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS timetables;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS attendance_sessions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS attendance_records;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS notifications;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS courses;

-- Step 2: Verify tables are enabled
SELECT 'Realtime enabled for these tables:' as status;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Step 3: Create notifications table if missing
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

-- Step 4: Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Basic notification policies
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

-- Step 6: Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Step 7: Final verification
SELECT 
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ SUCCESS: Realtime enabled for ' || COUNT(*) || ' tables'
    ELSE '⚠️ WARNING: Only ' || COUNT(*) || ' tables enabled'
  END as final_status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('profiles', 'timetables', 'attendance_sessions', 'attendance_records', 'notifications', 'courses');

-- SUCCESS MESSAGE
SELECT '🎉 Realtime setup complete! Test at: http://localhost:3000/realtime-test' as next_step;
