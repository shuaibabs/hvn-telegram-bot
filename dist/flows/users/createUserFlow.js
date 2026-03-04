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
exports.startCreateUserFlow = startCreateUserFlow;
exports.handleCreateUserResponse = handleCreateUserResponse;
const userService_1 = require("../../services/userService");
const sessionManager_1 = require("../../services/sessionManager");
const validation_1 = require("../../utils/validation");
// ─── Constants ──────────────────────────────────────────────────────────────
const CREATE_STAGES = {
    AWAIT_NAME: 'AWAIT_NAME',
    AWAIT_EMAIL: 'AWAIT_EMAIL',
    AWAIT_ROLE: 'AWAIT_ROLE',
    AWAIT_TELEGRAM: 'AWAIT_TELEGRAM',
    CONFIRM: 'CONFIRM',
};
// ─── Flow Steps ─────────────────────────────────────────────────────────────
function startCreateUserFlow(bot, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, sessionManager_1.setSession)(chatId, 'createUser', {
            stage: 'AWAIT_NAME',
            newUser: {},
        });
        yield bot.sendMessage(chatId, "Let's create a new user. What is their full name?");
    });
}
function handleNameInput(bot, msg, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const name = (_a = msg.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!name) {
            yield bot.sendMessage(msg.chat.id, "Name cannot be empty. Please enter the user's full name.");
            return;
        }
        session.newUser.displayName = name;
        session.stage = 'AWAIT_EMAIL';
        (0, sessionManager_1.setSession)(msg.chat.id, 'createUser', session);
        yield bot.sendMessage(msg.chat.id, `Got it. Now, what is ${name}'s email address?`);
    });
}
function handleEmailInput(bot, msg, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const email = (_a = msg.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!email || !(0, validation_1.isValidEmail)(email)) {
            yield bot.sendMessage(msg.chat.id, "That doesn't look like a valid email. Please try again.");
            return;
        }
        session.newUser.email = email;
        session.stage = 'AWAIT_ROLE';
        (0, sessionManager_1.setSession)(msg.chat.id, 'createUser', session);
        yield bot.sendMessage(msg.chat.id, 'What role should this user have?', {
            reply_markup: {
                inline_keyboard: [[{
                            text: '👑 Admin',
                            callback_data: 'create_user_role_admin'
                        }, {
                            text: '👷 Employee',
                            callback_data: 'create_user_role_employee'
                        }]],
            },
        });
    });
}
function handleRoleSelection(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const role = callbackQuery.data === 'create_user_role_admin' ? 'admin' : 'employee';
        session.newUser.role = role;
        session.stage = 'AWAIT_TELEGRAM';
        (0, sessionManager_1.setSession)(callbackQuery.message.chat.id, 'createUser', session);
        yield bot.answerCallbackQuery(callbackQuery.id);
        yield bot.sendMessage(callbackQuery.message.chat.id, `Role set to ${role}. Finally, what is their Telegram username? (e.g., @username)`);
    });
}
function handleTelegramInput(bot, msg, session) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const username = (_a = msg.text) === null || _a === void 0 ? void 0 : _a.trim().replace(/^@/, '');
        if (!username) {
            yield bot.sendMessage(msg.chat.id, "Username cannot be empty. Please enter their Telegram username.");
            return;
        }
        session.newUser.telegramUsername = username;
        session.stage = 'CONFIRM';
        (0, sessionManager_1.setSession)(msg.chat.id, 'createUser', session);
        yield sendConfirmation(bot, msg.chat.id, session);
    });
}
function sendConfirmation(bot, chatId, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const { displayName, email, role, telegramUsername } = session.newUser;
        const text = `Please confirm the details:\n\n*Name*: ${displayName}\n*Email*: ${email}\n*Role*: ${role}\n*Telegram*: @${telegramUsername}\n\nDoes this look correct?`;
        yield bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                            text: '✅ Yes, Create User',
                            callback_data: 'create_user_confirm_yes'
                        }], [{
                            text: '❌ No, Start Over',
                            callback_data: 'create_user_confirm_no'
                        }]],
            },
        });
    });
}
function handleConfirmation(bot, callbackQuery, session) {
    return __awaiter(this, void 0, void 0, function* () {
        const decision = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        yield bot.answerCallbackQuery(callbackQuery.id);
        if (decision === 'create_user_confirm_yes') {
            try {
                // The user object is validated by the addUser service
                yield (0, userService_1.addUser)(session.newUser, 'Telegram Bot');
                yield bot.sendMessage(chatId, `✅ Success! User *${session.newUser.displayName}* has been created.`, { parse_mode: 'Markdown' });
            }
            catch (error) {
                yield bot.sendMessage(chatId, `❌ An error occurred: ${error.message}`);
            }
        }
        else {
            yield bot.sendMessage(chatId, "Cancelled. Let's start over.");
            yield startCreateUserFlow(bot, chatId); // Restart the flow
        }
        (0, sessionManager_1.clearSession)(chatId, 'createUser');
    });
}
// ─── Main Handler ───────────────────────────────────────────────────────────
function handleCreateUserResponse(bot, update) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const msg = update.message;
        const callbackQuery = update.callback_query;
        const chatId = (msg === null || msg === void 0 ? void 0 : msg.chat.id) || ((_a = callbackQuery === null || callbackQuery === void 0 ? void 0 : callbackQuery.message) === null || _a === void 0 ? void 0 : _a.chat.id);
        if (!chatId)
            return;
        const session = (0, sessionManager_1.getSession)(chatId, 'createUser');
        if (!session)
            return; // Not in a create user flow
        if (callbackQuery) {
            if (session.stage === 'AWAIT_ROLE') {
                yield handleRoleSelection(bot, callbackQuery, session);
            }
            else if (session.stage === 'CONFIRM') {
                yield handleConfirmation(bot, callbackQuery, session);
            }
        }
        else if (msg && msg.text) {
            switch (session.stage) {
                case 'AWAIT_NAME':
                    yield handleNameInput(bot, msg, session);
                    break;
                case 'AWAIT_EMAIL':
                    yield handleEmailInput(bot, msg, session);
                    break;
                case 'AWAIT_TELEGRAM':
                    yield handleTelegramInput(bot, msg, session);
                    break;
            }
        }
    });
}
