
import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { CommandRouter } from '../router/commandRouter';
import { registerGeneralCommands } from '../../commands/general';
import { registerUserCommands } from '../../features/users/commands';
import { registerUserFlows } from '../../features/users/flows';
import { registerActivityCommands } from '../../features/activities/commands';
import { registerActivityFlows } from '../../features/activities/flows';

let bot: TelegramBot | null = null;
let commandRouter: CommandRouter | null = null;

export function initializeBot(): TelegramBot {
    if (env.TELEGRAM_BOT_TOKEN) {
        bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
        console.log("Bot has been initialized.");

        commandRouter = new CommandRouter(bot);

        // Register commands
        registerGeneralCommands(commandRouter);
        registerUserCommands(commandRouter);
        registerActivityCommands(commandRouter);

        // Register flows
        registerUserFlows(bot);
        registerActivityFlows(bot);

        // Start listening for commands
        commandRouter.listen();

        // Generic error handling
        bot.on('polling_error', (error) => {
            console.error(`Polling error: ${error.message}`);
        });

        return bot;

    } else {
        console.error("Telegram bot token is not defined.");
        throw new Error("Telegram bot token is not defined.");
    }
}

export function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
