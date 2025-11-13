#!/bin/bash

# Family Dashboard Startup Script
# Starts both the storage server and React web app

echo "================================================"
echo "🚀 Starting Family Dashboard"
echo "================================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "================================================"
    echo "🛑 Shutting down Family Dashboard..."
    echo "================================================"
    if [ ! -z "$STORAGE_PID" ]; then
        echo "Stopping storage server (PID: $STORAGE_PID)..."
        kill $STORAGE_PID 2>/dev/null
        wait $STORAGE_PID 2>/dev/null
    fi
    if [ ! -z "$WEB_PID" ]; then
        echo "Stopping web app (PID: $WEB_PID)..."
        kill $WEB_PID 2>/dev/null
        wait $WEB_PID 2>/dev/null
    fi
    echo "✅ Shutdown complete"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Create log directory
mkdir -p "$SCRIPT_DIR/logs"

# Check and install storage server dependencies
echo ""
echo "📦 Checking storage server dependencies..."
cd "$SCRIPT_DIR/storage-server"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies (first time only)..."
    npm install
fi

# Start storage server with logging
echo ""
echo "📦 Starting storage server..."
npm start 2>&1 | tee "$SCRIPT_DIR/logs/storage-server.log" &
STORAGE_PID=$!
echo "✅ Storage server started (PID: $STORAGE_PID)"
echo "   Log: $SCRIPT_DIR/logs/storage-server.log"

# Wait a moment for storage server to initialize
sleep 3

# Check and install web app dependencies
echo ""
echo "🌐 Checking web app dependencies..."
cd "$SCRIPT_DIR/web-app"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies (first time only)..."
    npm install
fi

# Start web app with logging
echo ""
echo "🌐 Starting web app..."
npm run web 2>&1 | tee "$SCRIPT_DIR/logs/web-app.log" &
WEB_PID=$!
echo "✅ Web app started (PID: $WEB_PID)"
echo "   Log: $SCRIPT_DIR/logs/web-app.log"

echo ""
echo "================================================"
echo "✨ Family Dashboard is running!"
echo "================================================"
echo "📦 Storage Server: http://localhost:3001"
echo "🌐 Web App: http://localhost:19006"
echo ""
echo "📋 Logs are being saved to:"
echo "   - $SCRIPT_DIR/logs/storage-server.log"
echo "   - $SCRIPT_DIR/logs/web-app.log"
echo ""
echo "💡 To view errors, check the logs above or watch this terminal"
echo "Press Ctrl+C to stop all services"
echo "================================================"

# Wait for all background processes
wait
