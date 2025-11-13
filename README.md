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
