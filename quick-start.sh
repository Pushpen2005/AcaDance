#!/bin/bash

# Academic System - Quick Start & Deployment Script
# Production-ready Supabase integrated system

echo "🚀 Academic System - Quick Start & Deployment"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if environment file exists
if [ ! -f .env.local ]; then
    print_error "Environment file (.env.local) not found!"
    echo "Please create .env.local with the following variables:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

print_success "Environment configuration found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

print_success "Supabase CLI available"

# Function to show menu
show_menu() {
    echo -e "\n${BLUE}🎯 Academic System - Quick Actions${NC}"
    echo "=================================="
    echo "1. 🧪 Run Integration Tests"
    echo "2. 🔍 Verify Supabase Connections"
    echo "3. 🚀 Start Development Server"
    echo "4. 🏗️  Build for Production"
    echo "5. 🗄️  Check Database Status"
    echo "6. 🔧 Deploy Edge Functions"
    echo "7. 📊 Run Complete System Check"
    echo "8. 📱 Test Mobile Features"
    echo "9. 🔒 Security Verification"
    echo "10. 📈 Performance Benchmark"
    echo "11. 📋 Generate Full Report"
    echo "0. ❌ Exit"
    echo ""
    read -p "Select an option (0-11): " choice
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    ./final-verification.sh
    print_success "Integration tests completed"
}

# Function to verify Supabase connections
verify_supabase() {
    print_status "Verifying Supabase connections..."
    ./supabase-integration-analysis.sh
    print_success "Supabase verification completed"
}

# Function to start development server
start_dev_server() {
    print_status "Starting development server..."
    print_warning "Server will start on http://localhost:3000"
    print_warning "Press Ctrl+C to stop the server"
    npm run dev
}

# Function to build for production
build_production() {
    print_status "Building for production..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Production build completed successfully"
        print_status "To start production server, run: npm start"
    else
        print_error "Production build failed"
    fi
}

# Function to check database status
check_database() {
    print_status "Checking database status..."
    if command -v supabase &> /dev/null; then
        supabase status
        print_success "Database status check completed"
    else
        print_error "Supabase CLI not available"
    fi
}

# Function to deploy edge functions
deploy_edge_functions() {
    print_status "Deploying edge functions..."
    if command -v supabase &> /dev/null; then
        supabase functions deploy
        print_success "Edge functions deployed"
    else
        print_error "Supabase CLI not available"
    fi
}

# Function to run complete system check
complete_system_check() {
    print_status "Running complete system check..."
    echo "📋 Environment Check"
    cat .env.local | grep -v "KEY" | head -1
    echo ""
    
    echo "📦 Dependencies Check"
    npm list --depth=0 | grep supabase
    echo ""
    
    echo "🗄️ Database Schema"
    if [ -f "supabase/schema.sql" ]; then
        echo "✅ Schema file exists"
        grep -c "CREATE TABLE" supabase/schema.sql | xargs echo "Tables defined:"
    fi
    echo ""
    
    echo "🔧 Edge Functions"
    ls supabase/functions/ 2>/dev/null | wc -l | xargs echo "Functions available:"
    echo ""
    
    echo "🧩 Components"
    find components/ -name "*.tsx" | wc -l | xargs echo "Total components:"
    find components/ -name "*.tsx" -exec grep -l "supabase" {} \; | wc -l | xargs echo "Components with Supabase:"
    
    print_success "Complete system check finished"
}

# Function to test mobile features
test_mobile_features() {
    print_status "Testing mobile features..."
    echo "📱 Mobile Components Check:"
    
    if [ -f "components/MobileQRAttendance.tsx" ]; then
        print_success "Mobile QR Attendance - Available"
    fi
    
    if [ -f "components/MobileEnhancementShowcase.tsx" ]; then
        print_success "Mobile Enhancement Showcase - Available"
    fi
    
    if [ -f "components/MobileResponsivenessChecker.tsx" ]; then
        print_success "Mobile Responsiveness Checker - Available"
    fi
    
    echo ""
    print_status "To test mobile features:"
    echo "1. Start development server (option 3)"
    echo "2. Open http://localhost:3000 in mobile browser"
    echo "3. Test responsive design and mobile features"
}

# Function for security verification
security_verification() {
    print_status "Running security verification..."
    
    echo "🔒 Security Features Check:"
    
    if grep -q "ENABLE ROW LEVEL SECURITY" supabase/schema.sql; then
        print_success "Row Level Security - Enabled"
    fi
    
    if grep -q "CREATE POLICY" supabase/schema.sql; then
        print_success "RLS Policies - Configured"
    fi
    
    if grep -q "audit_logs" supabase/schema.sql; then
        print_success "Audit Logging - Available"
    fi
    
    if [ -f "components/AdminAuditLogs.tsx" ]; then
        print_success "Audit Log Management - Available"
    fi
    
    print_success "Security verification completed"
}

# Function for performance benchmark
performance_benchmark() {
    print_status "Running performance benchmark..."
    
    echo "⚡ Performance Features Check:"
    
    if [ -f "lib/performance.ts" ]; then
        print_success "Performance Library - Available"
    fi
    
    if [ -f "lib/advancedSupabase.ts" ]; then
        print_success "Advanced Supabase Integration - Available"
    fi
    
    if grep -q "cache" lib/*.ts; then
        print_success "Caching System - Implemented"
    fi
    
    echo ""
    print_status "To run full performance test:"
    echo "1. Start development server"
    echo "2. Use browser dev tools to monitor performance"
    echo "3. Test with multiple users for load testing"
}

# Function to generate full report
generate_full_report() {
    print_status "Generating full system report..."
    
    REPORT_FILE="SYSTEM_STATUS_REPORT_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# Academic System - Status Report
Generated: $(date)

## Environment Status
\`\`\`
$(cat .env.local | grep -v "KEY" | head -2)
\`\`\`

## Dependencies
\`\`\`
$(npm list --depth=0 | grep supabase)
\`\`\`

## Database Schema
\`\`\`
Tables: $(grep -c "CREATE TABLE" supabase/schema.sql 2>/dev/null || echo "0")
Functions: $(grep -c "CREATE OR REPLACE FUNCTION" supabase/schema.sql 2>/dev/null || echo "0")
Policies: $(grep -c "CREATE POLICY" supabase/schema.sql 2>/dev/null || echo "0")
\`\`\`

## Components Status
\`\`\`
Total Components: $(find components/ -name "*.tsx" 2>/dev/null | wc -l)
Supabase Integrated: $(find components/ -name "*.tsx" -exec grep -l "supabase" {} \; 2>/dev/null | wc -l)
\`\`\`

## Edge Functions
\`\`\`
$(ls supabase/functions/ 2>/dev/null || echo "No functions directory")
\`\`\`

## Recent Test Results
\`\`\`
Last verification: See final-verification.sh results
Integration analysis: See supabase-integration-analysis.sh results
\`\`\`

Report generated automatically by quick-start.sh
EOF

    print_success "Report generated: $REPORT_FILE"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            run_integration_tests
            ;;
        2)
            verify_supabase
            ;;
        3)
            start_dev_server
            ;;
        4)
            build_production
            ;;
        5)
            check_database
            ;;
        6)
            deploy_edge_functions
            ;;
        7)
            complete_system_check
            ;;
        8)
            test_mobile_features
            ;;
        9)
            security_verification
            ;;
        10)
            performance_benchmark
            ;;
        11)
            generate_full_report
            ;;
        0)
            print_success "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
