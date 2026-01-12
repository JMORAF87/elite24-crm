import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

import { loginLimiter } from '../middleware/rateLimit.js';

// Login
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ error: 'JWT secret not configured' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
