-- 🔥 MINIMAL REALTIME SETUP - Try this first
-- Copy and paste this in Supabase SQL Editor

-- Enable realtime for core tables
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE notifications;

-- Create minimal notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic policy
CREATE POLICY "Anyone can view notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Test it works
SELECT 'Realtime enabled for ' || COUNT(*) || ' tables' as result
FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Insert test notification
INSERT INTO notifications (user_id, title, message) 
VALUES ('test-user', 'Test', 'Realtime is working!');

SELECT '✅ Done! Test at: http://localhost:3000/realtime-test' as status;
