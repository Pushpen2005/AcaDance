# Performance Optimization Guide

## Overview

This guide covers comprehensive performance optimization strategies for the Academic Management System, including database optimization, caching, frontend performance, and monitoring.

## Database Performance

### 1. Index Optimization

#### Critical Indexes
```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_attendance_records_student_date 
ON attendance_records(student_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_attendance_sessions_faculty_date 
ON attendance_sessions(faculty_id, date DESC);

CREATE INDEX CONCURRENTLY idx_notifications_recipient_unread 
ON notifications(recipient_id, is_read, created_at DESC);

CREATE INDEX CONCURRENTLY idx_audit_logs_user_action_date 
ON audit_logs(user_id, action, created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_attendance_records_session_status 
ON attendance_records(session_id, status);

CREATE INDEX CONCURRENTLY idx_profiles_role_department 
ON profiles(role, department);
```

#### Index Analysis
```sql
-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexname)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY pg_relation_size(indexname) DESC;

-- Find missing indexes (high seq_scan ratio)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    seq_tup_read / GREATEST(seq_scan, 1) as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 100
AND seq_tup_read / GREATEST(seq_scan, 1) > 10000
ORDER BY seq_tup_read DESC;
```

### 2. Query Optimization

#### Optimized Attendance Queries
```sql
-- Efficient attendance summary
WITH attendance_stats AS (
  SELECT 
    ar.student_id,
    COUNT(*) as total_classes,
    COUNT(*) FILTER (WHERE ar.status = 'present') as attended_classes
  FROM attendance_records ar
  JOIN attendance_sessions ass ON ar.session_id = ass.id
  WHERE ass.date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY ar.student_id
)
SELECT 
  p.full_name,
  COALESCE(ast.total_classes, 0) as total_classes,
  COALESCE(ast.attended_classes, 0) as attended_classes,
  CASE 
    WHEN ast.total_classes > 0 
    THEN ROUND((ast.attended_classes::DECIMAL / ast.total_classes) * 100, 2)
    ELSE 0 
  END as percentage
FROM profiles p
LEFT JOIN attendance_stats ast ON p.id = ast.student_id
WHERE p.role = 'student'
ORDER BY percentage DESC;
```

#### Efficient Faculty Dashboard
```sql
-- Optimized faculty session query
SELECT 
  ass.id,
  ass.class_id,
  ass.date,
  ass.start_time,
  COUNT(ar.id) as total_students,
  COUNT(ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as absent_count
FROM attendance_sessions ass
LEFT JOIN attendance_records ar ON ass.id = ar.session_id
WHERE ass.faculty_id = $1
AND ass.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY ass.id, ass.class_id, ass.date, ass.start_time
ORDER BY ass.date DESC, ass.start_time DESC;
```

### 3. Database Partitioning

#### Partition Large Tables
```sql
-- Partition attendance_records by date
CREATE TABLE attendance_records_partitioned (
  LIKE attendance_records INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE attendance_records_2024_01 PARTITION OF attendance_records_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE attendance_records_2024_02 PARTITION OF attendance_records_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create partitions function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
  partition_name text;
  end_date date;
BEGIN
  partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
  end_date := start_date + interval '1 month';
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                  FOR VALUES FROM (%L) TO (%L)',
                 partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### 4. Connection Pooling

#### PgBouncer Configuration
```ini
# pgbouncer.ini
[databases]
academic_system = host=localhost port=5432 dbname=academic_system

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
server_reset_query = DISCARD ALL
```

#### Application Connection Pool
```typescript
// lib/db-pool.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  
  // Log slow queries
  if (duration > 1000) {
    console.warn('Slow query detected:', { text, duration })
  }
  
  return res
}
```

## Caching Strategy

### 1. Application-Level Caching

#### Redis Cache Implementation
```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class CacheManager {
  private static instance: CacheManager
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, data: T, ttl = 300): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }
}

// Usage in API routes
export async function getCachedAttendance(studentId: string) {
  const cache = CacheManager.getInstance()
  const cacheKey = `attendance:${studentId}`
  
  let attendance = await cache.get(cacheKey)
  
  if (!attendance) {
    attendance = await fetchAttendanceFromDB(studentId)
    await cache.set(cacheKey, attendance, 300) // 5 minutes
  }
  
  return attendance
}
```

### 2. Browser Caching

#### Service Worker for Offline Support
```typescript
// public/sw.js
const CACHE_NAME = 'academic-system-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})
```

#### HTTP Caching Headers
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Static assets caching
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // API caching
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  }
  
  return response
}
```

### 3. CDN Configuration

#### Cloudflare Integration
```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cloudflare-cdn.example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

## Frontend Performance

### 1. Code Splitting and Lazy Loading

#### Dynamic Imports
```typescript
// components/LazyComponents.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <div>Loading admin dashboard...</div>,
  ssr: false
})

const TimetableView = dynamic(() => import('./TimetableView'), {
  loading: () => <div>Loading timetable...</div>
})

export { AdminDashboard, TimetableView }
```

#### Route-based Code Splitting
```typescript
// pages/admin/index.tsx
import { lazy, Suspense } from 'react'

const AdminDashboard = lazy(() => import('@/components/AdminDashboard'))

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  )
}
```

### 2. Bundle Optimization

#### Webpack Bundle Analyzer
```bash
npm install --save-dev @next/bundle-analyzer

# Add to next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Analyze bundle
ANALYZE=true npm run build
```

#### Tree Shaking Optimization
```typescript
// Import only what you need
import { format } from 'date-fns/format'
import { startOfDay } from 'date-fns/startOfDay'

// Instead of
import * as dateFns from 'date-fns'
```

### 3. Image Optimization

#### Next.js Image Component
```typescript
import Image from 'next/image'

export function OptimizedAvatar({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
      priority={false}
    />
  )
}
```

#### Responsive Images
```typescript
export function ResponsiveImage({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      fill
      style={{ objectFit: 'cover' }}
    />
  )
}
```

### 4. Virtual Scrolling

#### Large List Optimization
```typescript
import { FixedSizeList as List } from 'react-window'

interface AttendanceListProps {
  attendance: AttendanceRecord[]
}

export function VirtualizedAttendanceList({ attendance }: AttendanceListProps) {
  const Row = ({ index, style }: { index: number, style: any }) => (
    <div style={style}>
      <AttendanceRow record={attendance[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={attendance.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

## Real-time Performance

### 1. WebSocket Optimization

#### Optimized Real-time Updates
```typescript
// hooks/useRealtimeOptimized.ts
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeOptimized<T>(
  table: string,
  filter?: string,
  throttleMs = 1000
) {
  const [data, setData] = useState<T[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        },
        (payload) => {
          // Throttle updates to prevent excessive re-renders
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          
          timeoutRef.current = setTimeout(() => {
            setData(currentData => {
              // Optimize state updates based on payload type
              switch (payload.eventType) {
                case 'INSERT':
                  return [...currentData, payload.new as T]
                case 'UPDATE':
                  return currentData.map(item => 
                    (item as any).id === payload.new.id ? payload.new as T : item
                  )
                case 'DELETE':
                  return currentData.filter(item => 
                    (item as any).id !== payload.old.id
                  )
                default:
                  return currentData
              }
            })
          }, throttleMs)
        }
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [table, filter, throttleMs])

  return data
}
```

### 2. Background Processing

#### Web Workers for Heavy Tasks
```typescript
// workers/attendanceCalculator.worker.ts
self.onmessage = function(e) {
  const { attendanceData } = e.data
  
  // Perform heavy calculation
  const result = calculateAttendanceStatistics(attendanceData)
  
  self.postMessage(result)
}

function calculateAttendanceStatistics(data: any[]) {
  // Heavy computation logic
  return data.map(record => {
    // Calculate percentages, trends, etc.
    return {
      ...record,
      percentage: (record.present / record.total) * 100,
      trend: calculateTrend(record)
    }
  })
}

// Usage in component
const useAttendanceWorker = () => {
  const workerRef = useRef<Worker>()

  useEffect(() => {
    workerRef.current = new Worker('/workers/attendanceCalculator.worker.js')
    return () => workerRef.current?.terminate()
  }, [])

  const calculateAttendance = useCallback((data: any[]) => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = (e) => resolve(e.data)
      workerRef.current!.postMessage({ attendanceData: data })
    })
  }, [])

  return calculateAttendance
}
```

## Monitoring and Analytics

### 1. Performance Monitoring

#### Custom Performance Hook
```typescript
// hooks/usePerformanceMonitor.ts
import { useEffect } from 'react'

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Log slow renders
      if (renderTime > 100) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`)
        
        // Send to analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'slow_render', {
            component: componentName,
            duration: renderTime
          })
        }
      }
    }
  })
}
```

#### Core Web Vitals Tracking
```typescript
// lib/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    })
  }
}

export function reportWebVitals() {
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}
```

### 2. Database Performance Monitoring

#### Automated Performance Alerts
```sql
-- Function to monitor slow queries
CREATE OR REPLACE FUNCTION monitor_slow_queries()
RETURNS void AS $$
BEGIN
  -- Insert slow queries into monitoring table
  INSERT INTO performance_alerts (
    alert_type,
    message,
    details,
    created_at
  )
  SELECT 
    'slow_query',
    'Slow query detected: ' || LEFT(query, 100),
    json_build_object(
      'query', query,
      'mean_time', mean_time,
      'calls', calls,
      'total_time', total_time
    ),
    NOW()
  FROM pg_stat_statements
  WHERE mean_time > 1000 -- queries slower than 1 second
  AND calls > 10 -- with more than 10 calls
  AND query NOT LIKE '%pg_stat_statements%';
END;
$$ LANGUAGE plpgsql;

-- Schedule monitoring (requires pg_cron extension)
SELECT cron.schedule('monitor-performance', '*/5 * * * *', 'SELECT monitor_slow_queries();');
```

## Load Testing

### 1. API Load Testing

#### Artillery.js Configuration
```yaml
# load-test.yml
config:
  target: 'https://your-api.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  variables:
    userIds:
      - "user1"
      - "user2"
      - "user3"

scenarios:
  - name: "Generate QR Code"
    weight: 30
    flow:
      - post:
          url: "/functions/v1/generate-qr"
          headers:
            Authorization: "Bearer {{ $processEnvironment.JWT_TOKEN }}"
          json:
            session_id: "{{ $randomString() }}"
            faculty_id: "{{ userIds[$randomNumber(0,2)] }}"

  - name: "Validate Attendance"
    weight: 70
    flow:
      - post:
          url: "/functions/v1/validate-attendance"
          headers:
            Authorization: "Bearer {{ $processEnvironment.JWT_TOKEN }}"
          json:
            qr_data: "test-qr-data"
            student_id: "{{ userIds[$randomNumber(0,2)] }}"
```

### 2. Database Load Testing

#### pgbench Configuration
```bash
# Initialize test database
pgbench -i -s 100 your_database

# Run load test
pgbench -c 10 -j 2 -T 300 your_database

# Custom test script
cat > attendance_test.sql << EOF
\set student_id random(1, 1000)
\set session_id random(1, 100)
INSERT INTO attendance_records (student_id, session_id, status, marked_at)
VALUES (:student_id, :session_id, 'present', NOW());
EOF

pgbench -f attendance_test.sql -c 20 -j 4 -T 600 your_database
```

## Optimization Checklist

### Database
- [ ] Critical indexes created
- [ ] Query performance analyzed
- [ ] Connection pooling configured
- [ ] Large tables partitioned
- [ ] Unused indexes removed

### Application
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Caching strategy in place
- [ ] Virtual scrolling for large lists

### Infrastructure
- [ ] CDN configured
- [ ] HTTPS enabled
- [ ] Compression enabled
- [ ] Load balancing configured
- [ ] Monitoring in place

### Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | < 3s |
| Largest Contentful Paint | < 2.5s | < 4s |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| First Input Delay | < 100ms | < 300ms |
| API Response Time | < 200ms | < 500ms |
| Database Query Time | < 100ms | < 1s |

Use this guide to systematically optimize your Academic Management System for optimal performance across all components.
