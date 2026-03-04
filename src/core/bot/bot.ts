import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { registerUserFlows } from '../../features/users/flows';
import { registerFinancialFlows } from '../../features/financial/flows';

let bot: TelegramBot | null = null;

export function initializeBot() {
    if (env.TELEGRAM_BOT_TOKEN) {
        bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
        console.log("Bot has been initialized.");

        // Register all feature flows
        registerUserFlows(bot);
        registerFinancialFlows(bot);

        // Generic error handling
        bot.on('polling_error', (error) => {
            console.error(`Polling error: ${error.message}`);
        });

    } else {
        console.error("Telegram bot token is not defined.");
    }
}

export function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
