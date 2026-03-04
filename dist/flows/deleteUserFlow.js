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
exports.handleDeleteUserResponse = exports.startDeleteUserFlow = void 0;
const userService_1 = require("../services/userService");
const sessionManager_1 = require("../services/sessionManager");
const DELETE_STAGES = {
    SELECT_USER: 'SELECT_USER',
    CONFIRM: 'CONFIRM',
};
function startDeleteUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (0, userService_1.getAllUsers)();
        if (users.length === 0) {
            yield bot.sendMessage(chatId, "There are no users to delete.");
            return;
        }
        const userList = users.map(user => ([{ text: `🗑️ ${user.displayName}`, callback_data: `delete_user_select_${user.id}` }]));
        (0, sessionManager_1.setSession)(chatId, 'deleteUser', { stage: 'SELECT_USER' });
        yield bot.sendMessage(chatId, 'Please select a user to delete:', {
            reply_markup: {
                inline_keyboard: userList,
            },
        });
    });
}
exports.startDeleteUserFlow = startDeleteUserFlow;
function handleUserSelection(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = callbackQuery.data.split('_').pop();
        if (!userId)
            return; // Should not happen
        try {
            const user = yield (0, userService_1.getUser)(userId);
            if (!user) {
                yield bot.sendMessage(callbackQuery.message.chat.id, "User not found.");
                (0, sessionManager_1.clearSession)(callbackQuery.message.chat.id, 'deleteUser');
                return;
            }
            session.stage = 'CONFIRM';
            session.userId = userId;
            session.userName = user.displayName;
            (0, sessionManager_1.setSession)(callbackQuery.message.chat.id, 'deleteUser', session);
            yield bot.answerCallbackQuery(callbackQuery.id);
            yield bot.sendMessage(callbackQuery.message.chat.id, `Are you sure you want to delete the user *${user.displayName}*?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{
                                text: '✅ Yes, Delete',
                                callback_data: 'delete_user_confirm_yes'
                            }], [{
                                text: '❌ No, Cancel',
                                callback_data: 'delete_user_confirm_no'
                            }]],
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(callbackQuery.message.chat.id, `Error: ${error.message}`);
        }
    });
}
function handleConfirmation(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const decision = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        yield bot.answerCallbackQuery(callbackQuery.id);
        (0, sessionManager_1.clearSession)(chatId, 'deleteUser');
        if (decision === 'delete_user_confirm_yes') {
            if (!session.userId || !session.userName)
                return; // Should not happen
            try {
                yield (0, userService_1.deleteUser)(session.userId, 'Telegram Bot');
                yield bot.sendMessage(chatId, `✅ Success! User *${session.userName}* has been deleted.`, { parse_mode: 'Markdown' });
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
            }
        }
        else {
            yield bot.sendMessage(chatId, "Cancelled. The user has not been deleted.");
        }
    });
}
function handleDeleteUserResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'deleteUser');
        if (!session || !callbackQuery.data)
            return;
        switch (session.stage) {
            case 'SELECT_USER':
                if (callbackQuery.data.startsWith('delete_user_select_')) {
                    yield handleUserSelection(bot, callbackQuery, session);
                }
                break;
            case 'CONFIRM':
                if (callbackQuery.data.startsWith('delete_user_confirm_')) {
                    yield handleConfirmation(bot, callbackQuery, session);
                }
                break;
        }
    });
}
exports.handleDeleteUserResponse = handleDeleteUserResponse;
