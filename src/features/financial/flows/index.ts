import TelegramBot from 'node-telegram-bot-api';
import { handleAddRecordResponse } from './addRecordFlow';
import { handleDeleteRecordResponse } from './deleteRecordFlow';


export function registerFinancialFlows(bot: TelegramBot) {
    bot.on('message', (msg) => {
        handleAddRecordResponse(bot, { message: msg });
    });

    bot.on('callback_query', (callbackQuery) => {
        handleAddRecordResponse(bot, { callback_query: callbackQuery });
        handleDeleteRecordResponse(bot, callbackQuery);
    });
}
