import TelegramBot from 'node-telegram-bot-api';
import { handleCreateUserResponse } from './createUserFlow';
import { handleDeleteUserResponse } from './deleteUserFlow';
import { handleEditUserResponse } from './editUserFlow';


export function registerUserFlows(bot: TelegramBot) {
    bot.on('message', (msg) => {
        handleCreateUserResponse(bot, { message: msg });
        handleEditUserResponse(bot, { message: msg });
    });

    bot.on('callback_query', (callbackQuery) => {
        handleCreateUserResponse(bot, { callback_query: callbackQuery });
        handleDeleteUserResponse(bot, callbackQuery);
        handleEditUserResponse(bot, { callback_query: callbackQuery });
    });
}
