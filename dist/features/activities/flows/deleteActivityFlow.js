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
exports.startDeleteActivityFlow = startDeleteActivityFlow;
exports.registerDeleteActivityFlow = registerDeleteActivityFlow;
const activityService_1 = require("../activityService");
const sessionManager_1 = require("../../../core/bot/sessionManager");
const telegram_1 = require("../../../shared/utils/telegram");
const DELETE_ACT_STAGES = {
    AWAIT_SELECTION: 'AWAIT_SELECTION',
    AWAIT_CONFIRMATION: 'AWAIT_CONFIRMATION',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'delete_act_cancel' };
function startDeleteActivityFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const activities = yield (0, activityService_1.getRecentActivities)(15); // Show last 15 for selection
            if (activities.length === 0) {
                yield bot.sendMessage(chatId, "There are no activities to delete.");
                return;
            }
            const buttons = activities.map(act => ([{
                    text: `#${act.srNo} - ${act.action} by ${act.createdBy}`,
                    callback_data: `delete_act_select_${act.id}`
                }]));
            buttons.push([cancelBtn]);
            (0, sessionManager_1.setSession)(chatId, 'deleteActivity', {
                stage: 'AWAIT_SELECTION',
            });
            yield bot.sendMessage(chatId, "*Select an activity to delete (recent 15):*", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: buttons,
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error fetching activities: ${error.message}`);
        }
    });
}
function handleSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteActivity');
        if (!session || session.stage !== 'AWAIT_SELECTION')
            return;
        const activityId = (_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.replace('delete_act_select_', '');
        if (!activityId)
            return;
        try {
            const activities = yield (0, activityService_1.getRecentActivities)(50);
            const activity = activities.find(a => a.id === activityId);
            if (!activity)
                throw new Error('Activity not found.');
            session.stage = 'AWAIT_CONFIRMATION';
            session.activityId = activityId;
            session.srNo = activity.srNo;
            (0, sessionManager_1.setSession)(chatId, 'deleteActivity', session);
            yield bot.answerCallbackQuery(callbackQuery.id);
            yield bot.sendMessage(chatId, `⚠️ *Confirm Deletion*\n\nAre you sure you want to delete activity *#${activity.srNo}* (${(0, telegram_1.escapeMarkdown)(activity.action)})?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                            { text: "✅ Yes, Delete", callback_data: `delete_act_confirm_yes` },
                            cancelBtn,
                        ]],
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'deleteActivity');
        }
    });
}
function handleConfirmation(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteActivity');
        if (!session || session.stage !== 'AWAIT_CONFIRMATION' || !session.activityId)
            return;
        yield bot.answerCallbackQuery(callbackQuery.id);
        try {
            yield (0, activityService_1.deleteActivity)(session.activityId);
            const creator = callbackQuery.from.first_name + (callbackQuery.from.last_name ? ' ' + callbackQuery.from.last_name : '');
            yield bot.sendMessage(chatId, `✅ Success! Activity *#${session.srNo}* has been deleted.`);
            // Log the deletion itself
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: 'System',
                action: 'DELETE_SINGLE_ACTIVITY',
                description: `Deleted activity log #${session.srNo}`,
                createdBy: creator
            }, true); // Broadcast to channel
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'deleteActivity');
        }
    });
}
function registerDeleteActivityFlow(bot) {
    bot.on('callback_query', (callbackQuery) => {
        const data = callbackQuery.data || '';
        const chatId = callbackQuery.message.chat.id;
        if (data === 'delete_act_cancel') {
            if ((0, sessionManager_1.getSession)(chatId, 'deleteActivity')) {
                (0, sessionManager_1.clearSession)(chatId, 'deleteActivity');
                bot.answerCallbackQuery(callbackQuery.id, { text: 'Cancelled' });
                bot.sendMessage(chatId, "❌ Action cancelled.");
            }
            return;
        }
        if (data.startsWith('delete_act_select_')) {
            handleSelection(bot, callbackQuery);
        }
        else if (data === 'delete_act_confirm_yes') {
            handleConfirmation(bot, callbackQuery);
        }
    });
}
