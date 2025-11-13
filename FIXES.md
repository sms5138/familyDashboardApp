# Fixes Applied - User Management & Debugging

## Issue 1: Errors Not Visible in Terminal
**Problem**: When running `dashboard`, errors were hidden in background processes.

**Solution**: Updated [start-dashboard.sh](start-dashboard.sh)
- Added logging with `tee` to capture all output
- Logs saved to `logs/storage-server.log` and `logs/web-app.log`
- Terminal still shows output in real-time
- Added `logs/` to `.gitignore`

## Issue 3: Missing Dependencies
**Problem**: `Cannot find module 'express'` error when starting storage server.

**Solution**: Updated [start-dashboard.sh](start-dashboard.sh)
- Added automatic dependency checking and installation
- Script now checks for `node_modules` in both projects
- Automatically runs `npm install` on first run if needed
- No manual setup required anymore!

## Issue 2: Users Not Saving to Correct Location
**Problem**: Users were being saved to `storage-server/data/users.json` instead of `web-app/data/users.json`

**Solution**: Updated [storage-server/server.js](storage-server/server.js)
- Added `WEB_APP_DATA_DIR` constant pointing to `../web-app/data`
- Modified `readDataFile()` to check if filename is 'users' and use appropriate directory
- Modified `writeDataFile()` to check if filename is 'users' and use appropriate directory
- Added console log when saving files to show where they're being saved
- Updated `ensureDataDir()` to create both data directories

## Key Changes Summary

### Files Modified:
1. **start-dashboard.sh** - Added logging capability
2. **storage-server/server.js** - Fixed file paths for users.json
3. **.gitignore** - Added logs directory
4. **START.md** - Added troubleshooting and logging sections

### Files Created:
1. **test-api.sh** - Quick API testing script
2. **FIXES.md** - This document

## How to Use

### Start the Dashboard:
```bash
dashboard
```

### View Logs (if errors occur):
```bash
tail -f logs/storage-server.log
tail -f logs/web-app.log
```

### Test the API:
```bash
./test-api.sh
```

## Data Storage Locations

- **Users**: `web-app/data/users.json` (managed by storage server)
- **Tasks**: `web-app/data/tasks.json` (managed by storage server)
- **Rewards**: `web-app/data/rewards.json` (managed by storage server)
- **User Points**: `storage-server/data/userPoints.json`
- **API Keys**: `storage-server/data/apiKeys.json`

## Issue 4: User Points Not Persisting
**Problem**: When users earn/spend points (completing tasks, redeeming rewards), the points were only updated in memory, not saved to `web-app/data/users.json`.

**Solution**: Updated [web-app/App.js](web-app/App.js)
- Added `updateUserPoints()` helper function
- Updates both `userPoints` state AND `users` array
- Automatically saves to API/file after every point change
- Modified `toggleTask()` to save points when tasks are completed/uncompleted
- Modified `redeemReward()` to save points when rewards are redeemed

## Issue 5: Tasks Not Persisting
**Problem**: Tasks added or updated in the UI were only stored in memory and lost on page refresh.

**Solution**: Updated [web-app/App.js](web-app/App.js) and [storage-server/server.js](storage-server/server.js)
- Modified storage server to route tasks to `web-app/data/tasks.json` (same as users)
- Added `loadTasks()` function to fetch tasks from API on app mount
- Added `saveTasks()` helper function to persist tasks to API
- Modified `addTask()` to save tasks after adding new task
- Modified `toggleTask()` to save tasks after completion status changes
- All task changes now automatically save to `web-app/data/tasks.json`

## Issue 6: Rewards Not Persisting
**Problem**: Rewards added in the UI were only stored in memory and lost on page refresh.

**Solution**: Updated [web-app/App.js](web-app/App.js) and [storage-server/server.js](storage-server/server.js)
- Modified storage server to route rewards to `web-app/data/rewards.json` (same pattern as users and tasks)
- Added `loadRewards()` function to fetch rewards from API on app mount
- Added `saveRewards()` helper function to persist rewards to API
- Modified `addReward()` to save rewards after adding new reward
- All reward changes now automatically save to `web-app/data/rewards.json`

## What Should Happen Now

1. Run `dashboard` to start both servers
2. Open http://localhost:19006 in your browser
3. **User Management**: Click the Users icon (👥) in the Points section
   - Add/Edit/Delete users - saves immediately to `web-app/data/users.json`
4. **Task Management**:
   - Add new tasks - saves immediately to `web-app/data/tasks.json`
   - Click on tasks to complete them - saves immediately to `web-app/data/tasks.json`
   - User points update immediately and save to `web-app/data/users.json`
5. **Reward Management**:
   - Add new rewards - saves immediately to `web-app/data/rewards.json`
   - Redeem rewards - points deduct and save to `web-app/data/users.json`
6. Check `logs/storage-server.log` to see "✅ Saved users/tasks/rewards to [path]" confirmations
7. Any errors will be visible in the terminal AND saved to log files
