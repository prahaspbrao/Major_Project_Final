import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';

const startServer = async () => {
  await connectDB();

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
