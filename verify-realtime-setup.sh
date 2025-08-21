#!/bin/bash

# Real-time Setup Verification Script
# This script helps verify that real-time functionality is properly set up

echo "🔄 Verifying Real-time Setup for Academic System..."
echo "================================================="

# Check if required files exist
echo "📁 Checking required files..."

files=(
    "hooks/useRealtimeAttendance.ts"
    "hooks/useRealtimeTimetable.ts" 
    "hooks/useRealtimeNotifications.ts"
    "hooks/useRealtimeDashboard.ts"
    "components/RealtimeStatus.tsx"
    "components/RealtimeNotifications.tsx"
    "components/RealtimeAttendanceDashboard.tsx"
    "database/realtime-policies.sql"
    "REALTIME_IMPLEMENTATION_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔍 Checking TypeScript compilation..."

# Check if TypeScript compiles without errors
if command -v npx &> /dev/null; then
    echo "Running TypeScript check..."
    npx tsc --noEmit --skipLibCheck 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript compilation successful"
    else
        echo "⚠️  TypeScript has some issues - check the files manually"
    fi
else
    echo "⚠️  npx not found - skipping TypeScript check"
fi

echo ""
echo "📋 Real-time Setup Checklist:"
echo "=============================="
echo ""
echo "Manual steps to complete:"
echo ""
echo "1. 🗄️  Database Setup:"
echo "   □ Go to Supabase Dashboard → Database → Replication"
echo "   □ Enable Realtime for: profiles, timetables, attendance_sessions, attendance_records, notifications, courses"
echo "   □ Run the SQL script: database/realtime-policies.sql"
echo ""
echo "2. 🔧 Component Integration:"
echo "   □ Import real-time hooks in your components"
echo "   □ Add RealtimeStatus and RealtimeNotifications to header"
echo "   □ Add RealtimeAttendanceDashboard for faculty users"
echo ""
echo "3. 🧪 Testing:"
echo "   □ Open multiple browser windows with different user roles"
echo "   □ Test attendance marking and verify real-time updates"
echo "   □ Test timetable changes and notification delivery"
echo "   □ Check browser console for real-time connection logs"
echo ""
echo "4. 🔒 Security Verification:"
echo "   □ Verify RLS policies are working correctly"
echo "   □ Test that users only see their authorized data"
echo "   □ Confirm real-time subscriptions respect user permissions"
echo ""
echo "5. 📱 User Experience:"
echo "   □ Request browser notification permissions"
echo "   □ Test notification sound/visual alerts"
echo "   □ Verify connection status indicator works"
echo ""

echo "📖 For detailed implementation guide, see: REALTIME_IMPLEMENTATION_GUIDE.md"
echo ""

# Check if Supabase is configured
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo "✅ Supabase configuration found in .env.local"
else
    echo "⚠️  Make sure Supabase is properly configured in .env.local"
fi

echo ""
echo "🎉 Real-time setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Complete the manual checklist above"
echo "2. Test the real-time functionality with multiple users"
echo "3. Monitor the connection status in the dashboard"
echo ""
echo "For any issues, check the troubleshooting section in REALTIME_IMPLEMENTATION_GUIDE.md"
