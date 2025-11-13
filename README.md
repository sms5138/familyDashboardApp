# 🏠 Family Dashboard

> A beautiful, full-featured family management system for tracking tasks, earning points, and redeeming rewards.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Raspberry%20Pi-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-20.x-brightgreen)

**Perfect for families who want to gamify chores and keep everyone organized!** 🎯

![Family Dashboard Screenshot](docs/screenshot.png)

---

## ✨ Features

### 🎯 **Task Management**
- ✅ Create recurring tasks by day of the week
- ✅ Assign tasks to family members
- ✅ Set point values for completed tasks
- ✅ Period-based filtering (Morning, Afternoon, Evening)
- ✅ Visual task completion with animations
- ✅ Track daily progress

### 🏆 **Points & Rewards System**
- ⭐ Track points for each family member
- 🎁 Create custom rewards with point costs
- 💰 Redeem rewards when earned enough points
- 📊 Visual point tracking
- 👶 Child/Parent user types
- 🎨 Customizable user avatars

### 📅 **Calendar Integration**
- 📆 Sync with Google Calendar
- 🔄 Auto-refresh calendar events
- 🎨 Color-coded events by calendar
- 📱 View upcoming family events
- ⏰ Time and date display

### 🌤️ **Weather & Time**
- 🌡️ Live weather updates for your location
- ⏰ Beautiful clock display with moving digits
- 🔄 Auto-updates every 30 minutes
- 📍 Location-based forecasts
- 🌙 Temperature highs and lows

### 🎨 **Customization**
- 🌈 Multiple theme colors (Orange, Teal, Purple, Blue, Pink, Green)
- 🌓 Light and dark mode support
- 💾 Configurable display limits
- 🖼️ Screensaver with custom images
- ⚙️ Settings modal for easy configuration

### 💾 **Data Management**
- 🔒 All data stored locally
- 🚫 No cloud services required
- 🏠 100% private and secure
- 💾 Automatic daily backups
- 📤 Export/import functionality

---

## 🚀 Quick Start

### Prerequisites
- **Raspberry Pi** (recommended: Pi 4 or Pi 5) OR any Linux/Mac/Windows machine
- **Node.js** 20.x or higher
- **Internet connection** (for weather and calendar features)

### Option 1: Quick Install (Raspberry Pi)

The fastest way to get started on a Raspberry Pi:

```bash
curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
```

**That's it!** ☕ Installation takes ~15-20 minutes.

### Option 2: Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/sms5138/familyDashboardApp.git
cd familyDashboardApp

# 2. Install dependencies for storage server
cd storage-server
npm install
cd ..

# 3. Install dependencies for web app
cd web-app
npm install
cd ..

# 4. Start the dashboard
./start-dashboard.sh
```

### Option 3: Development Setup

```bash
# Clone and navigate
git clone https://github.com/sms5138/familyDashboardApp.git
cd familyDashboardApp

# Terminal 1: Start storage server
cd storage-server
npm install
npm start

# Terminal 2: Start web app
cd web-app
npm install
npm run web
```

---

## 📖 Configuration

### Google Calendar Setup

To enable Google Calendar integration:

1. Create a Google Cloud project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add your credentials to the app settings

See [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md) for detailed instructions.

### Weather API Setup

The dashboard uses OpenWeatherMap for weather data:

1. Set your location in the app once it's running then restart the dashboard.

### Customizing Data

All configuration files are in `web-app/data/`:

- **theme.json** - Theme colors and mode
- **experience.json** - Display limits and backup settings
- **users.json** - Family members
- **tasks.json** - Task definitions
- **rewards.json** - Reward definitions
- **apiDetails.json** - API keys and configuration

---

## 🎮 Usage

### Access the Dashboard

After starting the dashboard:

- **Local Access**: http://localhost:8081
- **Network Access**: http://[YOUR_IP]:8081

### Managing Tasks

1. Click the **+** button in the Tasks section
2. Fill in task details (name, assignee, points, period, recurrence)
3. Save the task
4. Family members can check off tasks to earn points

### Managing Rewards

1. Click the **+** button in the Rewards section
2. Set reward name and point cost
3. Assign to specific users or make available to all
4. Users can redeem when they have enough points

### Settings

Click the ⚙️ icon to access:
- Theme customization
- API key configuration
- Google Calendar setup
- Weather location
- Display preferences

### Power Options

- **Power button** (top right): Shut down the Raspberry Pi
- **Screensaver**: Activates automatically or via settings

---

## 📁 Project Structure

```
familyDashboardApp/
├── web-app/                  # React web application
│   ├── App.js               # Main application component
│   ├── data/                # Configuration and data files
│   │   ├── theme.json
│   │   ├── experience.json
│   │   ├── users.json
│   │   ├── tasks.json
│   │   ├── rewards.json
│   │   ├── apiDetails.json
│   │   └── screensaver.json
│   └── package.json
│
├── storage-server/          # Local data storage server
│   ├── server.js           # Express server
│   ├── data/               # Runtime data storage
│   └── package.json
│
├── scripts/                # Installation and utility scripts
├── docs/                   # Additional documentation
├── start-dashboard.sh      # Main startup script
└── README.md              # This file
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Native Web, TailwindCSS
- **Backend**: Node.js, Express
- **UI Components**: Lucide React icons
- **Storage**: Local JSON files
- **APIs**: Google Calendar API, OpenWeatherMap API
- **Platform**: Cross-platform (optimized for Raspberry Pi)

---

## 🔧 Troubleshooting

### Dashboard won't start

```bash
# Check if ports are in use
lsof -i :3001  # Storage server
lsof -i :8081  # Web app

# Kill processes if needed
pkill -f "node.*storage-server"
pkill -f "expo"
```

### Calendar not loading

1. Verify Google Calendar API is enabled
2. Check OAuth credentials are correct
3. Ensure you're signed in with the correct Google account
4. Check browser console for errors

### Weather not updating

1. Verify OpenWeatherMap API key is valid
2. Check internet connection
3. Ensure location coordinates are correct

### Tasks/Rewards not saving

1. Check storage server is running: `http://localhost:3001/users`
2. Verify file permissions in `storage-server/data/`
3. Check server logs for errors

---

## 📚 Additional Documentation

- [📥 One-Command Install Guide](ONE_COMMAND_INSTALL.md)
- [🔐 Google Calendar Setup](GOOGLE_CALENDAR_SETUP.md)
- [🚀 Getting Started](START.md)
- [🐛 Bug Fixes History](FIXES.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for families who want to make chores fun
- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [React](https://reactjs.org/) and [Expo](https://expo.dev/)

---

## 📞 Support

Having issues? Check out:
- [Troubleshooting Guide](#-troubleshooting)
- [Documentation](docs/)
- [Issues](https://github.com/sms5138/familyDashboardApp/issues)

---

**Made with ❤️ for families everywhere**
