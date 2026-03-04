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
exports.handleFinancialManagementResponse = handleFinancialManagementResponse;
const addRecordFlow_1 = require("./addRecordFlow");
const deleteRecordFlow_1 = require("./deleteRecordFlow");
const viewRecords_1 = require("./viewRecords");
function handleFinancialManagementResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, message } = callbackQuery;
        if (!data || !message)
            return;
        const chatId = message.chat.id;
        // Remove the previous message to keep the chat clean
        yield bot.deleteMessage(chatId, message.message_id);
        switch (data) {
            case 'add_record':
                yield (0, addRecordFlow_1.startAddRecordFlow)(bot, chatId);
                break;
            case 'delete_record':
                yield (0, deleteRecordFlow_1.startDeleteRecordFlow)(bot, chatId);
                break;
            case 'view_records':
                yield (0, viewRecords_1.listAllRecords)(bot, chatId);
                break;
        }
    });
}
