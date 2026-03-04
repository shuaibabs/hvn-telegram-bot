"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserFlows = registerUserFlows;
const createUserFlow_1 = require("./createUserFlow");
const deleteUserFlow_1 = require("./deleteUserFlow");
const editUserFlow_1 = require("./editUserFlow");
function registerUserFlows(bot) {
    bot.on('message', (msg) => {
        (0, createUserFlow_1.handleCreateUserResponse)(bot, { message: msg });
        (0, editUserFlow_1.handleEditUserResponse)(bot, { message: msg });
    });
    bot.on('callback_query', (callbackQuery) => {
        (0, createUserFlow_1.handleCreateUserResponse)(bot, { callback_query: callbackQuery });
        (0, deleteUserFlow_1.handleDeleteUserResponse)(bot, callbackQuery);
        (0, editUserFlow_1.handleEditUserResponse)(bot, { callback_query: callbackQuery });
    });
}
