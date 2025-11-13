// server.js - Local Storage Backend for Raspberry Pi
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
const PORT = 3001;
// Use web-app/data directory for users.json, storage-server/data for other data
const DATA_DIR = path.join(__dirname, 'data');
const WEB_APP_DATA_DIR = path.join(__dirname, '..', 'web-app', 'data');
const PHOTOS_DIR = path.join(WEB_APP_DATA_DIR, 'photos');
const BACKUPS_DIR = path.join(WEB_APP_DATA_DIR, 'backups');

// Backup scheduler state
let backupScheduler = null;

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

// Backup utility functions
async function createBackupZip(maxBackups = 2) {
  try {
    // Ensure backups directory exists
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `backup-${timestamp}.zip`;
    const backupPath = path.join(BACKUPS_DIR, backupFileName);

    // Create a write stream for the zip file
    const output = fsSync.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise(async (resolve, reject) => {
      output.on('close', async () => {
        console.log(`✅ Backup created: ${backupFileName} (${archive.pointer()} bytes)`);

        // Clean up old backups, keeping only the most recent maxBackups
        try {
          const files = await fs.readdir(BACKUPS_DIR);
          const backupFiles = files
            .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
            .sort()
            .reverse();

          if (backupFiles.length > maxBackups) {
            const filesToDelete = backupFiles.slice(maxBackups);
            for (const file of filesToDelete) {
              await fs.unlink(path.join(BACKUPS_DIR, file));
              console.log(`🗑️  Deleted old backup: ${file}`);
            }
          }
        } catch (err) {
          console.error('Error cleaning up old backups:', err);
        }

        resolve({ success: true, filename: backupFileName, path: backupPath });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add files from web-app/data directory, excluding the backups folder to avoid infinite loops
      const addFilesRecursive = async (dir, baseDir, archivePath) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const archiveFilePath = path.join(archivePath, entry.name);

          // Skip the backups directory to prevent including itself
          if (entry.name === 'backups') {
            continue;
          }

          if (entry.isDirectory()) {
            await addFilesRecursive(fullPath, baseDir, archiveFilePath);
          } else {
            archive.file(fullPath, { name: archiveFilePath });
          }
        }
      };

      try {
        await addFilesRecursive(WEB_APP_DATA_DIR, WEB_APP_DATA_DIR, 'data');
        archive.finalize();
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

async function getBackupList() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    const files = await fs.readdir(BACKUPS_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.zip'))
      .sort()
      .reverse();

    const backupList = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = await fs.stat(filePath);
        const timestamp = file.replace('backup-', '').replace('.zip', '');
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime.toISOString(),
          timestamp
        };
      })
    );

    return backupList;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
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

// IMPORTANT: Backup endpoints MUST come before the generic /api/:type handlers
// Create a new backup immediately
app.post('/api/backup', async (req, res) => {
  try {
    const maxBackups = req.body.maxBackups || 2;
    const result = await createBackupZip(maxBackups);
    res.json({ success: true, message: 'Backup created', ...result });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of existing backups
app.get('/api/backups', async (req, res) => {
  try {
    const backups = await getBackupList();
    res.json({ success: true, backups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download a specific backup
app.get('/api/backups/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BACKUPS_DIR, filename);

    // Security: ensure the file is actually in the backups directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBackupsDir = path.resolve(BACKUPS_DIR);

    if (!resolvedPath.startsWith(resolvedBackupsDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a specific backup
app.delete('/api/backups/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BACKUPS_DIR, filename);

    // Security: ensure the file is actually in the backups directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBackupsDir = path.resolve(BACKUPS_DIR);

    if (!resolvedPath.startsWith(resolvedBackupsDir)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await fs.unlink(filePath);
    res.json({ success: true, message: `Backup deleted: ${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic handlers MUST come after specific paths
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

// Initialize daily backup scheduler
async function initializeBackupScheduler() {
  try {
    // Load experience settings to get backup configuration
    const experienceFilePath = path.join(WEB_APP_DATA_DIR, 'experience.json');
    let backupSettings = {
      enabled: true,
      backupTime: '00:00',
      maxBackups: 2
    };

    try {
      const experienceData = JSON.parse(await fs.readFile(experienceFilePath, 'utf8'));
      if (experienceData.backup) {
        backupSettings = { ...backupSettings, ...experienceData.backup };
      }
    } catch (err) {
      console.log('Using default backup settings');
    }

    if (!backupSettings.enabled) {
      console.log('⏸️  Backup scheduler is disabled');
      return;
    }

    // Schedule daily backup
    const scheduleNextBackup = () => {
      const [hour, minute] = backupSettings.backupTime.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // If the scheduled time has already passed today, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const msUntilBackup = scheduledTime - now;

      console.log(`⏰ Next backup scheduled at ${scheduledTime.toLocaleString()}`);

      backupScheduler = setTimeout(async () => {
        try {
          console.log('⏳ Starting scheduled backup...');
          await createBackupZip(backupSettings.maxBackups);
          console.log('✅ Scheduled backup completed');
        } catch (error) {
          console.error('❌ Scheduled backup failed:', error);
        }

        // Schedule the next backup
        scheduleNextBackup();
      }, msUntilBackup);
    };

    scheduleNextBackup();
  } catch (error) {
    console.error('Failed to initialize backup scheduler:', error);
  }
}

async function startServer() {
  try {
    await ensureDataDir();
    await initializeDataFiles();
    await initializeBackupScheduler();

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
