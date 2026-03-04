"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommandHandlers = registerCommandHandlers;
const index_1 = require("../features/users/commands/index");
function registerCommandHandlers(bot) {
    (0, index_1.registerUserCommands)(bot);
}
