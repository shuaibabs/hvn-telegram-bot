import TelegramBot from 'node-telegram-bot-api';
import { setSession, getSession, clearSession } from '../../../core/bot/sessionManager';
import { addFinancialRecord, FinancialRecord } from '../financialService';
import { getAllUsers, User } from '../../users/userService'; // Import user service to select a user

const ADD_RECORD_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_TYPE_SELECTION: 'AWAIT_TYPE_SELECTION',
    AWAIT_CATEGORY_SELECTION: 'AWAIT_CATEGORY_SELECTION',
    AWAIT_AMOUNT: 'AWAIT_AMOUNT',
    AWAIT_DESCRIPTION: 'AWAIT_DESCRIPTION',
} as const;

type AddRecordSession = {
    stage: keyof typeof ADD_RECORD_STAGES;
    record: Partial<FinancialRecord>;
};

export async function startAddRecordFlow(bot: TelegramBot, chatId: number) {
    const users = await getAllUsers();
    if (users.length === 0) {
        await bot.sendMessage(chatId, "No users available to assign the record to.");
        return;
    }

    const userButtons = users.map((user: User) => ([{
        text: `${user.displayName}`,
        callback_data: `add_record_user_${user.id}`
    }]));

    setSession(chatId, 'addRecord', { stage: 'AWAIT_USER_SELECTION', record: {} });
    await bot.sendMessage(chatId, "*Who does this record belong to?*", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: userButtons },
    });
}

export async function handleAddRecordResponse(bot: TelegramBot, response: { message?: TelegramBot.Message, callback_query?: TelegramBot.CallbackQuery }) {
    const msg = response.message || response.callback_query?.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const session = getSession(chatId, 'addRecord') as AddRecordSession | undefined;
    if (!session) return;

    const data = response.callback_query?.data;

    switch (session.stage) {
        case 'AWAIT_USER_SELECTION':
            if (data?.startsWith('add_record_user_')) {
                session.record.userId = data.split('_').pop();
                session.stage = 'AWAIT_TYPE_SELECTION';
                setSession(chatId, 'addRecord', session);
                await bot.deleteMessage(chatId, msg.message_id);
                await bot.sendMessage(chatId, "*Is this an income or an expense?*", {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            text: 'Income',
                            callback_data: 'add_record_type_income'
                        }, {
                            text: 'Expense',
                            callback_data: 'add_record_type_expense'
                        }]]
                    },
                });
            }
            break;

        case 'AWAIT_TYPE_SELECTION':
            if (data?.startsWith('add_record_type_')) {
                session.record.type = data.split('_').pop() as 'income' | 'expense';
                session.stage = 'AWAIT_CATEGORY_SELECTION';
                setSession(chatId, 'addRecord', session);
                await bot.deleteMessage(chatId, msg.message_id);
                await bot.sendMessage(chatId, "*What is the category of this record?*", { parse_mode: 'Markdown' });
            }
            break;

        case 'AWAIT_CATEGORY_SELECTION':
            if (response.message?.text) {
                session.record.category = response.message.text;
                session.stage = 'AWAIT_AMOUNT';
                setSession(chatId, 'addRecord', session);
                await bot.sendMessage(chatId, "*What is the amount?*", { parse_mode: 'Markdown' });
            }
            break;

        case 'AWAIT_AMOUNT':
            if (response.message?.text && !isNaN(parseFloat(response.message.text))) {
                session.record.amount = parseFloat(response.message.text);
                session.stage = 'AWAIT_DESCRIPTION';
                setSession(chatId, 'addRecord', session);
                await bot.sendMessage(chatId, "*Provide a short description:*", { parse_mode: 'Markdown' });
            }
            break;

        case 'AWAIT_DESCRIPTION':
            if (response.message?.text) {
                session.record.description = response.message.text;
                try {
                    await addFinancialRecord(session.record as any, 'admin');
                    await bot.sendMessage(chatId, `Financial record has been added successfully.`);
                } catch (error: any) { 
                    await bot.sendMessage(chatId, `Error: ${error.message}`);
                }
                clearSession(chatId, 'addRecord');
            }
            break;
    }
}
