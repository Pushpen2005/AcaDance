# 🚀 Academic System - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [ ] `NEXT_PUBLIC_SITE_URL` - Your production domain

### ✅ Database Setup
- [ ] Supabase project created and configured
- [ ] Database schema deployed (`database/schema.sql`)
- [ ] Row Level Security (RLS) policies enabled
- [ ] Test data seeded (optional)

### ✅ Dependencies
- [ ] All dependencies installed (`npm install --legacy-peer-deps`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript/lint errors

---

## 🌐 Deployment Options

### 1. Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
```

**Vercel Environment Variables:**
- Go to your project dashboard
- Settings → Environment Variables
- Add all required variables for Production, Preview, and Development

### 2. Docker Deployment

```bash
# Build image
docker build -t academic-system .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your_service_key" \
  -e NEXT_PUBLIC_SITE_URL="https://yourdomain.com" \
  academic-system

# Or use docker-compose
docker-compose up -d
```

### 3. Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_key
railway variables set NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next

# Set environment variables in Netlify dashboard
```

---

## 🔧 Production Configuration

### Domain Setup
1. **Update NEXT_PUBLIC_SITE_URL** to your production domain
2. **Configure CORS** in Supabase dashboard:
   - Go to Authentication → URL Configuration
   - Add your production domain to "Site URL"
   - Add your domain to "Redirect URLs"

### SSL/HTTPS
- Most platforms (Vercel, Netlify, Railway) provide SSL automatically
- For custom deployments, ensure HTTPS is configured

### Performance Optimization
```bash
# Enable gzip compression in your server
# Use CDN for static assets
# Configure caching headers
```

---

## 🗃️ Database Migration

### Production Database Setup
1. **Create Supabase Project** for production
2. **Run Schema Migration:**
   ```sql
   -- Copy and paste content from database/schema.sql
   -- Run in Supabase SQL Editor
   ```
3. **Enable RLS Policies:**
   ```sql
   -- All policies are included in schema.sql
   -- Verify they're enabled in Supabase dashboard
   ```

### Data Migration (if needed)
```bash
# Export from development
supabase db dump --data-only > data.sql

# Import to production
supabase db reset --db-url="your_prod_db_url"
```

---

## 🔐 Security Checklist

### Environment Security
- [ ] No sensitive keys in client-side code
- [ ] Service role key only used server-side
- [ ] Environment variables properly configured
- [ ] `.env.local` not committed to git

### Supabase Security
- [ ] RLS policies enabled for all tables
- [ ] API rate limiting configured
- [ ] Database backups enabled
- [ ] SSL enforcement enabled

### Application Security
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] API endpoints protected with authentication
- [ ] Error messages don't expose sensitive data

---

## 📊 Monitoring & Analytics

### Health Checks
- Health endpoint: `/api/health`
- Monitor response times and error rates
- Set up uptime monitoring (Uptime Robot, Pingdom)

### Error Tracking
```bash
# Add Sentry for error tracking
npm install @sentry/nextjs

# Configure in next.config.js
```

### Performance Monitoring
- Use Vercel Analytics (if deployed on Vercel)
- Google Analytics for user tracking
- Core Web Vitals monitoring

---

## 🚀 Go Live Steps

1. **Final Build Test:**
   ```bash
   npm run build
   npm start
   # Test all features locally
   ```

2. **Deploy to Staging:**
   - Deploy to staging environment first
   - Test all user journeys
   - Verify database connections

3. **Production Deployment:**
   - Deploy to production
   - Update DNS if needed
   - Test post-deployment

4. **Post-Launch:**
   - Monitor error rates
   - Check performance metrics
   - Verify all features working

---

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

**Database Connection Issues:**
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies allow access

**API Errors:**
- Check server logs
- Verify API endpoint URLs
- Test authentication flow

### Support Resources
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

## ✅ Success Criteria

Your deployment is successful when:
- [ ] Application loads without errors
- [ ] User authentication works
- [ ] QR attendance system functional
- [ ] Database operations working
- [ ] Real-time features active
- [ ] Mobile responsiveness verified
- [ ] All API endpoints responding

**🎉 Your Academic System is now production-ready!**
