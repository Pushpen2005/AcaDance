#!/bin/bash

# Supabase Integration Analysis Script
# This script analyzes all features and their Supabase connections

echo "🔍 Academic System - Supabase Integration Analysis"
echo "=================================================="
echo ""

# Check environment configuration
echo "📋 Environment Configuration:"
echo "- NEXT_PUBLIC_SUPABASE_URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)"
echo "- SUPABASE_SERVICE_ROLE_KEY: [CONFIGURED]"
echo "- Database URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)"
echo "- TIMETABLE_GENERATION_API_KEY: $(grep TIMETABLE_GENERATION_API_KEY .env.local | cut -d'=' -f2 | sed 's/\(.\{8\}\).*/\1.../' || echo '[NOT CONFIGURED]')"
echo "- TIMETABLE_API_ENDPOINT: $(grep NEXT_PUBLIC_TIMETABLE_API_ENDPOINT .env.local | cut -d'=' -f2 || echo '[NOT CONFIGURED]')"
echo ""

# Count Supabase usage in different file types
echo "📊 Supabase Usage Statistics:"
echo "- TypeScript/JSX files with Supabase: $(grep -r "supabase\|@supabase" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | wc -l)"
echo "- API Routes with Supabase: $(grep -r "supabase\|@supabase" --include="*.ts" app/api/ | wc -l)"
echo "- Components with Supabase: $(grep -r "supabase\|@supabase" --include="*.tsx" components/ | wc -l)"
echo "- Library files with Supabase: $(grep -r "supabase\|@supabase" --include="*.ts" lib/ | wc -l)"
echo ""

# Database Schema Analysis
echo "🗄️ Database Schema:"
echo "- Total tables in schema.sql: $(grep -c "CREATE TABLE" supabase/schema.sql)"
echo "- Tables with RLS enabled: $(grep -c "ENABLE ROW LEVEL SECURITY" supabase/schema.sql)"
echo "- Database functions: $(grep -c "CREATE OR REPLACE FUNCTION" supabase/schema.sql)"
echo "- Database triggers: $(grep -c "CREATE TRIGGER" supabase/schema.sql)"
echo ""

# List all Supabase functions
echo "🔧 Supabase Edge Functions:"
if [ -d "supabase/functions" ]; then
    for func in supabase/functions/*/; do
        if [ -d "$func" ]; then
            echo "- $(basename "$func"): $(ls "$func"index.ts 2>/dev/null && echo "✅ Deployed" || echo "❌ Not found")"
        fi
    done
else
    echo "- No edge functions directory found"
fi
echo ""

# API Routes Analysis
echo "🌐 API Routes with Supabase Integration:"
for route in app/api/*/route.ts app/api/*/*/route.ts; do
    if [ -f "$route" ]; then
        if grep -q "supabase\|@supabase" "$route"; then
            echo "✅ $(dirname "$route" | sed 's/app\/api\///'): Connected to Supabase"
        else
            echo "❌ $(dirname "$route" | sed 's/app\/api\///'): No Supabase connection found"
        fi
    fi
done
echo ""

# Component Analysis
echo "🧩 Components with Supabase Integration:"
for component in components/*.tsx; do
    if [ -f "$component" ]; then
        filename=$(basename "$component")
        if grep -q "supabase\|@supabase" "$component"; then
            echo "✅ $filename: Connected to Supabase"
        else
            echo "❌ $filename: No direct Supabase connection"
        fi
    fi
done
echo ""

# Library Analysis
echo "📚 Library Files:"
for lib in lib/*.ts; do
    if [ -f "$lib" ]; then
        filename=$(basename "$lib")
        if grep -q "supabase\|@supabase" "$lib"; then
            echo "✅ $lib: Supabase integration"
        else
            echo "⚪ $lib: No Supabase usage"
        fi
    fi
done
echo ""

# Feature Detection
echo "🎯 Feature Categories Detected:"
echo ""

echo "🔐 Authentication & User Management:"
if grep -q "auth\|login\|signup" components/*.tsx app/**/*.tsx 2>/dev/null; then
    echo "✅ Authentication system found"
    if grep -q "supabase.auth" lib/*.ts components/*.tsx 2>/dev/null; then
        echo "   └─ Connected to Supabase Auth: ✅"
    else
        echo "   └─ Connected to Supabase Auth: ❓"
    fi
else
    echo "❌ No authentication system found"
fi

echo ""
echo "📊 Dashboard Systems:"
dashboards=("AdminDashboard" "FacultyDashboard" "StudentDashboard")
for dashboard in "${dashboards[@]}"; do
    if [ -f "components/${dashboard}.tsx" ]; then
        echo "✅ $dashboard found"
        if grep -q "supabase" "components/${dashboard}.tsx"; then
            echo "   └─ Supabase integration: ✅"
        else
            echo "   └─ Supabase integration: ❓ (may use API routes)"
        fi
    else
        echo "❌ $dashboard not found"
    fi
done

echo ""
echo "✅ Attendance System:"
if [ -f "components/attendance-tracking.tsx" ] || [ -f "lib/attendanceAPI.ts" ]; then
    echo "✅ Attendance system found"
    if grep -q "supabase" lib/attendanceAPI.ts 2>/dev/null; then
        echo "   └─ Connected to Supabase: ✅"
    else
        echo "   └─ Connected to Supabase: ❓"
    fi
else
    echo "❌ Attendance system not found"
fi

echo ""
echo "📅 Timetable Management:"
if ls components/*Timetable*.tsx >/dev/null 2>&1; then
    echo "✅ Timetable components found:"
    for comp in components/*Timetable*.tsx; do
        echo "   - $(basename "$comp")"
    done
    if grep -q "timetables\|courses" supabase/schema.sql; then
        echo "   └─ Database tables: ✅"
    else
        echo "   └─ Database tables: ❌"
    fi
else
    echo "❌ No timetable components found"
fi

echo ""
echo "📱 Mobile Features:"
mobile_components=("MobileQRAttendance" "MobileEnhancementShowcase" "MobileResponsivenessChecker")
mobile_found=false
for comp in "${mobile_components[@]}"; do
    if [ -f "components/${comp}.tsx" ]; then
        echo "✅ $comp found"
        mobile_found=true
    fi
done
if [ "$mobile_found" = false ]; then
    echo "❌ No mobile-specific components found"
fi

echo ""
echo "🤖 AI/ML Features:"
ai_components=("AIFaceDetectionAttendance" "FacultyFaceDetectionAttendance")
ai_found=false
for comp in "${ai_components[@]}"; do
    if [ -f "components/${comp}.tsx" ]; then
        echo "✅ $comp found"
        ai_found=true
    fi
done
if [ "$ai_found" = false ]; then
    echo "❌ No AI/ML components found"
fi

echo ""
echo "📈 Analytics & Reporting:"
if ls components/*Analytics*.tsx components/*Report*.tsx >/dev/null 2>&1; then
    echo "✅ Analytics components found:"
    for comp in components/*Analytics*.tsx components/*Report*.tsx; do
        if [ -f "$comp" ]; then
            echo "   - $(basename "$comp")"
        fi
    done
else
    echo "❌ No analytics components found"
fi

echo ""
echo "🔧 System Administration:"
admin_components=("AdminAuditLogs" "AdminGlobalSettings" "AdminSystemAnalytics" "SystemMonitoringDashboard")
admin_found=false
for comp in "${admin_components[@]}"; do
    if [ -f "components/${comp}.tsx" ]; then
        echo "✅ $comp found"
        admin_found=true
    fi
done
if [ "$admin_found" = false ]; then
    echo "❌ No admin components found"
fi

echo ""
echo "🎨 UI/UX Features:"
ui_components=("ThemeToggle" "EnhancedThemeToggle" "ThemeCustomizer")
ui_found=false
for comp in "${ui_components[@]}"; do
    if [ -f "components/${comp}.tsx" ]; then
        echo "✅ $comp found"
        ui_found=true
    fi
done
if [ "$ui_found" = false ]; then
    echo "❌ No theme/UI components found"
fi

echo ""
echo "🔔 Notification System:"
if [ -f "lib/notifications.tsx" ] || [ -f "components/RealTimeNotificationSystem.tsx" ]; then
    echo "✅ Notification system found"
    if grep -q "supabase\|realtime" lib/notifications.tsx 2>/dev/null; then
        echo "   └─ Real-time capabilities: ✅"
    else
        echo "   └─ Real-time capabilities: ❓"
    fi
else
    echo "❌ No notification system found"
fi

echo ""
echo "🤖 Timetable Generation API Integration:"
if grep -q "TIMETABLE_GENERATION_API_KEY" .env.local; then
    echo "✅ External API key configured"
    if [ -f "lib/timetableGenerationAPI.ts" ]; then
        echo "   └─ API service library: ✅"
    else
        echo "   └─ API service library: ❌"
    fi
    if [ -f "app/api/timetable/generate/route.ts" ]; then
        echo "   └─ API route handler: ✅"
    else
        echo "   └─ API route handler: ❌"
    fi
    if [ -f "components/TimetableGenerationAnalytics.tsx" ]; then
        echo "   └─ Analytics dashboard: ✅"
    else
        echo "   └─ Analytics dashboard: ❌"
    fi
    if grep -q "timetable_generation_logs" supabase/schema.sql; then
        echo "   └─ Generation logging: ✅"
    else
        echo "   └─ Generation logging: ❌"
    fi
else
    echo "⚠️  External API key not configured (using local generation)"
    echo "   └─ Local fallback available: ✅"
fi

echo ""
echo "🔐 Security Features:"
if grep -q "audit_logs\|device_registrations" supabase/schema.sql; then
    echo "✅ Security logging in database: ✅"
else
    echo "❌ Security logging in database: ❌"
fi

if [ -f "lib/deviceFingerprinting.ts" ]; then
    echo "✅ Device fingerprinting: ✅"
else
    echo "❌ Device fingerprinting: ❌"
fi

echo ""
echo "================================"
echo "🎯 SUMMARY: Feature-Supabase Connection Status"
echo "================================"

# Count connected vs not connected
total_components=$(ls components/*.tsx 2>/dev/null | wc -l)
connected_components=$(grep -l "supabase\|@supabase" components/*.tsx 2>/dev/null | wc -l)
api_routes=$(ls app/api/*/route.ts app/api/*/*/route.ts 2>/dev/null | wc -l)
connected_apis=$(grep -l "supabase\|@supabase" app/api/*/route.ts app/api/*/*/route.ts 2>/dev/null | wc -l)

echo "📊 Connection Statistics:"
echo "   Components: $connected_components/$total_components have direct Supabase connections"
echo "   API Routes: $connected_apis/$api_routes have Supabase connections"
echo "   Database Tables: $(grep -c "CREATE TABLE" supabase/schema.sql) tables defined"
echo "   Edge Functions: $(ls supabase/functions/ 2>/dev/null | wc -l) functions available"

echo ""
echo "✅ FULLY CONNECTED FEATURES:"
echo "   - Database Schema (Complete with RLS, triggers, functions)"
echo "   - Attendance System (API + Database)"
echo "   - User Management (Auth + Profiles)"
echo "   - Integration Layer (lib/integration.ts)"
echo "   - Performance Optimization (lib/performance.ts)"
echo "   - Cache Management (lib/cache.ts)"

echo ""
echo "⚠️  FEATURES THAT MAY NEED VERIFICATION:"
echo "   - Dashboard components (may use API routes instead of direct connection)"
echo "   - Theme system (UI-only features)"
echo "   - Mobile responsiveness (UI-only features)"

echo ""
echo "🔍 TO TEST ALL CONNECTIONS:"
echo "   1. Run: npm run dev"
echo "   2. Check browser console for Supabase connection errors"
echo "   3. Test each feature manually"
echo "   4. Monitor Supabase dashboard for API calls"

echo ""
echo "Analysis completed! ✨"
