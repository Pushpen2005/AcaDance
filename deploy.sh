#!/bin/bash

# 🚀 Academic System - Multi-Platform Deployment Script
# Version: 1.0.0
# Date: 2025-08-21

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Check environment variables
check_env() {
    print_header "🔍 Environment Check"
    
    local missing_vars=()
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        missing_vars+=("NEXT_PUBLIC_SUPABASE_URL")
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        missing_vars+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables in your hosting platform's environment settings."
        exit 1
    fi
    
    print_success "Environment variables configured ✅"
}

# Build the application
build_app() {
    print_header "🔨 Building Application"
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building Next.js application..."
    npm run build
    
    print_success "Build completed successfully ✅"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "🚀 Deploying to Vercel"
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_success "Deployed to Vercel successfully ✅"
}

# Deploy to Netlify
deploy_netlify() {
    print_header "🌐 Deploying to Netlify"
    
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    print_status "Building for Netlify..."
    npm run build
    
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=.next
    
    print_success "Deployed to Netlify successfully ✅"
}

# Deploy database
deploy_database() {
    print_header "🗄️  Database Deployment"
    
    if [ -f "./deploy-database.sh" ]; then
        print_status "Running database deployment script..."
        chmod +x ./deploy-database.sh
        ./deploy-database.sh
        print_success "Database deployed successfully ✅"
    else
        print_warning "Database deployment script not found. Skipping..."
    fi
}

# Validate deployment
validate_deployment() {
    print_header "✅ Deployment Validation"
    
    if [ -f "./validate-deployment.sh" ]; then
        print_status "Running deployment validation..."
        chmod +x ./validate-deployment.sh
        ./validate-deployment.sh
        print_success "Deployment validation completed ✅"
    else
        print_warning "Deployment validation script not found. Skipping..."
    fi
}

# Main deployment function
main() {
    echo -e "\n${BLUE}🚀 Academic System Deployment${NC}\n"
    
    # Get deployment platform
    PLATFORM=${1:-""}
    
    if [ -z "$PLATFORM" ]; then
        echo "Usage: $0 [vercel|netlify|build-only]"
        echo ""
        echo "Available options:"
        echo "  vercel     - Deploy to Vercel"
        echo "  netlify    - Deploy to Netlify"
        echo "  build-only - Just build the application"
        echo ""
        exit 1
    fi
    
    # Check environment
    check_env
    
    # Deploy based on platform
    case $PLATFORM in
        "vercel")
            build_app
            deploy_database
            deploy_vercel
            validate_deployment
            ;;
        "netlify")
            build_app
            deploy_database
            deploy_netlify
            validate_deployment
            ;;
        "build-only")
            build_app
            print_success "Build completed. You can now manually deploy the .next folder."
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            echo "Supported platforms: vercel, netlify, build-only"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "\nNext steps:"
    echo -e "1. 🔒 Test user authentication"
    echo -e "2. 📱 Verify QR code functionality"
    echo -e "3. 📊 Check real-time features"
    echo -e "4. 🔍 Monitor application logs"
}

# Run main function
main "$@"
