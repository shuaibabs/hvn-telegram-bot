"use strict";
/**
 * manageUsersFlow.ts
 * ---------------------------------------------------------------------------
 * Main flow for managing users. Displays the main menu and delegates to other flows.
 */
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
exports.handleUserManagementResponse = exports.sendUserManagementMenu = void 0;
const editUserFlow_1 = require("./editUserFlow");
const userService_1 = require("../services/userService");
const createUserFlow_1 = require("./createUserFlow");
const deleteUserFlow_1 = require("./deleteUserFlow");
const USER_MENU_TEXT = 'Please choose an option to manage users:';
const USER_MENU_KEYBOARD = {
    inline_keyboard: [
        [{ text: 'Create New User', callback_data: 'create_user' }],
        [{ text: 'Edit Existing User', callback_data: 'edit_user' }],
        [{ text: 'Delete Existing User', callback_data: 'delete_user' }],
        [{ text: 'View All Users', callback_data: 'view_users' }],
    ],
};
function sendUserManagementMenu(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield bot.sendMessage(chatId, USER_MENU_TEXT, {
            reply_markup: USER_MENU_KEYBOARD,
        });
    });
}
exports.sendUserManagementMenu = sendUserManagementMenu;
function viewAllUsers(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (0, userService_1.getAllUsers)();
        if (users.length === 0) {
            yield bot.sendMessage(chatId, 'No users found.');
            return;
        }
        let message = '<b>All Users:</b>\n\n';
        users.forEach(user => {
            message += `<b>Name:</b> ${user.displayName}\n`;
            message += `<b>Email:</b> ${user.email}\n`;
            message += `<b>Role:</b> ${user.role}\n`;
            message += `<b>Telegram:</b> ${user.telegramUsername || 'N/A'}\n\n`;
        });
        yield bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    });
}
function handleUserManagementResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        switch (data) {
            case 'create_user':
                yield (0, createUserFlow_1.startCreateUserFlow)(bot, chatId);
                break;
            case 'edit_user':
                yield (0, editUserFlow_1.startEditUserFlow)(bot, chatId);
                break;
            case 'delete_user':
                yield (0, deleteUserFlow_1.startDeleteUserFlow)(bot, chatId);
                break;
            case 'view_users':
                yield viewAllUsers(bot, chatId);
                break;
        }
    });
}
exports.handleUserManagementResponse = handleUserManagementResponse;
