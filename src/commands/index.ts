import TelegramBot from 'node-telegram-bot-api';
import { registerUserCommands } from '../features/users/commands/index';

export function registerCommandHandlers(bot: TelegramBot) {
    registerUserCommands(bot);
}
