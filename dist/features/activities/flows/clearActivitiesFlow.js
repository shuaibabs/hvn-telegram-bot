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
exports.handleClearActivities = handleClearActivities;
const activityService_1 = require("../activityService");
function handleClearActivities(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        if (data === 'clear_activities_start') {
            yield bot.answerCallbackQuery(callbackQuery.id);
            yield bot.sendMessage(chatId, "⚠️ *Confirm Clear Logs*\n\nAre you sure you want to delete ALL activity logs? This action cannot be undone.", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔥 Yes, Delete All', callback_data: 'clear_activities_confirm' }],
                        [{ text: '❌ No, Cancel', callback_data: 'clear_activities_cancel' }]
                    ]
                }
            });
            return;
        }
        if (data === 'clear_activities_confirm') {
            yield bot.answerCallbackQuery(callbackQuery.id, { text: 'Clearing logs...' });
            try {
                yield (0, activityService_1.clearAllActivities)();
                yield bot.sendMessage(chatId, "✅ All activity logs have been cleared successfully.");
                // Log Activity & Broadcast
                const creator = callbackQuery.from.first_name + (callbackQuery.from.last_name ? ' ' + callbackQuery.from.last_name : '');
                yield (0, activityService_1.logActivity)(bot, {
                    employeeName: 'System',
                    action: 'CLEAR_LOGS',
                    description: 'All activity logs were cleared',
                    createdBy: creator
                }, true);
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error clearing activities: ${error.message}`);
            }
        }
        else if (data === 'clear_activities_cancel') {
            yield bot.answerCallbackQuery(callbackQuery.id);
            yield bot.sendMessage(chatId, "❌ Action cancelled.");
        }
    });
}
