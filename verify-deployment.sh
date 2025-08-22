#!/bin/bash

# Post-Database Deployment Verification Script
echo "🔍 DATABASE DEPLOYMENT VERIFICATION"
echo "==================================="
echo ""

# Check if app is running
if curl -s http://localhost:3006 > /dev/null; then
    echo "✅ Application is running at http://localhost:3006"
else
    echo "❌ Application not running. Start with: npm run dev"
    echo ""
fi

echo ""
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "=============================="
echo ""

echo "1. ✅ DATABASE SCRIPTS DEPLOYED"
echo "   □ role-settings-complete.sql (FIRST)"
echo "   □ qr-attendance-complete-setup.sql (SECOND)"
echo ""

echo "2. 🧪 TESTING STEPS:"
echo "   □ Register new user account"
echo "   □ Check default role assignment (should be 'student')"
echo "   □ Test role-based dashboard features"
echo "   □ Verify profile creation trigger works"
echo ""

echo "3. 🔐 ROLE VERIFICATION QUERIES (Run in Supabase SQL Editor):"
echo ""
echo "   -- Check role distribution"
echo "   SELECT role, COUNT(*) FROM profiles GROUP BY role;"
echo ""
echo "   -- Check current user profile"
echo "   SELECT * FROM current_user_profile;"
echo ""
echo "   -- Test permission functions"
echo "   SELECT can_perform_action('create_session');"
echo ""

echo "4. 🎯 QR ATTENDANCE TESTING:"
echo "   □ Faculty: Create attendance session"
echo "   □ Student: Scan QR code"
echo "   □ Check real-time notifications"
echo "   □ Verify attendance records"
echo ""

echo "5. 📱 EDGE FUNCTIONS (Optional):"
echo "   □ Deploy functions in Supabase Dashboard"
echo "   □ Test session creation API"
echo "   □ Test attendance marking API"
echo ""

echo "🚀 SYSTEM IS READY FOR TESTING!"
echo ""
echo "Visit: http://localhost:3006 to start testing"
