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
exports.handleUserManagementResponse = handleUserManagementResponse;
const createUserFlow_1 = require("./createUserFlow");
const deleteUserFlow_1 = require("./deleteUserFlow");
const editUserFlow_1 = require("./editUserFlow");
const viewUsersFlow_1 = require("./viewUsersFlow");
function handleUserManagementResponse(bot, callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const { data, message } = callbackQuery;
        if (!data || !message)
            return;
        const chatId = message.chat.id;
        // Remove the previous message to keep the chat clean
        yield bot.deleteMessage(chatId, message.message_id);
        switch (data) {
            case 'create_user':
                yield (0, createUserFlow_1.startCreateUserFlow)(bot, chatId);
                break;
            case 'edit_user':
                yield (0, editUserFlow_1.startEditUserFlow)(bot, chatId);
                break;
            case 'delete_user':
                yield (0, deleteUserFlow_1.startDeleteUserFlow)(bot, chatId);
                break;
            case 'view_users':
                yield (0, viewUsersFlow_1.listUsers)(bot, chatId);
                break;
        }
    });
}
