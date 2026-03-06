import { env } from '../config/env';
import { CommandRouter } from '../core/router/commandRouter';
import TelegramBot from 'node-telegram-bot-api';

export function registerGeneralCommands(router: CommandRouter) {
    // Health check command - keep as global for now or restrict if needed
    router.register(/\/health/, (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;
        router.bot.sendMessage(chatId, '✅ Bot is up and running!');
    });

    // Fallback handler for unrecognized commands
    router.setFallbackHandler((msg: TelegramBot.Message) => {
        const chatId = msg.chat.id.toString();

        let callbackData = 'manage_users_start'; // Default
        if (chatId === env.TG_GROUP_ACTIVITY) {
            callbackData = 'manage_activities_start';
        } else if (chatId === env.TG_GROUP_USERS) {
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
