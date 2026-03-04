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
exports.adminOnly = exports.authorized = void 0;
const userService_1 = require("../../features/users/userService");
const telegram_1 = require("../utils/telegram");
const isAdmin = (user) => {
    return (user === null || user === void 0 ? void 0 : user.role) === 'admin';
};
/**
 * Ensures the sender is a registered user.
 */
const authorized = (bot, handler) => (msg, match) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const telegramUsername = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
    if (!telegramUsername) {
        bot.sendMessage(msg.chat.id, telegram_1.RESPONSES.ERROR("We couldn't get your Telegram username. Please set one in your Settings."), { parse_mode: 'Markdown' });
        return;
    }
    const user = yield (0, userService_1.getUserByTelegramUsername)(telegramUsername);
    if (!user) {
        bot.sendMessage(msg.chat.id, telegram_1.RESPONSES.WARNING("You are not authorized to use this bot. Please contact the Admin."), { parse_mode: 'Markdown' });
        return;
    }
    const displayName = user.displayName || user.email || telegramUsername;
    handler(msg, match, displayName);
});
exports.authorized = authorized;
/**
 * Ensures the sender is an Admin.
 */
const adminOnly = (bot, handler) => (0, exports.authorized)(bot, (msg, match, username) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const telegramUsername = (_a = msg.from) === null || _a === void 0 ? void 0 : _a.username;
    if (!telegramUsername) {
        bot.sendMessage(msg.chat.id, telegram_1.RESPONSES.ERROR("We couldn't get your Telegram username. Please set one in your Settings."), { parse_mode: 'Markdown' });
        return;
    }
    const user = yield (0, userService_1.getUserByTelegramUsername)(telegramUsername);
    if (!isAdmin(user)) {
        bot.sendMessage(msg.chat.id, telegram_1.RESPONSES.WARNING("⛔ **Admin Only Command.**\nAccess denied."), { parse_mode: 'Markdown' });
        return;
    }
    handler(msg, match, username);
}));
exports.adminOnly = adminOnly;
