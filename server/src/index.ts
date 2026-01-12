import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './client.js';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB Health Check
app.get('/api/health/db', async (req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, message: 'Database connected' });
    } catch (error) {
        console.error('DB Health Check Failed:', error);
        res.status(500).json({ ok: false, error: 'Database connection failed' });
    }
});

// Routes
import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import activitiesRoutes from './routes/activities.js';
import tasksRoutes from './routes/tasks.js';
import quotesRoutes from './routes/quotes.js';
import dashboardRoutes from './routes/dashboard.js';
import emailRoutes from './routes/email.js';
import aiRoutes from './routes/ai.js';
import publicRoutes from './routes/public.js';
import importRoutes from './routes/import.js';
import settingsRoutes from './routes/settings.js';

import { authenticateToken } from './middleware/auth.js';

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/import', importRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
