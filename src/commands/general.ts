import TelegramBot from 'node-telegram-bot-api';
import { db } from '../config/firebase';
import { GROUPS } from '../config/env';
import { isAdmin } from '../services/authService';
import { authorized } from '../middleware/auth';

export function registerGeneralCommands(bot: TelegramBot) {
    bot.onText(/\/start/, authorized(bot, async (msg, match, username) => {
        // Ignore /start in Inventory Group
        if (msg.chat.id.toString() === GROUPS.INVENTORY) return;

        const telegramUsername = msg.from?.username!;
        const userRole = (await isAdmin(telegramUsername)) ? 'Admin' : 'Employee';

        // Escape username for markdown just in case it has underscores
        const safeUsername = username.replace(/_/g, '\\_');

        const welcomeMsg = `👋 Welcome back, *${safeUsername}*!\n\n` +
            `👤 Role: \`${userRole}\`\n\n` +
            `I am your VIP Numbers Management Bot. Use /help to see all available commands.`;

        bot.sendMessage(msg.chat.id, welcomeMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    [{ text: '📊 Inventory' }, { text: '📦 Manage Inventory' }],
                    [{ text: '💰 Sales' }, { text: '⏰ Reminders' }],
                    [{ text: '📅 Pre-Bookings' }, { text: '👥 Manage Users' }],
                    [{ text: '❓ Help' }]
                ],
                resize_keyboard: true
            }
        });
    }));

    bot.onText(/\/help|❓ Help/i, (msg) => {
        console.log(`Help command triggered by ${msg.from?.username}`);
        const helpMsg = `📖 *VIP Numbers Bot - Help Menu*\n\n` +
            `💡 *Inventory Management (restricted to Inventory group):*\n` +
            `• Send multi-line templates (e.g., NEWADD, PRICEUPDATE).\n` +
            `• Tap 📦 *Manage Inventory* button for guided menu.\n` +
            `• Advanced Search: Use SEARCH/MAXCONTAIN with filters.\n\n` +
            `💡 *Guided Flows:*\n` +
            `• 👥 *Manage Users* - Add/Delete/List users.\n\n` +
            `💡 *Legacy/Short Commands:*\n` +
            `• /sell, /prebook, /remind - as usual.\n\n` +
            `💡 *Setup:*\n` +
            `• /getid - Get chat ID for config. \n\n` +
            `_Note: Multi-line inventory commands are primary for professional use._`;
        bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/getid/, (msg) => {
        bot.sendMessage(msg.chat.id, `📍 **Chat Info**\n\n**Name:** ${msg.chat.title || 'Private Chat'}\n**ID:** \`${msg.chat.id}\`\n**Type:** ${msg.chat.type}\n\nCopy this ID to your .env file.`);
    });
}

