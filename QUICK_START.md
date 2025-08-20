# 🚀 Academic System - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Git installed
- Modern web browser with camera support

## 🏃‍♂️ Quick Setup (5 minutes)

### 1. Clone and Install
```bash
git clone <your-repo>
cd academic-system
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the schema in your Supabase SQL editor:
```sql
-- Copy and paste contents from database/schema.sql
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` and start exploring!

## 🎯 Test User Journey

### 1. **Admin Setup**
- Go to `/signup`
- Create admin account
- Access all features in dashboard

### 2. **Faculty Experience**  
- Create faculty account
- Navigate to QR Attendance tab
- Create new session
- View analytics

### 3. **Student Experience**
- Create student account  
- Go to Mobile Scan tab
- Scan QR code (use camera)
- Check attendance history

## 📱 Mobile Testing

### Enable Location & Camera
1. Open in mobile browser
2. Allow camera permissions
3. Allow location access
4. Test QR scanning

### PWA Installation
1. Open in Chrome mobile
2. Tap "Add to Home Screen"
3. Launch as native app

## 🔥 Key Features to Test

### ✅ QR Attendance
- Faculty: Create session → Generate QR
- Student: Scan QR → Mark attendance
- Real-time updates across devices

### ✅ Analytics Dashboard
- View attendance trends
- Export reports
- Filter by department/time

### ✅ Notifications
- Admin: Send notifications
- Real-time delivery
- Priority and scheduling

### ✅ Timetable Management
- Create subjects and teachers
- Generate timetables
- Visual timetable view

## 🛠️ Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` and component styles

### Branding
- Replace logos in `/public`
- Update app name in `layout.tsx`
- Customize colors and fonts

### Features
- Add new tabs in `EnhancedInteractiveDashboard.tsx`
- Create new components in `/components`
- Add API routes in `/pages/api`

## 🔧 Production Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance Tips

### 1. **Database Optimization**
- Enable connection pooling in Supabase
- Add database indexes for frequent queries
- Use RLS policies for security

### 2. **Frontend Optimization**
- Enable Next.js image optimization
- Use dynamic imports for large components
- Implement proper caching headers

### 3. **Real-time Optimization**
- Limit real-time subscriptions
- Use proper cleanup in useEffect
- Implement connection retry logic

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

**Supabase Connection**
- Check environment variables
- Verify Supabase project status
- Check RLS policies

**Camera Not Working**
- Ensure HTTPS in production
- Check browser permissions
- Test on different devices

**Real-time Not Working**
- Check WebSocket connections
- Verify subscription setup
- Check browser network tabs

## 📞 Support

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Common Solutions
- Check browser console for errors
- Verify API endpoints in Network tab
- Test database queries in Supabase
- Check component props and state

## 🎉 You're Ready!

Your academic system is now fully functional with:
- ✅ Modern authentication
- ✅ Real-time QR attendance
- ✅ Advanced analytics
- ✅ Live notifications
- ✅ Mobile responsiveness
- ✅ Production-ready security

Happy coding! 🚀
