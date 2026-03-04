"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBot = initializeBot;
exports.getBot = getBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_1 = require("../../config/env");
const flows_1 = require("../../features/users/flows");
const flows_2 = require("../../features/financial/flows");
let bot = null;
function initializeBot() {
    if (env_1.env.TELEGRAM_BOT_TOKEN) {
        bot = new node_telegram_bot_api_1.default(env_1.env.TELEGRAM_BOT_TOKEN, { polling: true });
        console.log("Bot has been initialized.");
        // Register all feature flows
        (0, flows_1.registerUserFlows)(bot);
        (0, flows_2.registerFinancialFlows)(bot);
        // Generic error handling
        bot.on('polling_error', (error) => {
            console.error(`Polling error: ${error.message}`);
        });
    }
    else {
        console.error("Telegram bot token is not defined.");
    }
}
function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
