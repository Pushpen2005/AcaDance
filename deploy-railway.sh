#!/bin/bash

# Railway Deployment Script for Academic System
# This script helps prepare and deploy your application to Railway

set -e  # Exit on any error

echo "🚂 Academic System - Railway Deployment Script"
echo "=============================================="

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

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    if npm install -g @railway/cli; then
        echo "✅ Railway CLI installed successfully"
    else
        echo "❌ Failed to install Railway CLI. Please install manually:"
        echo "   npm install -g @railway/cli"
        exit 1
    fi
else
    echo "✅ Railway CLI found"
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
    echo "1. Set them in your Railway dashboard under Variables section"
    echo "2. Use 'railway variables set' command"
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
    echo "Railway requires a git repository for deployment."
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
if [ ! -d "node_modules" ]; then
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

# Check if railway.json exists, create if not
if [ ! -f "railway.json" ]; then
    echo ""
    echo "📄 Creating railway.json configuration file..."
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
EOF
    echo "✅ railway.json created with default configuration"
else
    echo "✅ railway.json already exists"
fi

# Check if user is logged in to Railway
echo ""
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "   railway login"
    echo ""
    read -p "Would you like to login now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        if railway login; then
            echo "✅ Successfully logged in to Railway"
        else
            echo "❌ Failed to login to Railway"
            exit 1
        fi
    else
        echo "❌ Cannot deploy without Railway authentication"
        exit 1
    fi
else
    echo "✅ Already logged in to Railway"
fi

# Check if project is linked to Railway
echo ""
echo "🔗 Checking Railway project link..."
if [ ! -f ".railway/project" ]; then
    echo "❌ Project not linked to Railway. Creating new project..."
    if railway init; then
        echo "✅ Railway project created and linked"
    else
        echo "❌ Failed to create Railway project"
        exit 1
    fi
else
    echo "✅ Project already linked to Railway"
fi

# Set environment variables if they exist locally
echo ""
echo "🔧 Setting environment variables in Railway..."
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "Setting $var..."
        railway variables set "$var=${!var}" || echo "⚠️  Failed to set $var"
    fi
done

# Determine deployment type
echo ""
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    echo "📋 Deploying to PRODUCTION environment..."
    echo "⚠️  This will be your live site accessible to users!"
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Production deployment cancelled."
        echo "💡 Use './deploy-railway.sh' (without --production) for development deployment"
        exit 1
    fi
    ENVIRONMENT="production"
else
    echo "📋 Deploying to DEVELOPMENT environment..."
    echo "💡 Use './deploy-railway.sh --production' for production deployment"
    ENVIRONMENT="development"
fi

# Perform the deployment
echo ""
echo "🚀 Starting Railway deployment..."
echo "⏳ This may take a few minutes..."

if railway up; then
    DEPLOYMENT_SUCCESS=true
    echo ""
    echo "🎉 Deployment completed successfully!"
else
    DEPLOYMENT_SUCCESS=false
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Common issues and fixes:"
    echo "   - Build errors: Check the build logs above"
    echo "   - Environment variables: Use 'railway variables' to check/set them"
    echo "   - Railway CLI: Try 'railway --help' to check CLI status"
    echo "   - Network: Check your internet connection"
    echo "   - Authentication: Run 'railway login' if session expired"
    exit 1
fi

# Post-deployment verification and checklist
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🔗 Your application is now live on Railway!"
    echo "📊 Check deployment status: railway status"
    echo "🌐 Open application: railway open"
    echo "📋 View logs: railway logs"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 REQUIRED ACTIONS:"
    echo "1. 🔐 Update Supabase Auth settings:"
    echo "   - Go to: https://app.supabase.com/project/[your-project]/auth/url-configuration"
    echo "   - Add your Railway URL to 'Site URL' and 'Redirect URLs'"
    echo ""
    echo "2. 🌍 Verify environment variables in Railway:"
    echo "   - Run: railway variables"
    echo "   - Check all required variables are set correctly"
    echo ""
    echo "3. 🔄 Set up custom domain (optional):"
    echo "   - Go to Railway dashboard > Settings > Domains"
    echo "   - Add your custom domain"
    echo ""
    echo "🧪 TESTING CHECKLIST:"
    echo "4. ✅ Test authentication flow (login/logout)"
    echo "5. ✅ Verify database connections work"
    echo "6. ✅ Check all API endpoints respond correctly"
    echo "7. ✅ Test real-time features (if applicable)"
    echo "8. ✅ Verify file uploads work (if applicable)"
    echo "9. ✅ Test mobile responsiveness"
    echo ""
    echo "🔗 Useful links:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   📊 Railway Dashboard: https://railway.app/dashboard"
    echo "   🗄️  Supabase Dashboard: https://app.supabase.com"
    echo "   📈 Metrics: railway metrics"
    echo "   🐛 Logs: railway logs"
    echo ""
    echo "🎉 Your Academic System is now live on Railway!"
    echo "💡 Bookmark your deployment URL for easy access"
    
    # Reset trap to avoid showing error message on successful completion
    trap - EXIT
else
    echo "❌ Deployment failed. Please check the errors above and try again."
    exit 1
fi
