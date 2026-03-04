import TelegramBot from 'node-telegram-bot-api';
import { getAllUsers, updateUserTelegramUsername, User } from '../userService';
import { setSession, getSession, clearSession } from '../../../core/bot/sessionManager';

const EDIT_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_NEW_USERNAME: 'AWAIT_NEW_USERNAME',
} as const;

type EditUserSession = {
    stage: keyof typeof EDIT_STAGES;
    userId?: string;
};

export async function startEditUserFlow(bot: TelegramBot, chatId: number) {
    try {
        const users = await getAllUsers();

        if (users.length === 0) {
            await bot.sendMessage(chatId, "There are no users to edit.");
            return;
        }

        const userButtons = users.map((user: User) => ([{
            text: `${user.displayName} (${user.role}) - @${user.telegramUsername}`,
            callback_data: `edit_user_select_${user.id}`
        }]));

        const options = {
            reply_markup: {
                inline_keyboard: userButtons
            }
        };

        setSession(chatId, 'editUser', {
            stage: 'AWAIT_USER_SELECTION',
        });
        await bot.sendMessage(chatId, "*Select a user to edit:*", { parse_mode: 'Markdown', ...options });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
    }
}

export async function handleEditUserResponse(bot: TelegramBot, response: { message?: TelegramBot.Message, callback_query?: TelegramBot.CallbackQuery }) {
    const msg = response.message || response.callback_query?.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId, 'editUser') as EditUserSession | undefined;
    if (!session) return;

    const data = response.callback_query?.data;

    if (data?.startsWith('edit_user_select_') && session.stage === 'AWAIT_USER_SELECTION') {
        const userId = data.split('_').pop();
        session.stage = 'AWAIT_NEW_USERNAME';
        session.userId = userId;
        setSession(chatId, 'editUser', session);

        await bot.deleteMessage(chatId, msg.message_id);
        await bot.sendMessage(chatId, "Please enter the new Telegram username for the user (e.g., @newusername).");
    } else if (response.message?.text && session.stage === 'AWAIT_NEW_USERNAME') {
        const newUsername = response.message.text.replace(/^@/, '');
        try {
            await updateUserTelegramUsername(session.userId!, newUsername);
            await bot.sendMessage(chatId, `User @${newUsername} has been updated.`);
        } catch (error: any) {
            await bot.sendMessage(chatId, `Error updating user: ${error.message}`);
        }
        clearSession(chatId, 'editUser');
    }
}
