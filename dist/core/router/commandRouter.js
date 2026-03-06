"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRouter = void 0;
const sessionManager_1 = require("../bot/sessionManager");
class CommandRouter {
    constructor(bot) {
        this.commands = [];
        this.callbacks = [];
        this.fallbackHandler = null;
        this.bot = bot;
    }
    register(pattern, callback, allowedGroupIds) {
        this.commands.push({ pattern, callback, allowedGroupIds });
    }
    registerCallback(data, callback, allowedGroupIds) {
        this.callbacks.push({ data, callback, allowedGroupIds });
    }
    setFallbackHandler(handler) {
        this.fallbackHandler = handler;
    }
    listen() {
        // Handle text commands
        this.bot.on('message', (msg) => {
            const user = msg.from;
            const userName = user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'Unknown';
            const userHandle = (user === null || user === void 0 ? void 0 : user.username) ? ` (@${user.username})` : '';
            console.log(`[MESSAGE] From: ${userName}${userHandle} [ID: ${user === null || user === void 0 ? void 0 : user.id}] | Text: ${msg.text || '[No Text]'}`);
            if (!msg.text)
                return;
            const chatId = msg.chat.id.toString();
            const text = msg.text.trim();
            const startRegex = /^(?:\/start|start)$/i;
            const isStart = startRegex.test(text);
            let matched = false;
            for (const cmd of this.commands) {
                const patternToUse = isStart && cmd.pattern.source.includes('start') ? startRegex : cmd.pattern;
                const match = patternToUse.exec(text);
                if (match) {
                    if (cmd.allowedGroupIds && cmd.allowedGroupIds.length > 0) {
                        if (cmd.allowedGroupIds.indexOf(chatId) === -1)
                            continue;
                    }
                    cmd.callback(msg, match);
                    matched = true;
                    break;
                }
            }
            if (matched)
                return;
            // If not a command, check if user is in a session
            // If they are in a session, we DON'T show the fallback (let the flow handle it)
            if ((0, sessionManager_1.hasAnySession)(msg.chat.id)) {
                return;
            }
            if (this.fallbackHandler) {
                this.fallbackHandler(msg);
            }
        });
        // Handle inline button clicks (callback queries)
        this.bot.on('callback_query', (query) => {
            var _a;
            const user = query.from;
            const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            const userHandle = user.username ? ` (@${user.username})` : '';
            console.log(`[CALLBACK] From: ${userName}${userHandle} [ID: ${user.id}] | Data: ${query.data}`);
            if (!query.data)
                return;
            const chatId = (_a = query.message) === null || _a === void 0 ? void 0 : _a.chat.id.toString();
            const data = query.data;
            for (const cb of this.callbacks) {
                let isMatch = false;
                if (typeof cb.data === 'string') {
                    isMatch = cb.data === data;
                }
                else if (cb.data instanceof RegExp) {
                    isMatch = cb.data.test(data);
                }
                if (isMatch) {
                    // Check group permissions if chatId is available
                    if (chatId && cb.allowedGroupIds && cb.allowedGroupIds.length > 0) {
                        if (cb.allowedGroupIds.indexOf(chatId) === -1)
                            continue;
                    }
                    cb.callback(query);
                    // Answer callback query to stop the loading icon in Telegram
                    this.bot.answerCallbackQuery(query.id);
                    return;
                }
            }
        });
    }
}
exports.CommandRouter = CommandRouter;
