import fs from 'fs';
import path from 'path';
import { Repository } from '../models/Repository.js';
import { CodeChunk } from '../models/CodeChunk.js';
import { ChatSession } from '../models/ChatSession.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { chunkerService } from '../services/chunkerService.js';
import { embeddingService } from '../services/embeddingService.js';
import { redisService } from '../services/redisService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createRepo = async (req, res, next) => {
  try {
    const { name, description, localPath, language } = req.body;

    if (!name) {
      return sendError(res, 'Repository name is required.', 400);
    }

    const repo = await Repository.create({
      name,
      description: description || '',
      localPath: localPath || '',
      language: language || 'JavaScript/TypeScript',
      owner: req.user._id,
      status: 'pending',
    });

    return sendSuccess(res, 'Repository created successfully.', { repo }, 201);
  } catch (error) {
    next(error);
  }
};

export const indexRepo = async (req, res, next) => {
  try {
    const { repoId } = req.params;
    const { files } = req.body; // Optional direct virtual files array: [{ filePath, content }]

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return sendError(res, 'Repository not found.', 404);
    }

    repo.status = 'indexing';
    await repo.save();

    // Invalidate old cache
    await redisService.invalidateRepoCache(repoId);

    let fileList = [];

    if (files && Array.isArray(files) && files.length > 0) {
      fileList = files;
    } else if (repo.localPath && fs.existsSync(repo.localPath)) {
      fileList = scanDirectory(repo.localPath);
    } else {
      // Fallback: Default sample code files if no local path provided
      fileList = getSampleCodeFiles(repo.name);
    }

    // Clear existing chunks for clean re-indexing
    await CodeChunk.deleteMany({ repoId });

    let totalChunks = 0;
    let totalLines = 0;
    const langMap = new Map();

    for (const file of fileList) {
      const ext = path.extname(file.filePath).substring(1) || 'txt';
      langMap.set(ext, (langMap.get(ext) || 0) + 1);

      const fileChunks = chunkerService.chunkFile(file.filePath, file.content);

      for (const chunkData of fileChunks) {
        const vector = await embeddingService.generateEmbedding(chunkData.content);
        await CodeChunk.create({
          repoId,
          filePath: chunkData.filePath,
          fileName: chunkData.fileName,
          startLine: chunkData.startLine,
          endLine: chunkData.endLine,
          chunkType: chunkData.chunkType,
          symbolName: chunkData.symbolName,
          language: ext,
          content: chunkData.content,
          vector,
          keywords: chunkData.keywords,
        });
        totalChunks++;
      }

      totalLines += file.content.split('\n').length;
    }

    repo.status = 'indexed';
    repo.indexedAt = new Date();
    repo.stats = {
      totalFiles: fileList.length,
      totalChunks,
      totalLines,
      languageBreakdown: Object.fromEntries(langMap),
    };
    await repo.save();

    // Cache updated stats in Redis
    await redisService.cacheRepoStats(repoId, repo.stats);

    return sendSuccess(res, 'Repository indexed successfully.', {
      repo,
      stats: repo.stats,
    });
  } catch (error) {
    if (req.params.repoId) {
      await Repository.findByIdAndUpdate(req.params.repoId, { status: 'failed' });
    }
    next(error);
  }
};

export const getRepos = async (req, res, next) => {
  try {
    const repos = await Repository.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    return sendSuccess(res, 'Repositories retrieved.', { repos });
  } catch (error) {
    next(error);
  }
};

export const getRepoById = async (req, res, next) => {
  try {
    const { repoId } = req.params;
    const repo = await Repository.findById(repoId);
    if (!repo) {
      return sendError(res, 'Repository not found.', 404);
    }

    // Check Redis for cached stats
    let cachedStats = await redisService.getRepoStats(repoId);
    if (!cachedStats) {
      cachedStats = repo.stats;
      await redisService.cacheRepoStats(repoId, cachedStats);
    }

    const chunkCount = await CodeChunk.countDocuments({ repoId });

    return sendSuccess(res, 'Repository details retrieved.', {
      repo: {
        ...repo.toObject(),
        stats: cachedStats,
        chunkCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRepoFileContent = async (req, res, next) => {
  try {
    const { repoId } = req.params;
    const { filePath } = req.query;

    if (!filePath) {
      return sendError(res, 'File path query parameter required.', 400);
    }

    const chunk = await CodeChunk.findOne({ repoId, filePath });
    if (!chunk) {
      return sendError(res, 'File context not found in repository index.', 404);
    }

    // Gather all chunks for this file to reconstruct full content
    const allFileChunks = await CodeChunk.find({ repoId, filePath }).sort({ startLine: 1 });
    const fullContent = allFileChunks.map((c) => c.content).join('\n\n');

    return sendSuccess(res, 'File content retrieved.', {
      filePath,
      fileName: chunk.fileName,
      language: chunk.language,
      content: fullContent,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRepo = async (req, res, next) => {
  try {
    const { repoId } = req.params;
    const repo = await Repository.findById(repoId);
    if (!repo) {
      return sendError(res, 'Repository not found.', 404);
    }

    await CodeChunk.deleteMany({ repoId });
    const sessions = await ChatSession.find({ repoId });
    const sessionIds = sessions.map((s) => s._id);
    await ChatMessage.deleteMany({ sessionId: { $in: sessionIds } });
    await ChatSession.deleteMany({ repoId });
    await Repository.findByIdAndDelete(repoId);

    // Invalidate Redis cache
    await redisService.invalidateRepoCache(repoId);

    return sendSuccess(res, 'Repository deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// Helper function to scan local directory
function scanDirectory(dirPath, fileList = [], baseDir = dirPath) {
  const files = fs.readdirSync(dirPath);
  const ignoredExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip', '.tar', '.gz', '.lock', '.exe', '.dll'];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();

    if (file.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage', '.git', '__pycache__'].includes(file) || ignoredExts.includes(ext) || file === 'package-lock.json') {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList, baseDir);
    } else if (stat.size < 500000) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        fileList.push({ filePath: relPath, content });
      } catch (err) {}
    }
  }
  return fileList;
}

// Built-in sample code files generator for default instant demo
function getSampleCodeFiles(repoName) {
  return [
    {
      filePath: 'src/config/db.js',
      content: `import mongoose from 'mongoose';

export const connectDatabase = async (uri) => {
  try {
    const connection = await mongoose.connect(uri);
    console.log(\`Database connected to \${connection.connection.host}\`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};`,
    },
    {
      filePath: 'src/middleware/auth.js',
      content: `import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
    req.user = user;
    next();
  });
};`,
    },
    {
      filePath: 'src/controllers/userController.js',
      content: `import { User } from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  const { name, bio } = req.body;
  // Bug Alert: Potential missing input validation for empty name string
  const updatedUser = await User.findByIdAndUpdate(req.user.id, { name, bio }, { new: true });
  res.json({ success: true, user: updatedUser });
};`,
    },
    {
      filePath: 'src/services/paymentService.js',
      content: `export class PaymentProcessor {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async processTransaction(amount, currency = 'USD') {
    if (!amount || amount <= 0) {
      throw new Error('Invalid transaction amount');
    }
    // Simulate gateway API request
    const transactionId = 'TXN_' + Math.random().toString(36).substring(2, 9);
    return { status: 'SUCCESS', transactionId, amount, currency };
  }
}`,
    },
  ];
}
