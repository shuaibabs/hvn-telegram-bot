"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFlowHandlers = registerFlowHandlers;
const flows_1 = require("../../users/flows");
function registerFlowHandlers(bot) {
    (0, flows_1.registerUserFlows)(bot);
}
