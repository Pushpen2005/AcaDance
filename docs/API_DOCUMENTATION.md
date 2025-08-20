# Academic System API Documentation

## Overview

The Academic Management System provides a comprehensive REST API for managing students, faculty, attendance, timetables, and administrative functions. All APIs are built using Supabase Edge Functions with TypeScript and Deno.

## Base URL

```
https://your-project.supabase.co/functions/v1
```

## Authentication

All API endpoints require authentication using Supabase JWT tokens.

### Headers Required

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Edge Functions

### 1. QR Code Generation

**Endpoint:** `POST /generate-qr`

**Description:** Generate QR codes for attendance sessions with optional geofencing.

**Request Body:**
```json
{
  "session_id": "string",
  "faculty_id": "string", 
  "class_id": "string",
  "expiry_minutes": 30,
  "geofence": {
    "enabled": true,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "session_id": "session-123",
    "expires_at": "2024-01-15T10:30:00Z",
    "geofence_enabled": true
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to generate QR code",
  "details": "Session not found"
}
```

### 2. Attendance Validation

**Endpoint:** `POST /validate-attendance`

**Description:** Validate and record student attendance via QR code scan.

**Request Body:**
```json
{
  "qr_data": "string",
  "student_id": "string",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "device_info": {
    "fingerprint": "string",
    "user_agent": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance_id": "att-123",
    "status": "present",
    "marked_at": "2024-01-15T10:15:00Z",
    "session_info": {
      "class_name": "Computer Science 101",
      "faculty_name": "Dr. Smith"
    }
  }
}
```

### 3. Notification System

**Endpoint:** `POST /send-notification`

**Description:** Send notifications via multiple channels (email, SMS, push, in-app).

**Request Body:**
```json
{
  "recipient_id": "string",
  "type": "attendance_reminder",
  "title": "Attendance Reminder",
  "message": "Don't forget to mark your attendance for today's class",
  "channels": ["email", "in_app"],
  "data": {
    "class_id": "cs101",
    "session_time": "2024-01-15T10:00:00Z"
  },
  "schedule_for": "2024-01-15T09:45:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notification_id": "notif-123",
    "channels_sent": ["email", "in_app"],
    "delivery_status": {
      "email": "sent",
      "in_app": "delivered"
    }
  }
}
```

### 4. Attendance Calculation

**Endpoint:** `POST /calculate-attendance`

**Description:** Calculate attendance statistics and trigger low attendance alerts.

**Request Body:**
```json
{
  "student_id": "string",
  "class_id": "string", 
  "semester": "Fall 2024",
  "force_recalculate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance_stats": [
      {
        "student_id": "student-123",
        "total_classes": 20,
        "attended_classes": 18,
        "percentage": 90.0,
        "status": "excellent",
        "last_updated": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "total_students": 1,
      "average_percentage": 90.0,
      "low_attendance_count": 0,
      "excellent_count": 1,
      "good_count": 0,
      "warning_count": 0,
      "critical_count": 0
    }
  }
}
```

### 5. Database Optimization

**Endpoint:** `POST /optimize-database`

**Description:** Analyze and optimize database performance.

**Request Body:**
```json
{
  "operation": "analyze",
  "tables": ["attendance_records", "profiles"],
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "operation": "analyze",
  "data": {
    "table_statistics": [...],
    "slow_queries": [...],
    "index_statistics": [...],
    "recommendations": [
      {
        "type": "vacuum",
        "table": "attendance_records",
        "reason": "High dead row ratio",
        "priority": "high"
      }
    ]
  }
}
```

## Database Schema

### Core Tables

#### 1. Profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student','faculty','admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Attendance Records
```sql
CREATE TABLE attendance_records (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions ON DELETE CASCADE,
  status TEXT CHECK (status IN ('present', 'late', 'absent')),
  marked_at TIMESTAMP DEFAULT NOW(),
  location POINT,
  device_fingerprint TEXT
);
```

#### 3. Attendance Sessions
```sql
CREATE TABLE attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES auth.users ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_code TEXT,
  qr_expires_at TIMESTAMP,
  geofence_enabled BOOLEAN DEFAULT FALSE,
  location POINT,
  geofence_radius INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Notifications
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  channels TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Audit Logs
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request format |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Standard endpoints:** 100 requests per minute
- **QR generation:** 50 requests per minute
- **Bulk operations:** 10 requests per minute

## Security

### Row Level Security (RLS)

All tables implement RLS policies:

**Students:**
- Can only view/modify their own data
- Can insert attendance records for themselves
- Cannot access other students' data

**Faculty:**
- Can view data for their assigned classes
- Can create and manage attendance sessions
- Can view student attendance for their classes

**Admins:**
- Full access to all data
- Can perform bulk operations
- Access to audit logs and system analytics

### Data Validation

- All inputs are validated and sanitized
- SQL injection prevention
- XSS protection
- CSRF protection

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Generate QR Code
const { data, error } = await supabase.functions.invoke('generate-qr', {
  body: {
    session_id: 'session-123',
    faculty_id: 'faculty-456',
    class_id: 'CS101',
    expiry_minutes: 30
  }
})
```

### React Hooks

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAttendance(studentId: string) {
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttendance() {
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', studentId)
      
      setAttendance(data)
      setLoading(false)
    }

    fetchAttendance()
  }, [studentId])

  return { attendance, loading }
}
```

## Testing

### Unit Testing

```bash
npm test
```

### API Testing

```bash
npm run test:api
```

### E2E Testing

```bash
npm run test:e2e
```

## Deployment

See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Support

For API support and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/academic-system/issues)
- Documentation: [Full documentation](./README.md)
- Email: support@youruniversity.edu
