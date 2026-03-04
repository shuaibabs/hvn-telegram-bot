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
const EDIT_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_NEW_USERNAME: 'AWAIT_NEW_USERNAME',
};
function startEditUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users to edit.");
                return;
            }
            const userButtons = users.map((user) => ([{
                    text: `${user.displayName} (${user.role}) - @${user.telegramUsername}`,
                    callback_data: `edit_user_select_${user.id}:${user.displayName}`
                }]));
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
            yield bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
        }
    });
}
function handleUserSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = callbackQuery.message;
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_USER_SELECTION')
            return;
        const data = callbackQuery.data;
        if (!data)
            return;
        const [_, userId, displayName] = data.match(/edit_user_select_(.+):(.+)/) || [];
        session.stage = 'AWAIT_NEW_USERNAME';
        session.userId = userId;
        session.displayName = displayName;
        (0, sessionManager_1.setSession)(chatId, 'editUser', session);
        yield bot.answerCallbackQuery(callbackQuery.id);
        yield bot.deleteMessage(chatId, msg.message_id);
        yield bot.sendMessage(chatId, `Please enter the new Telegram username for *${displayName}* (e.g., @newusername).`, { parse_mode: 'Markdown' });
    });
}
function handleUsernameInput(bot, message) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const chatId = message.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session || session.stage !== 'AWAIT_NEW_USERNAME' || !session.userId)
            return;
        const newUsername = (_a = message.text) === null || _a === void 0 ? void 0 : _a.trim().replace(/^@/, '');
        if (!newUsername) {
            yield bot.sendMessage(chatId, "Username cannot be empty. Please enter a valid username.");
            return;
        }
        try {
            yield (0, userService_1.updateUserTelegramUsername)(session.userId, newUsername);
            yield bot.sendMessage(chatId, `✅ Success! User *${session.displayName}* has been updated to @${newUsername}.`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
        }
        finally {
            (0, sessionManager_1.clearSession)(chatId, 'editUser');
        }
    });
}
function registerEditUserFlow(bot) {
    bot.on('callback_query', (callbackQuery) => {
        var _a;
        if ((_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.startsWith('edit_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
    });
    bot.on('message', (message) => {
        const session = (0, sessionManager_1.getSession)(message.chat.id, 'editUser');
        if (session && session.stage === 'AWAIT_NEW_USERNAME') {
            handleUsernameInput(bot, message);
        }
    });
}
