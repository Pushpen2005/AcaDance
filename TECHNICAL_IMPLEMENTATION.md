# 🏗️ Technical Implementation Plan

## Backend Functions Development

### 1. Supabase Edge Functions

#### QR Code Generation Function
```sql
-- Create function for QR code generation
CREATE OR REPLACE FUNCTION generate_attendance_qr(
    session_id UUID,
    faculty_id UUID,
    expiry_minutes INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    qr_code TEXT;
    expiry_time TIMESTAMP;
BEGIN
    -- Generate unique QR code
    qr_code := encode(gen_random_bytes(16), 'hex');
    expiry_time := NOW() + (expiry_minutes || ' minutes')::INTERVAL;
    
    -- Update session with QR code
    UPDATE attendance_sessions 
    SET qr_code = qr_code, 
        qr_expiry = expiry_time
    WHERE id = session_id AND faculty_id = faculty_id;
    
    RETURN json_build_object(
        'qr_code', qr_code,
        'expiry_time', expiry_time,
        'session_id', session_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Attendance Validation Function
```typescript
// Edge Function: validate-attendance
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AttendanceRequest {
  qr_code: string
  student_id: string
  location?: {
    latitude: number
    longitude: number
  }
  device_info?: string
}

serve(async (req) => {
  try {
    const { qr_code, student_id, location, device_info }: AttendanceRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate QR code and get session
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('qr_code', qr_code)
      .gt('qr_expiry', new Date().toISOString())
      .eq('status', 'active')
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired QR code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if student already marked attendance
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_id', student_id)
      .single()

    if (existingRecord) {
      return new Response(
        JSON.stringify({ error: 'Attendance already marked' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate location if required
    let location_verified = false
    if (session.location_required && location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.required_latitude,
        session.required_longitude
      )
      location_verified = distance <= session.location_radius
    }

    // Determine attendance status based on time
    const now = new Date()
    const sessionStart = new Date(session.start_time)
    const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000) // 15 minutes
    
    let status = 'present'
    if (now > lateThreshold) {
      status = 'late'
    }

    // Record attendance
    const { data: attendanceRecord, error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: session.id,
        student_id,
        status,
        location_verified,
        device_info,
        check_in_time: now.toISOString(),
        latitude: location?.latitude,
        longitude: location?.longitude
      })
      .select()
      .single()

    if (recordError) {
      throw recordError
    }

    // Send notification
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: student_id,
        type: 'attendance_confirmation',
        title: 'Attendance Marked',
        message: `Your attendance has been marked as ${status} for ${session.class_name}`,
        data: { session_id: session.id, status }
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        status,
        session_name: session.class_name,
        timestamp: now.toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}
```

### 2. Real-time Database Triggers

#### Attendance Update Trigger
```sql
-- Function to update attendance statistics
CREATE OR REPLACE FUNCTION update_attendance_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session statistics
    UPDATE attendance_sessions 
    SET 
        present_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = NEW.session_id AND status = 'present'
        ),
        late_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = NEW.session_id AND status = 'late'
        ),
        absent_count = (
            SELECT total_students - present_count - late_count
            FROM attendance_sessions
            WHERE id = NEW.session_id
        )
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER attendance_stats_trigger
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_stats();
```

### 3. Notification System

#### Email Notification Function
```typescript
// Edge Function: send-notification
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRequest {
  user_id: string
  type: string
  title: string
  message: string
  data?: any
  channels?: ('email' | 'sms' | 'push')[]
}

serve(async (req) => {
  try {
    const notification: NotificationRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user preferences
    const { data: user } = await supabase
      .from('profiles')
      .select('email, phone, notification_preferences')
      .eq('id', notification.user_id)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    const channels = notification.channels || ['push']
    const results = []

    // Send email notification
    if (channels.includes('email') && user.email) {
      const emailResult = await sendEmail({
        to: user.email,
        subject: notification.title,
        html: generateEmailTemplate(notification)
      })
      results.push({ channel: 'email', success: emailResult.success })
    }

    // Send SMS notification
    if (channels.includes('sms') && user.phone) {
      const smsResult = await sendSMS({
        to: user.phone,
        message: `${notification.title}: ${notification.message}`
      })
      results.push({ channel: 'sms', success: smsResult.success })
    }

    // Store notification in database
    await supabase
      .from('notifications')
      .insert({
        recipient_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        channels_sent: channels
      })

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  // Implement with your email service (SendGrid, AWS SES, etc.)
  return { success: true }
}

async function sendSMS({ to, message }: { to: string, message: string }) {
  // Implement with your SMS service (Twilio, AWS SNS, etc.)
  return { success: true }
}

function generateEmailTemplate(notification: NotificationRequest): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #1f2937;">${notification.title}</h2>
      <p style="color: #4b5563; line-height: 1.6;">${notification.message}</p>
      <div style="margin-top: 20px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          This is an automated message from Academic System.
        </p>
      </div>
    </div>
  `
}
```

## Database Schema Updates

### Additional Tables
```sql
-- User settings table
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    attendance_alerts BOOLEAN DEFAULT true,
    timetable_updates BOOLEAN DEFAULT true,
    assignment_reminders BOOLEAN DEFAULT true,
    exam_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- File attachments table
CREATE TABLE file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES profiles(id),
    related_table VARCHAR(100),
    related_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### RLS Policies
```sql
-- User settings policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies (admin only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System settings policies (admin only)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

## API Endpoints Documentation

### Authentication Endpoints
```typescript
// /api/auth/login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// /api/auth/register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "full_name": "John Doe"
}

// /api/auth/forgot-password
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

### Attendance Endpoints
```typescript
// /api/attendance/create-session
POST /api/attendance/create-session
{
  "class_name": "CS101",
  "subject": "Computer Science Fundamentals",
  "room": "Room 101",
  "start_time": "2025-08-20T09:00:00Z",
  "end_time": "2025-08-20T10:30:00Z",
  "total_students": 45,
  "location_required": true,
  "required_latitude": 12.9716,
  "required_longitude": 77.5946,
  "location_radius": 50
}

// /api/attendance/mark
POST /api/attendance/mark
{
  "qr_code": "abc123def456",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "device_info": "iPhone 14 Pro"
}

// /api/attendance/reports
GET /api/attendance/reports?start_date=2025-08-01&end_date=2025-08-20&class=CS101
```

## Performance Optimization Plan

### 1. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_attendance_records_session_student ON attendance_records(session_id, student_id);
CREATE INDEX idx_attendance_records_created_at ON attendance_records(created_at);
CREATE INDEX idx_profiles_role_department ON profiles(role, department);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, is_read);

-- Partitioning for large tables
CREATE TABLE attendance_records_2025 PARTITION OF attendance_records
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 2. Caching Strategy
```typescript
// Redis caching implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache user profile
export async function getCachedUserProfile(userId: string) {
  const cached = await redis.get(`user:${userId}`)
  if (cached) return JSON.parse(cached)
  
  // Fetch from database
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  // Cache for 1 hour
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(profile.data))
  return profile.data
}

// Cache attendance statistics
export async function getCachedAttendanceStats(sessionId: string) {
  const cached = await redis.get(`session:${sessionId}:stats`)
  if (cached) return JSON.parse(cached)
  
  // Calculate stats
  const stats = await calculateAttendanceStats(sessionId)
  
  // Cache for 5 minutes
  await redis.setex(`session:${sessionId}:stats`, 300, JSON.stringify(stats))
  return stats
}
```

### 3. Frontend Optimization
```typescript
// Lazy loading components
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const VirtualizedUserList = ({ users }: { users: User[] }) => (
  <List
    height={600}
    itemCount={users.length}
    itemSize={80}
    itemData={users}
  >
    {UserRow}
  </List>
)

// Image optimization
const OptimizedImage = ({ src, alt, ...props }: ImageProps) => (
  <Image
    src={src}
    alt={alt}
    loading="lazy"
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    {...props}
  />
)
```

## Testing Implementation

### 1. Unit Tests
```typescript
// __tests__/components/AuthPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthPage } from '@/components/AuthPage'

describe('AuthPage', () => {
  test('renders login form by default', () => {
    render(<AuthPage />)
    expect(screen.getByRole('tab', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  test('switches to signup form when signup tab is clicked', () => {
    render(<AuthPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }))
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  test('shows error for invalid credentials', async () => {
    render(<AuthPage />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid@email.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })
})
```

### 2. Integration Tests
```typescript
// __tests__/integration/attendance.test.tsx
import { createClient } from '@supabase/supabase-js'
import { attendanceWorkflow } from '@/lib/attendance'

describe('Attendance Workflow', () => {
  let supabase: ReturnType<typeof createClient>
  
  beforeEach(() => {
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
  })

  test('complete attendance marking workflow', async () => {
    // Create session
    const session = await attendanceWorkflow.createSession({
      class_name: 'Test Class',
      subject: 'Test Subject',
      room: 'Test Room',
      total_students: 10
    })

    // Generate QR code
    const qrCode = await attendanceWorkflow.generateQR(session.id)
    expect(qrCode.qr_code).toBeDefined()

    // Mark attendance
    const attendance = await attendanceWorkflow.markAttendance({
      qr_code: qrCode.qr_code,
      student_id: 'test-student-id'
    })

    expect(attendance.status).toBe('present')
  })
})
```

### 3. E2E Tests
```typescript
// e2e/attendance-flow.spec.ts
import { test, expect } from '@playwright/test'

test('faculty can create session and student can mark attendance', async ({ page, context }) => {
  // Faculty login and create session
  await page.goto('/auth')
  await page.fill('[data-testid=email]', 'faculty@demo.com')
  await page.fill('[data-testid=password]', 'password')
  await page.click('[data-testid=login-button]')

  await page.goto('/faculty/create-session')
  await page.fill('[data-testid=class-name]', 'Test Class')
  await page.fill('[data-testid=subject]', 'Test Subject')
  await page.click('[data-testid=create-session]')

  // Get QR code
  const qrCode = await page.textContent('[data-testid=qr-code]')

  // Student login in new tab
  const studentPage = await context.newPage()
  await studentPage.goto('/auth')
  await studentPage.fill('[data-testid=email]', 'student@demo.com')
  await studentPage.fill('[data-testid=password]', 'password')
  await studentPage.click('[data-testid=login-button]')

  // Mark attendance
  await studentPage.goto('/student/qr-scanner')
  await studentPage.fill('[data-testid=manual-qr]', qrCode!)
  await studentPage.click('[data-testid=submit-attendance]')

  await expect(studentPage.locator('[data-testid=success-message]')).toBeVisible()
})
```

## Deployment Pipeline

### 1. CI/CD Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy Academic System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run e2e

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main' && contains(github.event.head_commit.message, '[deploy]')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:production
```

### 2. Infrastructure as Code
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app

volumes:
  redis_data:
```

This technical implementation plan provides detailed guidance for the next phase of development, including backend functions, database optimizations, testing strategies, and deployment pipelines.
