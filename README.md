# Academic System - Complete QR Attendance & Management Platform

A comprehensive full-stack academic management system built with Next.js, Supabase, and advanced animations. Features QR code-based attendance tracking, role-based dashboards, real-time monitoring, and responsive design with beautiful 3D animations.

## ✨ Features

### 🎯 Core Features
- **QR Code Attendance System** - Real-time attendance tracking with QR scanning
- **Role-Based Access Control** - Student, Faculty, and Admin dashboards
- **Real-Time Updates** - Live attendance monitoring and notifications
- **Location-Based Verification** - GPS geofencing for attendance validation
- **Advanced Analytics** - Comprehensive reporting and data visualization
- **3D Animations & UI** - Modern, interactive user interface with advanced animations

### 👨‍🎓 Student Features
- **Dashboard** - Attendance overview, timetable, and notifications
- **QR Scanner** - Mobile-optimized camera scanning for attendance
- **Attendance History** - Detailed records with export functionality
- **Profile Management** - Personal information and preferences
- **Real-Time Notifications** - Attendance alerts and announcements

### 👨‍🏫 Faculty Features
- **Class Management** - Create and manage attendance sessions
- **QR Generation** - Generate time-limited QR codes for classes
- **Live Monitoring** - Real-time attendance tracking dashboard
- **Reports & Analytics** - Student attendance analysis and exports
- **Session Control** - Start, monitor, and end attendance sessions

### 👨‍💼 Admin Features
- **User Management** - Manage students, faculty, and admin accounts
- **System Analytics** - Overall attendance statistics and trends
- **Role Assignment** - Assign and modify user roles
- **Audit Logs** - Track system activity and attendance patterns
- **Global Monitoring** - Monitor all active sessions system-wide

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Framer Motion** - Advanced animations and transitions
- **Custom 3D Animations** - WebGL and CSS 3D transforms

### Backend
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Supabase Auth** - Authentication and user management
- **Row Level Security (RLS)** - Database security policies
- **Supabase Storage** - File storage for avatars and documents

### Additional Libraries
- **QRCode.js** - QR code generation
- **Lucide React** - Beautiful icon library
- **Date-fns** - Date manipulation utilities
- **Chart.js** - Data visualization and charts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Modern web browser with camera support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd academic-system
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Set up storage bucket for avatars
   - Configure Row Level Security policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables
- **profiles** - User profiles with role-based information
- **attendance** - Student attendance statistics
- **attendance_sessions** - QR code sessions created by faculty
- **attendance_records** - Individual attendance scan records
- **timetables** - Class schedules and timetable management
- **notifications** - System notifications and alerts

### Role-Specific Tables
- **student_features** - Student-specific feature toggles
- **faculty_features** - Faculty permissions and capabilities
- **admin_features** - Admin system access controls

## 🔐 Authentication & Authorization

### User Roles
1. **Student** - Can scan QR codes, view attendance, access timetable
2. **Faculty** - Can create sessions, monitor attendance, generate reports
3. **Admin** - Full system access, user management, analytics

### Security Features
- Supabase Auth integration
- Row Level Security (RLS) policies
- Role-based route protection
- Device fingerprinting for QR scans
- GPS location verification
- Session timeout and expiry

## 📱 QR Attendance System

### How It Works
1. **Faculty** creates an attendance session with class details
2. **System** generates time-limited QR code with session data
3. **Students** scan QR code using mobile camera
4. **System** validates session, location, and records attendance
5. **Real-time** updates show live attendance to faculty

### QR Code Format
```
session_id:class_id:expiry_timestamp
```

### Security Measures
- Time-limited QR codes (configurable expiry)
- GPS geofencing with customizable radius
- Device fingerprinting to prevent sharing
- Duplicate scan prevention
- IP address logging for audit trail

## 🎨 UI/UX Features

### Animations & Interactions
- **3D Tilt Effects** - Interactive card tilting
- **Scroll Animations** - Elements animate on scroll
- **Magnetic Buttons** - Hover effects with magnetic attraction
- **Liquid Buttons** - Fluid morphing button animations
- **Particle Systems** - Background particle effects
- **Glass Morphism** - Modern frosted glass effects

### Responsive Design
- Mobile-first design approach
- Optimized for tablets and desktop
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes

## 📈 Reports & Analytics

### Student Reports
- Individual attendance percentage
- Subject-wise attendance breakdown
- Monthly and weekly trends
- Downloadable CSV/PDF reports

### Faculty Reports
- Class attendance summaries
- Student performance analytics
- Session history and statistics
- Export functionality for all data

### Admin Analytics
- System-wide attendance trends
- Department-wise statistics
- User activity monitoring
- Comprehensive audit trails

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom Configuration
NEXT_PUBLIC_APP_NAME=Academic System
NEXT_PUBLIC_DEFAULT_ATTENDANCE_THRESHOLD=75
```

### Customization Options
- Attendance percentage thresholds
- QR code expiry times
- Geofencing radius settings
- Notification preferences
- Theme customization

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
```

### Test Coverage
- Authentication flows
- QR code generation and scanning
- Database operations
- Role-based access control
- API endpoints

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t academic-system .

# Run container
docker run -p 3000:3000 academic-system
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Attendance Endpoints
- `POST /api/attendance/session` - Create QR session
- `POST /api/attendance/scan` - Process QR scan
- `GET /api/attendance/records` - Get attendance records

### User Management
- `GET /api/users` - List users (admin only)
- `PUT /api/users/:id/role` - Update user role
- `GET /api/users/:id/stats` - Get user statistics

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Conventional commit messages
- Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- Check the [Issues](issues) section for known problems
- Read the documentation carefully
- Contact the development team

### Common Issues
1. **Camera not working** - Ensure HTTPS and camera permissions
2. **QR scanning fails** - Check network connectivity and session validity
3. **Database errors** - Verify Supabase configuration and RLS policies

## 🗺️ Roadmap

### Development Planning & Documentation
- [📋 Next Steps & Roadmap](./NEXT_STEPS.md) - Comprehensive development roadmap
- [🔧 Technical Implementation](./TECHNICAL_IMPLEMENTATION.md) - Detailed technical specifications
- [✅ Sprint Checklist](./SPRINT_CHECKLIST.md) - Development sprint planning and tasks
- [📖 User Manual](./USER_MANUAL.md) - Complete user guide for all roles
- [🚀 Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment instructions

### Upcoming Features
- [ ] Backend Edge Functions implementation (QR generation, attendance validation)
- [ ] Real-time notification system with email/SMS integration
- [ ] Advanced analytics with Chart.js integration
- [ ] Mobile app development (React Native)
- [ ] Multi-institution support with tenant isolation
- [ ] AI-powered attendance prediction and risk assessment
- [ ] Integration with external LMS (Moodle, Canvas)
- [ ] Advanced reporting with custom dashboard builder
- [ ] API rate limiting and caching optimization
- [ ] Offline support for mobile scanning

### Version History
- **v1.0.0** - Initial release with core UI components and authentication
- **v1.1.0** - Enhanced animations, dashboards, and mobile optimization
- **v1.2.0** - Advanced reporting, user management, and analytics pages
- **v2.0.0** - Backend functions, real-time features, and production deployment (planned)

---

**Built with ❤️ by the Academic System Team**

For more information, visit our [documentation](docs) or contact us at [support@academicsystem.com](mailto:support@academicsystem.com).
