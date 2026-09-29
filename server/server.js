import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { User } from './src/models/User.js';
import { seedDatabase } from './src/seed.js';

const startServer = async () => {
  await connectDB();

  // Auto-seed initial demo data ONLY if database is completely empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Auto-Seed] Empty database detected. Auto-populating initial demo data...');
      await seedDatabase(false);
    } else {
      console.log(`[Database] Found ${userCount} existing user(s). Preserving existing MongoDB database state.`);
    }
  } catch (err) {
    console.warn('[Auto-Seed Check Failed]', err.message);
  }

  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 AI Developer Assistant Server Running`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
};

startServer().catch((err) => {
  console.error('Failed to launch server:', err);
});

