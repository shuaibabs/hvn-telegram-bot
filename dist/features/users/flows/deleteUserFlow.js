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
exports.startDeleteUserFlow = startDeleteUserFlow;
exports.registerDeleteUserFlow = registerDeleteUserFlow;
const userService_1 = require("../userService");
const sessionManager_1 = require("../../../core/bot/sessionManager");
const activityService_1 = require("../../activities/activityService");
const telegram_1 = require("../../../shared/utils/telegram");
const DELETE_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_CONFIRMATION: 'AWAIT_CONFIRMATION',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'delete_user_cancel' };
function startDeleteUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users to delete.");
                return;
            }
            const userButtons = users.map((user) => ([{
                    text: `${user.displayName} (@${user.telegramUsername || 'N/A'})`,
                    callback_data: `delete_user_select_${user.id}`,
                }]));
            userButtons.push([cancelBtn]);
            (0, sessionManager_1.setSession)(chatId, 'deleteUser', {
                stage: 'AWAIT_USER_SELECTION',
            });
            yield bot.sendMessage(chatId, "*Select a user to delete:*", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: userButtons,
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error fetching users: ${error.message}`);
        }
    });
}
function handleUserSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteUser');
        if (!session || session.stage !== 'AWAIT_USER_SELECTION')
            return;
        const userId = (_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.replace('delete_user_select_', '');
        if (!userId)
            return;
        try {
            const users = yield (0, userService_1.getAllUsers)();
            const user = users.find(u => u.id === userId);
            if (!user)
                throw new Error('User not found.');
            session.stage = 'AWAIT_CONFIRMATION';
            session.userId = userId;
            session.displayName = user.displayName;
            (0, sessionManager_1.setSession)(chatId, 'deleteUser', session);
            yield bot.answerCallbackQuery(callbackQuery.id);
            const name = (0, telegram_1.escapeMarkdown)(user.displayName);
            yield bot.sendMessage(chatId, `Are you sure you want to delete user *${name}*?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                            { text: "✅ Yes, I'm sure", callback_data: `delete_user_confirm_yes` },
                            cancelBtn,
                        ]],
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'deleteUser');
        }
    });
}
function handleConfirmation(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteUser');
        if (!session || session.stage !== 'AWAIT_CONFIRMATION' || !session.userId)
            return;
        const decision = callbackQuery.data;
        yield bot.answerCallbackQuery(callbackQuery.id);
        if (decision === 'delete_user_confirm_yes') {
            try {
                yield (0, userService_1.deleteUser)(session.userId);
                const name = (0, telegram_1.escapeMarkdown)(session.displayName || '');
                const creator = callbackQuery.from.first_name + (callbackQuery.from.last_name ? ' ' + callbackQuery.from.last_name : '');
                yield bot.sendMessage(chatId, `✅ Success! User *${name}* has been deleted.`, { parse_mode: 'Markdown' });
                // Log Activity
                yield (0, activityService_1.logActivity)(bot, {
                    employeeName: session.displayName || 'Unknown',
                    action: 'DELETE_USER',
                    description: `Deleted user ${session.displayName}`,
                    createdBy: creator
                }, true);
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
            finally {
                (0, sessionManager_1.clearSession)(chatId, 'deleteUser');
            }
        }
    });
}
function registerDeleteUserFlow(bot) {
    bot.on('callback_query', (callbackQuery) => {
        var _a;
        if (callbackQuery.data === 'delete_user_cancel') {
            if ((0, sessionManager_1.getSession)(callbackQuery.message.chat.id, 'deleteUser')) {
                (0, sessionManager_1.clearSession)(callbackQuery.message.chat.id, 'deleteUser');
                bot.answerCallbackQuery(callbackQuery.id, { text: 'Deletion cancelled' });
                bot.sendMessage(callbackQuery.message.chat.id, "❌ Deletion flow cancelled.");
            }
            return;
        }
        if ((_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.startsWith('delete_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
        else if (callbackQuery.data === 'delete_user_confirm_yes') {
            handleConfirmation(bot, callbackQuery);
        }
    });
    bot.on('message', (message) => {
        if (message.text === '/cancel') {
            if ((0, sessionManager_1.getSession)(message.chat.id, 'deleteUser')) {
                (0, sessionManager_1.clearSession)(message.chat.id, 'deleteUser');
                bot.sendMessage(message.chat.id, "❌ Deletion flow cancelled.");
            }
            return;
        }
    });
}
