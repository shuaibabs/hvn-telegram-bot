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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGeneralCommands = registerGeneralCommands;
const env_1 = require("../config/env");
const authService_1 = require("../services/authService");
const auth_1 = require("../middleware/auth");
function registerGeneralCommands(bot) {
    bot.onText(/\/start/, (0, auth_1.authorized)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Ignore /start in Inventory Group
        if (msg.chat.id.toString() === env_1.GROUPS.INVENTORY)
            return;
        const telegramUsername = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
        const userRole = (yield (0, authService_1.isAdmin)(telegramUsername)) ? 'Admin' : 'Employee';
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
    })));
    bot.onText(/\/help|❓ Help/i, (msg) => {
        var _a;
        console.log(`Help command triggered by ${(_a = msg.from) === null || _a === void 0 ? void 0 : _a.username}`);
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
