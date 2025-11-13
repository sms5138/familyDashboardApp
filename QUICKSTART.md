# 🚀 Quick Start Guide

Get Family Dashboard running in minutes!

## 📦 Method 1: Automated Installation (Recommended)

### For Raspberry Pi or Linux:

```bash
# Download and run installer
curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
```

### For Manual Installation:

```bash
# Clone the repository
git clone https://github.com/sms5138/familyDashboardApp.git
cd familyDashboardApp

# Run the installer
./install.sh
```

The installer will:
- ✅ Check for Node.js (install if needed)
- ✅ Install all dependencies
- ✅ Set up configuration files
- ✅ Make scripts executable

## ▶️ Starting the Dashboard

### Option 1: Simple Start (Foreground)

```bash
./start-dashboard.sh
```

Press `Ctrl+C` to stop.

### Option 2: Control Script (Background)

```bash
# Start
./dashboard-control.sh start

# Check status
./dashboard-control.sh status

# View logs
./dashboard-control.sh logs

# Stop
./dashboard-control.sh stop

# Restart
./dashboard-control.sh restart
```

## 🌐 Accessing the Dashboard

After starting:

- **Local:** http://localhost:8081
- **Network:** http://YOUR_IP:8081

Find your IP:
```bash
hostname -I
```

## ⚙️ Initial Configuration

### 1. Basic Setup (No API keys needed)

The dashboard works immediately with:
- Task management
- Points tracking
- Rewards system
- Local data storage

### 2. Optional: Add Weather

1. Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Click ⚙️ Settings in the dashboard
3. Enter API key and your location

### 3. Optional: Add Google Calendar

1. Follow [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md)
2. Click ⚙️ Settings in the dashboard
3. Enter Google API credentials
4. Click "Sign In with Google"

## 🎨 Customizing Your Dashboard

### Theme & Colors

1. Click ⚙️ Settings
2. Choose from 6 color themes
3. Toggle Light/Dark mode

### Adding Family Members

1. Click ⚙️ Settings
2. Scroll to Users section
3. Click + to add members
4. Set name, type (Child/Parent), avatar

### Creating Tasks

1. Click + in Tasks section
2. Fill in:
   - Task name
   - Assigned user
   - Point value
   - Time period (Morning/Afternoon/Evening)
   - Days of week
3. Save

### Creating Rewards

1. Click + in Rewards section
2. Fill in:
   - Reward name
   - Point cost
   - Assign to specific users or all
3. Save

## 📱 Daily Use

### For Kids:

1. Check off completed tasks
2. Earn points automatically
3. Redeem points for rewards

### For Parents:

1. Monitor task completion
2. Add new tasks/rewards
3. Track point balances
4. View calendar and weather

## 🔧 Common Commands

```bash
# Start dashboard
./dashboard-control.sh start

# Stop dashboard
./dashboard-control.sh stop

# Check status
./dashboard-control.sh status

# View all logs
./dashboard-control.sh logs

# View specific logs
./dashboard-control.sh logs storage
./dashboard-control.sh logs web

# Restart after changes
./dashboard-control.sh restart
```

## 🐛 Troubleshooting

### Dashboard won't start?

```bash
# Check if ports are busy
lsof -i :3001
lsof -i :8081

# Kill any existing processes
pkill -f "node.*storage-server"
pkill -f "expo"

# Try starting again
./dashboard-control.sh start
```

### Can't connect from other devices?

1. Check firewall settings
2. Verify IP address: `hostname -I`
3. Ensure both devices on same network
4. Try: `http://YOUR_IP:8081`

### Data not saving?

1. Check storage server is running:
   ```bash
   ./dashboard-control.sh status
   ```
2. View logs:
   ```bash
   ./dashboard-control.sh logs storage
   ```
3. Check file permissions:
   ```bash
   ls -la storage-server/data/
   ```

## 📚 Next Steps

- [Full Documentation](README.md)
- [Google Calendar Setup](GOOGLE_CALENDAR_SETUP.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Configuration Details](START.md)

## 💡 Tips

1. **Backup your data:** The dashboard auto-backs up daily to `storage-server/backups/`
2. **Network access:** Add port 8081 to your firewall if accessing from other devices
3. **Raspberry Pi:** Set dashboard to auto-start on boot (see docs)
4. **Mobile friendly:** Works great on tablets and phones!

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `./install.sh` | Install dependencies |
| `./start-dashboard.sh` | Start (foreground) |
| `./dashboard-control.sh start` | Start (background) |
| `./dashboard-control.sh stop` | Stop services |
| `./dashboard-control.sh status` | Check status |
| `./dashboard-control.sh logs` | View logs |

---

**Ready to get started?** Run `./install.sh` now! 🚀
