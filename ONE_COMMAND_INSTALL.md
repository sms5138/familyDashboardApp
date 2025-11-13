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
