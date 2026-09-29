import { ragService } from '../services/ragService.js';
import { checkRedisHealth } from '../config/redis.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const searchRAGDirect = async (req, res, next) => {
  try {
    const { repoId, query, mode, topK } = req.body;

    if (!repoId || !query) {
      return sendError(res, 'repoId and query are required.', 400);
    }

    const result = await ragService.processQuery(repoId, query, mode || 'general', topK || 5);
    return sendSuccess(res, 'RAG search completed.', result);
  } catch (error) {
    next(error);
  }
};

export const getSystemStatus = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const isRedisConnected = checkRedisHealth();

    return sendSuccess(res, 'System status retrieved.', {
      status: 'operational',
      database: {
        type: 'MongoDB',
        connected: isMongoConnected,
        host: mongoose.connection.host || 'localhost',
      },
      cache: {
        type: 'Redis',
        connected: isRedisConnected,
        status: isRedisConnected ? 'Active (Caching Enabled)' : 'Fallback Mode (Memory/Direct DB)',
      },
      ragEngine: {
        type: process.env.GEMINI_API_KEY ? 'Google Gemini API + Hybrid Vector Engine' : 'High-Precision Local RAG Vector Engine',
        offlineVivaReady: true,
      },
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
