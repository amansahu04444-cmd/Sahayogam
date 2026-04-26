import dotenv from 'dotenv';
// Load .env FIRST — before any module that reads process.env
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { limiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import config from './config/index.js';
import { swaggerDocument } from './config/swagger.js';
import { apiInfo } from './utils/helpers.js';
import { db } from './config/firebase.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import taskRequestRoutes from './routes/taskRequestRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// (dotenv already loaded at top of file)

// Warn if Firebase is not connected
if (!db) {
  console.error("❌ CRITICAL: Firebase not connected. Database operations will fail.");
}

// Initialize Express app
const app = express();

// ── CORS Configuration ─────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",  // Vite sometimes uses this port
  "http://localhost:5175",
  "https://sahayogam.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
};

// Apply CORS to ALL routes — MUST come before any route/middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight explicitly with SAME corsOptions
// This MUST come before routes and auth middleware
app.options('*', cors(corsOptions));

// Disable caching — prevents 304 Not Modified responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging (Morgan)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.send('Server running');
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    ...apiInfo,
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/task-requests', taskRequestRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/chats', chatRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// ── Server Startup ──────────────────────────────────────────────
// Backend runs on Render — always start the HTTP server.
const DESIRED_PORT = parseInt(process.env.PORT, 10) || 5000;

function startServer(port, retries = 0) {
  const MAX_RETRIES = 10;

  const server = app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    if (port !== DESIRED_PORT) {
      console.log(`ℹ️  (Port ${DESIRED_PORT} was busy, using ${port} instead)`);
    }
    console.log("App initialized successfully");
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      if (retries < MAX_RETRIES) {
        const nextPort = port + 1;
        console.warn(`⚠️  Port ${port} is busy, trying ${nextPort}...`);
        startServer(nextPort, retries + 1);
      } else {
        console.error(`❌ Could not find a free port after ${MAX_RETRIES} attempts.`);
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🔄 Shutting down server gracefully...');
    server.close(() => {
      console.log('✅ Server closed. Port released.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer(DESIRED_PORT);

export default app;
