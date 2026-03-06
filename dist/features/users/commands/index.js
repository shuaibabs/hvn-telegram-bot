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
    const allowedGroups = hvnManageUsersGroupId ? [hvnManageUsersGroupId] : [];
    // Group-specific Start/Menu command
    router.register(/\/start/, (msg) => (0, manageUsersCommand_1.manageUsersCommand)(router.bot, msg), allowedGroups);
    router.register(/\/addUser/, (msg) => (0, addUserCommand_1.addUserCommand)(router.bot, msg), allowedGroups);
    router.register(/\/deleteUser/, (msg) => (0, deleteUserCommand_1.deleteUserCommand)(router.bot, msg), allowedGroups);
    router.register(/\/editUser/, (msg) => (0, editUserCommand_1.editUserCommand)(router.bot, msg), allowedGroups);
    router.register(/\/listUsers/, (msg) => (0, listUsersCommand_1.listUsersCommand)(router.bot, msg), allowedGroups);
    router.register(/\/manageUsers/, (msg) => (0, manageUsersCommand_1.manageUsersCommand)(router.bot, msg), allowedGroups);
    // Global Cancel Command
    router.register(/\/cancel/, (msg) => {
        // Handled individually by flow listeners, but we can add a fallback here
        // router.bot.sendMessage(msg.chat.id, "No active flow to cancel.");
    });
    // Register Callbacks for Inline Menu
    router.registerCallback('manage_users_start', (query) => {
        if (query.message)
            (0, manageUsersCommand_1.manageUsersCommand)(router.bot, query.message);
    }, allowedGroups);
    router.registerCallback('manage_users_list', (query) => {
        if (query.message)
            (0, listUsersCommand_1.listUsersCommand)(router.bot, query.message);
    }, allowedGroups);
    router.registerCallback('manage_users_add', (query) => {
        if (query.message)
            (0, addUserCommand_1.addUserCommand)(router.bot, query.message);
    }, allowedGroups);
    router.registerCallback('manage_users_edit', (query) => {
        if (query.message)
            (0, editUserCommand_1.editUserCommand)(router.bot, query.message);
    }, allowedGroups);
    router.registerCallback('manage_users_delete', (query) => {
        if (query.message)
            (0, deleteUserCommand_1.deleteUserCommand)(router.bot, query.message);
    }, allowedGroups);
}
