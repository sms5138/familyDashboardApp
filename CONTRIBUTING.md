# Contributing to Family Dashboard

Thank you for your interest in contributing to Family Dashboard! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

This project aims to be welcoming and inclusive. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/familyDashboardApp.git
   cd familyDashboardApp
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/sms5138/familyDashboardApp.git
   ```

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Git

### Installation

```bash
# Install storage server dependencies
cd storage-server
npm install
cd ..

# Install web app dependencies
cd web-app
npm install
cd ..
```

### Running in Development Mode

**Terminal 1 - Storage Server:**
```bash
cd storage-server
npm start
# Server runs on http://localhost:3001
```

**Terminal 2 - Web App:**
```bash
cd web-app
npm run web
# App runs on http://localhost:8081
```

## Making Changes

### Creating a Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### Making Commits

Write clear, concise commit messages:

```bash
git commit -m "Add task completion animation"
```

**Good commit messages:**
- `Add Google Calendar sync functionality`
- `Fix scrollbar appearing with few items`
- `Update README with installation instructions`
- `Refactor task filtering logic`

**Avoid:**
- `Fixed stuff`
- `Updates`
- `WIP`

## Submitting Changes

### Before Submitting

1. **Test your changes** thoroughly
2. **Update documentation** if needed
3. **Keep commits atomic** - one logical change per commit
4. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the [original repository](https://github.com/sms5138/familyDashboardApp)
3. Click "New Pull Request"
4. Select your branch
5. Fill in the PR template:

   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   How to test these changes

   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

## Coding Standards

### JavaScript/React

- Use functional components with hooks
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and single-purpose

**Example:**
```javascript
// Good
const formatEventTime = (startTime, endTime) => {
  // Implementation
};

// Avoid
const fmt = (s, e) => {
  // Implementation
};
```

### File Organization

```
web-app/
├── App.js              # Main app component
├── components/         # Reusable components (if adding)
├── data/              # Configuration files
│   ├── theme.json
│   ├── tasks.json
│   └── ...
└── assets/            # Images, fonts, etc.
```

### Styling

- Use TailwindCSS utility classes
- Follow existing theme patterns
- Support both light and dark modes
- Ensure responsive design

### Data Management

- Store user data in `storage-server/data/`
- Keep data files in JSON format
- Validate data before saving
- Handle errors gracefully

## Testing

### Manual Testing

1. **Test all features:**
   - Task creation and completion
   - Reward redemption
   - Calendar sync
   - Weather updates
   - Theme switching
   - Settings changes

2. **Test on different screens:**
   - Desktop browser
   - Tablet
   - Mobile
   - Raspberry Pi touchscreen

3. **Test data persistence:**
   - Create tasks/rewards
   - Restart server
   - Verify data persists

### Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Data persists after restart
- [ ] Works in light and dark mode
- [ ] Responsive on different screen sizes
- [ ] No broken links or images

## Common Development Tasks

### Adding a New Feature

1. Plan the feature
2. Create a branch
3. Implement the feature
4. Test thoroughly
5. Update documentation
6. Submit PR

### Fixing a Bug

1. Reproduce the bug
2. Create a branch
3. Fix the issue
4. Verify the fix
5. Submit PR

### Updating Documentation

1. Identify what needs updating
2. Make changes to relevant .md files
3. Ensure links work
4. Submit PR

## Getting Help

- **Issues**: Check [existing issues](https://github.com/sms5138/familyDashboardApp/issues)
- **Discussions**: Start a [discussion](https://github.com/sms5138/familyDashboardApp/discussions)
- **Questions**: Open an issue with the "question" label

## Project Structure Reference

### Key Files

- `web-app/App.js` - Main React component
- `storage-server/server.js` - Express server
- `web-app/data/` - Configuration files
- `start-dashboard.sh` - Startup script
- `dashboard-control.sh` - Control script

### Data Files

All in `web-app/data/`:
- `theme.json` - UI theme settings
- `experience.json` - App configuration
- `users.json` - Family members
- `tasks.json` - Task definitions
- `rewards.json` - Reward definitions
- `apiDetails.json` - API credentials

## Recognition

Contributors will be acknowledged in the README.md file.

Thank you for contributing to Family Dashboard! 🏠✨
