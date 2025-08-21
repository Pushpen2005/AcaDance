#!/bin/bash

# Heroku Deployment Script for Academic System
# This script helps prepare and deploy your application to Heroku

set -e  # Exit on any error

echo "⚡ Academic System - Heroku Deployment Script"
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

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   macOS: brew tap heroku/brew && brew install heroku"
    echo "   Ubuntu: curl https://cli-assets.heroku.com/install-ubuntu.sh | sh"
    echo "   Windows: Download from https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
else
    echo "✅ Heroku CLI found"
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
    echo "1. Set them using 'heroku config:set' command"
    echo "2. Set them in your Heroku dashboard under Settings > Config Vars"
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
    echo "Heroku requires a git repository for deployment."
    echo "Please initialize git first:"
    echo ""
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo ""
    exit 1
else
    echo "✅ Git repository found"
fi

# Check if user is logged in to Heroku
echo ""
echo "🔐 Checking Heroku authentication..."
if ! heroku whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please login first:"
    echo "   heroku login"
    echo ""
    read -p "Would you like to login now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        if heroku login; then
            echo "✅ Successfully logged in to Heroku"
        else
            echo "❌ Failed to login to Heroku"
            exit 1
        fi
    else
        echo "❌ Cannot deploy without Heroku authentication"
        exit 1
    fi
else
    echo "✅ Already logged in to Heroku"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit changes before deployment? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        if git commit -m "Pre-deployment commit - $(date)"; then
            echo "✅ Changes committed"
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
    npm install
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

# Create Procfile if it doesn't exist
if [ ! -f "Procfile" ]; then
    echo ""
    echo "📄 Creating Procfile for Heroku..."
    cat > Procfile << 'EOF'
web: npm start
EOF
    echo "✅ Procfile created"
    git add Procfile
    git commit -m "Add Procfile for Heroku deployment" || echo "No changes to commit"
else
    echo "✅ Procfile already exists"
fi

# Check if Heroku app exists or create new one
echo ""
echo "🔗 Checking Heroku app..."

# Generate unique app name
RANDOM_SUFFIX=$(openssl rand -hex 3)
DATE_SUFFIX=$(date +%Y%m%d)
DEFAULT_APP_NAME="academic-system-${DATE_SUFFIX}-${RANDOM_SUFFIX}"

if git remote | grep -q heroku; then
    EXISTING_APP=$(heroku apps:info 2>/dev/null | grep "=== " | sed 's/=== //' || echo "")
    if [ -n "$EXISTING_APP" ]; then
        echo "✅ Using existing Heroku app: $EXISTING_APP"
        APP_NAME="$EXISTING_APP"
    else
        echo "⚠️  Heroku remote exists but app not found. Creating new app..."
        git remote remove heroku
        APP_NAME="$DEFAULT_APP_NAME"
    fi
else
    APP_NAME="$DEFAULT_APP_NAME"
fi

if [ "$APP_NAME" = "$DEFAULT_APP_NAME" ]; then
    echo "🆕 Creating new Heroku app: $APP_NAME"
    if heroku create "$APP_NAME"; then
        echo "✅ Heroku app created successfully"
    else
        echo "❌ Failed to create Heroku app. Trying with random name..."
        if heroku create; then
            APP_NAME=$(heroku apps:info | grep "=== " | sed 's/=== //')
            echo "✅ Heroku app created with name: $APP_NAME"
        else
            echo "❌ Failed to create Heroku app"
            exit 1
        fi
    fi
fi

# Set environment variables in Heroku
echo ""
echo "🔧 Setting environment variables in Heroku..."
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "Setting $var..."
        heroku config:set "$var=${!var}" --app "$APP_NAME" || echo "⚠️  Failed to set $var"
    fi
done

# Set additional Heroku-specific variables
heroku config:set NODE_ENV=production --app "$APP_NAME"
heroku config:set NPM_CONFIG_PRODUCTION=false --app "$APP_NAME"

# Determine deployment type
echo ""
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    echo "📋 Deploying to PRODUCTION environment..."
    echo "⚠️  This will be your live site accessible to users!"
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Production deployment cancelled."
        echo "💡 Use './deploy-heroku.sh' (without --production) for staging deployment"
        exit 1
    fi
    DEPLOYMENT_TYPE="production"
else
    echo "📋 Deploying to STAGING environment..."
    echo "💡 Use './deploy-heroku.sh --production' for production deployment"
    DEPLOYMENT_TYPE="staging"
fi

# Perform the deployment
echo ""
echo "🚀 Starting Heroku deployment..."
echo "⏳ This may take a few minutes..."

if git push heroku main; then
    DEPLOYMENT_SUCCESS=true
    echo ""
    echo "🎉 Deployment completed successfully!"
else
    DEPLOYMENT_SUCCESS=false
    echo ""
    echo "❌ Deployment failed!"
    echo "💡 Common issues and fixes:"
    echo "   - Build errors: Check the build logs above"
    echo "   - Environment variables: Use 'heroku config' to check/set them"
    echo "   - Heroku CLI: Try 'heroku --help' to check CLI status"
    echo "   - Network: Check your internet connection"
    echo "   - Logs: Run 'heroku logs --tail' to see real-time logs"
    exit 1
fi

# Post-deployment verification and checklist
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🔗 Your application is now live on Heroku!"
    echo "📊 App info: heroku apps:info --app $APP_NAME"
    echo "🌐 Open application: heroku open --app $APP_NAME"
    echo "📋 View logs: heroku logs --tail --app $APP_NAME"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 REQUIRED ACTIONS:"
    echo "1. 🔐 Update Supabase Auth settings:"
    echo "   - Go to: https://app.supabase.com/project/[your-project]/auth/url-configuration"
    echo "   - Add your Heroku URL to 'Site URL' and 'Redirect URLs'"
    echo "   - Format: https://$APP_NAME.herokuapp.com"
    echo ""
    echo "2. 🌍 Verify environment variables in Heroku:"
    echo "   - Run: heroku config --app $APP_NAME"
    echo "   - Check all required variables are set correctly"
    echo ""
    echo "3. 🔄 Set up monitoring and logging:"
    echo "   - Run: heroku logs --tail --app $APP_NAME"
    echo "   - Consider adding Heroku add-ons for monitoring"
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
    echo "   📊 Heroku Dashboard: https://dashboard.heroku.com/apps/$APP_NAME"
    echo "   🗄️  Supabase Dashboard: https://app.supabase.com"
    echo "   📈 Metrics: heroku logs --tail --app $APP_NAME"
    echo "   🐛 Debug: heroku run bash --app $APP_NAME"
    echo ""
    echo "🎉 Your Academic System is now live on Heroku!"
    echo "💡 Your app URL: https://$APP_NAME.herokuapp.com"
    
    # Reset trap to avoid showing error message on successful completion
    trap - EXIT
else
    echo "❌ Deployment failed. Please check the errors above and try again."
    exit 1
fi
