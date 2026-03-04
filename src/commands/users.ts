/**
 * commands/users.ts
 * ---------------------------------------------------------------------------
 * Registers all user-management commands for the hvn-manage-users group.
 *
 * Approach:
 *  • Persistent keyboard button "👥 Manage Users" opens the inline menu.
 *  • The inline menu (3 buttons) launches guided flows via manageUsersFlow.ts.
 *  • Legacy text commands (/listusers, /adduser, /deleteuser) are kept as an
 *    admin power-user fallback — they still work exactly as before.
 */

import TelegramBot from 'node-telegram-bot-api';
import { addUser, deleteUser, listUsers } from '../services/userService';
import { broadcast } from '../services/broadcastService';
import { GROUPS } from '../config/env';
import { adminOnly } from '../middleware/auth';
import { validateGroup } from '../middleware/validation';
import { sendUsersMenu } from '../flows/manageUsersFlow';

export function registerUserCommands(bot: TelegramBot) {

    // ── Keyboard shortcut: "👥 Manage Users" ─────────────────────────────────
    // When the persistent reply-keyboard button is tapped, show the inline menu.
    bot.on('message', async (msg) => {
        if (msg.text === '👥 Manage Users') {
            if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
            sendUsersMenu(bot, msg.chat.id);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY TEXT COMMANDS (kept as admin power-user fallback)
    // ─────────────────────────────────────────────────────────────────────────

    // /listusers
    bot.onText(/\/listusers/, adminOnly(bot, async (msg, _match, _username) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        const users = await listUsers();

        if (users.length === 0) {
            bot.sendMessage(msg.chat.id, `👥 *User List*\n\nNo users found.`, { parse_mode: 'Markdown' });
            return;
        }

        let text = `👥 *User List* (${users.length} total)\n\n`;
        users.forEach((u, i) => {
            const tg = u.telegramUsername ? `@${u.telegramUsername}` : '_not linked_';
            const role = u.role === 'admin' ? '👑 Admin' : '👷 Employee';
            text += `${i + 1}. *${u.displayName}* — ${role}\n   📧 \`${u.email}\`  💬 ${tg}\n\n`;
        });
        bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
    }));

    // /adduser <email> <name> <admin|employee> <tg-username>
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

    // /deleteuser <tg-username>
    bot.onText(/\/deleteuser (\S+)/, adminOnly(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.USERS, 'User Management')) return;
        const tgUsername = match![1].replace(/^@/, '');
        try {
            const users = await listUsers();
            const target = users.find(u => u.telegramUsername === tgUsername);
            if (!target || !target.id) throw new Error(`User @${tgUsername} not found.`);

            await deleteUser(target.id, username);
            const successMsg = `🗑️ User *${target.displayName}* (@${tgUsername}) deleted by @${username}.`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.USERS, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));
}

