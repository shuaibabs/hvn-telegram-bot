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
exports.startAddRecordFlow = startAddRecordFlow;
exports.handleAddRecordResponse = handleAddRecordResponse;
const sessionManager_1 = require("../../../core/bot/sessionManager");
const financialService_1 = require("../financialService");
const userService_1 = require("../../users/userService"); // Import user service to select a user
const ADD_RECORD_STAGES = {
    AWAIT_USER_SELECTION: 'AWAIT_USER_SELECTION',
    AWAIT_TYPE_SELECTION: 'AWAIT_TYPE_SELECTION',
    AWAIT_CATEGORY_SELECTION: 'AWAIT_CATEGORY_SELECTION',
    AWAIT_AMOUNT: 'AWAIT_AMOUNT',
    AWAIT_DESCRIPTION: 'AWAIT_DESCRIPTION',
};
function startAddRecordFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (0, userService_1.getAllUsers)();
        if (users.length === 0) {
            yield bot.sendMessage(chatId, "No users available to assign the record to.");
            return;
        }
        const userButtons = users.map((user) => ([{
                text: `${user.displayName}`,
                callback_data: `add_record_user_${user.id}`
            }]));
        (0, sessionManager_1.setSession)(chatId, 'addRecord', { stage: 'AWAIT_USER_SELECTION', record: {} });
        yield bot.sendMessage(chatId, "*Who does this record belong to?*", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: userButtons },
        });
    });
}
function handleAddRecordResponse(bot, response) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const msg = response.message || ((_a = response.callback_query) === null || _a === void 0 ? void 0 : _a.message);
        if (!msg)
            return;
        const chatId = msg.chat.id;
        const session = (0, sessionManager_1.getSession)(chatId, 'addRecord');
        if (!session)
            return;
        const data = (_b = response.callback_query) === null || _b === void 0 ? void 0 : _b.data;
        switch (session.stage) {
            case 'AWAIT_USER_SELECTION':
                if (data === null || data === void 0 ? void 0 : data.startsWith('add_record_user_')) {
                    session.record.userId = data.split('_').pop();
                    session.stage = 'AWAIT_TYPE_SELECTION';
                    (0, sessionManager_1.setSession)(chatId, 'addRecord', session);
                    yield bot.deleteMessage(chatId, msg.message_id);
                    yield bot.sendMessage(chatId, "*Is this an income or an expense?*", {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{
                                        text: 'Income',
                                        callback_data: 'add_record_type_income'
                                    }, {
                                        text: 'Expense',
                                        callback_data: 'add_record_type_expense'
                                    }]]
                        },
                    });
                }
                break;
            case 'AWAIT_TYPE_SELECTION':
                if (data === null || data === void 0 ? void 0 : data.startsWith('add_record_type_')) {
                    session.record.type = data.split('_').pop();
                    session.stage = 'AWAIT_CATEGORY_SELECTION';
                    (0, sessionManager_1.setSession)(chatId, 'addRecord', session);
                    yield bot.deleteMessage(chatId, msg.message_id);
                    yield bot.sendMessage(chatId, "*What is the category of this record?*", { parse_mode: 'Markdown' });
                }
                break;
            case 'AWAIT_CATEGORY_SELECTION':
                if ((_c = response.message) === null || _c === void 0 ? void 0 : _c.text) {
                    session.record.category = response.message.text;
                    session.stage = 'AWAIT_AMOUNT';
                    (0, sessionManager_1.setSession)(chatId, 'addRecord', session);
                    yield bot.sendMessage(chatId, "*What is the amount?*", { parse_mode: 'Markdown' });
                }
                break;
            case 'AWAIT_AMOUNT':
                if (((_d = response.message) === null || _d === void 0 ? void 0 : _d.text) && !isNaN(parseFloat(response.message.text))) {
                    session.record.amount = parseFloat(response.message.text);
                    session.stage = 'AWAIT_DESCRIPTION';
                    (0, sessionManager_1.setSession)(chatId, 'addRecord', session);
                    yield bot.sendMessage(chatId, "*Provide a short description:*", { parse_mode: 'Markdown' });
                }
                break;
            case 'AWAIT_DESCRIPTION':
                if ((_e = response.message) === null || _e === void 0 ? void 0 : _e.text) {
                    session.record.description = response.message.text;
                    try {
                        yield (0, financialService_1.addFinancialRecord)(session.record, 'admin');
                        yield bot.sendMessage(chatId, `Financial record has been added successfully.`);
                    }
                    catch (error) {
                        yield bot.sendMessage(chatId, `Error: ${error.message}`);
                    }
                    (0, sessionManager_1.clearSession)(chatId, 'addRecord');
                }
                break;
        }
    });
}
