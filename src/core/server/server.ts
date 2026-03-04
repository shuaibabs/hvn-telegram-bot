import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../../config/env';
import { broadcast } from '../../features/broadcast/broadcastService';
import TelegramBot from 'node-telegram-bot-api';

const NotifySchema = z.object({
    groupName: z.string().optional(),
    groupId: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    source: z.enum(['UI', 'BOT']).default('UI'),
});

/**
 * Limit incoming requests to 100 per 15 minutes per IP to prevent DDoS.
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

/**
 * Middleware for authentication between UI and Bot using X-API-Key.
 */
const apiKeyGuard = (req: Request, res: Response, next: NextFunction) => {
    const incomingKey = req.headers['x-api-key'];
    if (incomingKey !== env.NOTIFY_API_KEY) {
        console.warn(`[SECURITY] Unauthorized API access attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

export function startServer(bot: TelegramBot) {
    const app = express();

    // Apply Security Middlewares
    app.use(helmet());
    app.use(express.json({ limit: '10kb' })); // Limit body size to prevent memory-filling attacks
    app.use(limiter);

    // Health check (Publicly accessible but rate-limited)
    app.get('/health', (req, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }));

    // Secure API Notification Endpoint
    app.post('/api/notify', apiKeyGuard, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parseResult = NotifySchema.safeParse(req.body);

            if (!parseResult.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: parseResult.error.format()
                });
            }

            const { groupName, groupId, message, source } = parseResult.data;
            const result = await broadcast(groupName || groupId || '', message, source);

            if (result.success) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(500).json({ error: result.error });
            }
        } catch (error) {
            next(error); // Forward to global error handler
        }
    });

    // Global Error Handler (Prevents stack trace leaks)
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(`[CRITICAL ERROR]:`, err.message);
        res.status(500).json({ error: 'Internal Server Security Incident tracked.' });
    });

    const PORT = env.PORT;
    app.listen(PORT, () => {
        console.log(`🚀 [SHIELDED] Notification server active on Port ${PORT}`);
    });

    return app;
}
