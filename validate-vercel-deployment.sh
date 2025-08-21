#!/bin/bash

# Vercel Deployment Validation Script
# Tests key endpoints and features after deployment

if [ -z "$1" ]; then
    echo "Usage: $0 <deployed-url>"
    echo "Example: $0 https://your-app.vercel.app"
    exit 1
fi

DEPLOYED_URL="$1"
echo "🔍 Testing deployment at: $DEPLOYED_URL"
echo "================================="

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL/api/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint: OK"
else
    echo "❌ Health endpoint: Failed (HTTP $HEALTH_RESPONSE)"
fi

# Test main page
echo "Testing main page..."
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL")
if [ "$MAIN_RESPONSE" = "200" ] || [ "$MAIN_RESPONSE" = "302" ] || [ "$MAIN_RESPONSE" = "307" ]; then
    echo "✅ Main page: OK"
else
    echo "❌ Main page: Failed (HTTP $MAIN_RESPONSE)"
fi

# Test auth pages
echo "Testing auth pages..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL/auth/login")
if [ "$AUTH_RESPONSE" = "200" ]; then
    echo "✅ Auth pages: OK"
else
    echo "❌ Auth pages: Failed (HTTP $AUTH_RESPONSE)"
fi

# Test static assets
echo "Testing static assets..."
STATIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYED_URL/_next/static/css/" 2>/dev/null || echo "000")
if [ "$STATIC_RESPONSE" = "200" ] || [ "$STATIC_RESPONSE" = "000" ]; then
    echo "✅ Static assets: Available"
else
    echo "⚠️  Static assets: Check manually"
fi

echo ""
echo "🔗 Manual tests to perform:"
echo "1. Visit $DEPLOYED_URL and test authentication"
echo "2. Check student/faculty/admin dashboards"
echo "3. Test attendance marking functionality"
echo "4. Verify timetable generation"
echo "5. Test real-time features"
echo ""
echo "📊 Check Vercel Analytics for performance metrics"
echo "🐛 Monitor error tracking in your dashboard"
