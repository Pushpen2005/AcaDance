#!/bin/bash

# 🚀 ULTIMATE QUICK DEPLOY - QR Attendance System
# One command to rule them all!

echo "🎯 QR ATTENDANCE SYSTEM - ULTIMATE QUICK DEPLOY"
echo "================================================"

# Make sure we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ Run this from the project root directory"
    exit 1
fi

echo "🚀 Installing dependencies and building..."
pnpm install && pnpm run build

echo ""
echo "🗄️  QUICK DATABASE SETUP:"
echo "1. Go to: https://app.supabase.com/projects"
echo "2. SQL Editor → Copy/paste: database/qr-attendance-complete-setup.sql"  
echo "3. Database → Replication → Enable Realtime for: attendance, attendance_sessions, notifications, timetables"
echo ""

read -p "Database setup done? (y/n): " -n 1 -r
echo ""
[[ ! $REPLY =~ ^[Yy]$ ]] && echo "Complete database setup first!" && exit 1

echo "🚀 Deploying to Vercel..."
command -v vercel >/dev/null || npm install -g vercel
vercel --prod

echo ""
echo "⚡ FINAL STEP - Edge Functions:"
echo "Deploy in Supabase Dashboard:"
echo "- create-attendance-session"
echo "- mark-attendance" 
echo "- daily-shortage-check"
echo ""
echo "🎉 DONE! Test with: ./test-production-features.sh"
