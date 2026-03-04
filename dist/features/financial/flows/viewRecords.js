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
exports.listAllRecords = listAllRecords;
const financialService_1 = require("../financialService");
const userService_1 = require("../../users/userService"); // To get user names
function listAllRecords(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const records = yield (0, financialService_1.getAllFinancialRecords)();
            const users = yield (0, userService_1.getAllUsers)();
            const userMap = new Map(users.map((u) => [u.id, u.displayName]));
            if (records.length === 0) {
                yield bot.sendMessage(chatId, "There are no financial records.");
                return;
            }
            const recordList = records.map(r => {
                const userName = r.userId ? userMap.get(r.userId) || 'Unknown User' : 'Unknown User';
                return `*${r.category}* (${r.type}) - ${r.amount} - ${r.description} on ${r.date.toDateString()} for ${userName}`;
            }).join('\n');
            const message = `*All Financial Records: *\n\n${recordList}`;
            yield bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `Error fetching records: ${error.message}`);
        }
    });
}
