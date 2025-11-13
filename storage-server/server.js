// server.js - Local Storage Backend for Raspberry Pi
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
}

async function initializeDataFiles() {
  const defaultData = {
    tasks: [
      { id: 1, name: 'Make Bed', points: 1, assignedTo: 'Nolan', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
    ],
    rewards: [
      { id: 1, name: 'Ice Cream', cost: 5 },
      { id: 2, name: 'Movie Night', cost: 10 },
    ],
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
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

async function writeDataFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
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
