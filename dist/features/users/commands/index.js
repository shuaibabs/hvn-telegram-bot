"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserCommands = registerUserCommands;
const addUserCommand_1 = require("./addUserCommand");
const deleteUserCommand_1 = require("./deleteUserCommand");
const editUserCommand_1 = require("./editUserCommand");
const listUsersCommand_1 = require("./listUsersCommand");
const manageUsersCommand_1 = require("./manageUsersCommand");
function registerUserCommands(bot) {
    (0, addUserCommand_1.addUserCommand)(bot);
    (0, deleteUserCommand_1.deleteUserCommand)(bot);
    (0, editUserCommand_1.editUserCommand)(bot);
    (0, listUsersCommand_1.listUsersCommand)(bot);
    (0, manageUsersCommand_1.manageUsersCommand)(bot);
}
