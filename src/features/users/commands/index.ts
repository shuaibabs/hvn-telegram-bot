import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../config/firebase';

export function registerUserCommands(bot: TelegramBot) {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Welcome! Use /help to see available commands.');
    });

    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Available commands:\n/start - Welcome message\n/help - Show this message');
    });
}
