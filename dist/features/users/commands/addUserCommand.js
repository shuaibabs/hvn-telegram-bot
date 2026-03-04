"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserCommand = addUserCommand;
const createUserFlow_1 = require("../flows/createUserFlow");
function addUserCommand(bot, msg) {
    (0, createUserFlow_1.startCreateUserFlow)(bot, msg.chat.id);
}
