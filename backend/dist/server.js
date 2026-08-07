"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS with support for credentials and specific origin routing
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
// Parsing middlewares
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check Endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Bloomon Family Restaurant API Server is running smoothly.',
        timestamp: new Date().toISOString(),
    });
});
// Register unified API routing version 1
app.use('/api/v1', api_1.default);
// Undefined Route Handler
app.use((req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Resource not found on endpoint: ${req.originalUrl}`,
    });
});
// Global Centralized Error Middleware
app.use((err, _req, res, _next) => {
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
