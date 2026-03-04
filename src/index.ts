import { initializeBot } from './core/bot/bot';

function main() {
    try {
        console.log("Starting the Telegram bot...");
        initializeBot();
        console.log("Bot is now running.");
    } catch (error) {
        console.error("Failed to start the bot:", error);
    }
}

main();
