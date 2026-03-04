"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const server_1 = require("../core/server/server");
const env_1 = require("../config/env");
require("../features/misc/new-feature");
const bot = new node_telegram_bot_api_1.default(env_1.env.TELEGRAM_BOT_TOKEN, { polling: true });
console.log('🤖 Telegram bot initialized and listening...');
// Start the Express server for UI notifications if configured
if (env_1.env.ENABLE_SERVER) {
    (0, server_1.startServer)();
}
