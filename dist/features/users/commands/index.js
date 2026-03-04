"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserCommands = registerUserCommands;
const env_1 = require("../../../config/env");
const addUserCommand_1 = require("./addUserCommand");
const deleteUserCommand_1 = require("./deleteUserCommand");
const editUserCommand_1 = require("./editUserCommand");
const listUsersCommand_1 = require("./listUsersCommand");
const manageUsersCommand_1 = require("./manageUsersCommand");
const hvnManageUsersGroupId = env_1.env.TG_GROUP_USERS;
function registerUserCommands(router) {
    router.register(/\/addUser/, (msg) => (0, addUserCommand_1.addUserCommand)(router.bot, msg));
    router.register(/\/deleteUser/, (msg) => (0, deleteUserCommand_1.deleteUserCommand)(router.bot, msg));
    router.register(/\/editUser/, (msg) => (0, editUserCommand_1.editUserCommand)(router.bot, msg));
    router.register(/\/listUsers/, (msg) => (0, listUsersCommand_1.listUsersCommand)(router.bot, msg));
    router.register(/\/manageUsers/, (msg) => (0, manageUsersCommand_1.manageUsersCommand)(router.bot, msg));
}
