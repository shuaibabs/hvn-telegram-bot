import TelegramBot from 'node-telegram-bot-api';
import { addUser, UserRole } from '../userService';
import { broadcast } from '../../../features/broadcast/broadcastService';
import { GROUPS } from '../../../config/env';
import { adminOnly } from '../../../shared/middleware/auth';
import { validateGroup } from '../../../shared/services/validation';

export function addUserCommand(bot: TelegramBot) {
    bot.onText(/\/adduser (\S+) (.+) (admin|employee) (\S+)/, adminOnly(bot, async (msg: TelegramBot.Message, match: RegExpExecArray | null, username: string) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        if(!match) return;
        const [_, email, name, role, tgUsername] = match!;
        try {
            await addUser({
                email,
                displayName: name,
                role: role as UserRole,
                telegramUsername: tgUsername,
            });

            const successMsg = `✅ New user *${name}* (${role}) added! (By Admin: @${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.USERS, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));
}
