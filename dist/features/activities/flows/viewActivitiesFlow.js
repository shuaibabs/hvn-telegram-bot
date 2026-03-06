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
exports.handleViewActivities = handleViewActivities;
const activityService_1 = require("../activityService");
const telegram_1 = require("../../../shared/utils/telegram");
function handleViewActivities(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        yield bot.answerCallbackQuery(callbackQuery.id);
        let limit = 10;
        let isAll = false;
        if (data === 'view_recent_25')
            limit = 25;
        if (data === 'view_recent_50')
            limit = 50;
        if (data === 'view_recent_100')
            limit = 100;
        if (data === 'view_all_activities')
            isAll = true;
        try {
            const activities = isAll ? yield (0, activityService_1.getAllActivities)() : yield (0, activityService_1.getRecentActivities)(limit);
            if (activities.length === 0) {
                yield bot.sendMessage(chatId, "📭 No activities found.");
                return;
            }
            let message = `📜 *${isAll ? 'All' : `Recent ${limit}`} Activities*\n\n`;
            for (const act of activities) {
                const entry = `📌 *#${act.srNo}* | ${(0, telegram_1.escapeMarkdown)(act.action)}\n` +
                    `└ *Target:* ${(0, telegram_1.escapeMarkdown)(act.employeeName)}\n` +
                    `└ *By:* ${(0, telegram_1.escapeMarkdown)(act.createdBy)} | ${act.timestamp.toDate().toLocaleDateString()}\n\n`;
                // Handle long messages by splitting
                if ((message + entry).length > 4000) {
                    yield bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                    message = '';
                }
                message += entry;
            }
            if (message) {
                yield bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error fetching activities: ${error.message}`);
        }
    });
}
