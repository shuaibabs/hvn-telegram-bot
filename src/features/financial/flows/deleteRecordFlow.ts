import TelegramBot from 'node-telegram-bot-api';
import { getAllFinancialRecords, deleteFinancialRecord } from '../financialService';

export async function startDeleteRecordFlow(bot: TelegramBot, chatId: number) {
    try {
        const records = await getAllFinancialRecords();
        if (records.length === 0) {
            await bot.sendMessage(chatId, "There are no financial records to delete.");
            return;
        }

        const recordButtons = records.map(record => ([{
            text: `${record.description} (${record.amount})`,
            callback_data: `delete_record_${record.id}`
        }]));

        await bot.sendMessage(chatId, "*Select a record to delete:*", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: recordButtons },
        });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching records: ${error.message}`);
    }
}

export async function handleDeleteRecordResponse(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const { data, message } = callbackQuery;
    if (!data || !message || !data.startsWith('delete_record_')) return;

    const chatId = message.chat.id;
    const recordId = data.split('_').pop();

    if (recordId) {
        try {
            await deleteFinancialRecord(recordId, 'admin');
            await bot.deleteMessage(chatId, message.message_id);
            await bot.sendMessage(chatId, `Record with ID ${recordId} has been deleted.`);
        } catch (error: any) {
            await bot.sendMessage(chatId, `Error deleting record: ${error.message}`);
        }
    }
}
