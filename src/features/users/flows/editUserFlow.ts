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
    displayName?: string;
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
            callback_data: `edit_user_select_${user.id}:${user.displayName}`
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

async function handleUserSelection(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const msg = callbackQuery.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId, 'editUser') as EditUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_USER_SELECTION') return;
    
    const data = callbackQuery.data;
    if (!data) return;

    const [_, userId, displayName] = data.match(/edit_user_select_(.+):(.+)/) || [];
    session.stage = 'AWAIT_NEW_USERNAME';
    session.userId = userId;
    session.displayName = displayName;
    setSession(chatId, 'editUser', session);

    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.deleteMessage(chatId, msg.message_id);
    await bot.sendMessage(chatId, `Please enter the new Telegram username for *${displayName}* (e.g., @newusername).`, { parse_mode: 'Markdown' });
}

async function handleUsernameInput(bot: TelegramBot, message: TelegramBot.Message) {
    const chatId = message.chat.id;
    const session = getSession(chatId, 'editUser') as EditUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_NEW_USERNAME' || !session.userId) return;

    const newUsername = message.text?.trim().replace(/^@/, '');
    if (!newUsername) {
        await bot.sendMessage(chatId, "Username cannot be empty. Please enter a valid username.");
        return;
    }

    try {
        await updateUserTelegramUsername(session.userId, newUsername);
        await bot.sendMessage(chatId, `✅ Success! User *${session.displayName}* has been updated to @${newUsername}.`, { parse_mode: 'Markdown' });
    } catch (error: any) {
        await bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
    } finally {
        clearSession(chatId, 'editUser');
    }
}


export function registerEditUserFlow(bot: TelegramBot) {
    bot.on('callback_query', (callbackQuery) => {
        if (callbackQuery.data?.startsWith('edit_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
    });

    bot.on('message', (message) => {
        const session = getSession(message.chat.id, 'editUser') as EditUserSession | undefined;
        if (session && session.stage === 'AWAIT_NEW_USERNAME') {
            handleUsernameInput(bot, message);
        }
    });
}
