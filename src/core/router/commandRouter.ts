import TelegramBot from 'node-telegram-bot-api';

export class CommandRouter {
    private commands: Map<RegExp, (msg: TelegramBot.Message, match: RegExpExecArray | null) => void> = new Map();
    public bot: TelegramBot;

    constructor(bot: TelegramBot) {
        this.bot = bot;
    }

    register(command: RegExp, callback: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void) {
        this.commands.set(command, callback);
    }

    listen() {
        this.bot.on('message', (msg) => {
            if (!msg.text) return;

            for (const [command, callback] of this.commands.entries()) {
                const match = command.exec(msg.text);
                if (match) {
                    callback(msg, match);
                    return; // Stop after first match
                }
            }
        });
    }
}
