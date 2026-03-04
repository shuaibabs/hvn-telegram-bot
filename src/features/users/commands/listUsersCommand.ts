import TelegramBot from 'node-telegram-bot-api';
import { GROUPS } from '../../../config/env';
import { adminOnly } from '../../../shared/middleware/auth';
import { validateGroup } from '../../../shared/services/validation';
import { listUsers } from '../flows/viewUsersFlow';

export function listUsersCommand(bot: TelegramBot) {
    bot.onText(/\/listusers/, adminOnly(bot, async (msg) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        await listUsers(bot, msg.chat.id);
    }));
}
