"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommandHandlers = registerCommandHandlers;
const general_1 = require("./commands/general");
const users_1 = require("./commands/users");
function registerCommandHandlers(bot) {
    (0, general_1.registerGeneralCommands)(bot);
    (0, users_1.registerUserCommands)(bot);
}
