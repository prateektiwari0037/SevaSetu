import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let memoryServer = null;

export async function connectDB(uri = process.env.MONGODB_URI) {
  const mongoUri = uri || 'mongodb://127.0.0.1:27017/sevasetu';

  try {
    // Attempt standard connection
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected successfully to ${mongoUri}`);
    return mongoose.connection;
  } catch (error) {
    console.warn(`⚠️ Could not connect to primary MongoDB at ${mongoUri}: ${error.message}`);

    // If in development or test, try in-memory fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('🔄 Attempting development in-memory MongoDB fallback...');
        // Point download cache to local workspace directory so it works within sandbox permissions
        const cacheDir = path.resolve(__dirname, '../../.mongo-cache');
        process.env.MONGOMS_DOWNLOAD_DIR = cacheDir;

        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'sevasetu',
          },
        });
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri, { autoIndex: true });
        console.log(`✅ MongoDB connected to in-memory fallback instance at ${memUri}`);
        return mongoose.connection;
      } catch (memError) {
        console.error('❌ Failed to initialize in-memory MongoDB fallback:', memError.message);
      }
    }

    throw error;
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

export default mongoose;
