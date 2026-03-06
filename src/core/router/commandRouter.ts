import TelegramBot from 'node-telegram-bot-api';
import { hasAnySession } from '../bot/sessionManager';

export interface CommandCallback {
    (msg: TelegramBot.Message, match: RegExpExecArray | null): void;
}

export interface CallbackCallback {
    (query: TelegramBot.CallbackQuery): void;
}

export interface RegisteredCommand {
    pattern: RegExp;
    callback: CommandCallback;
    allowedGroupIds?: string[];
}

export interface RegisteredCallback {
    data: string | RegExp;
    callback: CallbackCallback;
    allowedGroupIds?: string[];
}

export class CommandRouter {
    private commands: RegisteredCommand[] = [];
    private callbacks: RegisteredCallback[] = [];
    private fallbackHandler: ((msg: TelegramBot.Message) => void) | null = null;
    public bot: TelegramBot;

    constructor(bot: TelegramBot) {
        this.bot = bot;
    }

    register(pattern: RegExp, callback: CommandCallback, allowedGroupIds?: string[]) {
        this.commands.push({ pattern, callback, allowedGroupIds });
    }

    registerCallback(data: string | RegExp, callback: CallbackCallback, allowedGroupIds?: string[]) {
        this.callbacks.push({ data, callback, allowedGroupIds });
    }

    setFallbackHandler(handler: (msg: TelegramBot.Message) => void) {
        this.fallbackHandler = handler;
    }

    listen() {
        // Handle text commands
        this.bot.on('message', (msg: TelegramBot.Message) => {
            const user = msg.from;
            const userName = user ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'Unknown';
            const userHandle = user?.username ? ` (@${user.username})` : '';
            console.log(`[MESSAGE] From: ${userName}${userHandle} [ID: ${user?.id}] | Text: ${msg.text || '[No Text]'}`);

            if (!msg.text) return;

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
                        if (cmd.allowedGroupIds.indexOf(chatId) === -1) continue;
                    }

                    cmd.callback(msg, match);
                    matched = true;
                    break;
                }
            }

            if (matched) return;

            // If not a command, check if user is in a session
            // If they are in a session, we DON'T show the fallback (let the flow handle it)
            if (hasAnySession(msg.chat.id)) {
                return;
            }

            if (this.fallbackHandler) {
                this.fallbackHandler(msg);
            }
        });

        // Handle inline button clicks (callback queries)
        this.bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
            const user = query.from;
            const userName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            const userHandle = user.username ? ` (@${user.username})` : '';
            console.log(`[CALLBACK] From: ${userName}${userHandle} [ID: ${user.id}] | Data: ${query.data}`);

            if (!query.data) return;

            const chatId = query.message?.chat.id.toString();
            const data = query.data;

            for (const cb of this.callbacks) {
                let isMatch = false;
                if (typeof cb.data === 'string') {
                    isMatch = cb.data === data;
                } else if (cb.data instanceof RegExp) {
                    isMatch = cb.data.test(data);
                }

                if (isMatch) {
                    // Check group permissions if chatId is available
                    if (chatId && cb.allowedGroupIds && cb.allowedGroupIds.length > 0) {
                        if (cb.allowedGroupIds.indexOf(chatId) === -1) continue;
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
