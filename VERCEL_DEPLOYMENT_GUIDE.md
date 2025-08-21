# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Ensure your code is pushed to GitHub, GitLab, or Bitbucket
3. **Supabase Project**: Have your Supabase project set up and running

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 2. Environment Variables Setup

Before deploying, set up these environment variables in your Vercel dashboard:

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_SITE_URL`: Your deployed Vercel URL (e.g., https://your-app.vercel.app)

**Optional Variables:**
- `CUSTOM_KEY`: Any custom configuration you need
- `NEXT_PUBLIC_QR_SECRET`: For QR code security

### 3. Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project
5. Configure environment variables in the "Environment Variables" section
6. Click "Deploy"

### 4. Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 5. Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Vercel Configuration

Your project includes these optimized configurations:

### `next.config.mjs`
- Image optimization enabled for better performance
- Vercel-compatible settings
- Proper redirects and rewrites

### `vercel.json`
- API function timeout settings
- CORS headers
- Route configurations
- Environment variable references

## Post-Deployment Checklist

1. **Test Authentication**: Verify Supabase auth works with your deployed URL
2. **Update Supabase Settings**: 
   - Add your Vercel URL to Supabase Auth settings
   - Update Site URL in Supabase dashboard
   - Configure redirect URLs for OAuth providers
3. **Test Database Connections**: Ensure all database operations work
4. **Monitor Performance**: Check Vercel analytics for any issues

## Supabase Configuration Updates

After deployment, update these settings in your Supabase dashboard:

1. **Auth Settings** → **URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

2. **API Settings**:
   - Add your Vercel domain to allowed origins if needed

## Troubleshooting

### Common Issues:

1. **Environment Variables**: Ensure all required env vars are set in Vercel
2. **CORS Issues**: Check your API routes have proper CORS headers
3. **Database Connection**: Verify Supabase credentials are correct
4. **Build Errors**: Check build logs in Vercel dashboard

### Useful Commands:

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull .env.local
```

## Production Optimizations

Your project is configured with:
- ✅ Image optimization
- ✅ Compression enabled
- ✅ Package import optimization
- ✅ TypeScript and ESLint error handling
- ✅ Proper caching headers
- ✅ Server-side external packages configuration

## Monitoring

Monitor your application using:
- Vercel Analytics (built-in)
- Vercel Speed Insights
- Supabase Dashboard for database metrics
- @highlight-run/next for error tracking

Your academic system is now ready for production deployment on Vercel! 🚀
