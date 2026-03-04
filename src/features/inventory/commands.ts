import TelegramBot from 'node-telegram-bot-api';
import { registerGeneralCommands } from './commands/general';
import { registerUserCommands } from '../users/commands';

export function registerCommandHandlers(bot: TelegramBot) {
    registerGeneralCommands(bot);
    registerUserCommands(bot);
}
