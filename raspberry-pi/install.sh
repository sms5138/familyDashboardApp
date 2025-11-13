#!/bin/bash

# Family Dashboard - Raspberry Pi 5 Installer
# Repository: https://github.com/sms5138/familyDashboardApp
# 
# This script will:
# - Install all dependencies
# - Set up storage server
# - Set up web dashboard
# - Configure auto-start
# - Create control scripts

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}"
echo "=========================================="
echo "🏠 Family Dashboard Installer"
echo "=========================================="
echo -e "${NC}"
echo "Repository: https://github.com/sms5138/familyDashboardApp"
echo "Location: $PROJECT_ROOT"
echo ""

# Check if running on Raspberry Pi
echo -e "${YELLOW}Checking system...${NC}"
if [ -f /proc/device-tree/model ]; then
    MODEL=$(cat /proc/device-tree/model)
    echo "✅ Detected: $MODEL"
else
    echo -e "${YELLOW}⚠️  Warning: Cannot detect Raspberry Pi model${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Check for sudo
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run this script as root (sudo)${NC}"
    echo "Run: ./install.sh"
    exit 1
fi

# Confirm installation
echo -e "${YELLOW}This will install:${NC}"
echo "  • Node.js 20.x"
echo "  • System dependencies (chromium, unclutter, etc.)"
echo "  • Storage server"
echo "  • Web dashboard"
echo "  • Auto-start service"
echo ""
read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi
echo ""

# Update system
echo -e "${BLUE}Step 1/8: Updating system packages...${NC}"
sudo apt update
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ System updated${NC}"
else
    echo -e "${RED}❌ Failed to update system${NC}"
    exit 1
fi
echo ""

# Install Node.js
echo -e "${BLUE}Step 2/8: Installing Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js already installed: $NODE_VERSION"
    read -p "Reinstall anyway? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Verify Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
    echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"
else
    echo -e "${RED}❌ Node.js installation failed${NC}"
    exit 1
fi
echo ""

# Install system dependencies
echo -e "${BLUE}Step 3/8: Installing system dependencies...${NC}"
sudo apt install -y \
    chromium-browser \
    unclutter \
    xdotool \
    x11-xserver-utils \
    git \
    curl \
    python3

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ System dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Setup storage server
echo -e "${BLUE}Step 4/8: Setting up storage server...${NC}"
cd "$PROJECT_ROOT/storage-server"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ storage-server/package.json not found${NC}"
    exit 1
fi

echo "Installing storage server dependencies..."
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Storage server configured${NC}"
else
    echo -e "${RED}❌ Storage server setup failed${NC}"
    exit 1
fi

# Create data directories
mkdir -p data/backups
echo ""

# Setup web app
echo -e "${BLUE}Step 5/8: Setting up web dashboard...${NC}"
cd "$PROJECT_ROOT/web-app"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ web-app/package.json not found${NC}"
    exit 1
fi

echo "Installing web app dependencies (this may take 5-10 minutes)..."
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Web dashboard configured${NC}"
else
    echo -e "${RED}❌ Web dashboard setup failed${NC}"
    exit 1
fi
echo ""

# Copy scripts to home directory
echo -e "${BLUE}Step 6/8: Installing control scripts...${NC}"
cd "$PROJECT_ROOT"

# Update paths in start script
sed "s|~/FamilyDashboard|$PROJECT_ROOT|g" raspberry-pi/start-dashboard.sh > ~/start-dashboard.sh
sed "s|~/FamilyDashboard|$PROJECT_ROOT|g" raspberry-pi/dashboard-control.sh > ~/dashboard-control.sh

chmod +x ~/start-dashboard.sh
chmod +x ~/dashboard-control.sh

echo -e "${GREEN}✅ Control scripts installed${NC}"
echo "  • ~/start-dashboard.sh"
echo "  • ~/dashboard-control.sh"
echo ""

# Install systemd service
echo -e "${BLUE}Step 7/8: Installing system service...${NC}"

# Update paths in service file
sudo sed "s|/home/pi/FamilyDashboard|$PROJECT_ROOT|g" \
    raspberry-pi/family-dashboard.service > /tmp/family-dashboard.service
sudo sed -i "s|User=pi|User=$USER|g" /tmp/family-dashboard.service
sudo sed -i "s|/home/pi/start-dashboard.sh|$HOME/start-dashboard.sh|g" /tmp/family-dashboard.service

sudo mv /tmp/family-dashboard.service /etc/systemd/system/family-dashboard.service
sudo systemctl daemon-reload
sudo systemctl enable family-dashboard.service

echo -e "${GREEN}✅ System service installed and enabled${NC}"
echo ""

# Configure display
echo -e "${BLUE}Step 8/8: Configuring display...${NC}"
mkdir -p ~/.config/lxsession/LXDE-pi
cp raspberry-pi/autostart ~/.config/lxsession/LXDE-pi/autostart

echo -e "${GREEN}✅ Display configured (screen won't blank)${NC}"
echo ""

# Get IP address
IP=$(hostname -I | awk '{print $1}')

# Installation complete
echo -e "${GREEN}"
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo -e "${NC}"
echo ""
echo -e "${YELLOW}📍 Your Raspberry Pi IP Address: ${GREEN}$IP${NC}"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo ""
echo "1. Get free OpenWeather API key:"
echo "   ${BLUE}https://openweathermap.org/api${NC}"
echo ""
echo "2. Test the installation:"
echo "   ${GREEN}~/dashboard-control.sh start${NC}"
echo "   ${GREEN}~/dashboard-control.sh status${NC}"
echo ""
echo "3. Configure mobile apps:"
echo "   • Enter Pi IP address: ${GREEN}$IP${NC}"
echo "   • See: docs/MOBILE_APP_SETUP.md"
echo ""
echo -e "${YELLOW}📋 Control Commands:${NC}"
echo "   ${GREEN}~/dashboard-control.sh start${NC}    - Start dashboard"
echo "   ${GREEN}~/dashboard-control.sh stop${NC}     - Stop dashboard"
echo "   ${GREEN}~/dashboard-control.sh restart${NC}  - Restart dashboard"
echo "   ${GREEN}~/dashboard-control.sh status${NC}   - Check status"
echo "   ${GREEN}~/dashboard-control.sh logs${NC}     - View logs"
echo "   ${GREEN}~/dashboard-control.sh storage${NC}  - Check storage server"
echo "   ${GREEN}~/dashboard-control.sh backup${NC}   - Create backup"
echo ""
echo -e "${YELLOW}🔄 Auto-start on boot:${NC}"
echo "   The dashboard will automatically start when your Pi boots"
echo ""
echo -e "${YELLOW}📁 Data Location:${NC}"
echo "   ${BLUE}$PROJECT_ROOT/storage-server/data/${NC}"
echo ""
echo -e "${YELLOW}💡 Tip:${NC}"
echo "   Reboot now to start the dashboard automatically:"
echo "   ${GREEN}sudo reboot${NC}"
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Happy Family Organizing!${NC}"
echo "=========================================="
echo ""

# Ask if user wants to start now
read -p "Start the dashboard now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting dashboard..."
    ~/dashboard-control.sh start
    sleep 3
    echo ""
    echo "Check status with: ~/dashboard-control.sh status"
fi

exit 0