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
exports.startEditUserFlow = startEditUserFlow;
exports.registerEditUserFlow = registerEditUserFlow;
const userService_1 = require("../userService");
const sessionManager_1 = require("../../../core/bot/sessionManager");
const activityService_1 = require("../../activities/activityService");
const telegram_1 = require("../../../shared/utils/telegram");
const EDIT_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_FIELD_SELECTION: 'AWAIT_FIELD_SELECTION',
    AWAIT_NEW_NAME: 'AWAIT_NEW_NAME',
    AWAIT_NEW_USERNAME: 'AWAIT_NEW_USERNAME',
};
const cancelBtn = { text: '❌ Cancel', callback_data: 'edit_user_cancel' };
function startEditUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users to edit.");
                return;
            }
            const userButtons = users.map((user) => ([{
                    text: `${user.displayName} - @${user.telegramUsername || 'N/A'}`,
                    callback_data: `edit_user_select_${user.id}`
                }]));
            userButtons.push([cancelBtn]);
            const options = {
                reply_markup: {
                    inline_keyboard: userButtons
                }
            };
            (0, sessionManager_1.setSession)(chatId, 'editUser', {
                stage: 'AWAIT_USER_SELECTION',
            });
            yield bot.sendMessage(chatId, "*Select a user to edit:*", Object.assign({ parse_mode: 'Markdown' }, options));
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error fetching users: ${error.message}`);
        }
    });
}
function handleUserSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const msg = callbackQuery.message;
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_USER_SELECTION')
            return;
        const userId = (_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.replace('edit_user_select_', '');
        if (!userId)
            return;
        try {
            const users = yield (0, userService_1.getAllUsers)();
            const user = users.find(u => u.id === userId);
            if (!user)
                throw new Error('User not found.');
            session.stage = 'AWAIT_FIELD_SELECTION';
            session.userId = userId;
            session.displayName = user.displayName;
            (0, sessionManager_1.setSession)(chatId, 'editUser', session);
            yield bot.answerCallbackQuery(callbackQuery.id);
            const name = (0, telegram_1.escapeMarkdown)(user.displayName);
            const username = (0, telegram_1.escapeMarkdown)(user.telegramUsername || 'N/A');
            yield bot.sendMessage(chatId, `Editing user: *${name}* (@${username})\n\nWhat would you like to update?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📝 Edit Name', callback_data: 'edit_user_field_name' }],
                        [{ text: '👤 Edit Username', callback_data: 'edit_user_field_username' }],
                        [cancelBtn]
                    ]
                }
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            (0, sessionManager_1.clearSession)(chatId, 'editUser');
        }
    });
}
function handleFieldSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_FIELD_SELECTION')
            return;
        const field = callbackQuery.data;
        yield bot.answerCallbackQuery(callbackQuery.id);
        if (field === 'edit_user_field_name') {
            session.stage = 'AWAIT_NEW_NAME';
            (0, sessionManager_1.setSession)(chatId, 'editUser', session);
            yield bot.sendMessage(chatId, `Enter the new full name for *${(0, telegram_1.escapeMarkdown)(session.displayName || '')}*:\n\n(Type /cancel to stop)`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
        else {
            session.stage = 'AWAIT_NEW_USERNAME';
            (0, sessionManager_1.setSession)(chatId, 'editUser', session);
            yield bot.sendMessage(chatId, `Enter the new Telegram username for *${(0, telegram_1.escapeMarkdown)(session.displayName || '')}* (e.g., @username):\n\n(Type /cancel to stop)`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[cancelBtn]] }
            });
        }
    });
}
function handleNameInput(bot, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const chatId = message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_NEW_NAME' || !session.userId)
            return;
        const newName = (_a = message.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!newName || newName === '/cancel')
            return;
        try {
            yield (0, userService_1.updateUserDisplayName)(session.userId, newName);
            const name = (0, telegram_1.escapeMarkdown)(newName);
            const creator = ((_b = message.from) === null || _b === void 0 ? void 0 : _b.first_name) + (((_c = message.from) === null || _c === void 0 ? void 0 : _c.last_name) ? ' ' + ((_d = message.from) === null || _d === void 0 ? void 0 : _d.last_name) : '');
            yield bot.sendMessage(chatId, `✅ Success! Name updated to *${name}*.`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: session.displayName || 'Unknown',
                action: 'UPDATE_USER_NAME',
                description: `Updated name for user ${session.displayName} to ${newName}`,
                createdBy: creator
            }, true);
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'editUser');
        }
    });
}
function handleUsernameInput(bot, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const chatId = message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_NEW_USERNAME' || !session.userId)
            return;
        const newUsername = (_a = message.text) === null || _a === void 0 ? void 0 : _a.trim().replace(/^@/, '');
        if (!newUsername || message.text === '/cancel')
            return;
        try {
            yield (0, userService_1.updateUserTelegramUsername)(session.userId, newUsername);
            const username = (0, telegram_1.escapeMarkdown)(newUsername);
            const creator = ((_b = message.from) === null || _b === void 0 ? void 0 : _b.first_name) + (((_c = message.from) === null || _c === void 0 ? void 0 : _c.last_name) ? ' ' + ((_d = message.from) === null || _d === void 0 ? void 0 : _d.last_name) : '');
            yield bot.sendMessage(chatId, `✅ Success! Username updated to @${username}.`, { parse_mode: 'Markdown' });
            // Log Activity
            yield (0, activityService_1.logActivity)(bot, {
                employeeName: session.displayName || 'Unknown',
                action: 'UPDATE_USER_USERNAME',
                description: `Updated telegram username for user ${session.displayName} to @${newUsername}`,
                createdBy: creator
            }, true);
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'editUser');
        }
    });
}
function registerEditUserFlow(bot) {
    bot.on('callback_query', (callbackQuery) => {
        var _a, _b;
        if (callbackQuery.data === 'edit_user_cancel') {
            if ((0, sessionManager_1.getSession)(callbackQuery.message.chat.id, 'editUser')) {
                (0, sessionManager_1.clearSession)(callbackQuery.message.chat.id, 'editUser');
                bot.answerCallbackQuery(callbackQuery.id, { text: 'Edit cancelled' });
                bot.sendMessage(callbackQuery.message.chat.id, "❌ Edit flow cancelled.");
            }
            return;
        }
        if ((_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.startsWith('edit_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
        else if ((_b = callbackQuery.data) === null || _b === void 0 ? void 0 : _b.startsWith('edit_user_field_')) {
            handleFieldSelection(bot, callbackQuery);
        }
    });
    bot.on('message', (message) => {
        if (message.text === '/cancel') {
            if ((0, sessionManager_1.getSession)(message.chat.id, 'editUser')) {
                (0, sessionManager_1.clearSession)(message.chat.id, 'editUser');
                bot.sendMessage(message.chat.id, "❌ Edit flow cancelled.");
            }
            return;
        }
        const session = (0, sessionManager_1.getSession)(message.chat.id, 'editUser');
        if (!session)
            return;
        if (session.stage === 'AWAIT_NEW_NAME') {
            handleNameInput(bot, message);
        }
        else if (session.stage === 'AWAIT_NEW_USERNAME') {
            handleUsernameInput(bot, message);
        }
    });
}
