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
exports.manageActivitiesCommand = manageActivitiesCommand;
function manageActivitiesCommand(bot, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = msg.chat.id;
        const welcomeMessage = "📊 *Activity Management*\n\nWelcome to the activity log manager. What would you like to do?";
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📜 View Recent 10', callback_data: 'view_recent_10' },
                        { text: '📜 View Recent 25', callback_data: 'view_recent_25' }
                    ],
                    [
                        { text: '📜 View Recent 50', callback_data: 'view_recent_50' },
                        { text: '📜 View Recent 100', callback_data: 'view_recent_100' }
                    ],
                    [
                        { text: '📑 View All Activities', callback_data: 'view_all_activities' }
                    ],
                    [
                        { text: '🗑️ Delete Single Activity', callback_data: 'delete_act_start' }
                    ],
                    [
                        { text: '🔥 Clear Activity Logs', callback_data: 'clear_activities_start' }
                    ]
                ]
            }
        };
        yield bot.sendMessage(chatId, welcomeMessage, Object.assign({ parse_mode: 'Markdown' }, keyboard));
    });
}
