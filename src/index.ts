
import TelegramBot from 'node-telegram-bot-api';
import { registerGeneralCommands } from './commands/general';
import { registerInventoryCommands } from './commands/inventory';
import { registerSalesCommands } from './commands/sales';
import { registerUserCommands } from './commands/users';
import { registerReminderCommands } from './commands/reminders';
import { registerPreBookingCommands } from './commands/prebooking';
import { startServer } from './server';
import { env } from './config/env';
import { getUserByTelegramUsername } from './services/authService';
import { handleUsersCallbackQuery, handleUsersMessageStep } from './flows/manageUsersFlow';
import { handleInventoryCallbackQuery, handleInventoryMessageStep } from './flows/inventoryFlow';
import { hasSession } from './services/sessionManager';

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

// Register all modular commands
registerGeneralCommands(bot);
registerInventoryCommands(bot);
registerSalesCommands(bot);
registerUserCommands(bot);
registerReminderCommands(bot);
registerPreBookingCommands(bot);

// ─── Global Callback Query Router ──────────────────────────────────────────
bot.on('callback_query', async (query) => {
    const tgUsername = query.from.username;
    if (!tgUsername) return;

    const user = await getUserByTelegramUsername(tgUsername);
    if (!user) return;

    const adminName = user.displayName || tgUsername;

    const data = query.data || '';
    if (data.startsWith('users:')) {
        await handleUsersCallbackQuery(bot, query, adminName);
    } else if (data.startsWith('inventory:')) {
        await handleInventoryCallbackQuery(bot, query);
    }
});

// ─── Global Message Router for Guided Flows ────────────────────────────────
// Intercept messages if a user is currently in a guided flow session.
bot.on('message', async (msg) => {
    if (!msg.from?.id || !msg.text || msg.text.startsWith('/')) return;

    if (hasSession(msg.from.id)) {
        const tgUsername = msg.from.username;
        if (!tgUsername) return;

        const user = await getUserByTelegramUsername(tgUsername);
        if (!user) return;

        const adminName = user.displayName || tgUsername;

        // Route to the appropriate flow
        let handled = await handleUsersMessageStep(bot, msg, adminName);
        if (!handled) {
            handled = await handleInventoryMessageStep(bot, msg, adminName);
        }
        if (handled) return;
    }
});

console.log('🤖 Telegram bot initialized and listening...');

// Start the Express server for UI notifications
startServer();

