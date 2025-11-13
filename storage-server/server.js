// server.js - Local Storage Backend for Raspberry Pi
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;
// Use web-app/data directory for users.json, storage-server/data for other data
const DATA_DIR = path.join(__dirname, 'data');
const WEB_APP_DATA_DIR = path.join(__dirname, '..', 'web-app', 'data');
const PHOTOS_DIR = path.join(WEB_APP_DATA_DIR, 'photos');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/photos', express.static(PHOTOS_DIR));

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }

  // Also ensure web-app/data directory exists
  try {
    await fs.access(WEB_APP_DATA_DIR);
  } catch {
    await fs.mkdir(WEB_APP_DATA_DIR, { recursive: true });
    console.log('Created web-app data directory:', WEB_APP_DATA_DIR);
  }

  // Ensure photos directory exists
  try {
    await fs.access(PHOTOS_DIR);
  } catch {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });
    console.log('Created photos directory:', PHOTOS_DIR);
  }
}

async function initializeDataFiles() {
  const defaultData = {
    tasks: [
      { id: 1, name: 'Make Bed', points: 1, assignedTo: 'Nolan', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], period: 'Morning' },
    ],
    rewards: [
      { id: 1, name: 'Ice Cream', cost: 5 },
      { id: 2, name: 'Movie Night', cost: 10 },
    ],
    users: {
      users: [
        { name: 'Nolan', type: 'Child', points: 3 },
        { name: 'Mom', type: 'Parent', points: 0 },
        { name: 'Dad', type: 'Parent', points: 0 }
      ]
    },
    userPoints: {
      Nolan: 3,
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
    // Use web-app/data for users, tasks, and rewards; storage-server/data for everything else
    const dataDir = (filename === 'users' || filename === 'tasks' || filename === 'rewards') ? WEB_APP_DATA_DIR : DATA_DIR;
    const filePath = path.join(dataDir, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function writeDataFile(filename, data) {
  try {
    // Use web-app/data for users, tasks, and rewards; storage-server/data for everything else
    const dataDir = (filename === 'users' || filename === 'tasks' || filename === 'rewards') ? WEB_APP_DATA_DIR : DATA_DIR;
    const filePath = path.join(dataDir, `${filename}.json`);

    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${filename} to ${filePath}`);
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

// Photos endpoints - MUST be before the generic /api/:type route
// Get list of photos
app.get('/api/photos', async (req, res) => {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `/photos/${file}`);
    res.json({ success: true, data: photos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload photo
app.post('/api/photos', async (req, res) => {
  try {
    const { filename, data } = req.body;

    if (!filename || !data) {
      return res.status(400).json({ success: false, error: 'Filename and data required' });
    }

    // Extract base64 data
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const filePath = path.join(PHOTOS_DIR, filename);
    await fs.writeFile(filePath, buffer);

    res.json({ success: true, url: `/photos/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete photo
app.delete('/api/photos/:filename', async (req, res) => {
  try {
    const { filename} = req.params;
    const filePath = path.join(PHOTOS_DIR, filename);

    await fs.unlink(filePath);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Theme endpoints - MUST be before the generic /api/:type route
// Get theme settings
app.get('/api/theme', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'theme.json');
    const data = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // Return default theme if file doesn't exist
    res.json({
      success: true,
      data: {
        themeMode: 'auto',
        accentColor: 'blue',
        colorCycleEnabled: false,
        colorCycleIntervalMinutes: 60,
        lastColorChangeDate: null,
        lastColorChangeHour: null
      }
    });
  }
});

// Update theme settings
app.post('/api/theme', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'theme.json');
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Screensaver endpoints - MUST be before the generic /api/:type route
// Get screensaver settings
app.get('/api/screensaver', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'screensaver.json');
    const data = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // Return default screensaver settings if file doesn't exist
    res.json({
      success: true,
      data: {
        enabled: false,
        delayMinutes: 5,
        imageIntervalMinutes: 1
      }
    });
  }
});

// Update screensaver settings
app.post('/api/screensaver', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'screensaver.json');
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Details endpoints - MUST be before the generic /api/:type route
// Get API configuration
app.get('/api/api-details', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'apiDetails.json');
    const data = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // Return default API details if file doesn't exist
    res.json({
      success: true,
      data: {
        googleCalendar: {
          apiKey: '',
          clientId: '',
          calendarIds: 'primary'
        },
        weather: {
          location: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          temperatureUnit: 'fahrenheit'
        }
      }
    });
  }
});

// Update API configuration
app.post('/api/api-details', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'apiDetails.json');
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Experience/UX settings endpoints - MUST be before the generic /api/:type route
// Get experience settings
app.get('/api/experience', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'experience.json');
    const data = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    // Return default experience settings if file doesn't exist
    res.json({
      success: true,
      data: {
        modules: {
          calendar: { displayLimit: 5 },
          tasks: { displayLimit: 5 },
          rewards: { displayLimit: 4 },
          users: { displayLimit: 5 }
        }
      }
    });
  }
});

// Update experience settings
app.post('/api/experience', async (req, res) => {
  try {
    const filePath = path.join(WEB_APP_DATA_DIR, 'experience.json');
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, data: req.body });
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
