#!/bin/bash

# Family Dashboard - Quick Install Script
# Repository: https://github.com/sms5138/familyDashboardApp
# 
# Usage:
#   curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
#
# Or download and run:
#   wget https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh
#   chmod +x quick-install.sh
#   ./quick-install.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Repository details
REPO_URL="https://github.com/sms5138/familyDashboardApp.git"
INSTALL_DIR="$HOME/FamilyDashboard"

# Banner
clear
echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║        🏠  FAMILY DASHBOARD INSTALLER            ║
║                                                   ║
║     One-command installation for Raspberry Pi    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""
echo -e "${CYAN}Repository: https://github.com/sms5138/familyDashboardApp${NC}"
echo ""

# Log file
LOG_FILE="/tmp/family-dashboard-install.log"
echo "Installation started at $(date)" > "$LOG_FILE"

# Function to log and print
log() {
    echo -e "$1"
    echo -e "$1" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log "${RED}❌ Please do not run this script as root (sudo)${NC}"
    log "Run without sudo:"
    log "  ${GREEN}curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash${NC}"
    exit 1
fi

# Check system
log "${YELLOW}🔍 Checking system...${NC}"
if [ -f /proc/device-tree/model ]; then
    MODEL=$(cat /proc/device-tree/model)
    log "${GREEN}✅ Detected: $MODEL${NC}"
else
    log "${YELLOW}⚠️  Warning: Cannot detect Raspberry Pi model${NC}"
    log "${YELLOW}This script is designed for Raspberry Pi.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Installation cancelled"
        exit 1
    fi
fi

# Check available disk space
AVAILABLE_SPACE=$(df -BM / | awk 'NR==2 {print $4}' | sed 's/M//')
REQUIRED_SPACE=1000

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
    log "${RED}❌ Insufficient disk space${NC}"
    log "Required: ${REQUIRED_SPACE}MB"
    log "Available: ${AVAILABLE_SPACE}MB"
    exit 1
fi

log "${GREEN}✅ Disk space OK (${AVAILABLE_SPACE}MB available)${NC}"
echo ""

# Confirm installation
log "${YELLOW}📦 This will install:${NC}"
echo "  • Node.js 20.x"
echo "  • System dependencies (Chromium, utilities)"
echo "  • Family Dashboard application"
echo "  • Storage server"
echo "  • Auto-start service"
echo ""
echo "Installation directory: ${CYAN}$INSTALL_DIR${NC}"
echo "Time required: ~15-20 minutes"
echo ""

if [ -d "$INSTALL_DIR" ]; then
    log "${YELLOW}⚠️  Directory $INSTALL_DIR already exists${NC}"
    read -p "Remove and reinstall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    else
        log "Installation cancelled"
        exit 0
    fi
fi

read -p "$(echo -e ${GREEN}Continue with installation? \(y/n\)${NC}) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Installation cancelled"
    exit 0
fi

echo ""
log "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
log "${BLUE}║  Starting Installation - Please wait...           ║${NC}"
log "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Update system
log "${CYAN}[1/8]${NC} ${YELLOW}Updating system packages...${NC}"
sudo apt update >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "${GREEN}      ✅ System updated${NC}"
else
    log "${RED}      ❌ Failed to update system${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

# Install Node.js
log "${CYAN}[2/8]${NC} ${YELLOW}Installing Node.js 20.x...${NC}"

if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node --version)
    log "      ℹ️  Node.js already installed: $CURRENT_VERSION"
    log "      Checking version..."
    
    MAJOR_VERSION=$(echo $CURRENT_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        log "      Upgrading to Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >> "$LOG_FILE" 2>&1
        sudo apt install -y nodejs >> "$LOG_FILE" 2>&1
    fi
else
    log "      Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >> "$LOG_FILE" 2>&1
    sudo apt install -y nodejs >> "$LOG_FILE" 2>&1
fi

if command -v node &> /dev/null; then
    log "${GREEN}      ✅ Node.js: $(node --version)${NC}"
    log "${GREEN}      ✅ npm: $(npm --version)${NC}"
else
    log "${RED}      ❌ Node.js installation failed${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

# Install system dependencies
log "${CYAN}[3/8]${NC} ${YELLOW}Installing system dependencies...${NC}"
sudo apt install -y \
    chromium-browser \
    unclutter \
    xdotool \
    x11-xserver-utils \
    git \
    curl \
    python3 >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "${GREEN}      ✅ Dependencies installed${NC}"
else
    log "${RED}      ❌ Failed to install dependencies${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

# Clone repository
log "${CYAN}[4/8]${NC} ${YELLOW}Downloading Family Dashboard...${NC}"
git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "${GREEN}      ✅ Repository cloned${NC}"
else
    log "${RED}      ❌ Failed to clone repository${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

# Setup storage server
log "${CYAN}[5/8]${NC} ${YELLOW}Setting up storage server...${NC}"
cd "$INSTALL_DIR/storage-server"

if [ ! -f "package.json" ]; then
    log "${RED}      ❌ storage-server/package.json not found${NC}"
    exit 1
fi

log "      Installing dependencies..."
npm install >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "${GREEN}      ✅ Storage server configured${NC}"
else
    log "${RED}      ❌ Storage server setup failed${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

mkdir -p data/backups

# Setup web app
log "${CYAN}[6/8]${NC} ${YELLOW}Setting up web dashboard (this may take 5-10 min)...${NC}"
cd "$INSTALL_DIR/web-app"

if [ ! -f "package.json" ]; then
    log "${RED}      ❌ web-app/package.json not found${NC}"
    exit 1
fi

log "      Installing dependencies..."
npm install >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "${GREEN}      ✅ Web dashboard configured${NC}"
else
    log "${RED}      ❌ Web dashboard setup failed${NC}"
    log "Check log: $LOG_FILE"
    exit 1
fi

# Install scripts and service
log "${CYAN}[7/8]${NC} ${YELLOW}Installing control scripts...${NC}"
cd "$INSTALL_DIR"

# Update and copy start script
sed "s|~/FamilyDashboard|$INSTALL_DIR|g" raspberry-pi/start-dashboard.sh > "$HOME/start-dashboard.sh"
sed "s|~/FamilyDashboard|$INSTALL_DIR|g" raspberry-pi/dashboard-control.sh > "$HOME/dashboard-control.sh"

chmod +x "$HOME/start-dashboard.sh"
chmod +x "$HOME/dashboard-control.sh"

# Install systemd service
sed "s|/home/pi/FamilyDashboard|$INSTALL_DIR|g" raspberry-pi/family-dashboard.service > /tmp/family-dashboard.service
sed -i "s|User=pi|User=$USER|g" /tmp/family-dashboard.service
sed -i "s|/home/pi/start-dashboard.sh|$HOME/start-dashboard.sh|g" /tmp/family-dashboard.service

sudo mv /tmp/family-dashboard.service /etc/systemd/system/family-dashboard.service
sudo systemctl daemon-reload >> "$LOG_FILE" 2>&1
sudo systemctl enable family-dashboard.service >> "$LOG_FILE" 2>&1

log "${GREEN}      ✅ Scripts and service installed${NC}"

# Configure display
log "${CYAN}[8/8]${NC} ${YELLOW}Configuring display...${NC}"
mkdir -p ~/.config/lxsession/LXDE-pi
cp raspberry-pi/autostart ~/.config/lxsession/LXDE-pi/autostart

log "${GREEN}      ✅ Display configured${NC}"
echo ""

# Get IP address
IP=$(hostname -I | awk '{print $1}')
if [ -z "$IP" ]; then
    IP="Unable to detect"
fi

# Success banner
log "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          ✅  INSTALLATION COMPLETE!              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
log "${NC}"
echo ""

log "${PURPLE}╔═══════════════════════════════════════════════════╗${NC}"
log "${PURPLE}║           🎯  YOUR PI'S IP ADDRESS                ║${NC}"
log "${PURPLE}╠═══════════════════════════════════════════════════╣${NC}"
log "${PURPLE}║                                                   ║${NC}"
log "${PURPLE}║              ${GREEN}$IP${PURPLE}                  ║${NC}"
log "${PURPLE}║                                                   ║${NC}"
log "${PURPLE}║  ${YELLOW}Use this IP in your mobile app settings!${PURPLE}       ║${NC}"
log "${PURPLE}║                                                   ║${NC}"
log "${PURPLE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

log "${CYAN}📋 Next Steps:${NC}"
echo ""
log "${YELLOW}1. Get OpenWeather API key (free):${NC}"
log "   ${BLUE}https://openweathermap.org/api${NC}"
echo ""
log "${YELLOW}2. Start the dashboard:${NC}"
log "   ${GREEN}~/dashboard-control.sh start${NC}"
echo ""
log "${YELLOW}3. Check status:${NC}"
log "   ${GREEN}~/dashboard-control.sh status${NC}"
echo ""
log "${YELLOW}4. Configure mobile apps:${NC}"
log "   • Install Family Dashboard app on your phone"
log "   • Open Settings ⚙️"
log "   • Enter Pi IP: ${GREEN}$IP${NC}"
log "   • Test Connection"
log "   • Save Settings"
echo ""

log "${CYAN}📚 Documentation:${NC}"
log "   ${BLUE}$INSTALL_DIR/docs/${NC}"
echo ""

log "${CYAN}🎮 Control Commands:${NC}"
log "   ${GREEN}~/dashboard-control.sh start${NC}    - Start dashboard"
log "   ${GREEN}~/dashboard-control.sh stop${NC}     - Stop dashboard"
log "   ${GREEN}~/dashboard-control.sh restart${NC}  - Restart"
log "   ${GREEN}~/dashboard-control.sh status${NC}   - Check status"
log "   ${GREEN}~/dashboard-control.sh logs${NC}     - View logs"
log "   ${GREEN}~/dashboard-control.sh storage${NC}  - Check storage"
log "   ${GREEN}~/dashboard-control.sh backup${NC}   - Backup data"
echo ""

log "${CYAN}📁 Installation Location:${NC}"
log "   ${BLUE}$INSTALL_DIR${NC}"
echo ""

log "${CYAN}📝 Installation Log:${NC}"
log "   ${BLUE}$LOG_FILE${NC}"
echo ""

log "${YELLOW}💡 Tip: Reboot your Pi for auto-start:${NC}"
log "   ${GREEN}sudo reboot${NC}"
echo ""

log "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
log "${GREEN}║  🎉  Happy Family Organizing!                    ║${NC}"
log "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Ask to start now
read -p "$(echo -e ${CYAN}Start the dashboard now? \(y/n\)${NC}) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    log "${YELLOW}Starting dashboard...${NC}"
    "$HOME/dashboard-control.sh" start
    sleep 3
    echo ""
    log "${GREEN}✅ Dashboard started!${NC}"
    log "Check status: ${GREEN}~/dashboard-control.sh status${NC}"
else
    echo ""
    log "Start later with: ${GREEN}~/dashboard-control.sh start${NC}"
fi

echo ""
log "${CYAN}Repository:${NC} https://github.com/sms5138/familyDashboardApp"
log "${CYAN}Need help?${NC} Check the docs/ folder or create an issue on GitHub"
echo ""

exit 0