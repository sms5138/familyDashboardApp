#!/bin/bash

# Family Dashboard Installation Script
# Works on Linux, macOS, and Raspberry Pi

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /proc/device-tree/model ]; then
            echo "raspberrypi"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

print_header "Family Dashboard Installation"

# Detect operating system
OS=$(detect_os)
print_info "Detected OS: $OS"

# Check for Node.js
print_info "Checking for Node.js..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js found: $NODE_VERSION"

    # Check if version is >= 18
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required"
        print_info "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js not found"
    print_info "Installing Node.js..."

    if [ "$OS" == "raspberrypi" ] || [ "$OS" == "linux" ]; then
        # Install Node.js on Linux/Raspberry Pi
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" == "macos" ]; then
        # Check for Homebrew
        if command_exists brew; then
            brew install node
        else
            print_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
fi

# Check for npm
print_info "Checking for npm..."
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please reinstall Node.js"
    exit 1
fi

# Install storage server dependencies
print_header "Installing Storage Server Dependencies"
cd storage-server
print_info "Running npm install..."
npm install
print_success "Storage server dependencies installed"
cd ..

# Install web app dependencies
print_header "Installing Web App Dependencies"
cd web-app
print_info "Running npm install (this may take a few minutes)..."
npm install
print_success "Web app dependencies installed"
cd ..

# Create example configuration if apiDetails.json doesn't exist
if [ ! -f "web-app/data/apiDetails.json" ]; then
    print_info "Creating example API configuration file..."
    cp web-app/data/apiDetails.example.json web-app/data/apiDetails.json
    print_success "Created web-app/data/apiDetails.json - Please edit with your API keys"
fi

# Make scripts executable
print_info "Making scripts executable..."
chmod +x start-dashboard.sh
if [ -f "build-everything.sh" ]; then
    chmod +x build-everything.sh
fi
if [ -f "test-api.sh" ]; then
    chmod +x test-api.sh
fi

print_header "Installation Complete!"
echo ""
print_success "Family Dashboard is installed and ready to use!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit web-app/data/apiDetails.json with your API keys"
echo "     - Google Calendar API key and client ID"
echo "     - OpenWeatherMap API key"
echo "     - Your location coordinates"
echo ""
echo "  2. Start the dashboard:"
echo "     ${GREEN}./start-dashboard.sh${NC}"
echo ""
echo "  3. Open your browser to:"
echo "     ${BLUE}http://localhost:8081${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  - README.md - Full documentation"
echo "  - GOOGLE_CALENDAR_SETUP.md - Calendar setup guide"
echo "  - START.md - Quick start guide"
echo ""
print_success "Happy organizing!"
