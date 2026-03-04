import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers } from '../userService';

export async function listUsersCommand(bot: TelegramBot, msg: TelegramBot.Message) {
    try {
        const users = await getAllUsers();
        let message = "*All Users:*\n";
        if(users.length === 0) {
            message = "No users found.";
        } else {
            users.forEach(user => {
                message += `\n*${user.displayName}* (@${user.telegramUsername}) - ${user.role}\nEmail: ${user.email}\n`;
            });
        }
        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error: any) {
        bot.sendMessage(msg.chat.id, `Error fetching users: ${error.message}`);
    }
}
