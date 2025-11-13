# Starting the Family Dashboard

## Quick Start

Simply run this command from anywhere in your terminal:

```bash
dashboard
```

This will:
1. Start the storage server on port 3001
2. Start the React web app on port 19006
3. Display both URLs for easy access
4. Save logs to `logs/` directory for debugging

To stop everything, press `Ctrl+C` in the terminal.

## Helpful Aliases

Three convenient aliases are available:

```bash
dashboard        # Start both servers
dashboard-logs   # Watch logs in real-time
dashboard-test   # Test the API endpoints
```

## URLs

- **Storage Server API**: http://localhost:3001
- **Web App**: http://localhost:19006

## Important Notes

- **User data** is saved to `web-app/data/users.json` automatically when you add/edit/delete users
- **Other data** (tasks, rewards, points) is saved to `storage-server/data/`
- **Logs** are saved to `logs/` for debugging if errors occur

## Manual Start (if needed)

If you prefer to start services manually:

### Start Storage Server
```bash
cd storage-server
npm install  # First time only
npm start
```

### Start Web App (in a new terminal)
```bash
cd web-app
npm install  # First time only
npm run web
```

## First Time Setup

If this is your first time running the app:

1. Make sure you have Node.js installed
2. Run the installation for both projects:
   ```bash
   cd storage-server && npm install
   cd ../web-app && npm install
   ```
3. Then use the `dashboard` command

## Testing the API

To test if the storage server is working:

```bash
./test-api.sh
```

This will check:
- Health endpoint
- Users endpoint

## Viewing Logs

If you see errors:

```bash
# View storage server logs
tail -f logs/storage-server.log

# View web app logs
tail -f logs/web-app.log
```

## Troubleshooting

**Port already in use?**
- Storage server uses port 3001
- Web app uses port 19006
- Kill any processes using these ports:
  ```bash
  lsof -ti:3001 | xargs kill
  lsof -ti:19006 | xargs kill
  ```

**Alias not working?**
- Reload your terminal: `source ~/.zshrc`
- Or restart your terminal application

**Users not saving?**
- Check `logs/storage-server.log` for errors
- Verify `web-app/data/` directory exists
- Make sure storage server is running before using the web app

**Can't see errors?**
- All errors are logged to `logs/` directory
- Check both log files for detailed error messages
