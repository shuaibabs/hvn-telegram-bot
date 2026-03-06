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
exports.listUsers = listUsers;
const userService_1 = require("../userService");
const telegram_1 = require("../../../shared/utils/telegram");
function listUsers(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            if (users.length === 0) {
                yield bot.sendMessage(chatId, "There are no users in the system.");
                return;
            }
            const userList = users.map((user) => {
                const name = (0, telegram_1.escapeMarkdown)(user.displayName);
                const role = (0, telegram_1.escapeMarkdown)(user.role);
                const username = (0, telegram_1.escapeMarkdown)(user.telegramUsername || 'N/A');
                return `*${name}* (${role}) - @${username}`;
            }).join('\n');
            const message = `*All Users: *\n\n${userList}`;
            yield bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `Error fetching users: ${error.message}`);
        }
    });
}
