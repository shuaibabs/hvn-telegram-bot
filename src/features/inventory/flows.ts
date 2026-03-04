import TelegramBot from 'node-telegram-bot-api';
import { registerUserFlows } from '../users/flows';

export function registerFlowHandlers(bot: TelegramBot) {
    registerUserFlows(bot);
}
