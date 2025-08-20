# Academic System Deployment Guide

## Prerequisites

Before deploying the Academic Management System, ensure you have:

- **Node.js** 18+ installed
- **npm** or **pnpm** package manager
- **Supabase** account and project
- **Vercel** account (for frontend deployment)
- **Domain name** (optional, for custom domain)

## Environment Setup

### 1. Supabase Project Setup

1. **Create a new Supabase project:**
   ```bash
   # Visit https://supabase.com and create a new project
   # Note down your project URL and anon key
   ```

2. **Configure environment variables:**
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Set up database schema:**
   ```bash
   # Run the database schema
   supabase db reset
   ```

### 2. Database Schema Deployment

Execute the following SQL scripts in your Supabase SQL editor:

1. **Main Schema:**
   ```sql
   -- Run database/schema.sql
   ```

2. **Authentication Setup:**
   ```sql
   -- Run database/auth-setup.sql
   ```

3. **Advanced Features:**
   ```sql
   -- Run database/advanced-timetable-schema.sql
   ```

### 3. Edge Functions Deployment

Deploy Supabase Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy generate-qr
supabase functions deploy validate-attendance
supabase functions deploy send-notification
supabase functions deploy calculate-attendance
supabase functions deploy optimize-database

# Set function secrets
supabase secrets set --env-file .env.local
```

## Frontend Deployment

### Option 1: Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   # Build the project
   npm run build

   # Deploy
   vercel --prod
   ```

3. **Configure Environment Variables:**
   ```bash
   # In Vercel dashboard, add environment variables:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Option 2: Self-Hosted Deployment

1. **Build the application:**
   ```bash
   npm run build
   npm run export
   ```

2. **Deploy to your server:**
   ```bash
   # Copy the 'out' directory to your web server
   scp -r out/ user@your-server:/var/www/academic-system/
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /var/www/academic-system;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/out /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and run:**
   ```bash
   docker build -t academic-system .
   docker run -p 80:80 academic-system
   ```

## Row Level Security (RLS) Configuration

### 1. Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2. Student Policies:

```sql
-- Students can view their own profile
CREATE POLICY "Students can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id AND role = 'student');

-- Students can update their own profile
CREATE POLICY "Students can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id AND role = 'student');

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance_records
FOR SELECT USING (auth.uid() = student_id);

-- Students can insert their own attendance
CREATE POLICY "Students can insert own attendance" ON attendance_records
FOR INSERT WITH CHECK (auth.uid() = student_id);
```

### 3. Faculty Policies:

```sql
-- Faculty can view profiles of their students
CREATE POLICY "Faculty can view student profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE faculty_id = auth.uid() 
    AND class_id IN (
      SELECT DISTINCT class_id FROM attendance_records 
      WHERE student_id = profiles.id
    )
  )
);

-- Faculty can create attendance sessions
CREATE POLICY "Faculty can create sessions" ON attendance_sessions
FOR INSERT WITH CHECK (auth.uid() = faculty_id);

-- Faculty can view their sessions
CREATE POLICY "Faculty can view own sessions" ON attendance_sessions
FOR SELECT USING (auth.uid() = faculty_id);
```

### 4. Admin Policies:

```sql
-- Admins have full access to all tables
CREATE POLICY "Admin full access profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin full access attendance" ON attendance_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Performance Optimization

### 1. Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_sessions_faculty ON attendance_sessions(faculty_id);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_profiles_role ON profiles(role);
```

### 2. Caching Strategy

1. **Redis Setup (Optional):**
   ```bash
   # Install Redis
   redis-server
   
   # Configure caching in your application
   npm install redis
   ```

2. **Application-level caching:**
   ```typescript
   // lib/cache.ts
   import Redis from 'redis'
   
   const redis = Redis.createClient({
     url: process.env.REDIS_URL
   })
   
   export async function getCached<T>(key: string): Promise<T | null> {
     const cached = await redis.get(key)
     return cached ? JSON.parse(cached) : null
   }
   
   export async function setCache<T>(key: string, data: T, ttl = 300): Promise<void> {
     await redis.setex(key, ttl, JSON.stringify(data))
   }
   ```

### 3. CDN Configuration

1. **Static Assets:**
   ```bash
   # Upload static assets to CDN
   aws s3 sync public/ s3://your-bucket/static/
   ```

2. **Next.js Configuration:**
   ```javascript
   // next.config.mjs
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     images: {
       domains: ['your-cdn-domain.com'],
     },
     assetPrefix: process.env.CDN_URL,
   }
   
   export default nextConfig
   ```

## Monitoring and Logging

### 1. Application Monitoring

1. **Sentry Setup:**
   ```bash
   npm install @sentry/nextjs
   ```

   ```javascript
   // sentry.client.config.js
   import * as Sentry from '@sentry/nextjs'
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   })
   ```

2. **Health Check Endpoint:**
   ```typescript
   // pages/api/health.ts
   export default function handler(req, res) {
     res.status(200).json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.APP_VERSION
     })
   }
   ```

### 2. Database Monitoring

1. **Query Performance:**
   ```sql
   -- Enable query statistics
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   
   -- Monitor slow queries
   SELECT 
     query,
     calls,
     total_time,
     mean_time,
     rows
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **Automated Monitoring:**
   ```bash
   # Setup automated database monitoring
   supabase functions deploy db-monitor
   ```

## Security Configuration

### 1. HTTPS/SSL

1. **Vercel (automatic):**
   ```bash
   # HTTPS is automatically configured
   ```

2. **Self-hosted with Let's Encrypt:**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Generate certificate
   sudo certbot --nginx -d your-domain.com
   ```

### 2. Security Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: Request) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}
```

### 3. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function checkRateLimit(identifier: string) {
  return await ratelimit.limit(identifier)
}
```

## Backup and Recovery

### 1. Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

### 2. Disaster Recovery Plan

1. **Database Recovery:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_file.sql
   ```

2. **Application Recovery:**
   ```bash
   # Redeploy application
   vercel --prod
   ```

## Scaling Considerations

### 1. Horizontal Scaling

1. **Load Balancing:**
   ```nginx
   upstream academic_system {
       server app1.example.com;
       server app2.example.com;
       server app3.example.com;
   }
   
   server {
       listen 80;
       location / {
           proxy_pass http://academic_system;
       }
   }
   ```

2. **Database Read Replicas:**
   ```bash
   # Configure read replicas in Supabase dashboard
   ```

### 2. Vertical Scaling

1. **Database Resources:**
   ```bash
   # Upgrade database plan in Supabase
   ```

2. **Application Resources:**
   ```bash
   # Upgrade Vercel plan or server resources
   ```

## Maintenance

### 1. Database Maintenance

```sql
-- Weekly maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE your_database;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Application Updates

```bash
# Update dependencies
npm update

# Run tests
npm test

# Deploy updates
vercel --prod
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   ```bash
   # Check connection pooling
   # Verify environment variables
   # Check Supabase status
   ```

2. **Performance Issues:**
   ```bash
   # Analyze slow queries
   # Check database indexes
   # Monitor memory usage
   ```

3. **Authentication Issues:**
   ```bash
   # Verify JWT tokens
   # Check RLS policies
   # Validate user roles
   ```

## Support and Resources

- **Documentation:** [API Documentation](./API_DOCUMENTATION.md)
- **GitHub Issues:** [Report Issues](https://github.com/your-repo/issues)
- **Support Email:** support@youruniversity.edu
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [https://nextjs.org/docs](https://nextjs.org/docs)
