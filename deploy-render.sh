#!/bin/bash

# Render Deployment Script for Academic System
# This script helps prepare and deploy your application to Render

set -e  # Exit on any error

echo "🎨 Academic System - Render Deployment Script"
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
    echo "1. Set them in your Render dashboard under Environment section"
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
    echo "Render requires a git repository for deployment."
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
    echo "❌ No remote origin found. Render requires a remote repository."
    echo "Please add a remote origin:"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    exit 1
else
    echo "✅ Remote repository found"
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
            echo "📤 Pushing to remote repository..."
            if git push; then
                echo "✅ Changes pushed successfully"
            else
                echo "❌ Failed to push changes"
                exit 1
            fi
        else
            echo "❌ Failed to commit changes"
            exit 1
        fi
    else
        echo "⚠️  Continuing with uncommitted changes..."
        echo "📤 Pushing existing commits to remote..."
        if ! git push; then
            echo "❌ Failed to push to remote repository"
            exit 1
        fi
    fi
else
    echo "✅ No uncommitted changes"
    echo "📤 Ensuring remote is up to date..."
    if ! git push; then
        echo "❌ Failed to push to remote repository"
        exit 1
    fi
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

# Create render.yaml if it doesn't exist
if [ ! -f "render.yaml" ]; then
    echo ""
    echo "📄 Creating render.yaml configuration file..."
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: academic-system
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: NODE_ENV
        value: production
    domains:
      - academic-system.onrender.com
EOF
    echo "✅ render.yaml created with default configuration"
else
    echo "✅ render.yaml already exists"
fi

# Create Dockerfile for Render if it doesn't exist
if [ ! -f "Dockerfile.render" ]; then
    echo ""
    echo "📄 Creating Dockerfile.render for optimal Render deployment..."
    cat > Dockerfile.render << 'EOF'
# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
EOF
    echo "✅ Dockerfile.render created for containerized deployment"
else
    echo "✅ Dockerfile.render already exists"
fi

# Show deployment instructions
echo ""
echo "🚀 Render Deployment Instructions"
echo "================================="
echo ""
echo "Render deploys automatically from your Git repository."
echo "Follow these steps to complete your deployment:"
echo ""
echo "📋 STEP-BY-STEP DEPLOYMENT:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 🌐 Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "2. 🔐 Sign up/Login with your Git provider (GitHub/GitLab/Bitbucket)"
echo ""
echo "3. ➕ Create a New Web Service:"
echo "   - Click 'New +' > 'Web Service'"
echo "   - Connect your repository: $(git remote get-url origin 2>/dev/null || echo 'your-repo-url')"
echo "   - Select the branch: $(git branch --show-current 2>/dev/null || echo 'main')"
echo ""
echo "4. ⚙️  Configure your service:"
echo "   - Name: academic-system"
echo "   - Environment: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Plan: Free (or choose your preferred plan)"
echo ""
echo "5. 🔧 Set Environment Variables:"
echo "   Add these in the Environment Variables section:"
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "   - $var = ${!var}"
    else
        echo "   - $var = <SET_YOUR_VALUE>"
    fi
done
echo "   - NODE_ENV = production"
echo "   - PORT = 3000"
echo ""
echo "6. 🚀 Deploy:"
echo "   - Click 'Create Web Service'"
echo "   - Render will automatically deploy from your repository"
echo "   - Watch the build logs for any issues"
echo ""
echo "📋 Post-deployment checklist:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 REQUIRED ACTIONS:"
echo "1. 🔐 Update Supabase Auth settings:"
echo "   - Go to: https://app.supabase.com/project/[your-project]/auth/url-configuration"
echo "   - Add your Render URL to 'Site URL' and 'Redirect URLs'"
echo "   - Format: https://academic-system.onrender.com"
echo ""
echo "2. 🔄 Set up automatic deployments:"
echo "   - Render automatically deploys on git push"
echo "   - Configure branch auto-deploy in Render settings"
echo ""
echo "3. 🌍 Configure custom domain (optional):"
echo "   - Go to Render service settings > Custom Domains"
echo "   - Add your custom domain and configure DNS"
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
echo "   📊 Render Dashboard: https://dashboard.render.com"
echo "   🗄️  Supabase Dashboard: https://app.supabase.com"
echo "   📚 Render Docs: https://render.com/docs"
echo ""
echo "🎉 Your code is ready for Render deployment!"
echo "💡 Follow the steps above to complete your deployment"

# Reset trap to avoid showing error message on successful completion
trap - EXIT
