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
function startDeleteUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users to delete.");
                return;
            }
            const userButtons = users.map((user) => ([{
                    text: `${user.displayName} (@${user.telegramUsername})`,
                    callback_data: `delete_user_select_${user.id}`,
                }]));
            yield bot.sendMessage(chatId, "*Select a user to delete:*", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: userButtons,
                },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
        }
    });
}
function handleUserSelection(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const userId = (_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        const messageId = (_b = callbackQuery.message) === null || _b === void 0 ? void 0 : _b.message_id;
        const chatId = (_c = callbackQuery.message) === null || _c === void 0 ? void 0 : _c.chat.id;
        if (!userId || !chatId || !messageId)
            return;
        yield bot.deleteMessage(chatId, messageId);
        yield bot.sendMessage(chatId, "Are you sure you want to delete this user?", {
            reply_markup: {
                inline_keyboard: [[
                        { text: "Yes, I'm sure", callback_data: `delete_user_confirm_${userId}` },
                        { text: "No, cancel", callback_data: 'delete_user_cancel' },
                    ]],
            },
        });
    });
}
function handleConfirmation(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const userId = (_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.split('_').pop();
        const messageId = (_b = callbackQuery.message) === null || _b === void 0 ? void 0 : _b.message_id;
        const chatId = (_c = callbackQuery.message) === null || _c === void 0 ? void 0 : _c.chat.id;
        if (!userId || !chatId || !messageId)
            return;
        yield bot.deleteMessage(chatId, messageId);
        if ((_d = callbackQuery.data) === null || _d === void 0 ? void 0 : _d.startsWith('delete_user_confirm_')) {
            try {
                yield (0, userService_1.deleteUser)(userId);
                yield bot.sendMessage(chatId, "User has been deleted.");
            }
            catch (error) {
                yield bot.sendMessage(chatId, `Error deleting user: ${error.message}`);
            }
        }
        else {
            yield bot.sendMessage(chatId, "Deletion cancelled.");
        }
    });
}
function registerDeleteUserFlow(bot) {
    bot.on('callback_query', (callbackQuery) => {
        var _a, _b;
        if ((_a = callbackQuery.data) === null || _a === void 0 ? void 0 : _a.startsWith('delete_user_select_')) {
            handleUserSelection(bot, callbackQuery);
        }
        if (((_b = callbackQuery.data) === null || _b === void 0 ? void 0 : _b.startsWith('delete_user_confirm_')) || callbackQuery.data === 'delete_user_cancel') {
            handleConfirmation(bot, callbackQuery);
        }
    });
}
