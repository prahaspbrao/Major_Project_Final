import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Repository } from '../models/Repository.js';
import { ragService } from '../services/ragService.js';
import { redisService } from '../services/redisService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createSession = async (req, res, next) => {
  try {
    const { repoId, title, mode } = req.body;

    if (!repoId) {
      return sendError(res, 'Repository ID is required.', 400);
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return sendError(res, 'Repository not found.', 404);
    }

    const session = await ChatSession.create({
      repoId,
      userId: req.user._id,
      title: title || `${mode || 'General'} Session - ${new Date().toLocaleTimeString()}`,
      mode: mode || 'general',
    });

    return sendSuccess(res, 'Chat session created.', { session }, 201);
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const { repoId } = req.query;
    const filter = { userId: req.user._id };
    if (repoId) filter.repoId = repoId;

    const sessions = await ChatSession.find(filter).sort({ updatedAt: -1 });
    return sendSuccess(res, 'Chat sessions retrieved.', { sessions });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return sendError(res, 'Chat session not found.', 404);
    }

    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    return sendSuccess(res, 'Messages retrieved.', { session, messages });
  } catch (error) {
    next(error);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { query, mode } = req.body;

    if (!query || !query.trim()) {
      return sendError(res, 'Query text is required.', 400);
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return sendError(res, 'Chat session not found.', 404);
    }

    const activeMode = mode || session.mode || 'general';

    // Save User Message
    const userMsg = await ChatMessage.create({
      sessionId,
      sender: 'user',
      mode: activeMode,
      content: query.trim(),
    });

    // Check Redis Cache First
    const cachedResult = await redisService.getCachedRAGResponse(session.repoId.toString(), query, activeMode);

    let ragResult;
    let isCached = false;

    if (cachedResult) {
      ragResult = cachedResult;
      isCached = true;
    } else {
      // Execute RAG Retrieval Pipeline
      ragResult = await ragService.processQuery(session.repoId, query, activeMode);
      // Cache Result in Redis (TTL: 1 hour)
      await redisService.cacheRAGResponse(session.repoId.toString(), query, activeMode, ragResult, 3600);
    }

    // Save Assistant Message
    const assistantMsg = await ChatMessage.create({
      sessionId,
      sender: 'assistant',
      mode: activeMode,
      content: ragResult.answer,
      citations: ragResult.citations,
      cached: isCached,
      responseTimeMs: ragResult.responseTimeMs,
    });

    // Update Session Timestamp
    session.updatedAt = new Date();
    await session.save();

    return sendSuccess(res, 'Message processed.', {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      cached: isCached,
      responseTimeMs: ragResult.responseTimeMs,
    });
  } catch (error) {
    next(error);
  }
};
