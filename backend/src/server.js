import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db.js';
import { initWebSocketServer } from './services/websocketService.js';
import { initScheduler } from './services/scheduler.js';

import rfidRoutes from './routes/rfid.js';
import attendanceRoutes from './routes/attendance.js';
import penaltiesRoutes from './routes/penalties.js';
import studentsRoutes from './routes/students.js';
import systemRoutes from './routes/system.js';
import statsRoutes from './routes/stats.js';
import authRoutes from './routes/auth.js';
import academicYearsRoutes from './routes/academicYears.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Static file storage for student photos
const uploadsDir = path.resolve(__dirname, '../uploads');
const photosDir = path.resolve(uploadsDir, 'photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize Database & WebSocket & Cron Scheduler
await initDb();
initWebSocketServer(server);
initScheduler();

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/penalties', penaltiesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/academic-years', academicYearsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend production build if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`[Frontend] Serving production bundle from ${frontendDist}`);
}

const PORT = process.env.PORT || 5000;
server.timeout = 15 * 60 * 1000; // 15 minutes timeout for large ZIP archives
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`[Server] RFID Hostel System API listening on http://localhost:${PORT}`);
  console.log(`[WebSocket] Live update server attached.`);
});
