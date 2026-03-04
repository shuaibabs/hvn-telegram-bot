"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageUsersCommand = manageUsersCommand;
exports.sendUsersMenu = sendUsersMenu;
const env_1 = require("../../config/env");
const validation_1 = require("../../middleware/validation");
function manageUsersCommand(bot) {
    bot.onText(/\/manageusers/, (msg) => {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.USERS, 'User Management'))
            return;
        sendUsersMenu(bot, msg.chat.id);
    });
}
function sendUsersMenu(bot, chatId) {
    const text = "*User Management*\n\nWhat would you like to do?";
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '👤 Create User', callback_data: 'create_user' },
                    { text: '✏️ Edit User', callback_data: 'edit_user' },
                ],
                [
                    { text: '🗑️ Delete User', callback_data: 'delete_user' },
                    { text: '👁️ View Users', callback_data: 'view_users' },
                ],
            ],
        },
    };
    bot.sendMessage(chatId, text, options);
}
