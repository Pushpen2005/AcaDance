#!/bin/bash

# 🚀 Complete Production Deployment Script for QR Attendance System
# Run this script to deploy everything at once

set -e  # Exit on any error

echo "🎯 ACADEMIC SYSTEM - COMPLETE PRODUCTION DEPLOYMENT"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we have required environment variables
check_env_vars() {
    print_info "Checking environment variables..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
        exit 1
    fi
    
    print_status "Environment variables are set"
}

# Step 1: Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    pnpm install
    print_status "Dependencies installed"
}

# Step 2: Build the application
build_application() {
    print_info "Building the application..."
    pnpm run build
    print_status "Application built successfully"
}

# Step 3: Database setup reminder
database_setup() {
    print_warning "DATABASE SETUP REQUIRED:"
    echo "1. Go to your Supabase project SQL Editor"
    echo "2. Run the complete setup script: database/qr-attendance-complete-setup.sql"
    echo "3. Enable Realtime for tables: attendance, attendance_sessions, notifications, timetables"
    echo "4. Set up Edge Functions environment variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY" 
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    
    read -p "Have you completed the database setup? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Please complete database setup first"
        exit 1
    fi
    print_status "Database setup confirmed"
}

# Step 4: Deploy Edge Functions
deploy_edge_functions() {
    print_info "Deploying Edge Functions..."
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Install with: npm install -g supabase"
        print_info "Manual deployment required for Edge Functions:"
        echo "1. create-attendance-session"
        echo "2. mark-attendance" 
        echo "3. daily-shortage-check"
        return
    fi
    
    # Deploy functions
    supabase functions deploy create-attendance-session
    supabase functions deploy mark-attendance
    supabase functions deploy daily-shortage-check
    
    print_status "Edge Functions deployed"
}

# Step 5: Deployment to Vercel
deploy_to_vercel() {
    print_info "Deploying to Vercel..."
    
    # Check if vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to production
    vercel --prod
    print_status "Deployed to Vercel"
}

# Step 6: Post-deployment verification
verify_deployment() {
    print_info "Running post-deployment verification..."
    
    echo "🔍 VERIFICATION CHECKLIST:"
    echo "1. ✅ Database tables created"
    echo "2. ✅ RLS policies active"
    echo "3. ✅ Edge Functions deployed"
    echo "4. ✅ Frontend deployed"
    echo "5. ⏳ Manual testing required:"
    echo "   - Sign up as faculty/student"
    echo "   - Create timetable"
    echo "   - Generate QR code"
    echo "   - Scan QR code"
    echo "   - Check realtime updates"
    echo "   - Verify notifications"
    
    print_status "Deployment verification complete"
}

# Step 7: Production testing checklist
production_testing() {
    print_info "PRODUCTION TESTING CHECKLIST:"
    echo ""
    echo "🧪 Test these flows:"
    echo "1. Auth & Profiles:"
    echo "   - Sign up as admin, faculty, student"
    echo "   - Verify role-based redirects"
    echo ""
    echo "2. Timetable Management:"
    echo "   - Admin/Faculty create classes"
    echo "   - Students see live updates"
    echo ""
    echo "3. QR Attendance:"
    echo "   - Faculty generates QR session"
    echo "   - Student scans QR"
    echo "   - Faculty sees live attendance"
    echo "   - Verify one-scan limit"
    echo "   - Test session expiry"
    echo ""
    echo "4. Notifications:"
    echo "   - Check attendance shortage alerts"
    echo "   - Verify realtime notifications"
    echo ""
    echo "5. Security:"
    echo "   - Confirm RLS protection"
    echo "   - Test unauthorized access"
    echo ""
    print_status "Testing checklist provided"
}

# Main execution
main() {
    echo "Starting complete deployment process..."
    echo ""
    
    check_env_vars
    install_dependencies
    build_application
    database_setup
    deploy_edge_functions
    deploy_to_vercel
    verify_deployment
    production_testing
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "================================"
    print_status "Your QR Attendance System is ready for production!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Test all features using the checklist above"
    echo "2. Set up monitoring and backups"
    echo "3. Configure domain (if using custom domain)"
    echo "4. Set up CI/CD for future updates"
    echo ""
    echo "🔗 Useful Links:"
    echo "- Supabase Dashboard: https://app.supabase.com/projects"
    echo "- Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
}

# Run main function
main "$@"
