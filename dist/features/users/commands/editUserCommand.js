"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editUserCommand = editUserCommand;
const editUserFlow_1 = require("../flows/editUserFlow");
function editUserCommand(bot, msg) {
    (0, editUserFlow_1.startEditUserFlow)(bot, msg.chat.id);
}
