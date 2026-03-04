import TelegramBot, { SendMessageOptions } from 'node-telegram-bot-api';
import { GROUPS } from '../../../config/env';
import { validateGroup } from '../../../shared/services/validation';

export function manageUsersCommand(bot: TelegramBot) {
    bot.onText(/\/manageusers/, (msg) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        sendUsersMenu(bot, msg.chat.id);
    });
}

export function sendUsersMenu(bot: TelegramBot, chatId: number) {
    const text = "*User Management*\n\nWhat would you like to do?";

    const options: SendMessageOptions = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '👤 Create User', callback_data: 'create_user' },
                    { text: '✏️ Edit User', callback_data: 'edit_user' },
                ],
                [
                    { text: '🗑️ Delete User', callback_data: 'delete_user' },
                    { text: '👁️ View Users', callback_data: 'view_users' },
                ],
            ],
        },
    };

    bot.sendMessage(chatId, text, options);
}
