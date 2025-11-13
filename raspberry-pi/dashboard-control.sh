#!/bin/bash

case "$1" in
    start)
        echo "Starting Family Dashboard..."
        sudo systemctl start family-dashboard.service
        ;;
    stop)
        echo "Stopping Family Dashboard..."
        sudo systemctl stop family-dashboard.service
        pkill chromium
        pkill node
        ;;
    restart)
        echo "Restarting Family Dashboard..."
        sudo systemctl restart family-dashboard.service
        ;;
    status)
        sudo systemctl status family-dashboard.service
        ;;
    logs)
        sudo journalctl -u family-dashboard.service -f
        ;;
    storage)
        echo "Storage Server Status:"
        curl -s http://localhost:3001/api/health | python3 -m json.tool
        ;;
    backup)
        echo "Creating backup..."
        curl -X POST http://localhost:3001/api/backup
        echo ""
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|storage|backup}"
        exit 1
esac
