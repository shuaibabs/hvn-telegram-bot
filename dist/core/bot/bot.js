"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBot = initializeBot;
exports.getBot = getBot;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_1 = require("../../config/env");
const commandRouter_1 = require("../router/commandRouter");
const general_1 = require("../../commands/general");
const commands_1 = require("../../features/users/commands");
const flows_1 = require("../../features/users/flows");
let bot = null;
let commandRouter = null;
function initializeBot() {
    if (env_1.env.TELEGRAM_BOT_TOKEN) {
        bot = new node_telegram_bot_api_1.default(env_1.env.TELEGRAM_BOT_TOKEN, { polling: true });
        console.log("Bot has been initialized.");
        commandRouter = new commandRouter_1.CommandRouter(bot);
        // Register commands
        (0, general_1.registerGeneralCommands)(commandRouter);
        (0, commands_1.registerUserCommands)(commandRouter);
        // Register flows
        (0, flows_1.registerUserFlows)(bot);
        // Start listening for commands
        commandRouter.listen();
        // Generic error handling
        bot.on('polling_error', (error) => {
            console.error(`Polling error: ${error.message}`);
        });
        return bot;
    }
    else {
        console.error("Telegram bot token is not defined.");
        throw new Error("Telegram bot token is not defined.");
    }
}
function getBot() {
    if (!bot) {
        throw new Error("Bot is not initialized.");
    }
    return bot;
}
