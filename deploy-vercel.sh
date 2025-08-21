#!/bin/bash

# Vercel Deployment Script for Academic System
# This script helps prepare and deploy your application to Vercel

echo "🚀 Academic System - Vercel Deployment Script"
echo "============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI found"
fi

# Check for required environment variables
echo ""
echo "🔍 Checking environment variables..."

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SITE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
        echo "❌ $var is not set"
    else
        echo "✅ $var is set"
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Missing environment variables detected!"
    echo "Please set the following variables in Vercel dashboard:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Or create a .env.local file for local testing"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo ""
    echo "❌ This is not a git repository!"
    echo "Please initialize git and push to a remote repository first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "⚠️  You have uncommitted changes."
    read -p "Commit changes before deployment? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Pre-deployment commit - $(date)"
        git push
    fi
fi

# Build and test locally first
echo ""
echo "🔨 Building project locally..."
if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed! Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."

if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    echo "Deploying to production..."
    vercel --prod
else
    echo "Deploying to preview (use --production for production deployment)..."
    vercel
fi

# Post-deployment checklist
echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Update Supabase Auth settings with your new Vercel URL"
echo "2. Test authentication flow"
echo "3. Verify database connections"
echo "4. Check all API endpoints"
echo "5. Test real-time features"
echo ""
echo "🔗 Useful links:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Supabase Dashboard: https://app.supabase.com"
echo "   - Project Analytics: Check your Vercel project dashboard"
echo ""
echo "🎉 Your Academic System is now live on Vercel!"
