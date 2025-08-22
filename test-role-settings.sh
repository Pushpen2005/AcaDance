#!/bin/bash

# Database Role Settings Testing Script
# Run this after deploying both SQL files to test role-based access

echo "🔐 ACADEMIC SYSTEM - ROLE SETTINGS TEST"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing database role settings and access controls...${NC}"

# Check if the app is running
if ! curl -s http://localhost:3006 > /dev/null; then
    echo -e "${RED}❌ Application is not running. Start with: npm run dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application is running${NC}"

# Test database connection and tables
echo ""
echo "🗄️ Testing Database Tables..."

# Check if we can access the app and get basic info
echo "📊 Checking application health..."
curl -s http://localhost:3006/api/health || echo "Health check endpoint not available"

echo ""
echo "🔧 Manual Testing Steps:"
echo "======================="
echo ""
echo "1. 📝 Database Setup (Supabase SQL Editor):"
echo "   - Run: database/role-settings-complete.sql (FIRST)"
echo "   - Run: database/qr-attendance-complete-setup.sql (SECOND)"
echo ""
echo "2. 👤 Test User Registration:"
echo "   - Go to: http://localhost:3006"
echo "   - Sign up with different emails to test different roles"
echo "   - Default role should be 'student'"
echo ""
echo "3. 🔐 Test Role-Based Access:"
echo "   - Student: Should see QR scanner, own attendance"
echo "   - Faculty: Should see session creation, class management"
echo "   - Admin: Should see all data, user management"
echo ""
echo "4. 📱 Test QR Attendance Flow:"
echo "   - Faculty: Create attendance session"
echo "   - Student: Scan QR code to mark attendance"
echo "   - Check: Real-time notifications and updates"
echo ""
echo "5. 🛡️ Test Security (Supabase SQL Editor):"
echo "   Run these queries after logging in:"
echo ""
echo "   -- Check your current role and permissions"
echo "   SELECT * FROM current_user_profile;"
echo ""
echo "   -- Check if you can perform actions"
echo "   SELECT can_perform_action('create_session');"
echo "   SELECT can_perform_action('manage_users');"
echo ""
echo "   -- View role distribution"
echo "   SELECT role, COUNT(*) FROM profiles GROUP BY role;"
echo ""
echo "6. 🎯 Test Edge Functions (if deployed):"
echo "   - Create attendance session via API"
echo "   - Mark attendance via QR scan"
echo "   - Check shortage notifications"

echo ""
echo -e "${YELLOW}🔍 Testing Checklist:${NC}"
echo "□ Database tables created successfully"
echo "□ User registration creates profile with default role"
echo "□ Role-based UI components show/hide correctly"
echo "□ QR attendance flow works end-to-end"
echo "□ Real-time notifications appear"
echo "□ Security policies prevent unauthorized access"
echo "□ Role changes work (admin only)"
echo "□ Permission tables populate correctly"

echo ""
echo -e "${GREEN}✅ Manual testing guide complete!${NC}"
echo -e "${YELLOW}💡 Next: Deploy database scripts in Supabase SQL Editor${NC}"
