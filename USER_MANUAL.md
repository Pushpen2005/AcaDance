# Academic System - Complete User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Student Guide](#student-guide)
3. [Faculty Guide](#faculty-guide)
4. [Admin Guide](#admin-guide)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Camera access for QR code scanning
- Internet connection
- Location services (optional, for enhanced security)

### First Time Setup

#### 1. Registration
1. Visit the system URL provided by your institution
2. Click "Sign Up" on the login page
3. Choose your role (Student/Faculty)
4. Enter your email and create a secure password
5. Check your email for verification link
6. Complete profile setup with required information

#### 2. Profile Completion
- **Personal Information**: Full name, phone number, profile picture
- **Role & Department**: Select your department and specific details
- **Preferences**: Notification settings, theme selection

---

## Student Guide

### Dashboard Overview
Your student dashboard provides a comprehensive view of your academic attendance:

#### Key Sections
- **Attendance Overview**: Current percentage, total classes, present/absent counts
- **Today's Schedule**: Classes scheduled for the current day
- **Quick Actions**: Direct access to QR scanner, attendance history
- **Recent Notifications**: Important announcements and alerts

### QR Code Scanning

#### How to Mark Attendance
1. **Access Scanner**
   - Click "Scan QR" from dashboard
   - Or use "Quick Actions" → "Scan QR Code"

2. **Scanning Process**
   - Allow camera permissions when prompted
   - Point camera at QR code displayed by faculty
   - Keep QR code within the scanning frame
   - Wait for automatic detection

3. **Location Verification** (if enabled)
   - Ensure you're physically present in the classroom
   - Allow location access when prompted
   - System validates you're within the required radius

4. **Confirmation**
   - ✅ Success: "Attendance Marked Successfully"
   - ❌ Error: Check error message and try again

#### Manual Entry Option
If scanning fails:
1. Click "Manual Entry" button
2. Type or paste the QR code data
3. Click "Submit" to process

### Viewing Attendance History

#### Attendance Records Page
- **Access**: Dashboard → "View Attendance" or Quick Actions
- **Filters**: All records, Present only, Absent only, Late only
- **Date Range**: Filter by week, month, or custom range

#### Understanding Your Records
- **Present** (✅): Successfully marked attendance
- **Absent** (❌): Did not attend or mark attendance
- **Late** (⏰): Marked attendance after designated time

#### Export Options
- **CSV Download**: Click "Download Report" for spreadsheet format
- **PDF Report**: Generate formatted attendance certificate

### Attendance Statistics

#### Key Metrics
- **Overall Percentage**: Your total attendance across all subjects
- **Weekly Percentage**: Current week's attendance rate
- **Subject-wise Breakdown**: Individual subject attendance rates
- **Attendance Goal**: Progress toward required minimum (usually 75%)

#### Status Indicators
- **🟢 Good (80%+)**: Meeting requirements excellently
- **🟡 Warning (60-79%)**: Approaching minimum threshold
- **🔴 Critical (<60%)**: Below required attendance

### Notifications

#### Types of Notifications
- **Attendance Alerts**: When sessions go live
- **Low Attendance Warnings**: When below threshold
- **Schedule Updates**: Timetable changes
- **System Announcements**: Important notices

#### Managing Notifications
- Access: Profile Settings → Notifications
- **Email Notifications**: Toggle email alerts on/off
- **Attendance Alerts**: Control attendance session notifications

### Profile Management

#### Updating Your Profile
1. Click profile icon → "Profile Settings"
2. Edit personal information
3. Update contact details
4. Change password if needed
5. Save changes

#### Privacy Settings
- Control who can see your information
- Manage notification preferences
- Set attendance visibility options

---

## Faculty Guide

### Dashboard Overview
Faculty dashboard provides tools for class management and attendance monitoring:

#### Key Features
- **Session Management**: Active and recent attendance sessions
- **Today's Classes**: Scheduled classes with quick QR generation
- **Student Statistics**: Real-time attendance data
- **Quick Actions**: Create sessions, monitor attendance, view reports

### Creating Attendance Sessions

#### Session Setup Process
1. **Access Creation**
   - Click "Create Session" from dashboard
   - Or navigate to Faculty → Create Session

2. **Configure Session**
   - **Class/Subject ID**: Enter course identifier (e.g., CS101, MATH201)
   - **Duration**: Set session length (30min - 3 hours)
   - **Location Verification**: Enable GPS-based attendance
   - **Geofence Radius**: Set detection area (25-200 meters)

3. **Location Options**
   - **Current Location**: Use your current GPS coordinates
   - **Custom Location**: Enter specific latitude/longitude
   - **No Location**: Disable location verification

4. **Generate QR Code**
   - Click "Create QR Session"
   - QR code appears instantly
   - Display to students for scanning

#### QR Code Management
- **Display Options**: Show on projector, mobile device, or printed
- **Download**: Save QR code as PNG image
- **Copy Data**: Share QR data digitally
- **End Session**: Manually close before expiry

### Live Attendance Monitoring

#### Real-Time Dashboard
- **Access**: Click "Monitor" on active session or "Live Monitor" from dashboard
- **Student List**: Real-time updates as students scan
- **Attendance Counter**: X/Y students present
- **Status Indicators**: Present, absent, late classifications

#### Session Controls
- **Manual Entry**: Add students who couldn't scan
- **Remove Entry**: Correct accidental scans
- **End Session**: Close session early
- **Export Data**: Download session results

### Reports & Analytics

#### Class Reports
1. **Access Reports**
   - Dashboard → "View Reports"
   - Select date range and class

2. **Report Types**
   - **Session Summary**: Individual session results
   - **Student Performance**: Individual student analysis
   - **Class Trends**: Attendance patterns over time
   - **Comparative Analysis**: Cross-class comparisons

#### Export Options
- **CSV Format**: Spreadsheet-compatible data
- **PDF Reports**: Formatted documents
- **Custom Reports**: Filtered by date, student, or criteria

### Class Management

#### Timetable Integration
- **View Schedule**: See all assigned classes
- **Quick Session**: Create QR for scheduled classes
- **Class History**: Review past sessions
- **Student Lists**: Access enrolled student information

#### Session History
- **Past Sessions**: Review all previous attendance sessions
- **Success Rates**: Track scanning success and issues
- **Time Analysis**: Optimize session duration and timing

### Faculty Settings

#### Profile Management
- **Personal Information**: Update contact details
- **Department Info**: Specialization and teaching areas
- **Preferences**: Notification and display settings

#### Teaching Preferences
- **Default Session Length**: Set preferred duration
- **Auto-Location**: Always use current location
- **Notification Settings**: Session alerts and reminders

---

## Admin Guide

### Dashboard Overview
Admin dashboard provides system-wide oversight and management capabilities:

#### System Statistics
- **Total Users**: Students, faculty, and admin counts
- **Active Sessions**: Currently running attendance sessions
- **Overall Attendance**: System-wide attendance percentage
- **System Health**: Database, storage, and performance metrics

### User Management

#### Managing Users
1. **Access User Management**
   - Dashboard → "Manage Users"
   - View all system users

2. **User Operations**
   - **View Profiles**: Detailed user information
   - **Change Roles**: Promote/demote users
   - **Reset Passwords**: Help users with login issues
   - **Deactivate Accounts**: Suspend user access

3. **Bulk Operations**
   - **Import Users**: Upload CSV of new users
   - **Export Lists**: Download user directories
   - **Bulk Role Changes**: Modify multiple users

#### Role Management
- **Student → Faculty**: Promote student to teaching role
- **Faculty → Admin**: Grant administrative privileges
- **Admin → Faculty**: Remove admin access
- **Account Suspension**: Temporarily disable access

### System Monitoring

#### Real-Time Monitoring
- **Active Sessions**: Monitor all ongoing attendance sessions
- **Live Statistics**: Real-time attendance rates
- **System Performance**: Response times and load metrics
- **Error Tracking**: Monitor system issues and failures

#### Session Oversight
- **Global View**: See all active sessions across departments
- **Faculty Activity**: Monitor faculty session creation
- **Student Participation**: Track scanning patterns
- **Geographic Distribution**: Location-based session analysis

### Reports & Analytics

#### System-Wide Reports
1. **Attendance Analytics**
   - **Department Comparison**: Cross-departmental attendance rates
   - **Trend Analysis**: Attendance patterns over time
   - **Student Rankings**: Performance-based listings
   - **Faculty Effectiveness**: Teaching impact metrics

2. **Usage Statistics**
   - **Session Creation Trends**: Faculty engagement patterns
   - **Scanning Success Rates**: Technical performance metrics
   - **Peak Usage Times**: System load analysis
   - **Geographic Patterns**: Location-based insights

#### Custom Reports
- **Date Range Selection**: Custom time periods
- **Department Filtering**: Specific department analysis
- **Role-Based Reports**: User type specific data
- **Automated Reports**: Scheduled report generation

### Audit & Security

#### Audit Logs
- **User Activity**: Login, logout, and action tracking
- **QR Scanning**: All attendance marking attempts
- **System Changes**: Configuration and setting modifications
- **Security Events**: Failed logins and suspicious activity

#### Security Monitoring
- **Multiple Device Detection**: Same QR code on multiple devices
- **Location Anomalies**: Impossible location changes
- **Time Pattern Analysis**: Unusual scanning patterns
- **IP Address Tracking**: Geographic login patterns

### System Configuration

#### Global Settings
1. **Attendance Thresholds**
   - Minimum required attendance percentage
   - Warning levels and notifications
   - Grace period settings

2. **Session Configuration**
   - Default session duration limits
   - Maximum concurrent sessions
   - QR code expiry settings

3. **Security Settings**
   - Geofencing requirements
   - Device fingerprinting
   - Multi-factor authentication

#### Notification Management
- **System Announcements**: Broadcast messages
- **Automated Alerts**: Low attendance warnings
- **Maintenance Notices**: System update notifications
- **Emergency Communications**: Critical system messages

### Backup & Maintenance

#### Data Management
- **Database Backups**: Automated and manual backups
- **Data Export**: Full system data downloads
- **Archive Management**: Historical data retention
- **Recovery Procedures**: Disaster recovery protocols

#### System Maintenance
- **Update Management**: System version updates
- **Performance Optimization**: Database and query optimization
- **Storage Management**: File and image storage cleanup
- **Security Updates**: Patch management and security fixes

---

## Troubleshooting

### Common Issues & Solutions

#### QR Code Scanning Problems

**Issue**: Camera won't start
- **Solution**: Enable camera permissions in browser settings
- **Chrome**: Settings → Privacy → Camera → Allow
- **Safari**: Safari → Preferences → Websites → Camera

**Issue**: QR code won't scan
- **Check**: Ensure good lighting and steady hand
- **Verify**: QR code is within scanning frame
- **Try**: Manual entry if scanning continues to fail

**Issue**: "QR code expired" error
- **Cause**: Faculty session has ended or timed out
- **Solution**: Ask faculty to generate new QR code

**Issue**: "Location verification failed"
- **Check**: GPS is enabled on device
- **Verify**: You're within the classroom/required area
- **Contact**: Faculty if you believe you're in correct location

#### Login & Authentication Issues

**Issue**: Forgot password
- **Solution**: Click "Forgot Password" on login page
- **Process**: Enter email → Check inbox → Follow reset link

**Issue**: Account locked
- **Cause**: Multiple failed login attempts
- **Solution**: Wait 15 minutes or contact admin

**Issue**: Email verification pending
- **Check**: Spam/junk folders for verification email
- **Resend**: Click "Resend verification" on login page

#### Attendance Discrepancies

**Issue**: Scanned but marked absent
- **Check**: Scan was successful (green confirmation)
- **Verify**: No duplicate scans in same session
- **Contact**: Faculty immediately for manual correction

**Issue**: Attendance percentage seems wrong
- **Verify**: All classes are included in calculation
- **Check**: Recent sessions may not be immediately reflected
- **Contact**: Faculty or admin for verification

#### Technical Issues

**Issue**: Page won't load
- **Try**: Refresh page (Ctrl+F5 or Cmd+Shift+R)
- **Check**: Internet connection
- **Clear**: Browser cache and cookies

**Issue**: Slow performance
- **Close**: Unused browser tabs
- **Check**: Internet speed
- **Try**: Different browser or device

### Getting Help

#### Contact Information
- **Technical Support**: support@academicsystem.com
- **Academic Queries**: academic@academicsystem.com
- **Emergency Contact**: emergency@academicsystem.com

#### Self-Help Resources
- **FAQ Section**: Check frequently asked questions
- **Video Tutorials**: Step-by-step guides
- **User Forums**: Community support and discussions

#### Reporting Issues
1. **Describe the Problem**: What happened and when
2. **Steps to Reproduce**: How to recreate the issue
3. **Browser/Device Info**: Technical specifications
4. **Screenshots**: Visual evidence if applicable

---

## Best Practices

### For Students
- **Arrive Early**: Be in class before QR session starts
- **Charge Device**: Ensure phone battery for scanning
- **Update Browser**: Keep browser updated for best performance
- **Check Permissions**: Ensure camera and location access

### For Faculty
- **Test Session**: Create test session before class
- **Clear Display**: Ensure QR code is visible to all students
- **Monitor Progress**: Watch live attendance during session
- **End Properly**: Close session when class ends

### For Admins
- **Regular Backups**: Schedule automated data backups
- **Monitor Usage**: Track system performance and usage
- **Update Regularly**: Keep system updated with latest features
- **Review Logs**: Regularly check audit logs for issues

---

**End of User Manual**

For additional help or feature requests, please contact the system administrator or visit our support portal.
