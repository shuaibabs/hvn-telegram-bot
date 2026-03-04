"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./core/bot/bot");
function main() {
    try {
        console.log("Starting the Telegram bot...");
        (0, bot_1.initializeBot)();
        console.log("Bot is now running.");
    }
    catch (error) {
        console.error("Failed to start the bot:", error);
    }
}
main();
