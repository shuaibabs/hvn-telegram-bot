import TelegramBot from 'node-telegram-bot-api';
import { startServer } from '../core/server/server';
import { env } from '../config/env';
import { registerCommandHandlers } from '../features/inventory/commands';
import { registerFlowHandlers } from '../features/inventory/flows';
import '../features/misc/new-feature';

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

// Register all modular commands and flows
registerCommandHandlers(bot);
registerFlowHandlers(bot);

console.log('🤖 Telegram bot initialized and listening...');

// Start the Express server for UI notifications if configured
if (env.ENABLE_SERVER) {
    startServer();
}
