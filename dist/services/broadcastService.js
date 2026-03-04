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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = broadcast;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const env_1 = require("../config/env");
const botToken = env_1.env.TELEGRAM_BOT_TOKEN;
const bot = new node_telegram_bot_api_1.default(botToken); // Dedicated broadcast instance
/**
 * Robust broadcast service with centralized error handling.
 */
function broadcast(groupInput_1, message_1) {
    return __awaiter(this, arguments, void 0, function* (groupInput, message, source = 'BOT') {
        const formattedMasterMsg = `**🔔 Master Alert**\n**Source:** ${source}\n**Action Type:** ${groupInput}\n\n${message}`;
        // 1. Determine Target Group ID
        let targetGroupId = groupInput;
        if (env_1.GROUPS[groupInput]) {
            targetGroupId = env_1.GROUPS[groupInput];
        }
        const results = [];
        const errors = [];
        try {
            // 2. Send to Dedicated Group (if valid)
            if (targetGroupId && targetGroupId.startsWith('-')) {
                yield bot.sendMessage(targetGroupId, message, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                });
                results.push(`Sent to Group: ${targetGroupId}`);
            }
            // 3. Mirror to Master Channel (if configured)
            const masterId = env_1.GROUPS.MASTER_CHANNEL;
            if (masterId && masterId.startsWith('-')) {
                yield bot.sendMessage(masterId, formattedMasterMsg, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                });
                results.push(`Mirrored to Master Channel: ${masterId}`);
            }
            console.log(`📡 Broadcast completed:`, results);
            return { success: true };
        }
        catch (err) {
            const errMsg = err.description || err.message || 'Unknown Telegram Error';
            console.error(`❌ Broadcast Error:`, errMsg);
            return { success: false, error: errMsg };
        }
    });
}
