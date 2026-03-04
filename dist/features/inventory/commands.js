"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommandHandlers = registerCommandHandlers;
const general_1 = require("./commands/general");
const commands_1 = require("../users/commands");
function registerCommandHandlers(bot) {
    (0, general_1.registerGeneralCommands)(bot);
    (0, commands_1.registerUserCommands)(bot);
}
