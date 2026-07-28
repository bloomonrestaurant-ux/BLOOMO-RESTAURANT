import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for credentials and specific origin routing
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Bloomon Family Restaurant API Server is running smoothly.',
    timestamp: new Date().toISOString(),
  });
});

// Register unified API routing version 1
app.use('/api/v1', apiRouter);

// Undefined Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: `Resource not found on endpoint: ${req.originalUrl}`,
  });
});

// Global Centralized Error Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` Bloomon Family Restaurant API Server successfully initiated.`);
  console.log(` Port Number: ${PORT}`);
  console.log(` Environment Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Active Endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`========================================`);
});

// Handle graceful shutdowns
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
