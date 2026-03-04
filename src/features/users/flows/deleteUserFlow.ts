import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers, deleteUser, User } from '../userService';

export async function startDeleteUserFlow(bot: TelegramBot, chatId: number) {
    try {
        const users = await getAllUsers();
        if (users.length === 0) {
            await bot.sendMessage(chatId, "There are no users to delete.");
            return;
        }

        const userButtons = users.map((user: User) => ([{
            text: `${user.displayName} (@${user.telegramUsername})`,
            callback_data: `delete_user_select_${user.id}`,
        }]));

        await bot.sendMessage(chatId, "*Select a user to delete:*", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: userButtons,
            },
        });
    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
    }
}

async function handleUserSelection(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const userId = callbackQuery.data?.split('_').pop();
    const messageId = callbackQuery.message?.message_id;
    const chatId = callbackQuery.message?.chat.id;

    if (!userId || !chatId || !messageId) return;

    await bot.deleteMessage(chatId, messageId);

    await bot.sendMessage(chatId, "Are you sure you want to delete this user?", {
        reply_markup: {
            inline_keyboard: [[
                { text: "Yes, I'm sure", callback_data: `delete_user_confirm_${userId}` },
                { text: "No, cancel", callback_data: 'delete_user_cancel' },
            ]],
        },
    });
}

async function handleConfirmation(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const userId = callbackQuery.data?.split('_').pop();
    const messageId = callbackQuery.message?.message_id;
    const chatId = callbackQuery.message?.chat.id;

    if (!userId || !chatId || !messageId) return;

    await bot.deleteMessage(chatId, messageId);

    if (callbackQuery.data?.startsWith('delete_user_confirm_')) {
        try {
            await deleteUser(userId);
            await bot.sendMessage(chatId, "User has been deleted.");
        } catch (error: any) {
            await bot.sendMessage(chatId, `Error deleting user: ${error.message}`);
        }
    } else {
        await bot.sendMessage(chatId, "Deletion cancelled.");
    }
}

export function registerDeleteUserFlow(bot: TelegramBot) {
    bot.on('callback_query', (callbackQuery) => {
        if (callbackQuery.data?.startsWith('delete_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
        if (callbackQuery.data?.startsWith('delete_user_confirm_') || callbackQuery.data === 'delete_user_cancel') {
            handleConfirmation(bot, callbackQuery);
        }
    });
}
