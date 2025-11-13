#!/bin/bash

# Family Dashboard - Complete Project Builder
# This script creates ALL files needed for the project
# Run this in your cloned (empty) repository directory

set -e

echo "=========================================="
echo "🏠 Family Dashboard - Project Builder"
echo "=========================================="
echo ""
echo "This will create ALL project files in the current directory."
echo ""

# Check if in a git repo
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    echo "Run this script from inside your cloned familyDashboardApp directory"
    exit 1
fi

read -p "Create all files in $(pwd)? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "🔨 Building project structure..."
echo ""

# Create directories
mkdir -p raspberry-pi
mkdir -p storage-server/data/backups
mkdir -p web-app
mkdir -p mobile-app/src/services
mkdir -p docs
mkdir -p scripts
mkdir -p assets/screenshots

echo "✅ Directories created"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Build
dist/
build/
*.log

# Storage data (don't commit personal data)
storage-server/data/*.json
storage-server/data/backups/*.json

# Expo
.expo/
web-build/
EOF

echo "✅ .gitignore created"

# Create LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo "✅ LICENSE created"

# Create README.md
cat > README.md << 'EOF'
# 🏠 Family Dashboard

> A beautiful, full-featured family management system for tracking tasks, earning points, and redeeming rewards.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Raspberry%20Pi-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-20.x-brightgreen)

**Perfect for families who want to gamify chores and keep everyone organized!** 🎯

---

## ✨ Features

### 🎯 **Task Management**
- ✅ Create recurring tasks by day of the week
- ✅ Assign tasks to family members
- ✅ Set point values for completed tasks
- ✅ Check off tasks to earn points instantly
- ✅ Smart notifications at scheduled times

### 🏆 **Points & Rewards System**
- ⭐ Track points for each family member
- 🎁 Create custom rewards with point costs
- 💰 Redeem rewards when earned enough points
- 📊 Visual point tracking

### 📅 **Calendar Integration**
- 📆 Sync with Google Calendar
- 🔄 Auto-refresh every hour
- 🎨 Color-coded events
- 📱 View upcoming family events

### 🌤️ **Weather & Time**
- 🌡️ Live weather updates for your location
- ⏰ Beautiful clock display
- 🔄 Auto-updates every 30 minutes
- 📍 Location-based forecasts

### 💾 **Local Data Storage**
- 🔒 All data stored on your Raspberry Pi
- 🚫 No cloud services required
- 🏠 100% private and secure
- 💾 Automatic backups

---

## 🚀 Quick Start

### One-Command Installation (Raspberry Pi)

```bash
curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
```

**That's it!** ☕ Installation takes ~15-20 minutes.

### Manual Installation

```bash
# Clone repository
git clone https://github.com/sms5138/familyDashboardApp.git
cd familyDashboardApp

# Run installer
chmod +x raspberry-pi/install.sh
./raspberry-pi/install.sh
```

---

## 📚 Documentation

- [📥 One-Command Install](ONE_COMMAND_INSTALL.md)
- [🥧 Raspberry Pi Setup](docs/RASPBERRY_PI_SETUP.md)
- [📱 Mobile App Setup](docs/MOBILE_APP_SETUP.md)
- [🔌 Network Configuration](docs/PI_CONNECTION_GUIDE.md)

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React / React Native
- **Storage**: Local JSON files
- **Platform**: Raspberry Pi 5

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Made with ❤️ for families everywhere**
EOF

echo "✅ README.md created"

# Create ONE_COMMAND_INSTALL.md
cat > ONE_COMMAND_INSTALL.md << 'EOF'
# 🚀 One-Command Installation Guide

The **fastest** way to get Family Dashboard running on your Raspberry Pi 5.

## ⚡ Super Quick Install

On your Raspberry Pi, open terminal and run:

```bash
curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
```

**That's it!** ☕ Grab a coffee while it installs (~15-20 minutes).

## 📋 What Happens

1. ✅ Clone the repository
2. ✅ Install Node.js 20.x
3. ✅ Install system dependencies
4. ✅ Set up storage server
5. ✅ Set up web dashboard
6. ✅ Configure auto-start
7. ✅ Create control commands

## ✅ After Installation

```bash
# Start dashboard
~/dashboard-control.sh start

# Check status
~/dashboard-control.sh status

# View logs
~/dashboard-control.sh logs
```

---

For full documentation, see [docs/](docs/)
EOF

echo "✅ ONE_COMMAND_INSTALL.md created"

# Create storage-server files
echo "📦 Creating storage server..."

cat > storage-server/server.js << 'SERVEREOF'
// server.js - Local Storage Backend for Raspberry Pi
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
}

async function initializeDataFiles() {
  const defaultData = {
    tasks: [
      { id: 1, name: 'Make Bed', points: 1, assignedTo: 'John', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
      { id: 2, name: 'Dishes', points: 2, assignedTo: 'Sarah', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], time: '7:00 PM' },
    ],
    rewards: [
      { id: 1, name: 'Ice Cream', cost: 5 },
      { id: 2, name: 'Movie Night', cost: 10 },
    ],
    userPoints: {
      John: 3,
      Sarah: 7,
      Mom: 12,
      Dad: 15
    },
    apiKeys: {
      openweather: ''
    }
  };

  for (const [key, value] of Object.entries(defaultData)) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(value, null, 2));
      console.log(`Initialized ${key}.json`);
    }
  }
}

async function readDataFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function writeDataFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    dataDir: DATA_DIR,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data', async (req, res) => {
  try {
    const tasks = await readDataFile('tasks');
    const rewards = await readDataFile('rewards');
    const userPoints = await readDataFile('userPoints');
    const apiKeys = await readDataFile('apiKeys');

    res.json({
      success: true,
      data: { tasks: tasks || [], rewards: rewards || [], userPoints: userPoints || {}, apiKeys: apiKeys || {} }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await readDataFile(type);
    
    if (data === null) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const success = await writeDataFile(type, data);
    
    if (success) {
      res.json({ success: true, message: `${type} updated successfully` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(DATA_DIR, 'backups');
    
    await fs.mkdir(backupDir, { recursive: true });

    const tasks = await readDataFile('tasks');
    const rewards = await readDataFile('rewards');
    const userPoints = await readDataFile('userPoints');

    const backup = { tasks, rewards, userPoints, timestamp };
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));

    res.json({ success: true, message: 'Backup created', filename: `backup-${timestamp}.json` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  try {
    await ensureDataDir();
    await initializeDataFiles();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('===========================================');
      console.log('🏠 Family Dashboard Storage Server');
      console.log('===========================================');
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📁 Data directory: ${DATA_DIR}`);
      console.log(`🌐 Access: http://localhost:${PORT}`);
      console.log('===========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
SERVEREOF

cat > storage-server/package.json << 'EOF'
{
  "name": "family-dashboard-server",
  "version": "1.0.0",
  "description": "Local storage server for Family Dashboard",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

cat > storage-server/.gitignore << 'EOF'
node_modules/
data/*.json
data/backups/*.json
EOF

cat > storage-server/README.md << 'EOF'
# Storage Server

Local storage backend for Family Dashboard.

## Start Server

```bash
npm install
npm start
```

Server runs on port 3001.

## API Endpoints

- GET /api/health - Health check
- GET /api/data - Get all data
- GET /api/:type - Get specific data
- POST /api/:type - Update data
- POST /api/backup - Create backup
EOF

echo "✅ Storage server created"

# Create web-app files (NOTE: This is a placeholder - you'll need the full React code)
echo "📱 Creating web app..."

cat > web-app/package.json << 'EOF'
{
  "name": "family-dashboard",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.1",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-web": "~0.19.6",
    "react-dom": "18.2.0",
    "@expo/webpack-config": "^19.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
EOF

cat > web-app/.gitignore << 'EOF'
node_modules/
.expo/
web-build/
EOF

cat > web-app/App.js << 'EOF'
import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🏠 Family Dashboard</h1>
      <p>Web app placeholder - Replace this file with the complete React code from Claude's artifacts.</p>
      <p>See artifact: "Family Dashboard (Web Prototype)"</p>
    </div>
  );
}
EOF

cat > web-app/README.md << 'EOF'
# Web Dashboard

⚠️ **IMPORTANT**: Replace App.js with the complete React code from Claude's artifacts.

See artifact: "Family Dashboard (Web Prototype)"

## Development

```bash
npm install
npm run web
```
EOF

echo "✅ Web app structure created (needs full App.js code)"

# Create Raspberry Pi scripts
echo "🥧 Creating Raspberry Pi scripts..."

cat > raspberry-pi/start-dashboard.sh << 'EOF'
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
EOF

chmod +x raspberry-pi/start-dashboard.sh

cat > raspberry-pi/dashboard-control.sh << 'EOF'
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
EOF

chmod +x raspberry-pi/dashboard-control.sh

cat > raspberry-pi/family-dashboard.service << 'EOF'
[Unit]
Description=Family Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/FamilyDashboard
ExecStart=/home/pi/start-dashboard.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

cat > raspberry-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
EOF

cat > raspberry-pi/README.md << 'EOF'
# Raspberry Pi Scripts

## Installation

Run the installer:
```bash
chmod +x install.sh
./install.sh
```

## Control Commands

After installation:
```bash
~/dashboard-control.sh start
~/dashboard-control.sh stop
~/dashboard-control.sh restart
~/dashboard-control.sh status
~/dashboard-control.sh logs
```
EOF

echo "✅ Raspberry Pi scripts created"

# Note: install.sh needs to be created separately with the full script

echo ""
echo "⚠️  IMPORTANT: Creating install.sh placeholder..."
cat > raspberry-pi/install.sh << 'EOF'
#!/bin/bash
echo "=========================================="
echo "Family Dashboard - Raspberry Pi Installer"
echo "=========================================="
echo ""
echo "⚠️  This is a placeholder script."
echo ""
echo "Replace this file with the complete install.sh from Claude's artifacts:"
echo "  Artifact: 'raspberry-pi/install.sh'"
echo ""
exit 1
EOF

chmod +x raspberry-pi/install.sh

# Create quick-install.sh placeholder
cat > scripts/quick-install.sh << 'EOF'
#!/bin/bash
echo "=========================================="
echo "Family Dashboard - Quick Installer"
echo "=========================================="
echo ""
echo "⚠️  This is a placeholder script."
echo ""
echo "Replace this file with the complete quick-install.sh from Claude's artifacts:"
echo "  Artifact: 'scripts/quick-install.sh'"
echo ""
exit 1
EOF

chmod +x scripts/quick-install.sh

echo "✅ Install scripts created (placeholders)"

# Create documentation placeholders
echo "📚 Creating documentation..."

cat > docs/RASPBERRY_PI_SETUP.md << 'EOF'
# Raspberry Pi Setup Guide

Complete installation guide for Raspberry Pi 5.

## Quick Install

```bash
curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
```

For full details, see the repository documentation.
EOF

cat > docs/MOBILE_APP_SETUP.md << 'EOF'
# Mobile App Setup

Guide for setting up iOS and Android apps.

## Configuration

1. Install app on your device
2. Open Settings ⚙️
3. Enter your Raspberry Pi's IP address
4. Test connection
5. Save settings

For full details, see the repository documentation.
EOF

cat > docs/PI_CONNECTION_GUIDE.md << 'EOF'
# Pi Connection Guide

How to connect mobile devices to your Raspberry Pi.

## Find Your Pi's IP

On Raspberry Pi:
```bash
hostname -I
```

## Configure Mobile App

Enter the IP address in the app's Settings.

For full details, see the repository documentation.
EOF

echo "✅ Documentation created"

# Create TODO file
cat > TODO.md << 'EOF'
# TODO: Complete These Files

## Critical Files Needing Full Content

### 1. web-app/App.js
**Status**: ⚠️ Placeholder only
**Action**: Replace with complete React code
**Source**: Claude artifact "Family Dashboard (Web Prototype)"

### 2. raspberry-pi/install.sh
**Status**: ⚠️ Placeholder only
**Action**: Replace with complete installation script
**Source**: Claude artifact "raspberry-pi/install.sh"

### 3. scripts/quick-install.sh
**Status**: ⚠️ Placeholder only
**Action**: Replace with complete quick installer
**Source**: Claude artifact "scripts/quick-install.sh"

## How to Complete

1. Open each file listed above
2. Find the corresponding artifact in Claude's responses
3. Copy the complete content
4. Save the file

## Verification

After completing:
```bash
# Check syntax
bash -n raspberry-pi/install.sh
bash -n scripts/quick-install.sh

# Check React app
cd web-app
npm install
npm run web
```

## Then Push to GitHub

```bash
git add .
git commit -m "Complete all project files"
git push origin main
```
EOF

echo "✅ TODO.md created"

# Create completion summary
echo ""
echo "=========================================="
echo "✅ Project Structure Created!"
echo "=========================================="
echo ""
echo "📁 Created files:"
echo "  ✅ README.md"
echo "  ✅ LICENSE"
echo "  ✅ .gitignore"
echo "  ✅ ONE_COMMAND_INSTALL.md"
echo "  ✅ storage-server/ (complete)"
echo "  ✅ web-app/ (structure only)"
echo "  ✅ raspberry-pi/ (scripts)"
echo "  ✅ docs/ (guides)"
echo "  ✅ scripts/ (installers)"
echo ""
echo "⚠️  IMPORTANT: 3 files need complete content:"
echo ""
echo "  1. web-app/App.js"
echo "     → Replace with Claude artifact: 'Family Dashboard (Web Prototype)'"
echo ""
echo "  2. raspberry-pi/install.sh"
echo "     → Replace with Claude artifact: 'raspberry-pi/install.sh'"
echo ""
echo "  3. scripts/quick-install.sh"
echo "     → Replace with Claude artifact: 'scripts/quick-install.sh'"
echo ""
echo "📝 See TODO.md for detailed instructions"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit the 3 files above with complete content from Claude"
echo "  2. git add ."
echo "  3. git commit -m 'Initial commit: Complete Family Dashboard'"
echo "  4. git push origin main"
echo ""
echo "✨ Happy coding!"
echo ""