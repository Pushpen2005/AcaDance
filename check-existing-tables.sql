-- 🔍 CHECK EXISTING TABLES - Run this first to see what tables exist

-- Check what tables exist in your database
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check what's already enabled for realtime
SELECT 
  tablename as "Already Enabled for Realtime"
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Check if specific tables we need exist
SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'timetables',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timetables' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'attendance_sessions',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_sessions' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'attendance_records',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_records' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'notifications',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'courses',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses' AND table_schema = 'public') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END;
