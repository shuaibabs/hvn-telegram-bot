"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserCommand = deleteUserCommand;
const deleteUserFlow_1 = require("../flows/deleteUserFlow");
function deleteUserCommand(bot, msg) {
    (0, deleteUserFlow_1.startDeleteUserFlow)(bot, msg.chat.id);
}
