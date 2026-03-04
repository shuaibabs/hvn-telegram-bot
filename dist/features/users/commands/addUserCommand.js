"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserCommand = addUserCommand;
const userService_1 = require("../userService");
const broadcastService_1 = require("../../../features/broadcast/broadcastService");
const env_1 = require("../../../config/env");
const auth_1 = require("../../../shared/middleware/auth");
const validation_1 = require("../../../shared/services/validation");
function addUserCommand(bot) {
    bot.onText(/\/adduser (\S+) (.+) (admin|employee) (\S+)/, (0, auth_1.adminOnly)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.USERS, 'User Management'))
            return;
        if (!match)
            return;
        const [_, email, name, role, tgUsername] = match;
        try {
            yield (0, userService_1.addUser)({
                email,
                displayName: name,
                role: role,
                telegramUsername: tgUsername,
            });
            const successMsg = `✅ New user *${name}* (${role}) added! (By Admin: @${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            (0, broadcastService_1.broadcast)(env_1.GROUPS.USERS, successMsg);
        }
        catch (e) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    })));
}
