"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFinancialFlows = registerFinancialFlows;
const addRecordFlow_1 = require("./addRecordFlow");
const deleteRecordFlow_1 = require("./deleteRecordFlow");
function registerFinancialFlows(bot) {
    bot.on('message', (msg) => {
        (0, addRecordFlow_1.handleAddRecordResponse)(bot, { message: msg });
    });
    bot.on('callback_query', (callbackQuery) => {
        (0, addRecordFlow_1.handleAddRecordResponse)(bot, { callback_query: callbackQuery });
        (0, deleteRecordFlow_1.handleDeleteRecordResponse)(bot, callbackQuery);
    });
}
