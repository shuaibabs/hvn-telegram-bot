"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRouter = void 0;
class CommandRouter {
    constructor(bot) {
        this.commands = new Map();
        this.bot = bot;
    }
    register(command, callback) {
        this.commands.set(command, callback);
    }
    listen() {
        this.bot.on('message', (msg) => {
            if (!msg.text)
                return;
            for (const [command, callback] of this.commands.entries()) {
                const match = command.exec(msg.text);
                if (match) {
                    callback(msg, match);
                    return; // Stop after first match
                }
            }
        });
    }
}
exports.CommandRouter = CommandRouter;
