"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommandHandlers = registerCommandHandlers;
const users_1 = require("./users");
function registerCommandHandlers(bot) {
    (0, users_1.registerUserCommands)(bot);
}
