import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError, sendSuccess } from './utils/apiResponse.js';

const app = express();

// Security Middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  return sendSuccess(res, 'AI Developer Assistant Backend Service is healthy.', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/repos', repoRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/rag', ragRoutes);

// 404 Handler
app.use((req, res) => {
  return sendError(res, `Resource not found: ${req.originalUrl}`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
