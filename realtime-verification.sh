#!/bin/bash

# 🧪 REALTIME ATTENDANCE SYSTEM VERIFICATION SCRIPT
# This script checks all the requirements for the realtime attendance system

echo "🚀 Starting Realtime Attendance System Verification"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in the project root directory${NC}"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# 1. Check environment variables
echo "🔧 1. CHECKING ENVIRONMENT VARIABLES"
echo "-----------------------------------"

if [ -f ".env.local" ]; then
    print_status 0 ".env.local file exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        print_status 0 "NEXT_PUBLIC_SUPABASE_URL found"
    else
        print_status 1 "NEXT_PUBLIC_SUPABASE_URL missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        print_status 0 "NEXT_PUBLIC_SUPABASE_ANON_KEY found"
    else
        print_status 1 "NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
    fi
else
    print_status 1 ".env.local file missing"
    print_info "Create .env.local with your Supabase credentials"
fi

echo ""

# 2. Check required files
echo "📄 2. CHECKING REQUIRED FILES"
echo "-----------------------------"

required_files=(
    "supabase/schema.sql"
    "lib/advancedSupabase.ts"
    "components/StudentAttendanceSystem.tsx"
    "components/RealtimeTestingDashboard.tsx"
    "hooks/useRealtimeDebug.tsx"
    "app/realtime-test/page.tsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

echo ""

# 3. Check database tables in schema
echo "🗄️  3. CHECKING DATABASE SCHEMA"
echo "------------------------------"

required_tables=(
    "users"
    "students"
    "attendance"
    "attendance_records"
    "attendance_sessions"
    "courses"
    "enrollments"
    "timetables"
    "alerts"
)

for table in "${required_tables[@]}"; do
    if grep -q "CREATE TABLE $table" supabase/schema.sql; then
        print_status 0 "Table '$table' defined in schema"
    else
        print_status 1 "Table '$table' missing from schema"
    fi
done

echo ""

# 4. Check RLS policies
echo "🔒 4. CHECKING RLS POLICIES"
echo "--------------------------"

if grep -q "ROW LEVEL SECURITY" supabase/schema.sql; then
    print_status 0 "RLS is enabled in schema"
else
    print_status 1 "RLS not found in schema"
fi

rls_patterns=(
    "Students.*view.*own"
    "Faculty.*mark.*attendance"
    "CREATE POLICY"
)

for pattern in "${rls_patterns[@]}"; do
    if grep -q "$pattern" supabase/schema.sql; then
        print_status 0 "RLS policy pattern '$pattern' found"
    else
        print_status 1 "RLS policy pattern '$pattern' missing"
    fi
done

echo ""

# 5. Check realtime components
echo "📡 5. CHECKING REALTIME COMPONENTS"
echo "----------------------------------"

if grep -q "useRealtimeDebug" hooks/useRealtimeDebug.tsx; then
    print_status 0 "useRealtimeDebug hook implemented"
else
    print_status 1 "useRealtimeDebug hook missing"
fi

if grep -q "onTableChange" components/StudentAttendanceSystem.tsx; then
    print_status 0 "Real-time subscriptions in StudentAttendanceSystem"
else
    print_status 1 "Real-time subscriptions missing in StudentAttendanceSystem"
fi

if grep -q "postgres_changes" hooks/useRealtimeDebug.tsx; then
    print_status 0 "Postgres changes subscription implemented"
else
    print_status 1 "Postgres changes subscription missing"
fi

echo ""

# 6. Check API endpoints
echo "🌐 6. CHECKING API ENDPOINTS"
echo "----------------------------"

api_endpoints=(
    "app/api/attendance/route.ts"
    "app/api/simple-attendance/route.ts"
    "app/api/students/route.ts"
)

for endpoint in "${api_endpoints[@]}"; do
    if [ -f "$endpoint" ]; then
        print_status 0 "API endpoint $endpoint exists"
    else
        print_status 1 "API endpoint $endpoint missing"
    fi
done

echo ""

# 7. Check exact implementation patterns
echo "💻 7. CHECKING IMPLEMENTATION PATTERNS"
echo "--------------------------------------"

# Check for markPresent function
if grep -q "markPresent.*studentId" components/RealtimeTestingDashboard.tsx; then
    print_status 0 "markPresent function implemented as specified"
else
    print_status 1 "markPresent function missing or incorrect"
fi

# Check for addStudent function
if grep -q "addStudent.*name.*email.*department" components/RealtimeTestingDashboard.tsx; then
    print_status 0 "addStudent function implemented as specified"
else
    print_status 1 "addStudent function missing or incorrect"
fi

# Check for real-time subscription pattern
if grep -q "attendance_records.*INSERT" hooks/useRealtimeDebug.tsx; then
    print_status 0 "Real-time attendance_records subscription pattern found"
else
    print_status 1 "Real-time attendance_records subscription pattern missing"
fi

echo ""

# 8. Check TypeScript compilation
echo "🔧 8. CHECKING TYPESCRIPT COMPILATION"
echo "-------------------------------------"

print_info "Running TypeScript check..."
if npm run type-check 2>/dev/null || npx tsc --noEmit 2>/dev/null; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation errors found"
    print_warning "Run 'npm run type-check' or 'npx tsc --noEmit' for details"
fi

echo ""

# 9. Generate test matrix
echo "📊 9. REALTIME TEST MATRIX"
echo "-------------------------"

cat << 'EOF'
┌─────────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Frontend Action             │ Expected DB Change      │ Realtime Effect         │
├─────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Add Student (form submit)   │ users table INSERT      │ Student list updates    │
│ Start Session              │ attendance_sessions +1   │ Session status changes  │
│ Click "Present" button     │ attendance_records +1    │ Counter increments      │
│ End Session                │ session status→closed    │ All UIs update          │
│ Duplicate attendance       │ No new record           │ Error toast shown       │
└─────────────────────────────┴─────────────────────────┴─────────────────────────┘
EOF

echo ""

# 10. Instructions for manual testing
echo "🧪 10. MANUAL TESTING INSTRUCTIONS"
echo "----------------------------------"

cat << 'EOF'
To test the realtime system:

1. 🚀 START THE APPLICATION:
   npm run dev

2. 🌐 OPEN TESTING DASHBOARD:
   Navigate to: http://localhost:3000/realtime-test

3. 🔧 ENABLE DEBUG MODE:
   - Open browser console (F12)
   - Look for "[RT DEBUG] Setting up realtime subscriptions..." message

4. 🎯 TEST REALTIME FUNCTIONALITY:
   a) Open the same page in multiple browser tabs
   b) Click "Start New Attendance Session" in one tab
   c) Add a student using the form
   d) Click "Present" button for the student
   e) Watch the counter update in ALL tabs simultaneously
   f) Check console logs for "[RT] attendance_records:" messages

5. ✅ EXPECTED RESULTS:
   - All tabs show the same present count
   - Console logs show database events in real-time
   - No page refresh needed for updates
   - Debug panel shows live event stream

6. 🧪 ADDITIONAL TESTS:
   - Test with different user roles (if auth is set up)
   - Test session expiry
   - Test duplicate attendance marking
   - Test network disconnection/reconnection
EOF

echo ""

# 11. Summary
echo "📋 11. VERIFICATION SUMMARY"
echo "--------------------------"

print_info "Verification complete! Next steps:"
echo "1. Fix any failed checks above"
echo "2. Set up Supabase environment variables"
echo "3. Enable Realtime on tables in Supabase dashboard"
echo "4. Run manual tests using the instructions above"
echo "5. Test with multiple browser tabs to verify realtime sync"

echo ""
print_info "🚀 Ready to test? Run: npm run dev"
print_info "📍 Test page: http://localhost:3000/realtime-test"

echo ""
echo "🎉 Realtime Attendance System verification completed!"
