require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const mime = require('./utils/mime');
const prisma = require('./db');
const testStore = require('./utils/testStore');

const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const attemptRoutes = require('./routes/attempts');
const mockRoutes = require('./routes/mocks');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Ensure tmp upload dir exists
const tmpDir = path.join(UPLOAD_DIR, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Customized on the test runner and content route
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin, server-to-server, or any client in public deployment
    if (!origin) return callback(null, true);
    if (!process.env.CLIENT_URL || process.env.CLIENT_URL === '*') {
      return callback(null, true);
    }
    const allowed = process.env.CLIENT_URL.split(',').map(s => s.trim());
    if (allowed.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/mocks', mockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve uploaded test content (sandboxed static content)
const handleTestContent = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const requestedPath = req.params[0] || '';

    let version = testStore.findVersionById(versionId);
    if (!version) {
      try {
        version = await prisma.testVersion.findUnique({
          where: { id: versionId },
        });
      } catch (_) {}
    }

    if (!version) {
      return res.status(404).json({ error: 'Test version not found' });
    }

    const storageDir = path.resolve(UPLOAD_DIR, version.storagePath);
    const targetRelPath = requestedPath ? requestedPath : version.entryFile;
    const filePath = path.resolve(storageDir, targetRelPath);

    // Prevent path traversal outside storageDir
    if (!filePath.startsWith(storageDir)) {
      return res.status(403).json({ error: 'Access denied: Directory traversal prevented' });
    }

    if (!fs.existsSync(filePath)) {
      // If requested file not found, try entry file if targetRelPath is directory or blank
      if (fs.existsSync(path.join(storageDir, version.entryFile))) {
        return res.sendFile(path.join(storageDir, version.entryFile));
      }
      return res.status(404).json({ error: 'File not found' });
    }

    // Security headers for isolated execution
    res.setHeader('Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; " +
      "media-src 'self' data: blob: *; " +
      "img-src 'self' data: blob: *; " +
      "style-src 'self' 'unsafe-inline' *; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " +
      "font-src 'self' data: *; " +
      "frame-ancestors *;"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const contentType = mime.getType(filePath);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

app.get('/test-content/:versionId', handleTestContent);
app.get('/test-content/:versionId/*', handleTestContent);

// Serve client build if available
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/test-content')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`IELTS Mock Platform API running on port ${PORT}`);
  testStore.syncAllToPrisma().catch(() => {});
});

module.exports = { app, server };
