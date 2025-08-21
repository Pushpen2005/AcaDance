#!/bin/bash

# Vercel Deployment Script for Academic System
# This script helps prepare and deploy your application to Vercel

set -e  # Exit on any error

echo "🚀 Academic System - Vercel Deployment Script"
echo "============================================="

# Function to handle cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Deployment failed! Check the errors above."
        echo "💡 Common fixes:"
        echo "   - Ensure all environment variables are set"
        echo "   - Check your git repository is properly configured"
        echo "   - Verify your code builds locally without errors"
        echo "   - Make sure you're connected to the internet"
    fi
}

trap cleanup EXIT

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    if npm install -g vercel; then
        echo "✅ Vercel CLI installed successfully"
    else
        echo "❌ Failed to install Vercel CLI. Please install manually:"
        echo "   npm install -g vercel"
        exit 1
    fi
else
    echo "✅ Vercel CLI found"
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) found"

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
    echo "Please set the following variables before deployment:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "You can:"
    echo "1. Set them in your Vercel dashboard under Project Settings > Environment Variables"
    echo "2. Create a .env.local file for local testing (not recommended for production)"
    echo "3. Export them in your current shell session"
    echo ""
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Please set the required environment variables."
        exit 1
    fi
else
    echo "✅ All required environment variables are set"
fi

# Check if this is a git repository
echo ""
echo "🔍 Checking git repository status..."
if [ ! -d ".git" ]; then
    echo "❌ This is not a git repository!"
    echo "Vercel requires a git repository for deployment."
    echo "Please initialize git and push to a remote repository first:"
    echo ""
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    echo ""
    exit 1
else
    echo "✅ Git repository found"
fi

# Check if we have a remote repository
if ! git remote -v | grep -q "origin"; then
    echo "⚠️  No remote origin found. Vercel works best with remote repositories."
    echo "Consider adding a remote origin:"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit and push changes before deployment? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        if git commit -m "Pre-deployment commit - $(date)"; then
            echo "✅ Changes committed"
            if git remote -v | grep -q "origin"; then
                echo "📤 Pushing to remote repository..."
                if git push; then
                    echo "✅ Changes pushed successfully"
                else
                    echo "⚠️  Failed to push changes. Continuing with deployment..."
                fi
            else
                echo "⚠️  No remote repository configured. Skipping push."
            fi
        else
            echo "❌ Failed to commit changes"
            exit 1
        fi
    else
        echo "⚠️  Continuing with uncommitted changes..."
    fi
else
    echo "✅ No uncommitted changes"
fi

# Install dependencies if needed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ] && [ ! -f "pnpm-lock.yaml" ] && [ ! -f "yarn.lock" ]; then
    echo "Installing dependencies..."
    if [ -f "pnpm-lock.yaml" ]; then
        if command -v pnpm &> /dev/null; then
            pnpm install
        else
            echo "❌ pnpm not found but pnpm-lock.yaml exists. Installing pnpm..."
            npm install -g pnpm
            pnpm install
        fi
    elif [ -f "yarn.lock" ]; then
        if command -v yarn &> /dev/null; then
            yarn install
        else
            echo "❌ yarn not found but yarn.lock exists. Please install yarn or use npm."
            npm install
        fi
    else
        npm install
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Build and test locally first
echo ""
echo "🔨 Building project locally..."
echo "This may take a few minutes..."

if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed! Please fix the following issues:"
    echo "1. Check for TypeScript errors"
    echo "2. Verify all imports are correct"
    echo "3. Ensure all environment variables are set"
    echo "4. Check for syntax errors in your code"
    exit 1
fi

# Clean up any existing Vercel project links to avoid configuration conflicts
echo ""
echo "🧹 Cleaning up any existing Vercel project links..."
if [ -d ".vercel" ]; then
    echo "Removing existing .vercel directory..."
    rm -rf .vercel
fi

# Remove any legacy now.json files that might cause conflicts
if [ -f "now.json" ]; then
    echo "Removing legacy now.json file..."
    rm now.json
fi

echo "✅ Clean state for deployment"

# Deploy to Vercel with unique project name (compliant with Vercel naming rules)
RANDOM_SUFFIX=$(openssl rand -hex 3)
DATE_SUFFIX=$(date +%Y%m%d)
PROJECT_NAME="academic-system-${DATE_SUFFIX}-${RANDOM_SUFFIX}"

# Ensure project name is lowercase and within 100 character limit
PROJECT_NAME=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | cut -c1-100)

echo ""
echo "🚀 Deploying to Vercel with project name: $PROJECT_NAME..."

# Determine deployment type
DEPLOYMENT_TYPE="preview"
VERCEL_ARGS="--name $PROJECT_NAME"

if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    DEPLOYMENT_TYPE="production"
    VERCEL_ARGS="--prod --name $PROJECT_NAME"
    echo "📋 Deploying to PRODUCTION environment..."
    echo "⚠️  This will be your live site accessible to users!"
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Production deployment cancelled."
        echo "💡 Use './deploy-vercel.sh' (without --production) for preview deployment"
        exit 1
    fi
else
    echo "📋 Deploying to PREVIEW environment..."
    echo "💡 Use './deploy-vercel.sh --production' for production deployment"
fi

# Perform the deployment
echo ""
echo "🚀 Starting Vercel deployment..."
echo "⏳ This may take a few minutes..."

if vercel $VERCEL_ARGS; then
    DEPLOYMENT_SUCCESS=true
    echo ""
    echo "🎉 Deployment completed successfully!"
else
    DEPLOYMENT_SUCCESS=false
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Common issues and fixes:"
    echo "   - Build errors: Check the build logs above"
    echo "   - Environment variables: Ensure they're set in Vercel dashboard"
    echo "   - Vercel CLI: Try 'vercel --help' to check CLI status"
    echo "   - Network: Check your internet connection"
    exit 1
fi

# Post-deployment verification and checklist
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🔗 Your application is now live!"
    echo "📊 Check deployment status: vercel ls"
    echo "🌐 View deployment: vercel --url"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 REQUIRED ACTIONS:"
    echo "1. 🔐 Update Supabase Auth settings:"
    echo "   - Go to: https://app.supabase.com/project/[your-project]/auth/url-configuration"
    echo "   - Add your Vercel URL to 'Site URL' and 'Redirect URLs'"
    echo ""
    echo "2. 🌍 Set environment variables in Vercel:"
    echo "   - Go to: https://vercel.com/dashboard"
    echo "   - Navigate to your project settings"
    echo "   - Add all required environment variables"
    echo ""
    echo "🧪 TESTING CHECKLIST:"
    echo "3. ✅ Test authentication flow (login/logout)"
    echo "4. ✅ Verify database connections work"
    echo "5. ✅ Check all API endpoints respond correctly"
    echo "6. ✅ Test real-time features (if applicable)"
    echo "7. ✅ Verify file uploads work (if applicable)"
    echo "8. ✅ Test mobile responsiveness"
    echo ""
    echo "🔗 Useful links:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   📊 Vercel Dashboard: https://vercel.com/dashboard"
    echo "   🗄️  Supabase Dashboard: https://app.supabase.com"
    echo "   📈 Analytics: Check your Vercel project dashboard"
    echo "   🐛 Logs: vercel logs [deployment-url]"
    echo ""
    echo "🎉 Your Academic System is now live on Vercel!"
    echo "💡 Bookmark your deployment URL for easy access"
    
    # Reset trap to avoid showing error message on successful completion
    trap - EXIT
else
    echo "❌ Deployment failed. Please check the errors above and try again."
    exit 1
fi
