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
exports.handleEditUserResponse = handleEditUserResponse;
const userService_1 = require("../../services/userService");
const sessionManager_1 = require("../../services/sessionManager");
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
            const userButtons = users.map(user => ([{
                    text: `${user.displayName} (${user.role}) - @${user.telegramUsername}`,
                    callback_data: `edit_user_select_${user.id}`
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
function handleEditUserResponse(bot, response) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const msg = response.message || ((_a = response.callback_query) === null || _a === void 0 ? void 0 : _a.message);
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'editUser');
        if (!session)
            return;
        const data = (_b = response.callback_query) === null || _b === void 0 ? void 0 : _b.data;
        if ((data === null || data === void 0 ? void 0 : data.startsWith('edit_user_select_')) && session.stage === 'AWAIT_USER_SELECTION') {
            const userId = data.split('_').pop();
            session.stage = 'AWAIT_NEW_USERNAME';
            session.userId = userId;
            (0, sessionManager_1.setSession)(chatId, 'editUser', session);
            yield bot.deleteMessage(chatId, msg.message_id);
            yield bot.sendMessage(chatId, "Please enter the new Telegram username for the user (e.g., @newusername).");
        }
        else if (((_c = response.message) === null || _c === void 0 ? void 0 : _c.text) && session.stage === 'AWAIT_NEW_USERNAME') {
            const newUsername = response.message.text.replace(/^@/, '');
            try {
                yield (0, userService_1.updateUserTelegramUsername)(session.userId, newUsername, 'admin'); // Assuming admin is performing the action
                yield bot.sendMessage(chatId, `User @${newUsername} has been updated.`);
            }
            catch (error) {
                yield bot.sendMessage(chatId, `Error updating user: ${error.message}`);
            }
            (0, sessionManager_1.clearSession)(chatId, 'editUser');
        }
    });
}
