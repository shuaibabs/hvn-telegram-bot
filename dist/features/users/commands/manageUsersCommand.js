"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageUsersCommand = manageUsersCommand;
function manageUsersCommand(bot, msg) {
    const chatId = msg.chat.id;
    const text = "*User Management*\n\nWhat would you like to do?";
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "List Users", callback_data: "manage_users_list" }],
                [{ text: "Add User", callback_data: "manage_users_add" }],
                [{ text: "Edit User", callback_data: "manage_users_edit" }],
                [{ text: "Delete User", callback_data: "manage_users_delete" }],
            ],
        },
    };
    bot.sendMessage(chatId, text, options);
}
