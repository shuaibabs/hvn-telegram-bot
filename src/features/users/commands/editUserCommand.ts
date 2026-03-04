import TelegramBot from 'node-telegram-bot-api';
import { GROUPS } from '../../../config/env';
import { adminOnly } from '../../../shared/middleware/auth';
import { validateGroup } from '../../../shared/services/validation';
import { startEditUserFlow } from '../flows/editUserFlow';

export function editUserCommand(bot: TelegramBot) {
    bot.onText(/\/edituser/, adminOnly(bot, async (msg, _match, _username) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        await startEditUserFlow(bot, msg.chat.id);
    }));
}
