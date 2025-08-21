# 🚀 REALTIME ATTENDANCE SYSTEM SETUP GUIDE

## Quick Setup for Testing (5 minutes)

### 1. Environment Variables Setup

Create `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the values from the "Project API keys" section

### 2. Enable Realtime in Supabase

In your Supabase dashboard:

1. **Go to Database → Tables**
2. **For each table, click the table name and go to the "Realtime" tab**
3. **Enable the following events for these tables:**

```
✅ users (INSERT, UPDATE, DELETE)
✅ students (INSERT, UPDATE, DELETE)  
✅ attendance (INSERT, UPDATE, DELETE)
✅ attendance_records (INSERT, UPDATE, DELETE)
✅ attendance_sessions (INSERT, UPDATE, DELETE)
✅ courses (INSERT, UPDATE, DELETE)
✅ enrollments (INSERT, UPDATE, DELETE)
✅ timetables (INSERT, UPDATE, DELETE)
✅ alerts (INSERT, UPDATE, DELETE)
✅ attendance_statistics (INSERT, UPDATE, DELETE)
```

### 3. Quick Database Setup

Run this SQL in your Supabase SQL editor to ensure tables exist:

```sql
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE timetables;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_statistics;
```

### 4. Test the Setup

1. **Run the verification script:**
   ```bash
   ./realtime-verification.sh
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the testing dashboard:**
   Navigate to: http://localhost:3000/realtime-test

4. **Test realtime functionality:**
   - Open the page in 2+ browser tabs
   - Add a student in one tab
   - Start a session
   - Mark attendance 
   - Watch updates appear in all tabs simultaneously

### 5. Expected Behavior

**✅ What you should see:**
- Console logs with "[RT] attendance_records:" when attendance is marked
- Live counter updates across all browser tabs
- Debug panel showing realtime events
- No page refresh needed for updates

**❌ If realtime isn't working:**
- Check environment variables are correct
- Verify Realtime is enabled for tables in Supabase
- Check browser console for errors
- Make sure you're using the correct Supabase project

## Advanced Setup

### RLS Policies Verification

Run this in Supabase SQL editor to check if RLS is properly configured:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- List all policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Auth Integration

If you want to test with real authentication:

1. **Enable Authentication in Supabase:**
   - Go to Authentication → Settings
   - Configure sign-up settings
   - Add any social providers if needed

2. **Create test users:**
   - Student: student@test.com
   - Faculty: faculty@test.com  
   - Admin: admin@test.com

3. **Set roles in the users table:**
   ```sql
   UPDATE users SET role = 'student' WHERE email = 'student@test.com';
   UPDATE users SET role = 'faculty' WHERE email = 'faculty@test.com';
   UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
   ```

## Testing Checklist

- [ ] Environment variables configured
- [ ] Realtime enabled on all tables
- [ ] Verification script passes
- [ ] Can add students and see updates in real-time
- [ ] Can start/end sessions
- [ ] Can mark attendance with live counter updates
- [ ] Multiple browser tabs show synchronized data
- [ ] Console logs show realtime events

## Troubleshooting

**Common Issues:**

1. **"Cannot connect to Supabase"**
   - Check environment variables
   - Verify Supabase project is active

2. **"Realtime not working"**
   - Enable Realtime on tables in Supabase dashboard
   - Check browser console for subscription errors

3. **"RLS blocking operations"**
   - Temporarily disable RLS for testing
   - Check if user roles are set correctly

4. **"TypeScript errors"**
   - Run `npm run type-check` to see specific errors
   - Ensure all dependencies are installed

## Next Steps

Once realtime is working:
1. Test all attendance flows as specified in the requirements
2. Add proper authentication
3. Test role-based access control
4. Deploy to staging environment
5. Enable production monitoring

---

**🎯 Goal:** By following this guide, you should have a fully functional realtime attendance system that updates across all connected clients without page refreshes.
