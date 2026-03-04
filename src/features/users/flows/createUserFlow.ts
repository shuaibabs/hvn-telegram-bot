import TelegramBot from 'node-telegram-bot-api';
import { User, addUser } from '../userService';
import { getSession, setSession, clearSession } from '../../../core/bot/sessionManager';
import { isValidEmail } from '../../../shared/utils/emailValidation';

const CREATE_STAGES = {
    AWAIT_NAME: 'AWAIT_NAME',
    AWAIT_EMAIL: 'AWAIT_EMAIL',
    AWAIT_ROLE: 'AWAIT_ROLE',
    AWAIT_TELEGRAM: 'AWAIT_TELEGRAM',
    CONFIRM: 'CONFIRM',
} as const;

type CreateUserSession = {
    stage: keyof typeof CREATE_STAGES;
    newUser: Partial<User>;
};

export async function startCreateUserFlow(bot: TelegramBot, chatId: number) {
    setSession(chatId, 'createUser', {
        stage: 'AWAIT_NAME',
        newUser: {},
    });
    await bot.sendMessage(chatId, "Let's create a new user. What is their full name?");
}

async function handleNameInput(bot: TelegramBot, msg: TelegramBot.Message) {
    const session = getSession(msg.chat.id, 'createUser') as CreateUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_NAME') return;

    const name = msg.text?.trim();
    if (!name) {
        await bot.sendMessage(msg.chat.id, "Name cannot be empty. Please enter the user's full name.");
        return;
    }

    session.newUser.displayName = name;
    session.stage = 'AWAIT_EMAIL';
    setSession(msg.chat.id, 'createUser', session);

    await bot.sendMessage(msg.chat.id, `Got it. Now, what is ${name}'s email address?`);
}

async function handleEmailInput(bot: TelegramBot, msg: TelegramBot.Message) {
    const session = getSession(msg.chat.id, 'createUser') as CreateUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_EMAIL') return;

    const email = msg.text?.trim();
    if (!email || !isValidEmail(email)) {
        await bot.sendMessage(msg.chat.id, "That doesn't look like a valid email. Please try again.");
        return;
    }

    session.newUser.email = email;
    session.stage = 'AWAIT_ROLE';
    setSession(msg.chat.id, 'createUser', session);

    await bot.sendMessage(msg.chat.id, 'What role should this user have?', {
        reply_markup: {
            inline_keyboard: [[{
                text: '👑 Admin',
                callback_data: 'create_user_role_admin'
            }, {
                text: '👷 Employee',
                callback_data: 'create_user_role_employee'
            }]],
        },
    });
}

async function handleRoleSelection(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const session = getSession(callbackQuery.message!.chat.id, 'createUser') as CreateUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_ROLE') return;

    const role = callbackQuery.data === 'create_user_role_admin' ? 'admin' : 'employee';
    session.newUser.role = role;
    session.stage = 'AWAIT_TELEGRAM';
    setSession(callbackQuery.message!.chat.id, 'createUser', session);

    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.sendMessage(callbackQuery.message!.chat.id, `Role set to ${role}. Finally, what is their Telegram username? (e.g., @username)`);
}

async function handleTelegramInput(bot: TelegramBot, msg: TelegramBot.Message) {
    const session = getSession(msg.chat.id, 'createUser') as CreateUserSession | undefined;
    if (!session || session.stage !== 'AWAIT_TELEGRAM') return;

    const username = msg.text?.trim().replace(/^@/, '');
    if (!username) {
        await bot.sendMessage(msg.chat.id, "Username cannot be empty. Please enter their Telegram username.");
        return;
    }

    session.newUser.telegramUsername = username;
    session.stage = 'CONFIRM';
    setSession(msg.chat.id, 'createUser', session);

    await sendConfirmation(bot, msg.chat.id, session);
}

async function sendConfirmation(bot: TelegramBot, chatId: number, session: CreateUserSession) {
    const { displayName, email, role, telegramUsername } = session.newUser;
    const text = `Please confirm the details:\n\n*Name*: ${displayName}\n*Email*: ${email}\n*Role*: ${role}\n*Telegram*: @${telegramUsername}\n\nDoes this look correct?`;

    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{
                text: '✅ Yes, Create User',
                callback_data: 'create_user_confirm_yes'
            }], [{
                text: '❌ No, Start Over',
                callback_data: 'create_user_confirm_no'
            }]],
        },
    });
}

async function handleConfirmation(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const session = getSession(callbackQuery.message!.chat.id, 'createUser') as CreateUserSession | undefined;
    if (!session || session.stage !== 'CONFIRM') return;
    
    const decision = callbackQuery.data;
    const chatId = callbackQuery.message!.chat.id;

    await bot.answerCallbackQuery(callbackQuery.id);

    if (decision === 'create_user_confirm_yes') {
        try {
            await addUser(session.newUser as User);
            await bot.sendMessage(chatId, `✅ Success! User *${session.newUser.displayName}* has been created.`, { parse_mode: 'Markdown' });
        } catch (error: any) {
            await bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
        }
    } else {
        await bot.sendMessage(chatId, "Cancelled. Let's start over.");
        await startCreateUserFlow(bot, chatId); 
    }
    clearSession(chatId, 'createUser');
}

export function registerCreateUserFlow(bot: TelegramBot) {
    bot.on('message', (msg) => {
        const session = getSession(msg.chat.id, 'createUser') as CreateUserSession | undefined;
        if (!session) return;

        switch (session.stage) {
            case 'AWAIT_NAME':
                handleNameInput(bot, msg);
                break;
            case 'AWAIT_EMAIL':
                handleEmailInput(bot, msg);
                break;
            case 'AWAIT_TELEGRAM':
                handleTelegramInput(bot, msg);
                break;
        }
    });

    bot.on('callback_query', (callbackQuery) => {
        const session = getSession(callbackQuery.message!.chat.id, 'createUser') as CreateUserSession | undefined;
        if (!session) return;

        if (callbackQuery.data?.startsWith('create_user_role_')) {
            handleRoleSelection(bot, callbackQuery);
        }
        if (callbackQuery.data?.startsWith('create_user_confirm_')) {
            handleConfirmation(bot, callbackQuery);
        }
    });
}
