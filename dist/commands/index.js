"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommandHandlers = registerCommandHandlers;
const commandRouter_1 = require("../core/router/commandRouter");
const index_1 = require("../features/users/commands/index");
const general_1 = require("./general");
function registerCommandHandlers(bot) {
    const router = new commandRouter_1.CommandRouter(bot);
    (0, index_1.registerUserCommands)(router);
    (0, general_1.registerGeneralCommands)(router);
    router.listen();
}
