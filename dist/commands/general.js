"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGeneralCommands = registerGeneralCommands;
const env_1 = require("../config/env");
function registerGeneralCommands(router) {
    // Health check command - keep as global for now or restrict if needed
    router.register(/\/health/, (msg) => {
        const chatId = msg.chat.id;
        router.bot.sendMessage(chatId, '✅ Bot is up and running!');
    });
    // Fallback handler for unrecognized commands
    router.setFallbackHandler((msg) => {
        const chatId = msg.chat.id.toString();
        let callbackData = 'manage_users_start'; // Default
        if (chatId === env_1.env.TG_GROUP_ACTIVITY) {
            callbackData = 'manage_activities_start';
        }
        else if (chatId === env_1.env.TG_GROUP_USERS) {
            callbackData = 'manage_users_start';
        }
        router.bot.sendMessage(msg.chat.id, "😕 *Unrecognized Command*\n\nIt's not the correct command. Please use /start to see available options.", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: '🚀 Get Started', callback_data: callbackData }]]
            }
        });
    });
}
