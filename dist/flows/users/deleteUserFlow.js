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
exports.handleDeleteUserResponse = handleDeleteUserResponse;
const userService_1 = require("../../services/userService");
function startDeleteUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users to delete.");
                return;
            }
            const userButtons = users.map(user => ([{
                    text: `${user.displayName} (${user.role}) - @${user.telegramUsername}`,
                    callback_data: `delete_user_confirm_${user.id}`
                }]));
            const options = {
                reply_markup: {
                    inline_keyboard: userButtons
                }
            };
            yield bot.sendMessage(chatId, "*Select a user to delete:*", Object.assign({ parse_mode: 'Markdown' }, options));
        }
        catch (error) {
            yield bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
        }
    });
}
function handleDeleteUserResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, message } = callbackQuery;
        if (!data || !message)
            return;
        const chatId = message.chat.id;
        const userId = data.split('_').pop();
        if (data.startsWith('delete_user_confirm_')) {
            yield bot.deleteMessage(chatId, message.message_id);
            try {
                yield (0, userService_1.deleteUser)(userId, 'admin'); // Assuming admin is performing the action
                yield bot.sendMessage(chatId, `User with ID ${userId} has been deleted.`);
            }
            catch (error) {
                yield bot.sendMessage(chatId, `Error deleting user: ${error.message}`);
            }
        }
    });
}
