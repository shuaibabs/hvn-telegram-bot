import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers } from '../userService';

/**
 * Escapes special characters for Telegram Markdown (V1)
 * Characters: _, *, [
 */
function escapeMarkdown(text: string): string {
    return text.replace(/[_*\[]/g, '\\$&');
}

export async function listUsersCommand(bot: TelegramBot, msg: TelegramBot.Message) {
    try {
        const users = await getAllUsers();
        let message = "*All Users:*\n";

        if (users.length === 0) {
            message = "No users found.";
        } else {
            users.forEach(user => {
                const name = escapeMarkdown(user.displayName);
                const username = escapeMarkdown(user.telegramUsername || 'N/A');
                const role = escapeMarkdown(user.role);
                const email = escapeMarkdown(user.email);

                message += `\n*${name}* (@${username}) - ${role}\nEmail: ${email}\n`;
            });
        }

        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
        console.error('Error in listUsersCommand:', error);
        bot.sendMessage(msg.chat.id, `Error fetching users: ${error.message}`);
    }
}
