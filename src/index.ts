import { initializeBot } from './core/bot/bot';
import { startServer } from './core/server/server';

async function main() {
    try {
        console.log("Starting the Telegram bot...");
        const bot = initializeBot();
        console.log("Bot is now running.");

        // Start the notification server
        console.log("Starting the Telegram Server...");
        await startServer(bot);
        console.log("Server is now running.");

    } catch (error) {
        console.error("Failed to start the bot or server:", error);
    }
}

main();
