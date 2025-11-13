#!/bin/bash

# Family Dashboard Release Package Script
# Creates a distributable package of the project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Get version from package.json
get_version() {
    grep -m 1 '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/'
}

print_header "Family Dashboard Release Packager"

# Get version
VERSION=$(get_version)
print_info "Version: $VERSION"

# Create release directory
RELEASE_DIR="family-dashboard-v${VERSION}"
ARCHIVE_NAME="${RELEASE_DIR}.tar.gz"

if [ -d "$RELEASE_DIR" ]; then
    print_info "Removing existing release directory..."
    rm -rf "$RELEASE_DIR"
fi

print_info "Creating release directory..."
mkdir -p "$RELEASE_DIR"

# Copy essential files
print_info "Copying project files..."

# Root files
cp README.md "$RELEASE_DIR/"
cp LICENSE "$RELEASE_DIR/"
cp CONTRIBUTING.md "$RELEASE_DIR/"
cp GOOGLE_CALENDAR_SETUP.md "$RELEASE_DIR/"
cp START.md "$RELEASE_DIR/"
cp ONE_COMMAND_INSTALL.md "$RELEASE_DIR/"
cp .gitignore "$RELEASE_DIR/"
cp package.json "$RELEASE_DIR/"

# Scripts
cp install.sh "$RELEASE_DIR/"
cp start-dashboard.sh "$RELEASE_DIR/"
cp dashboard-control.sh "$RELEASE_DIR/"
cp -r scripts "$RELEASE_DIR/" 2>/dev/null || true

# Documentation
cp -r docs "$RELEASE_DIR/" 2>/dev/null || mkdir -p "$RELEASE_DIR/docs"

# Configuration examples
cp .env.example "$RELEASE_DIR/"

# Storage server (without node_modules and data)
print_info "Copying storage server..."
mkdir -p "$RELEASE_DIR/storage-server"
cp storage-server/package.json "$RELEASE_DIR/storage-server/"
cp storage-server/server.js "$RELEASE_DIR/storage-server/"
cp -r storage-server/data "$RELEASE_DIR/storage-server/" 2>/dev/null || mkdir -p "$RELEASE_DIR/storage-server/data"

# Web app (without node_modules and build artifacts)
print_info "Copying web app..."
mkdir -p "$RELEASE_DIR/web-app"
cp web-app/package.json "$RELEASE_DIR/web-app/"
cp web-app/App.js "$RELEASE_DIR/web-app/"
cp web-app/app.json "$RELEASE_DIR/web-app/"
cp web-app/babel.config.js "$RELEASE_DIR/web-app/" 2>/dev/null || true
cp web-app/tailwind.config.js "$RELEASE_DIR/web-app/" 2>/dev/null || true
cp web-app/webpack.config.js "$RELEASE_DIR/web-app/" 2>/dev/null || true

# Web app data files
cp -r web-app/data "$RELEASE_DIR/web-app/"
# Replace actual apiDetails.json with example
if [ -f "web-app/data/apiDetails.example.json" ]; then
    cp web-app/data/apiDetails.example.json "$RELEASE_DIR/web-app/data/apiDetails.json"
fi

# Web app assets
if [ -d "web-app/assets" ]; then
    cp -r web-app/assets "$RELEASE_DIR/web-app/"
fi

# Make scripts executable
chmod +x "$RELEASE_DIR/install.sh"
chmod +x "$RELEASE_DIR/start-dashboard.sh"
chmod +x "$RELEASE_DIR/dashboard-control.sh"

# Create README for release
cat > "$RELEASE_DIR/INSTALL_INSTRUCTIONS.txt" << 'EOF'
FAMILY DASHBOARD - INSTALLATION INSTRUCTIONS
=============================================

Thank you for downloading Family Dashboard!

QUICK START (All Platforms)
----------------------------

1. Extract this archive
2. Open a terminal in the extracted folder
3. Run: ./install.sh
4. Follow the on-screen instructions
5. Start the dashboard: ./start-dashboard.sh

OR use the control script:
  ./dashboard-control.sh start
  ./dashboard-control.sh status
  ./dashboard-control.sh logs

REQUIREMENTS
------------
- Node.js 20.x or higher
- npm (comes with Node.js)
- Internet connection (for initial setup and API features)

CONFIGURATION
-------------
After installation, edit these files:
- web-app/data/apiDetails.json - Add your API keys
  * Google Calendar API key
  * OpenWeatherMap API key
  * Your location coordinates

See GOOGLE_CALENDAR_SETUP.md for detailed API setup instructions.

DOCUMENTATION
-------------
- README.md - Full documentation
- START.md - Quick start guide
- GOOGLE_CALENDAR_SETUP.md - Calendar setup
- CONTRIBUTING.md - For developers

SUPPORT
-------
- Issues: https://github.com/sms5138/familyDashboardApp/issues
- Documentation: See README.md

Happy organizing!
EOF

# Create archive
print_info "Creating archive..."
tar -czf "$ARCHIVE_NAME" "$RELEASE_DIR"

# Calculate size
SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

print_success "Release package created!"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Archive:${NC}  $ARCHIVE_NAME"
echo -e "${YELLOW}Size:${NC}     $SIZE"
echo -e "${YELLOW}Version:${NC}  $VERSION"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Distribution package ready for release!"
echo ""
print_info "To test the package:"
echo "  1. Extract: tar -xzf $ARCHIVE_NAME"
echo "  2. cd $RELEASE_DIR"
echo "  3. ./install.sh"
echo ""
print_info "To clean up:"
echo "  rm -rf $RELEASE_DIR"
