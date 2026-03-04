import TelegramBot from 'node-telegram-bot-api';
import { startAddRecordFlow } from './addRecordFlow';
import { startDeleteRecordFlow } from './deleteRecordFlow';
import { listAllRecords } from './viewRecords';

export async function handleFinancialManagementResponse(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const { data, message } = callbackQuery;
    if (!data || !message) return;

    const chatId = message.chat.id;

    // Remove the previous message to keep the chat clean
    await bot.deleteMessage(chatId, message.message_id);

    switch (data) {
        case 'add_record':
            await startAddRecordFlow(bot, chatId);
            break;
        case 'delete_record':
            await startDeleteRecordFlow(bot, chatId);
            break;
        case 'view_records':
            await listAllRecords(bot, chatId);
            break;
    }
}
