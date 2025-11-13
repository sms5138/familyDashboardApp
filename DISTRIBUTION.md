# 📦 Distribution Guide

This document explains how to package and distribute the Family Dashboard project.

## 🎯 For End Users

### Download Options

1. **GitHub Release** (Recommended)
   - Download the latest `family-dashboard-vX.X.X.tar.gz` from [Releases](https://github.com/sms5138/familyDashboardApp/releases)
   - Extract and run `./install.sh`

2. **Clone from GitHub**
   ```bash
   git clone https://github.com/sms5138/familyDashboardApp.git
   cd familyDashboardApp
   ./install.sh
   ```

3. **Quick Install Script** (Raspberry Pi/Linux)
   ```bash
   curl -sSL https://raw.githubusercontent.com/sms5138/familyDashboardApp/main/scripts/quick-install.sh | bash
   ```

## 🔨 For Maintainers

### Creating a Release Package

```bash
# 1. Ensure version is updated in package.json
# 2. Run the release script
./create-release.sh

# 3. This creates:
#    - family-dashboard-vX.X.X/ (directory)
#    - family-dashboard-vX.X.X.tar.gz (archive)
```

### What's Included in the Package

The release package contains:

**Documentation:**
- README.md
- QUICKSTART.md
- CONTRIBUTING.md
- GOOGLE_CALENDAR_SETUP.md
- START.md
- INSTALL_INSTRUCTIONS.txt

**Scripts:**
- install.sh - Universal installer
- start-dashboard.sh - Foreground startup
- dashboard-control.sh - Background management
- create-release.sh - Package builder

**Application Code:**
- storage-server/ (without node_modules)
- web-app/ (without node_modules)
- Configuration examples

**Configuration:**
- .env.example
- web-app/data/*.example.json

### Publishing a Release

1. **Update Version**
   ```bash
   # Edit package.json and update version number
   vim package.json
   ```

2. **Create Release Package**
   ```bash
   ./create-release.sh
   ```

3. **Test the Package**
   ```bash
   # Extract to test directory
   tar -xzf family-dashboard-vX.X.X.tar.gz -C /tmp/
   cd /tmp/family-dashboard-vX.X.X

   # Test installation
   ./install.sh

   # Test startup
   ./dashboard-control.sh start
   ./dashboard-control.sh status
   ./dashboard-control.sh stop
   ```

4. **Create GitHub Release**
   - Go to GitHub repository
   - Click "Releases" → "Draft a new release"
   - Tag: `vX.X.X`
   - Title: `Family Dashboard vX.X.X`
   - Description: Release notes
   - Attach: `family-dashboard-vX.X.X.tar.gz`
   - Publish release

## 📝 Release Checklist

Before creating a release:

- [ ] All tests pass
- [ ] Documentation is up to date
- [ ] Version number updated in package.json
- [ ] CHANGELOG updated (if exists)
- [ ] No sensitive data in code (API keys, etc.)
- [ ] Example configuration files present
- [ ] Scripts are executable
- [ ] README includes new features
- [ ] Installation tested on clean system

## 🔒 Security Considerations

### Files to NEVER Include

- ❌ `web-app/data/apiDetails.json` (use .example instead)
- ❌ `.env` files with real credentials
- ❌ `storage-server/data/` with user data
- ❌ `node_modules/` directories
- ❌ Personal API keys
- ❌ User data or backups

### Safe to Include

- ✅ Example configuration files (.example)
- ✅ Empty data structure templates
- ✅ Documentation
- ✅ Source code
- ✅ Scripts and utilities

## 📦 Package Structure

```
family-dashboard-vX.X.X/
├── README.md
├── QUICKSTART.md
├── CONTRIBUTING.md
├── LICENSE
├── INSTALL_INSTRUCTIONS.txt
├── .env.example
├── .gitignore
├── package.json
│
├── install.sh
├── start-dashboard.sh
├── dashboard-control.sh
├── create-release.sh
│
├── storage-server/
│   ├── package.json
│   ├── server.js
│   └── data/
│       └── (empty templates)
│
├── web-app/
│   ├── package.json
│   ├── App.js
│   ├── app.json
│   └── data/
│       ├── apiDetails.example.json → apiDetails.json
│       ├── theme.json
│       ├── experience.json
│       ├── users.json
│       ├── tasks.json
│       └── rewards.json
│
├── scripts/
│   └── (installation utilities)
│
└── docs/
    └── (additional documentation)
```

## 🌍 Distribution Platforms

### GitHub Releases
- Primary distribution method
- Automated with GitHub Actions (optional)
- Provides download statistics

### npm (Future)
```bash
# Could publish as npm package
npm publish family-dashboard
```

### Docker (Future)
```bash
# Could create Docker image
docker build -t family-dashboard .
docker push family-dashboard
```

## 📊 Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

Examples:
- `1.0.0` - Initial release
- `1.1.0` - Add new feature
- `1.1.1` - Fix bug
- `2.0.0` - Breaking changes

## 🚀 Auto-Deployment (Future)

### GitHub Actions Workflow

```yaml
name: Create Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Create package
        run: ./create-release.sh
      - name: Create Release
        uses: actions/create-release@v1
        with:
          files: family-dashboard-*.tar.gz
```

## 📞 Support for Users

Users can get help through:
- GitHub Issues
- Documentation
- Community discussions

## 🎉 Success Metrics

Track these for each release:
- Downloads count
- GitHub stars
- Issue reports
- Pull requests
- Community engagement

---

**For questions about distribution, open an issue on GitHub.**
