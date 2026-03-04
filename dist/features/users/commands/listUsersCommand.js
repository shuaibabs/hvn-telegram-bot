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
exports.listUsersCommand = listUsersCommand;
const env_1 = require("../../../config/env");
const auth_1 = require("../../../shared/middleware/auth");
const validation_1 = require("../../../shared/services/validation");
const viewUsersFlow_1 = require("../flows/viewUsersFlow");
function listUsersCommand(bot) {
    bot.onText(/\/listusers/, (0, auth_1.adminOnly)(bot, (msg) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.USERS, 'User Management'))
            return;
        yield (0, viewUsersFlow_1.listUsers)(bot, msg.chat.id);
    })));
}
