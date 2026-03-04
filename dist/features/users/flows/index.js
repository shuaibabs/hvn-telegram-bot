"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserFlows = registerUserFlows;
const createUserFlow_1 = require("./createUserFlow");
const deleteUserFlow_1 = require("./deleteUserFlow");
const editUserFlow_1 = require("./editUserFlow");
function registerUserFlows(bot) {
    (0, createUserFlow_1.registerCreateUserFlow)(bot);
    (0, deleteUserFlow_1.registerDeleteUserFlow)(bot);
    (0, editUserFlow_1.registerEditUserFlow)(bot);
}
