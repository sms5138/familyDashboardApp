# Storage Server

Local storage backend for Family Dashboard.

## Start Server

```bash
npm install
npm start
```

Server runs on port 3001.

## API Endpoints

- GET /api/health - Health check
- GET /api/data - Get all data
- GET /api/:type - Get specific data
- POST /api/:type - Update data
- POST /api/backup - Create backup
