#!/bin/bash

# Highlight.io Session Cleanup Script
# This script helps resolve session data corruption errors in the academic system

echo "🔧 Highlight.io Session Cleanup Tool"
echo "======================================"

# Function to clear browser data (requires manual action)
clear_browser_data() {
    echo ""
    echo "📋 Manual Browser Data Cleanup Instructions:"
    echo "1. Open your browser's Developer Tools (F12 or Cmd+Option+I)"
    echo "2. Go to the Application/Storage tab"
    echo "3. Clear the following:"
    echo "   - Local Storage entries containing 'highlight' or 'sessionData_'"
    echo "   - Session Storage entries"
    echo "   - Clear browser cache"
    echo ""
    echo "Or use these JavaScript commands in the browser console:"
    echo "localStorage.clear(); sessionStorage.clear(); location.reload();"
}

# Check if environment variable is set to disable Highlight.io
check_highlight_status() {
    echo ""
    echo "🔍 Checking Highlight.io configuration..."
    
    if grep -q "NEXT_PUBLIC_DISABLE_HIGHLIGHT=true" .env.local 2>/dev/null; then
        echo "✅ Highlight.io is disabled in development (recommended)"
    else
        echo "⚠️  Highlight.io is enabled - consider disabling in development"
        echo ""
        echo "To disable Highlight.io in development, add this to .env.local:"
        echo "NEXT_PUBLIC_DISABLE_HIGHLIGHT=true"
    fi
}

# Function to restart the development server
restart_dev_server() {
    echo ""
    echo "🔄 Restarting development server..."
    
    # Kill any existing Next.js processes
    pkill -f "next dev" 2>/dev/null || true
    
    # Wait a moment
    sleep 2
    
    # Start the development server
    echo "Starting server on port 3009..."
    npm run dev -- -p 3009 &
    
    echo "✅ Development server restarted"
    echo "🌐 Access the application at: http://localhost:3009"
}

# Main execution
echo ""
echo "This script helps resolve the Highlight.io session data corruption error:"
echo "Error: 'data for key sessionData_xxx is not session data'"
echo ""

# Check current status
check_highlight_status

# Provide options
echo ""
echo "Choose an action:"
echo "1. Show browser cleanup instructions"
echo "2. Restart development server"
echo "3. Both"
echo "4. Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        clear_browser_data
        ;;
    2)
        restart_dev_server
        ;;
    3)
        clear_browser_data
        restart_dev_server
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "If the error persists:"
echo "1. Clear all browser data for localhost"
echo "2. Restart your browser"
echo "3. Try accessing the application again"
echo ""
echo "For production deployment, consider setting:"
echo "NEXT_PUBLIC_DISABLE_HIGHLIGHT=false"
