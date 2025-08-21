# 🔧 Supabase Realtime Access Issues - Solutions

## Issue: "Request Access" for Replication

If you're seeing "request access" when trying to enable replication, here are the solutions:

## Solution 1: Alternative Realtime Setup (Recommended)

Since you have the SQL script ready, you can enable realtime directly through SQL:

### Step 1: Run This in Supabase SQL Editor

```sql
-- Enable realtime for tables (alternative to UI)
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS profiles;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS timetables;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS attendance_sessions;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS attendance_records;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS notifications;
ALTER publication supabase_realtime ADD TABLE IF NOT EXISTS courses;

-- Verify what tables are enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Step 2: Then Run Your Full Script

Copy and paste the entire content from `database/realtime-policies.sql` into the SQL Editor.

## Solution 2: Check Your Supabase Plan

### Free Tier Limitations:
- **Realtime** may be limited on free tier
- **Database size** limits might affect replication
- **API requests** per hour limits

### Upgrade Options:
1. **Pro Plan** ($25/month) - Full realtime access
2. **Team Plan** ($599/month) - Advanced features

## Solution 3: Manual Realtime Check

### Verify Your Current Setup:

```sql
-- Check if realtime is available
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check current enabled tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check if your tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'timetables', 'attendance_sessions', 'attendance_records', 'notifications', 'courses');
```

## Solution 4: Alternative Real-time Implementation

If Supabase realtime isn't available, you can use **polling-based updates**:

### Create Polling Hook:

```typescript
// hooks/usePollingUpdates.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePollingUpdates(table: string, interval = 5000) {
  const [data, setData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const { data: newData } = await supabase
        .from(table)
        .select('*')
        .gte('updated_at', lastUpdate.toISOString());
      
      if (newData && newData.length > 0) {
        setData(prev => [...prev, ...newData]);
        setLastUpdate(new Date());
      }
    };

    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [table, interval, lastUpdate]);

  return { data, lastUpdate };
}
```

## Solution 5: Contact Supabase Support

If you need immediate realtime access:

1. **Email**: support@supabase.com
2. **Discord**: Supabase Discord Community
3. **GitHub**: Open an issue at supabase/supabase

**Subject**: "Request access to realtime replication for academic project"

## Quick Test Without Full Realtime

You can still test the system with manual updates:

```bash
# Start development server
npm run dev

# Open test page
open http://localhost:3000/realtime-test

# Use the test buttons to insert data manually
# The UI will update when you refresh
```

## Recommended Next Steps

1. **Try Solution 1** (SQL-based realtime enable) first
2. **Check your Supabase plan** and consider upgrading if needed
3. **Use Solution 4** (polling) as a temporary workaround
4. **Contact support** if you need realtime for production

## Verification Commands

After trying any solution, verify with:

```sql
-- Check if realtime is working
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Test realtime subscription
SELECT * FROM pg_stat_replication;
```

Your real-time implementation is complete and ready - you just need to resolve the Supabase access issue! 🚀
