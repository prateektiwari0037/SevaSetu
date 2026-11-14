import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { successResponse, errorResponse } from './utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(res, 'SevaSetu API is healthy and operational', {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// REST API V1 routes
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
