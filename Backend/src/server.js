import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 SevaSetu Backend Server running on http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
