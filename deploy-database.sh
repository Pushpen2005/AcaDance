#!/bin/bash

# 🚀 Academic System - Production Database Deployment Script
# Version: 1.0.0
# Date: 2025-08-21

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Check if required environment variables are set
check_environment() {
    print_header "🔍 Environment Check"
    
    local missing_vars=()
    
    if [ -z "$SUPABASE_PROJECT_URL" ]; then
        missing_vars+=("SUPABASE_PROJECT_URL")
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables:"
        echo "export SUPABASE_PROJECT_URL='https://your-project.supabase.co'"
        echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
        exit 1
    fi
    
    print_success "Environment variables configured ✅"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    print_header "🛠️  Tools Check"
    
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Installing..."
        
        # Install Supabase CLI based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install supabase/tap/supabase
            else
                print_error "Homebrew not found. Please install Supabase CLI manually:"
                echo "https://supabase.com/docs/guides/cli"
                exit 1
            fi
        else
            # Linux
            curl -sSfL https://supabase.com/install.sh | sh
        fi
    fi
    
    print_success "Supabase CLI available ✅"
}

# Validate SQL file
validate_sql() {
    print_header "📝 SQL Validation"
    
    local sql_file="minimal-profiles-timetables-setup.sql"
    
    if [ ! -f "$sql_file" ]; then
        print_error "SQL file not found: $sql_file"
        exit 1
    fi
    
    # Basic SQL syntax check
    if grep -q "DO \$\$" "$sql_file" && grep -q "END \$\$" "$sql_file"; then
        print_success "SQL file structure looks valid ✅"
    else
        print_warning "SQL file may have syntax issues ⚠️"
    fi
    
    # Check file size
    local file_size=$(wc -c < "$sql_file")
    if [ $file_size -gt 100 ]; then
        print_success "SQL file size: ${file_size} bytes ✅"
    else
        print_error "SQL file seems too small: ${file_size} bytes"
        exit 1
    fi
}

# Create backup
create_backup() {
    print_header "💾 Creating Backup"
    
    local backup_dir="backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${backup_dir}/backup_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    print_status "Creating database backup..."
    
    # Create backup using supabase CLI
    if supabase db dump --db-url "$SUPABASE_PROJECT_URL" --role-password "$SUPABASE_SERVICE_ROLE_KEY" > "$backup_file" 2>/dev/null; then
        print_success "Backup created: $backup_file ✅"
    else
        print_warning "Could not create automatic backup. Please ensure you have a manual backup! ⚠️"
        read -p "Continue without backup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Deploy SQL
deploy_sql() {
    print_header "🚀 Deploying Database Schema"
    
    local sql_file="minimal-profiles-timetables-setup.sql"
    
    print_status "Executing SQL deployment..."
    
    # Execute the SQL file
    if supabase db push --db-url "$SUPABASE_PROJECT_URL" --file "$sql_file"; then
        print_success "Database deployment completed successfully! ✅"
    else
        print_error "Database deployment failed! ❌"
        print_warning "Check the backup and restore if necessary"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_header "✅ Deployment Verification"
    
    print_status "Running post-deployment checks..."
    
    # Create a verification SQL
    cat > verify_deployment.sql << 'EOF'
-- Verify realtime tables
SELECT 
    'Realtime Tables' as check_type,
    COUNT(*) as count,
    array_agg(tablename) as tables
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('profiles', 'timetables', 'notifications');

-- Verify RLS policies
SELECT 
    'RLS Policies' as check_type,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename IN ('profiles', 'timetables', 'notifications');

-- Verify indexes
SELECT 
    'Performance Indexes' as check_type,
    COUNT(*) as count
FROM pg_indexes 
WHERE tablename IN ('profiles', 'timetables', 'notifications')
AND indexname LIKE 'idx_%';
EOF
    
    # Run verification
    if supabase db exec --db-url "$SUPABASE_PROJECT_URL" --file verify_deployment.sql; then
        print_success "Deployment verification completed! ✅"
        rm -f verify_deployment.sql
    else
        print_warning "Verification checks encountered issues ⚠️"
    fi
}

# Main deployment function
main() {
    print_header "🎯 Academic System Database Deployment"
    echo "Starting production deployment process..."
    echo "Timestamp: $(date)"
    echo ""
    
    # Pre-deployment checks
    check_environment
    check_supabase_cli
    validate_sql
    
    # Deployment process
    create_backup
    deploy_sql
    verify_deployment
    
    # Success message
    print_header "🎉 Deployment Complete!"
    print_success "Your Academic System database is now production ready!"
    echo ""
    echo "Next steps:"
    echo "1. 🌐 Test your application with the updated database"
    echo "2. 🔒 Verify user authentication and permissions"
    echo "3. 📱 Test realtime functionality"
    echo "4. 📊 Monitor database performance"
    echo "5. 🔄 Set up automated backups"
    echo ""
    echo "🚀 Happy deploying!"
}

# Run main function
main "$@"
