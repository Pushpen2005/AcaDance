# Real-Time Data Updates Implementation Guide

This guide covers the complete implementation of real-time data updates using Supabase for the Academic System.

## 🚀 Quick Start

### 1. Enable Realtime in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Enable Realtime for these tables:
   - ✅ `profiles`
   - ✅ `timetables`
   - ✅ `attendance_sessions`
   - ✅ `attendance_records`
   - ✅ `notifications`
   - ✅ `courses`

### 2. Set Up Database Policies

Run the SQL script located at `database/realtime-policies.sql` in your Supabase SQL editor. This will:
- Set up Row Level Security (RLS) policies
- Create the notifications table
- Set up database triggers for automated notifications
- Enable realtime subscriptions

### 3. Import Real-time Components

```typescript
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import RealtimeStatus from '@/components/RealtimeStatus';
import RealtimeNotifications from '@/components/RealtimeNotifications';
import RealtimeAttendanceDashboard from '@/components/RealtimeAttendanceDashboard';
```

## 📚 Available Hooks

### 1. useRealtimeAttendance

Real-time attendance tracking for faculty and students.

```typescript
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';

const {
  attendanceRecords,
  attendanceSessions,
  lastUpdate,
  isConnected,
  error
} = useRealtimeAttendance({
  facultyId: user.role === 'faculty' ? user.id : undefined,
  studentId: user.role === 'student' ? user.id : undefined,
  enabled: true
});
```

**Features:**
- Real-time attendance record updates
- Session status changes (scheduled → active → completed)
- QR code generation tracking
- Attendance percentage calculations

### 2. useRealtimeTimetable

Real-time timetable management and updates.

```typescript
import { useRealtimeTimetable } from '@/hooks/useRealtimeTimetable';

const {
  timetables,
  lastUpdate,
  isConnected,
  getTimetablesByDay
} = useRealtimeTimetable({
  facultyId: user.role === 'faculty' ? user.id : undefined,
  enabled: true
});
```

**Features:**
- Live timetable changes
- Course schedule updates
- Room and time modifications
- Faculty assignment changes

### 3. useRealtimeNotifications

Real-time notification system with browser notifications.

```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  isConnected
} = useRealtimeNotifications({
  userId: user.id,
  enabled: true
});
```

**Features:**
- Instant notifications
- Browser notification support
- Read/unread status tracking
- Priority-based notifications (low, medium, high, urgent)
- Notification types (info, warning, error, attendance_shortage, etc.)

### 4. useRealtimeDashboard

Comprehensive dashboard hook combining all real-time features.

```typescript
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';

const realtimeDashboard = useRealtimeDashboard({
  user: profile,
  enabled: !!profile
});

// Access individual hooks
const { attendance, timetable, notifications } = realtimeDashboard;

// Get dashboard statistics
const stats = realtimeDashboard.getDashboardStats();
const recentActivity = realtimeDashboard.getRecentActivity();
```

## 🎨 UI Components

### 1. RealtimeStatus

Shows connection status and health of real-time subscriptions.

```typescript
<RealtimeStatus 
  isConnected={realtimeDashboard.isConnected}
  connectionStatus={realtimeDashboard.connectionStatus}
  errors={realtimeDashboard.errors}
  showDetails={true}
/>
```

### 2. RealtimeNotifications

Interactive notification bell with popover showing recent notifications.

```typescript
<RealtimeNotifications 
  userId={user.id}
  maxHeight="400px"
/>
```

### 3. RealtimeAttendanceDashboard

Complete attendance management dashboard for faculty.

```typescript
<RealtimeAttendanceDashboard 
  user={facultyUser}
  className="mb-8"
/>
```

## 🔄 Real-time Flow Examples

### Faculty Attendance Flow

1. **Faculty generates QR code** → Updates `attendance_sessions` table
2. **Students scan QR** → Inserts into `attendance_records` table
3. **Real-time update** → Faculty dashboard shows new attendance instantly
4. **Attendance calculation** → Session statistics update in real-time
5. **Auto-notifications** → Students with low attendance get warnings

### Timetable Update Flow

1. **Admin updates timetable** → Updates `timetables` table
2. **Database trigger** → Creates notifications for affected students
3. **Real-time notification** → Students see timetable change instantly
4. **Dashboard update** → Student dashboards reflect new schedule

### Notification Flow

1. **System event** (low attendance, timetable change, etc.)
2. **Database trigger** → Inserts notification into `notifications` table
3. **Real-time subscription** → User receives notification instantly
4. **Browser notification** → Desktop notification if permissions granted
5. **UI update** → Notification bell shows unread count

## 🔒 Security & Permissions

### Row Level Security (RLS)

All real-time tables have RLS enabled with role-based policies:

**Students can:**
- View their own profile and attendance
- Mark their own attendance
- View timetables for enrolled courses
- Receive their own notifications

**Faculty can:**
- View and manage their assigned classes
- View attendance for their sessions
- Update attendance records for their classes
- View student profiles in their courses

**Admin can:**
- Full access to all tables
- Manage all timetables and attendance
- Send notifications to any user
- View all reports and analytics

### Real-time Filters

Supabase real-time subscriptions are filtered by:
- User role and permissions
- Ownership (faculty_id, student_id, user_id)
- Course enrollment (when available)

## 🚨 Automated Notifications

### Attendance Shortage Warnings

Automatically triggered when:
- Student attendance drops below threshold (default 75%)
- Configurable per user via `attendance_threshold` in profiles
- Notification priority based on severity:
  - **Urgent**: Below threshold - 20%
  - **High**: Below threshold - 10%
  - **Medium**: Below threshold

### Timetable Change Notifications

Automatically sent when:
- New classes are scheduled
- Existing classes are modified (time, room, faculty)
- Classes are cancelled or deleted
- Sent to all enrolled students

## 📊 Performance Considerations

### Connection Management

- Each hook manages its own Supabase channel
- Channels are automatically cleaned up on component unmount
- Connection status is tracked and displayed to users

### Data Optimization

- Real-time subscriptions use filters to reduce unnecessary data
- Local state is updated efficiently to avoid re-renders
- Database indexes are created for optimal query performance

### Error Handling

- Connection errors are tracked and displayed
- Automatic reconnection attempts
- Graceful degradation when real-time is unavailable

## 🧪 Testing Real-time Features

### Development Testing

1. Open multiple browser windows with different user roles
2. Perform actions in one window (mark attendance, update timetable)
3. Observe real-time updates in other windows
4. Check browser console for real-time event logs

### Production Monitoring

- Monitor connection status in dashboard
- Track notification delivery rates
- Monitor database trigger performance
- Set up alerts for real-time subscription failures

## 🔧 Troubleshooting

### Common Issues

1. **Real-time not working**
   - Check if tables are enabled in Supabase Replication
   - Verify RLS policies are correctly set up
   - Check browser console for subscription errors

2. **Notifications not appearing**
   - Verify `notifications` table exists and has correct structure
   - Check if triggers are properly created
   - Ensure user has correct permissions

3. **Performance issues**
   - Monitor database query performance
   - Check if too many real-time subscriptions are active
   - Verify indexes are created for filtered columns

### Debug Mode

Enable debug logging:

```typescript
// Add to your component for debugging
useEffect(() => {
  console.log('Real-time status:', {
    attendance: attendanceHook.isConnected,
    timetable: timetableHook.isConnected,
    notifications: notificationsHook.isConnected
  });
}, [attendanceHook.isConnected, timetableHook.isConnected, notificationsHook.isConnected]);
```

## 🎯 Next Steps

1. **Add Enrollment Management**: Create proper enrollment tables and relationships
2. **Enhanced Notifications**: Add email and SMS notification options
3. **Real-time Analytics**: Add live dashboard statistics
4. **Mobile App Integration**: Extend real-time features to mobile apps
5. **Offline Support**: Add offline queue for when real-time is unavailable

## 📝 Example Implementation

See the updated `components/dashboard.tsx` for a complete example of how all real-time features are integrated into the main dashboard.

The system now provides:
- ✅ Real-time attendance tracking
- ✅ Live timetable updates
- ✅ Instant notifications
- ✅ Connection status monitoring
- ✅ Role-based real-time data
- ✅ Automated notification triggers
- ✅ Secure row-level permissions

Students and faculty will see updates instantly when:
- Attendance is marked
- Timetables change
- Notifications are sent
- Sessions start/end
- QR codes are generated

This creates a truly interactive and responsive academic management system!
