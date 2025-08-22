# Database Role Settings & Deployment Order

## 🗂️ Database Setup Files Overview

Your academic QR attendance system now has comprehensive role-based security. Here's what each file does:

### 1. **role-settings-complete.sql** ⭐ **(RUN FIRST)**
- **Purpose**: Complete user role management system
- **Features**:
  - Profiles table with role constraints (student/faculty/admin)
  - Automatic user creation triggers
  - Role-based permissions tables
  - Security functions and validation
  - Permission assignment based on roles

### 2. **qr-attendance-complete-setup.sql** ⭐ **(RUN SECOND)**
- **Purpose**: QR attendance system with role-based security
- **Features**:
  - Attendance sessions table
  - QR code validation
  - Role-based RLS policies
  - Real-time subscriptions
  - Attendance statistics view

## 🚀 **DEPLOYMENT ORDER** (Critical!)

### Step 1: Deploy Role Settings
```sql
-- Copy and paste role-settings-complete.sql in Supabase SQL Editor
-- This creates the foundation user role system
```

### Step 2: Deploy QR Attendance System  
```sql
-- Copy and paste qr-attendance-complete-setup.sql in Supabase SQL Editor
-- This builds the attendance system on top of the role foundation
```

### Step 3: Verify Setup
```sql
-- Run these verification queries:
SELECT role, COUNT(*) FROM profiles GROUP BY role;
SELECT can_perform_action('create_session');
SELECT * FROM current_user_profile;
```

## 🔐 **Role-Based Security Features**

### **Student Role**
- ✅ Can scan QR codes to mark attendance
- ✅ Can view their own attendance records
- ✅ Can view active attendance sessions
- ❌ Cannot create attendance sessions
- ❌ Cannot view other students' data

### **Faculty Role** 
- ✅ Can create QR attendance sessions
- ✅ Can view attendance for their classes
- ✅ Can mark attendance manually
- ✅ Can view student profiles in their classes
- ✅ Can export attendance reports
- ❌ Cannot change user roles

### **Admin Role**
- ✅ Full system access
- ✅ Can manage all users and roles
- ✅ Can view all attendance data
- ✅ Can export all system data
- ✅ Can change user roles
- ✅ Can configure system settings

## 🛡️ **Security Features Implemented**

### **1. Row Level Security (RLS)**
- All tables have RLS enabled
- Policies enforce role-based data access
- Users can only see data they're authorized for

### **2. Role Validation Functions**
```sql
-- Check if user has specific role
SELECT has_role(auth.uid()::uuid, 'faculty');

-- Check if user can perform action
SELECT can_perform_action('create_session');
```

### **3. Automatic Permission Assignment**
- New users automatically get role-based permissions
- Role changes trigger permission updates
- Only admins can change user roles

### **4. Permission Tables**
- `student_permissions`: QR scanning, attendance viewing
- `faculty_permissions`: Session creation, report access
- `admin_permissions`: Full system management

## 🔧 **Environment Configuration**

Ensure these environment variables are set in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_vercel_domain
NEXT_PUBLIC_QR_SECRET=your_qr_secret_key
```

## 🧪 **Testing Role-Based Access**

### Test Student Access:
1. Login as student
2. Try to access QR scanner ✅
3. Try to create session ❌ (should fail)

### Test Faculty Access:
1. Login as faculty  
2. Try to create attendance session ✅
3. Try to view student attendance ✅
4. Try to change user roles ❌ (should fail)

### Test Admin Access:
1. Login as admin
2. Access all features ✅
3. Change user roles ✅
4. View system statistics ✅

## 📊 **Role Statistics View**

The system includes a `role_statistics` view for monitoring:

```sql
SELECT * FROM role_statistics;
-- Returns: role, user_count, recent_signups
```

## 🔄 **Role Change Process**

Only admins can change roles:

```sql
UPDATE profiles 
SET role = 'faculty' 
WHERE id = 'user_id';
-- Automatically updates permissions via trigger
```

## 🚨 **Important Security Notes**

1. **Initial Admin**: Uncomment the admin creation section in `role-settings-complete.sql` and set your admin email
2. **Role Changes**: Only admins can modify user roles
3. **Permission Inheritance**: Each role inherits permissions from lower roles when needed
4. **Data Isolation**: Students can only see their own data unless explicitly allowed
5. **Session Security**: QR tokens are validated with role-based access controls

Your system now has enterprise-level role-based security! 🎉
