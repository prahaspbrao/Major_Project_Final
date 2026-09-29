import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Repository } from './models/Repository.js';
import { CodeChunk } from './models/CodeChunk.js';
import { chunkerService } from './services/chunkerService.js';
import { embeddingService } from './services/embeddingService.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({});
    await Repository.deleteMany({});
    await CodeChunk.deleteMany({});

    // 1. Create Demo User
    const user = await User.create({
      name: 'Prahas Rao',
      email: 'prahas@nie.ac.in',
      password: 'password123',
      role: 'developer',
    });
    console.log(`[Seed] Created User: ${user.email}`);

    // 2. Create Sample Repository
    const repo = await Repository.create({
      name: 'ECommerce-Microservices-Core',
      description: 'Production MERN stack codebase with authentication, order processing, and payment gateway.',
      owner: user._id,
      language: 'JavaScript / Node.js',
      status: 'indexing',
    });

    const sampleFiles = [
      {
        filePath: 'src/config/database.js',
        content: `import mongoose from 'mongoose';

/**
 * Initializes MongoDB connection pool with retry strategy.
 */
export const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Database Connection Error: \${error.message}\`);
    process.exit(1);
  }
};`,
      },
      {
        filePath: 'src/middleware/auth.js',
        content: `import jwt from 'jsonwebtoken';

/**
 * Validates JWT authorization header token for protected API routes.
 */
export const verifyAuthToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authorization token' });
  }
};`,
      },
      {
        filePath: 'src/controllers/orderController.js',
        content: `import { Order } from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;
    
    // Bug Risk: Potential unhandled null check on items array length
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      shippingAddress,
      totalAmount,
      status: 'pending',
    });

    return res.status(201).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};`,
      },
      {
        filePath: 'src/services/paymentService.js',
        content: `export class StripePaymentService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async processPayment(orderId, amount, currency = 'USD') {
    if (!amount || amount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }

    // Refactoring Opportunity: Extract HTTP client to dedicated API wrapper
    const charge = {
      id: 'ch_' + Math.random().toString(36).substring(2, 10),
      orderId,
      amount,
      currency,
      status: 'succeeded',
    };

    return charge;
  }
}`,
      },
    ];

    let totalChunks = 0;
    let totalLines = 0;

    for (const file of sampleFiles) {
      const chunks = chunkerService.chunkFile(file.filePath, file.content);
      for (const c of chunks) {
        const vector = await embeddingService.generateEmbedding(c.content);
        await CodeChunk.create({
          repoId: repo._id,
          filePath: c.filePath,
          fileName: c.fileName,
          startLine: c.startLine,
          endLine: c.endLine,
          chunkType: c.chunkType,
          symbolName: c.symbolName,
          language: 'javascript',
          content: c.content,
          vector,
          keywords: c.keywords,
        });
        totalChunks++;
      }
      totalLines += file.content.split('\n').length;
    }

    repo.status = 'indexed';
    repo.stats = {
      totalFiles: sampleFiles.length,
      totalChunks,
      totalLines,
      languageBreakdown: { js: sampleFiles.length },
    };
    await repo.save();

    console.log(`[Seed] Successfully seeded repository '${repo.name}' with ${totalChunks} vector chunks!`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedDatabase();
