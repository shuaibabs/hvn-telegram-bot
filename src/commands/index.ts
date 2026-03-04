import TelegramBot from 'node-telegram-bot-api';
import { registerUserCommands } from './users';

export function registerCommandHandlers(bot: TelegramBot) {
    registerUserCommands(bot);
}
