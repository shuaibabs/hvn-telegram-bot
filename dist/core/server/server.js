"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const env_1 = require("../../config/env");
const broadcastService_1 = require("../../features/broadcast/broadcastService");
const NotifySchema = zod_1.z.object({
    groupName: zod_1.z.string().optional(),
    groupId: zod_1.z.string().optional(),
    message: zod_1.z.string().min(1, 'Message is required'),
    source: zod_1.z.enum(['UI', 'BOT']).default('UI'),
});
/**
 * Limit incoming requests to 100 per 15 minutes per IP to prevent DDoS.
 */
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
/**
 * Middleware for authentication between UI and Bot using X-API-Key.
 */
const apiKeyGuard = (req, res, next) => {
    const incomingKey = req.headers['x-api-key'];
    if (incomingKey !== env_1.env.NOTIFY_API_KEY) {
        console.warn(`[SECURITY] Unauthorized API access attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};
function startServer() {
    const app = (0, express_1.default)();
    // Apply Security Middlewares
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json({ limit: '10kb' })); // Limit body size to prevent memory-filling attacks
    app.use(limiter);
    // Health check (Publicly accessible but rate-limited)
    app.get('/health', (req, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }));
    // Secure API Notification Endpoint
    app.post('/api/notify', apiKeyGuard, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const parseResult = NotifySchema.safeParse(req.body);
            if (!parseResult.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: parseResult.error.format()
                });
            }
            const { groupName, groupId, message, source } = parseResult.data;
            const result = yield (0, broadcastService_1.broadcast)(groupName || groupId || '', message, source);
            if (result.success) {
                return res.status(200).json({ success: true });
            }
            else {
                return res.status(500).json({ error: result.error });
            }
        }
        catch (error) {
            next(error); // Forward to global error handler
        }
    }));
    // Global Error Handler (Prevents stack trace leaks)
    app.use((err, req, res, next) => {
        console.error(`[CRITICAL ERROR]:`, err.message);
        res.status(500).json({ error: 'Internal Server Security Incident tracked.' });
    });
    const PORT = env_1.env.PORT;
    app.listen(PORT, () => {
        console.log(`🚀 [SHIELDED] Notification server active on Port ${PORT}`);
    });
    return app;
}
