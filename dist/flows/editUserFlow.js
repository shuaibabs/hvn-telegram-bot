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
exports.handleEditUserResponse = exports.startEditUserFlow = void 0;
const userService_1 = require("../services/userService");
const sessionManager_1 = require("../services/sessionManager");
const validation_1 = require("../utils/validation");
const EDIT_STAGES = {
    SELECT_USER: 'SELECT_USER',
    SELECT_FIELD: 'SELECT_FIELD',
    AWAIT_VALUE: 'AWAIT_VALUE',
    CONFIRM: 'CONFIRM',
};
function startEditUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (0, userService_1.getAllUsers)();
        if (users.length === 0) {
            yield bot.sendMessage(chatId, "There are no users to edit.");
            return;
        }
        const userList = users.map(user => ([{ text: `✏️ ${user.displayName}`, callback_data: `edit_user_select_${user.id}` }]));
        (0, sessionManager_1.setSession)(chatId, 'editUser', { stage: 'SELECT_USER' });
        yield bot.sendMessage(chatId, 'Please select a user to edit:', {
            reply_markup: {
                inline_keyboard: userList,
            },
        });
    });
}
exports.startEditUserFlow = startEditUserFlow;
function handleUserSelection(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = callbackQuery.data.split('_').pop();
        if (!userId)
            return;
        try {
            const user = yield (0, userService_1.getUser)(userId);
            if (!user) {
                yield bot.sendMessage(callbackQuery.message.chat.id, "User not found.");
                (0, sessionManager_1.clearSession)(callbackQuery.message.chat.id, 'editUser');
                return;
            }
            session.stage = 'SELECT_FIELD';
            session.userId = userId;
            session.userName = user.displayName;
            (0, sessionManager_1.setSession)(callbackQuery.message.chat.id, 'editUser', session);
            yield bot.answerCallbackQuery(callbackQuery.id);
            yield showFieldSelectionMenu(bot, callbackQuery.message.chat.id, user.displayName);
        }
        catch (error) {
            yield bot.sendMessage(callbackQuery.message.chat.id, `Error: ${error.message}`);
        }
    });
}
function showFieldSelectionMenu(bot, chatId, userName) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = `You are editing *${userName}*. Which field would you like to change?`;
        yield bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Name', callback_data: 'edit_field_displayName' }, { text: 'Email', callback_data: 'edit_field_email' }],
                    [{ text: 'Role', callback_data: 'edit_field_role' }, { text: 'Telegram', callback_data: 'edit_field_telegramUsername' }],
                    [{ text: 'Back to User List', callback_data: 'edit_user_back' }]
                ]
            }
        });
    });
}
function handleFieldSelection(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const field = callbackQuery.data.split('_').pop();
        session.field = field;
        yield bot.answerCallbackQuery(callbackQuery.id);
        if (field === 'role') {
            session.stage = 'AWAIT_VALUE'; // The value is selected via buttons
            (0, sessionManager_1.setSession)(callbackQuery.message.chat.id, 'editUser', session);
            yield bot.sendMessage(callbackQuery.message.chat.id, `Select the new role for *${session.userName}*:`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{
                                text: '👑 Admin',
                                callback_data: 'edit_value_role_admin'
                            }, {
                                text: '👷 Employee',
                                callback_data: 'edit_value_role_employee'
                            }]],
                },
            });
        }
        else {
            session.stage = 'AWAIT_VALUE';
            (0, sessionManager_1.setSession)(callbackQuery.message.chat.id, 'editUser', session);
            yield bot.sendMessage(callbackQuery.message.chat.id, `What is the new *${field}* for *${session.userName}*?`);
        }
    });
}
function handleValueInput(bot, update, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const chatId = ((_a = update.message) === null || _a === void 0 ? void 0 : _a.chat.id) || ((_c = (_b = update.callback_query) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.chat.id);
        if (!chatId)
            return;
        let newValue;
        let validationError = null;
        if (update.callback_query && session.field === 'role') {
            newValue = update.callback_query.data.endsWith('_admin') ? 'admin' : 'employee';
            yield bot.answerCallbackQuery(update.callback_query.id);
        }
        else if (update.message && update.message.text) {
            newValue = update.message.text.trim();
            if (session.field === 'email' && !(0, validation_1.isValidEmail)(newValue)) {
                validationError = "That doesn\'t look like a valid email. Please try again.";
            }
            else if (session.field === 'telegramUsername') {
                newValue = newValue.replace(/^@/, '');
            }
        }
        if (validationError) {
            yield bot.sendMessage(chatId, validationError);
            return; // Keep current stage
        }
        session.newValue = newValue;
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(chatId, 'editUser', session);
        yield sendConfirmation(bot, chatId, session);
    });
}
function sendConfirmation(bot, chatId, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const { field, newValue, userName } = session;
        const text = `Please confirm the change for *${userName}*:\n\n*Field*: ${field}\n*New Value*: ${newValue}\n\nDoes this look correct?`;
        yield bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                            text: '✅ Yes, Update User',
                            callback_data: 'edit_user_confirm_yes'
                        }], [{
                            text: '❌ No, Cancel',
                            callback_data: 'edit_user_confirm_no'
                        }]],
            },
        });
    });
}
function handleConfirmation(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const decision = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        yield bot.answerCallbackQuery(callbackQuery.id);
        (0, sessionManager_1.clearSession)(chatId, 'editUser');
        if (decision === 'edit_user_confirm_yes') {
            try {
                const { userId, field, newValue } = session;
                if (!userId || !field)
                    throw new Error("Session is missing data.");
                yield (0, userService_1.updateUser)(userId, { [field]: newValue }, 'Telegram Bot');
                yield bot.sendMessage(chatId, `✅ Success! User *${session.userName}* has been updated.`, { parse_mode: 'Markdown' });
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
            }
        }
        else {
            yield bot.sendMessage(chatId, "Cancelled. The user has not been modified.");
        }
    });
}
function handleEditUserResponse(bot, update) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const callbackQuery = update.callback_query;
        const msg = update.message;
        const chatId = ((_a = callbackQuery === null || callbackQuery === void 0 ? void 0 : callbackQuery.message) === null || _a === void 0 ? void 0 : _a.chat.id) || (msg === null || msg === void 0 ? void 0 : msg.chat.id);
        if (!chatId)
            return;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session)
            return;
        if (callbackQuery) {
            const data = callbackQuery.data;
            if (data.startsWith('edit_user_select_')) {
                yield handleUserSelection(bot, callbackQuery, session);
            }
            else if (data.startsWith('edit_field_')) {
                yield handleFieldSelection(bot, callbackQuery, session);
            }
            else if (data.startsWith('edit_value_')) {
                yield handleValueInput(bot, update, session);
            }
            else if (data.startsWith('edit_user_confirm_')) {
                yield handleConfirmation(bot, callbackQuery, session);
            }
            else if (data === 'edit_user_back') {
                yield bot.answerCallbackQuery(callbackQuery.id);
                (0, sessionManager_1.clearSession)(chatId, 'editUser');
                yield startEditUserFlow(bot, chatId);
            }
        }
        else if (msg && session.stage === 'AWAIT_VALUE') {
            yield handleValueInput(bot, update, session);
        }
    });
}
exports.handleEditUserResponse = handleEditUserResponse;
