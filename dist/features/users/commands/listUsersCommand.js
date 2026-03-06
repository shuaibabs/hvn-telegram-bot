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
exports.listUsersCommand = listUsersCommand;
const userService_1 = require("../userService");
/**
 * Escapes special characters for Telegram Markdown (V1)
 * Characters: _, *, [
 */
function escapeMarkdown(text) {
    return text.replace(/[_*\[]/g, '\\$&');
}
function listUsersCommand(bot, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield (0, userService_1.getAllUsers)();
            let message = "*All Users:*\n";
            if (users.length === 0) {
                message = "No users found.";
            }
            else {
                users.forEach(user => {
                    const name = escapeMarkdown(user.displayName);
                    const username = escapeMarkdown(user.telegramUsername || 'N/A');
                    const role = escapeMarkdown(user.role);
                    const email = escapeMarkdown(user.email);
                    message += `\n*${name}* (@${username}) - ${role}\nEmail: ${email}\n`;
                });
            }
            bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            console.error('Error in listUsersCommand:', error);
            bot.sendMessage(msg.chat.id, `Error fetching users: ${error.message}`);
        }
    });
}
