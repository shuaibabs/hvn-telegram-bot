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
exports.startDeleteRecordFlow = startDeleteRecordFlow;
exports.handleDeleteRecordResponse = handleDeleteRecordResponse;
const financialService_1 = require("../financialService");
function startDeleteRecordFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const records = yield (0, financialService_1.getAllFinancialRecords)();
            if (records.length === 0) {
                yield bot.sendMessage(chatId, "There are no financial records to delete.");
                return;
            }
            const recordButtons = records.map(record => ([{
                    text: `${record.description} (${record.amount})`,
                    callback_data: `delete_record_${record.id}`
                }]));
            yield bot.sendMessage(chatId, "*Select a record to delete:*", {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: recordButtons },
            });
        }
        catch (error) {
            yield bot.sendMessage(chatId, `Error fetching records: ${error.message}`);
        }
    });
}
function handleDeleteRecordResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, message } = callbackQuery;
        if (!data || !message || !data.startsWith('delete_record_'))
            return;
        const chatId = message.chat.id;
        const recordId = data.split('_').pop();
        if (recordId) {
            try {
                yield (0, financialService_1.deleteFinancialRecord)(recordId, 'admin');
                yield bot.deleteMessage(chatId, message.message_id);
                yield bot.sendMessage(chatId, `Record with ID ${recordId} has been deleted.`);
            }
            catch (error) {
                yield bot.sendMessage(chatId, `Error deleting record: ${error.message}`);
            }
        }
    });
}
