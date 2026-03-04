import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers, User } from '../userService';

export async function listUsers(bot: TelegramBot, chatId: number) {
    try {
        const users = await getAllUsers();

        if (users.length === 0) {
            await bot.sendMessage(chatId, "There are no users in the system.");
            return;
        }

        const userList = users.map((user: User) => {
            return `*${user.displayName}* (${user.role}) - @${user.telegramUsername}`;
        }).join('\n');

        const message = `*All Users: *\n\n${userList}`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
    }
}
