import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers, deleteUser } from '../services/userService';

export async function startDeleteUserFlow(bot: TelegramBot, chatId: number) {
    try {
        const users = await getAllUsers();

        if (users.length === 0) {
            await bot.sendMessage(chatId, "There are no users to delete.");
            return;
        }

        const userButtons = users.map(user => ([{
            text: `${user.displayName} (${user.role}) - @${user.telegramUsername}`,
            callback_data: `delete_user_confirm_${user.id}`
        }]));

        const options = {
            reply_markup: {
                inline_keyboard: userButtons
            }
        };

        await bot.sendMessage(chatId, "*Select a user to delete:*", { parse_mode: 'Markdown', ...options });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
    }
}

export async function handleDeleteUserResponse(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const { data, message } = callbackQuery;
    if (!data || !message) return;

    const chatId = message.chat.id;
    const userId = data.split('_').pop();

    if (data.startsWith('delete_user_confirm_')) {
        await bot.deleteMessage(chatId, message.message_id);

        try {
            await deleteUser(userId!, 'admin'); // Assuming admin is performing the action
            await bot.sendMessage(chatId, `User with ID ${userId} has been deleted.`);
        } catch (error: any) {
            await bot.sendMessage(chatId, `Error deleting user: ${error.message}`);
        }
    }
}
