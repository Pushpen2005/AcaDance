# Deployment Guide - Academic System

## Overview
This guide provides step-by-step instructions for deploying the Academic System to production. The system supports multiple deployment options including Vercel, Docker, and traditional server deployment.

## Prerequisites

### Required Accounts & Services
- [Supabase](https://supabase.com) account and project
- [Vercel](https://vercel.com) account (recommended) or hosting provider
- Domain name (optional but recommended)
- SSL certificate (automatic with Vercel)

### Local Development Setup
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

## Supabase Setup

### 1. Create Supabase Project
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to your users
4. Set strong database password
5. Wait for project initialization

### 2. Database Schema Setup
1. Navigate to SQL Editor in Supabase dashboard
2. Copy contents from `database/schema.sql`
3. Execute the SQL script
4. Verify all tables are created successfully

### 3. Storage Configuration
1. Go to Storage section in Supabase
2. Create bucket named `avatars`
3. Set bucket to public
4. Configure RLS policies for avatar bucket:

```sql
-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow public access to avatars
CREATE POLICY "Avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Avatar updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Row Level Security (RLS) Policies

Execute these policies in the SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_features ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Students can only see their own attendance
CREATE POLICY "Students view own attendance" ON attendance
FOR SELECT USING (auth.uid() = user_id);

-- Faculty can view their own sessions
CREATE POLICY "Faculty view own sessions" ON attendance_sessions
FOR SELECT USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty create sessions" ON attendance_sessions
FOR INSERT WITH CHECK (auth.uid() = faculty_id);

-- Students can insert their own attendance records
CREATE POLICY "Students mark attendance" ON attendance_records
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Admins have full access
CREATE POLICY "Admin full access" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 5. API Keys & Configuration
1. Go to Project Settings → API
2. Copy `Project URL` and `anon public` key
3. Keep these secure for environment variables

## Environment Configuration

### Environment Variables
Create `.env.local` file in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
NEXT_PUBLIC_APP_NAME=Academic System
NEXT_PUBLIC_DEFAULT_ATTENDANCE_THRESHOLD=75
NEXT_PUBLIC_MAX_SESSION_DURATION=180

# Optional: Analytics & Monitoring
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VERCEL_ANALYTICS_ID=your-analytics-id
```

### Production Environment
For production deployment, set these in your hosting platform:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Optional Variables:**
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEFAULT_ATTENDANCE_THRESHOLD`

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

#### Automatic Deployment
1. **Connect Repository**
   - Login to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Select the project root

2. **Configure Environment Variables**
   - Add all required environment variables
   - Set `NEXT_PUBLIC_SUPABASE_URL`
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Deploy**
   - Click "Deploy"
   - Wait for build completion
   - Access your live URL

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Option 2: Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Deploy with Docker
```bash
# Build image
docker build -t academic-system .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  academic-system
```

### Option 3: Traditional Server Deployment

#### Build Application
```bash
# Install dependencies
npm install --legacy-peer-deps

# Build for production
npm run build

# Start production server
npm start
```

#### Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'academic-system',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'your-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-key'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Domain & SSL Configuration

### Custom Domain Setup
1. **Purchase Domain** from registrar
2. **Configure DNS** to point to your hosting provider
3. **Add Domain** in hosting platform settings
4. **Wait for SSL** certificate provisioning

### Vercel Domain Configuration
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate (automatic)

## Post-Deployment Configuration

### 1. Admin Account Setup
After deployment, create your first admin account:

1. **Register** as a normal user through the application
2. **Access Database** through Supabase dashboard
3. **Update Role** in profiles table:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@domain.com';
```

### 2. System Testing
Test all major functionality:
- [ ] User registration and login
- [ ] Profile setup for all roles
- [ ] QR code generation (faculty)
- [ ] QR code scanning (student)
- [ ] Real-time attendance updates
- [ ] Report generation
- [ ] Admin user management

### 3. Initial Data Setup
Consider adding initial data:
- Department lists
- Course codes
- Faculty assignments
- Student enrollments

## Monitoring & Maintenance

### Performance Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Metrics**: Database performance and usage
- **Custom Monitoring**: Application-specific metrics

### Backup Strategy
1. **Database Backups**: Supabase automatic backups
2. **Manual Exports**: Regular data exports
3. **Code Backups**: Git repository with regular commits

### Update Process
1. **Test Updates** in staging environment
2. **Deploy to Production** during low-usage hours
3. **Monitor Performance** after deployment
4. **Rollback Plan** if issues occur

## Security Checklist

### Pre-Production Security
- [ ] Environment variables secured
- [ ] RLS policies implemented and tested
- [ ] API keys rotated from development
- [ ] HTTPS enforced
- [ ] Database passwords are strong
- [ ] User input validation implemented
- [ ] Rate limiting configured

### Ongoing Security
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Review access logs
- [ ] Update dependencies regularly
- [ ] Backup and recovery testing

## Troubleshooting

### Common Deployment Issues

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

**Environment Variable Issues**
- Ensure all required variables are set
- Check variable names for typos
- Verify Supabase URL and key validity

**Database Connection Issues**
- Verify Supabase project is active
- Check RLS policies are correctly configured
- Ensure database URL is accessible

**Performance Issues**
- Monitor Supabase usage and limits
- Check for inefficient database queries
- Review client-side bundle size

### Support Resources
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

## Scaling Considerations

### Traffic Growth
- **Vercel**: Automatic scaling included
- **Supabase**: Monitor database limits and upgrade plan as needed
- **CDN**: Consider additional CDN for global performance

### Feature Expansion
- **API Rate Limiting**: Implement for high-traffic scenarios
- **Caching Strategy**: Add Redis or similar for session management
- **Database Optimization**: Index optimization for large datasets

---

## Production Checklist

Before going live, ensure:

- [ ] **Database**: Schema created, RLS policies configured
- [ ] **Environment**: All variables set correctly
- [ ] **SSL**: HTTPS enabled and working
- [ ] **Domain**: Custom domain configured (if applicable)
- [ ] **Admin Account**: First admin user created
- [ ] **Testing**: All features tested in production environment
- [ ] **Monitoring**: Analytics and error tracking configured
- [ ] **Backups**: Backup strategy implemented
- [ ] **Documentation**: Deployment process documented
- [ ] **Support**: Support channels established

**Congratulations! Your Academic System is now live and ready for use.**

For ongoing support and maintenance, refer to the troubleshooting section or contact the development team.
