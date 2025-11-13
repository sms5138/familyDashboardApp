#!/bin/bash

# Family Dashboard Control Script
# Manage the Family Dashboard application

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STORAGE_SERVER_DIR="$SCRIPT_DIR/storage-server"
WEB_APP_DIR="$SCRIPT_DIR/web-app"

# PID files
STORAGE_PID_FILE="$SCRIPT_DIR/.storage-server.pid"
WEBAPP_PID_FILE="$SCRIPT_DIR/.web-app.pid"

# Log files
LOG_DIR="$SCRIPT_DIR/logs"
STORAGE_LOG="$LOG_DIR/storage-server.log"
WEBAPP_LOG="$LOG_DIR/web-app.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Start the dashboard
start_dashboard() {
    print_header "Starting Family Dashboard"

    # Check if already running
    if is_running "$STORAGE_PID_FILE" && is_running "$WEBAPP_PID_FILE"; then
        print_info "Dashboard is already running"
        print_info "Storage Server PID: $(cat $STORAGE_PID_FILE)"
        print_info "Web App PID: $(cat $WEBAPP_PID_FILE)"
        return 0
    fi

    # Start storage server
    print_info "Starting storage server..."
    cd "$STORAGE_SERVER_DIR"
    nohup npm start > "$STORAGE_LOG" 2>&1 &
    echo $! > "$STORAGE_PID_FILE"
    print_success "Storage server started (PID: $(cat $STORAGE_PID_FILE))"

    # Wait for storage server to be ready
    sleep 3

    # Start web app
    print_info "Starting web app..."
    cd "$WEB_APP_DIR"
    nohup npm run web > "$WEBAPP_LOG" 2>&1 &
    echo $! > "$WEBAPP_PID_FILE"
    print_success "Web app started (PID: $(cat $WEBAPP_PID_FILE))"

    # Wait for web app to be ready
    sleep 5

    print_success "Family Dashboard is running!"
    echo ""
    print_info "Access the dashboard at:"
    echo "  Local:   ${GREEN}http://localhost:8081${NC}"
    echo "  Network: ${GREEN}http://$(hostname -I | awk '{print $1}'):8081${NC}"
    echo ""
    print_info "View logs with: $0 logs"
}

# Stop the dashboard
stop_dashboard() {
    print_header "Stopping Family Dashboard"

    local stopped=0

    # Stop web app
    if is_running "$WEBAPP_PID_FILE"; then
        local pid=$(cat "$WEBAPP_PID_FILE")
        print_info "Stopping web app (PID: $pid)..."
        kill "$pid" 2>/dev/null
        rm -f "$WEBAPP_PID_FILE"
        print_success "Web app stopped"
        stopped=1
    fi

    # Stop storage server
    if is_running "$STORAGE_PID_FILE"; then
        local pid=$(cat "$STORAGE_PID_FILE")
        print_info "Stopping storage server (PID: $pid)..."
        kill "$pid" 2>/dev/null
        rm -f "$STORAGE_PID_FILE"
        print_success "Storage server stopped"
        stopped=1
    fi

    # Kill any remaining processes
    pkill -f "node.*storage-server" 2>/dev/null || true
    pkill -f "expo.*web-app" 2>/dev/null || true

    if [ $stopped -eq 0 ]; then
        print_info "Dashboard was not running"
    else
        print_success "Family Dashboard stopped"
    fi
}

# Restart the dashboard
restart_dashboard() {
    print_header "Restarting Family Dashboard"
    stop_dashboard
    sleep 2
    start_dashboard
}

# Show dashboard status
show_status() {
    print_header "Family Dashboard Status"

    local storage_running=0
    local webapp_running=0

    # Check storage server
    if is_running "$STORAGE_PID_FILE"; then
        print_success "Storage Server: Running (PID: $(cat $STORAGE_PID_FILE))"
        storage_running=1
    else
        print_error "Storage Server: Not running"
    fi

    # Check web app
    if is_running "$WEBAPP_PID_FILE"; then
        print_success "Web App: Running (PID: $(cat $WEBAPP_PID_FILE))"
        webapp_running=1
    else
        print_error "Web App: Not running"
    fi

    echo ""

    if [ $storage_running -eq 1 ] && [ $webapp_running -eq 1 ]; then
        print_success "Dashboard is fully operational"
        echo ""
        print_info "Access at: ${GREEN}http://localhost:8081${NC}"
    else
        print_error "Dashboard is not fully running"
        echo ""
        print_info "Start with: $0 start"
    fi
}

# Show logs
show_logs() {
    local service=$1

    if [ -z "$service" ] || [ "$service" == "all" ]; then
        print_header "Dashboard Logs (Ctrl+C to exit)"
        tail -f "$STORAGE_LOG" "$WEBAPP_LOG"
    elif [ "$service" == "storage" ]; then
        print_header "Storage Server Logs (Ctrl+C to exit)"
        tail -f "$STORAGE_LOG"
    elif [ "$service" == "web" ]; then
        print_header "Web App Logs (Ctrl+C to exit)"
        tail -f "$WEBAPP_LOG"
    else
        print_error "Unknown service: $service"
        echo "Usage: $0 logs [all|storage|web]"
    fi
}

# Show help
show_help() {
    cat << EOF
${BLUE}Family Dashboard Control Script${NC}

${YELLOW}Usage:${NC}
  $0 [command]

${YELLOW}Commands:${NC}
  ${GREEN}start${NC}       Start the dashboard
  ${GREEN}stop${NC}        Stop the dashboard
  ${GREEN}restart${NC}     Restart the dashboard
  ${GREEN}status${NC}      Show dashboard status
  ${GREEN}logs${NC}        Show all logs (Ctrl+C to exit)
  ${GREEN}logs storage${NC} Show storage server logs
  ${GREEN}logs web${NC}    Show web app logs
  ${GREEN}help${NC}        Show this help message

${YELLOW}Examples:${NC}
  $0 start          # Start the dashboard
  $0 status         # Check if running
  $0 logs           # View all logs
  $0 restart        # Restart everything

EOF
}

# Main command handler
case "${1:-}" in
    start)
        start_dashboard
        ;;
    stop)
        stop_dashboard
        ;;
    restart)
        restart_dashboard
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-all}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac
