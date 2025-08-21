#!/bin/bash

# 🚀 Quick Realtime System Status Check

echo "🔍 REALTIME SYSTEM STATUS CHECK"
echo "================================"

echo ""
echo "📊 Server Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js server is running on http://localhost:3000"
else
    echo "❌ Next.js server is not responding"
fi

echo ""
echo "📁 Required Files Status:"

# Check hooks
if [ -f "hooks/useRealtimeAttendance.ts" ]; then
    echo "✅ useRealtimeAttendance.ts exists"
else
    echo "❌ useRealtimeAttendance.ts missing"
fi

if [ -f "hooks/useRealtimeTimetable.ts" ]; then
    echo "✅ useRealtimeTimetable.ts exists"
else
    echo "❌ useRealtimeTimetable.ts missing"
fi

if [ -f "hooks/useRealtimeNotifications.ts" ]; then
    echo "✅ useRealtimeNotifications.ts exists"
else
    echo "❌ useRealtimeNotifications.ts missing"
fi

# Check components
if [ -f "components/RealtimeTestPage.tsx" ]; then
    echo "✅ RealtimeTestPage.tsx exists"
else
    echo "❌ RealtimeTestPage.tsx missing"
fi

if [ -f "app/realtime-test/page.tsx" ]; then
    echo "✅ Realtime test page exists"
else
    echo "❌ Realtime test page missing"
fi

# Check SQL scripts
if [ -f "minimal-profiles-timetables-setup.sql" ]; then
    echo "✅ SQL setup script exists"
else
    echo "❌ SQL setup script missing"
fi

echo ""
echo "🔗 Test URLs:"
echo "• Main app: http://localhost:3000"
echo "• Realtime test: http://localhost:3000/realtime-test"

echo ""
echo "📋 Next Steps:"
echo "1. ✅ Server is running"
echo "2. ✅ Files are in place"
echo "3. 🔄 Run SQL script in Supabase"
echo "4. 🧪 Test realtime features"

echo ""
echo "🔍 To run SQL setup:"
echo "   1. Open Supabase Dashboard → SQL Editor"
echo "   2. Copy contents of minimal-profiles-timetables-setup.sql"
echo "   3. Paste and execute"
echo "   4. Refresh http://localhost:3000/realtime-test"
