"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const server_1 = require("./server");
const env_1 = require("./config/env");
const commands_1 = require("./commands");
const flows_1 = require("./flows");
const bot = new node_telegram_bot_api_1.default(env_1.env.TELEGRAM_BOT_TOKEN, { polling: true });
// Register all modular commands and flows
(0, commands_1.registerCommandHandlers)(bot);
(0, flows_1.registerFlowHandlers)(bot);
console.log('🤖 Telegram bot initialized and listening...');
// Start the Express server for UI notifications if configured
if (env_1.env.ENABLE_SERVER) {
    (0, server_1.startServer)();
}
