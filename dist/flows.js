"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFlowHandlers = registerFlowHandlers;
const users_1 = require("./flows/users");
function registerFlowHandlers(bot) {
    (0, users_1.registerUserFlows)(bot);
}
