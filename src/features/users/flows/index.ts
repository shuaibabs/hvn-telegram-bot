import TelegramBot from 'node-telegram-bot-api';
import { registerCreateUserFlow } from './createUserFlow';
import { registerDeleteUserFlow } from './deleteUserFlow';
import { registerEditUserFlow } from './editUserFlow';

export function registerUserFlows(bot: TelegramBot) {
    registerCreateUserFlow(bot);
    registerDeleteUserFlow(bot);
    registerEditUserFlow(bot);
}
