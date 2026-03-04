import TelegramBot from 'node-telegram-bot-api';
import { addUser } from '../services/userService';
import { broadcast } from '../../broadcast/broadcastService';
import { GROUPS } from '../../../config/env';
import { adminOnly } from '../../../shared/middleware/auth';
import { validateGroup } from '../../../shared/middleware/validation';

export function addUserCommand(bot: TelegramBot) {
    bot.onText(/\/adduser (\S+) (.+) (admin|employee) (\S+)/, adminOnly(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        const [_, email, name, role, tgUsername] = match!;
        try {
            await addUser({
                email,
                displayName: name,
                role: role as any,
                telegramUsername: tgUsername,
            }, username);

            const successMsg = `✅ New user *${name}* (${role}) added! (By Admin: @${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.USERS, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));
}
