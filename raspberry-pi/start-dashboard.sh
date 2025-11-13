#!/bin/bash

# Wait for system to fully boot
sleep 10

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Start storage server
cd "$PROJECT_ROOT/storage-server"
node server.js &
STORAGE_PID=$!

# Wait for storage server
sleep 5

# Start web app
cd "$PROJECT_ROOT/web-app"
npm run web &
WEB_PID=$!

# Wait for web server
sleep 15

# Hide cursor
unclutter -idle 0 &

# Start Chromium in kiosk mode
DISPLAY=:0 chromium-browser \
    --kiosk \
    --app=http://localhost:19006 \
    --start-fullscreen \
    --disable-infobars \
    --noerrdialogs \
    --disable-translate \
    --no-first-run \
    --disable-features=TranslateUI \
    --overscroll-history-navigation=0

# Cleanup on exit
kill $STORAGE_PID $WEB_PID
