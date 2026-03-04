
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
    PORT: z.string().default('3000'),
    NOTIFY_API_KEY: z.string().default('hvn-default-secure-key-2024'), // Shared secret between UI and Bot

    // Telegram Group IDs
    TG_GROUP_INVENTORY: z.string().optional(),
    TG_GROUP_SALES: z.string().optional(),
    TG_GROUP_ACTIVITY: z.string().optional(),
    TG_GROUP_USERS: z.string().optional(),
    TG_GROUP_PREBOOKING: z.string().optional(),
    TG_MASTER_CHANNEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Environment Variable validation failed:', parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;

export const GROUPS = {
    INVENTORY: env.TG_GROUP_INVENTORY || '',
    SALES: env.TG_GROUP_SALES || '',
    ACTIVITY: env.TG_GROUP_ACTIVITY || '',
    USERS: env.TG_GROUP_USERS || '',
    PREBOOKING: env.TG_GROUP_PREBOOKING || '',
    MASTER_CHANNEL: env.TG_MASTER_CHANNEL || '',
};

export type GroupName = keyof typeof GROUPS;

