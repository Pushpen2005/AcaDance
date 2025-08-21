# 🔍 Database Table Check and Realtime Setup

The error you encountered indicates that the `attendance_sessions` table doesn't exist in your Supabase database. Let's fix this by checking what tables actually exist and only enabling realtime for those tables.

## Step 1: Check Existing Tables

1. **Open Supabase Dashboard** → Your Project → SQL Editor
2. **Run this query** to see what tables exist:

```sql
-- Paste the contents of check-existing-tables.sql
```

This will show you:
- ✅ All existing tables in your database
- ✅ Tables already enabled for realtime
- ✅ Status of specific tables we need

## Step 2: Run Conditional Setup

After confirming which tables exist, run the conditional setup:

1. **Copy and paste** the contents of `conditional-realtime-setup.sql` into Supabase SQL Editor
2. **Execute** the script

This script will:
- ✅ Only enable realtime for tables that actually exist
- ✅ Skip missing tables without errors
- ✅ Set up proper RLS policies
- ✅ Show you exactly what was enabled

## Step 3: Test the Setup

1. **Visit your test page**: `http://localhost:3000/realtime-test`
2. **Check the console** for realtime connection status
3. **Test the features** to ensure everything works

## Common Table Names in Academic Systems

If some tables are missing, you might need to create them or they might have different names:

```sql
-- Check for variations of table names
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%attendance%' OR
    table_name LIKE '%timetable%' OR
    table_name LIKE '%notification%' OR
    table_name LIKE '%course%' OR
    table_name LIKE '%profile%' OR
    table_name LIKE '%user%'
  )
ORDER BY table_name;
```

## Troubleshooting

### If you see "relation does not exist" errors:
1. ✅ Run `check-existing-tables.sql` first
2. ✅ Only run setup for existing tables
3. ✅ Create missing tables if needed

### If realtime still doesn't work:
1. ✅ Check if realtime is enabled in your Supabase project settings
2. ✅ Verify your project URL and anon key
3. ✅ Check browser console for connection errors

## Files Created

- `check-existing-tables.sql` - Check what tables exist
- `conditional-realtime-setup.sql` - Safe setup that won't error on missing tables

Run these in order and your realtime setup should work without errors! 🚀
