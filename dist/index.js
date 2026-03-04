"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./core/bot/bot");
const server_1 = require("./core/server/server");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Starting the Telegram bot...");
            const bot = (0, bot_1.initializeBot)();
            console.log("Bot is now running.");
            // Start the notification server
            console.log("Starting the Telegram Server...");
            yield (0, server_1.startServer)(bot);
            console.log("Server is now running.");
        }
        catch (error) {
            console.error("Failed to start the bot or server:", error);
        }
    });
}
main();
