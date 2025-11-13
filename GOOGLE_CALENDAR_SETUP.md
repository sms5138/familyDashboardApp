# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar API access for your Family Dashboard.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top, then click "New Project"
3. Name your project (e.g., "Family Dashboard")
4. Click "Create"

## Step 2: Enable the Google Calendar API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and then click "Enable"

## Step 3: Create API Credentials

### Create an API Key:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key that appears
4. (Optional) Click "Restrict Key" to add restrictions for security

### Create an OAuth 2.0 Client ID:
1. First, configure the OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: "Family Dashboard"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip the "Scopes" section (click "Save and Continue")
   - Add test users (add your Google account email)
   - Click "Save and Continue"

2. Create OAuth Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:19006` (for local development)
     - Add your production domain if you have one
   - Click "Create"
   - Copy the Client ID that appears

## Step 4: Configure Your Application

1. In the `web-app` directory, create a `.env` file:
   ```bash
   cd web-app
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```
   REACT_APP_GOOGLE_API_KEY=your_api_key_here
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   REACT_APP_CALENDAR_IDS=primary
   ```

3. To use multiple calendars, update `REACT_APP_CALENDAR_IDS`:
   ```
   REACT_APP_CALENDAR_IDS=primary,family@group.calendar.google.com,work@group.calendar.google.com
   ```

## Step 5: Find Your Calendar IDs

To add calendars other than your primary calendar:

1. Open [Google Calendar](https://calendar.google.com)
2. Click the three dots next to the calendar you want to add
3. Select "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the "Calendar ID"
6. Add it to your `.env` file (comma-separated)

## Step 6: Test the Integration

1. Start your app:
   ```bash
   npm start
   ```

2. Open the app in your browser
3. Click "Sign In with Google" in the Calendar section
4. Authorize the app to access your calendar
5. Your calendar events should now appear!

## Troubleshooting

### "Failed to initialize Google Calendar"
- Check that your API Key and Client ID are correct in the `.env` file
- Make sure you've enabled the Google Calendar API in your Google Cloud project

### "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Check that `http://localhost:19006` is added to authorized JavaScript origins

### Calendar events not showing
- Verify your Calendar ID is correct
- Make sure you have events in the next 7 days
- Check the browser console for error messages

### Permission denied errors
- Make sure you've added your email as a test user in the OAuth consent screen
- Try signing out and signing in again

## Security Notes

- Never commit your `.env` file to git (it's already in `.gitignore`)
- The `.env.example` file is safe to commit as it contains no real credentials
- For production, use environment variables provided by your hosting platform
