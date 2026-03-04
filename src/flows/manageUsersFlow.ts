/**
 * manageUsersFlow.ts
 * ---------------------------------------------------------------------------
 * Guided, menu-driven flow for the "hvn-manage-users" Telegram group.
 *
 * Flows implemented:
 *   1. LIST USERS   — immediately shows all users with a formatted table
 *   2. ADD USER     — 4-step guided flow: email → name → role → tg-username → confirm
 *   3. DELETE USER  — 2-step flow: pick user from inline list → confirm
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────────
 * • All button taps arrive via bot.on('callback_query') in index.ts which
 *   calls handleUsersCallbackQuery() below.
 * • All text replies arrive via bot.on('message') in index.ts which checks
 *   the user's session and calls handleUsersMessageStep() below.
 * • Inline keyboard buttons carry a "callback_data" string prefixed with
 *   "users:" to avoid collisions with other flows.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import TelegramBot from 'node-telegram-bot-api';
import { setSession, getSession, updateSession, clearSession } from '../services/sessionManager';
import { addUser, deleteUser, listUsers, UserData } from '../services/userService';
import { broadcast } from '../services/broadcastService';
import { GROUPS } from '../config/env';

// ─── Constants ────────────────────────────────────────────────────────────────

const FLOW = {
    ADD_USER: 'add_user',
    DELETE_USER: 'delete_user',
} as const;

const STEP = {
    AWAITING_EMAIL: 'awaiting_email',
    AWAITING_NAME: 'awaiting_name',
    AWAITING_ROLE: 'awaiting_role',
    AWAITING_TG_USERNAME: 'awaiting_tg_username',
    CONFIRM_ADD: 'confirm_add',
    AWAITING_DELETE_PICK: 'awaiting_delete_pick',
    CONFIRM_DELETE: 'confirm_delete',
} as const;

// ─── Menu Sender ─────────────────────────────────────────────────────────────

/**
 * Sends the main Users Management menu with 3 big action buttons.
 * Called when the user taps "👥 Manage Users" from the keyboard.
 */
export function sendUsersMenu(bot: TelegramBot, chatId: number): void {
    bot.sendMessage(
        chatId,
        `👥 *User Management*\n\nChoose an action below:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 List All Users', callback_data: 'users:list' }],
                    [{ text: '➕ Add New User', callback_data: 'users:start_add' }],
                    [{ text: '🗑️ Delete a User', callback_data: 'users:start_delete' }],
                ],
            },
        }
    );
}

// ─── Callback Query Handler ───────────────────────────────────────────────────

/**
 * Routes all callback_query events that start with "users:" to the correct
 * handler. Called from the central callback_query listener in index.ts.
 */
export async function handleUsersCallbackQuery(
    bot: TelegramBot,
    query: TelegramBot.CallbackQuery,
    adminUsername: string
): Promise<void> {
    const data = query.data!;
    const userId = query.from.id;
    const chatId = query.message!.chat.id;
    const msgId = query.message!.message_id;

    // Always acknowledge the button tap to remove Telegram's loading spinner
    await bot.answerCallbackQuery(query.id);

    // ── LIST USERS ────────────────────────────────────────────────────────────
    if (data === 'users:list') {
        await handleListUsers(bot, chatId, msgId);
        return;
    }

    // ── START ADD FLOW ────────────────────────────────────────────────────────
    if (data === 'users:start_add') {
        clearSession(userId);
        setSession(userId, { flow: FLOW.ADD_USER, step: STEP.AWAITING_EMAIL, data: {}, chatId });

        await bot.editMessageText(
            `➕ *Add New User — Step 1 of 4*\n\n📧 Please send the user's *email address*:\n\n_Type \`cancel\` at any time to abort._`,
            { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
        );
        return;
    }

    // ── START DELETE FLOW ─────────────────────────────────────────────────────
    if (data === 'users:start_delete') {
        await startDeleteFlow(bot, chatId, msgId, userId);
        return;
    }

    // ── ROLE SELECTION (inline buttons during add flow) ───────────────────────
    if (data.startsWith('users:role_')) {
        const role = data.replace('users:role_', '') as 'admin' | 'employee';
        await handleRoleSelection(bot, chatId, msgId, userId, role);
        return;
    }

    // ── CONFIRM ADD ───────────────────────────────────────────────────────────
    if (data === 'users:confirm_add') {
        await executeAddUser(bot, chatId, msgId, userId, adminUsername);
        return;
    }

    // ── CANCEL ADD ────────────────────────────────────────────────────────────
    if (data === 'users:cancel') {
        clearSession(userId);
        await bot.editMessageText(
            `❌ *Action cancelled.*\n\nNo changes were made.`,
            { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
        );
        return;
    }

    // ── DELETE PICK (user selected from list) ─────────────────────────────────
    if (data.startsWith('users:delete_pick_')) {
        const userDocId = data.replace('users:delete_pick_', '');
        await handleDeletePick(bot, chatId, msgId, userId, userDocId);
        return;
    }

    // ── CONFIRM DELETE ────────────────────────────────────────────────────────
    if (data === 'users:confirm_delete') {
        await executeDeleteUser(bot, chatId, msgId, userId, adminUsername);
        return;
    }
}

// ─── Message Step Handler ─────────────────────────────────────────────────────

/**
 * Handles plain text messages when the user is inside the add_user flow.
 * Called from the central message listener in index.ts when a session exists.
 * Returns true if the message was consumed by this flow, false otherwise.
 */
export async function handleUsersMessageStep(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    adminUsername: string
): Promise<boolean> {
    const userId = msg.from!.id;
    const session = getSession(userId);

    if (!session || session.flow !== FLOW.ADD_USER) return false;

    const text = msg.text?.trim() || '';

    // Universal cancel command
    if (text.toLowerCase() === 'cancel') {
        clearSession(userId);
        bot.sendMessage(msg.chat.id, `❌ *Action cancelled.* No changes were made.`, { parse_mode: 'Markdown' });
        return true;
    }

    switch (session.step) {

        // ── STEP 1: Email ─────────────────────────────────────────────────────
        case STEP.AWAITING_EMAIL: {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(text)) {
                bot.sendMessage(msg.chat.id,
                    `⚠️ *Invalid email address.*\n\nPlease send a valid email (e.g. \`john@example.com\`)`,
                    { parse_mode: 'Markdown' }
                );
                return true;
            }
            updateSession(userId, { step: STEP.AWAITING_NAME, data: { email: text } });
            bot.sendMessage(msg.chat.id,
                `✅ Email saved!\n\n➕ *Add New User — Step 2 of 4*\n\n👤 Now send the user's *full name*:`,
                { parse_mode: 'Markdown' }
            );
            return true;
        }

        // ── STEP 2: Full Name ─────────────────────────────────────────────────
        case STEP.AWAITING_NAME: {
            if (text.length < 2) {
                bot.sendMessage(msg.chat.id, `⚠️ Name is too short. Please enter a proper full name.`);
                return true;
            }
            updateSession(userId, { step: STEP.AWAITING_ROLE, data: { displayName: text } });
            bot.sendMessage(msg.chat.id,
                `✅ Name saved!\n\n➕ *Add New User — Step 3 of 4*\n\n🔑 Select the user's *role*:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '👑 Admin', callback_data: 'users:role_admin' },
                                { text: '👷 Employee', callback_data: 'users:role_employee' },
                            ],
                            [{ text: '❌ Cancel', callback_data: 'users:cancel' }],
                        ],
                    },
                }
            );
            return true;
        }

        // ── STEP 4: Telegram Username (role is handled via callback) ──────────
        case STEP.AWAITING_TG_USERNAME: {
            // Strip leading "@" if user included it
            const tgUsername = text.replace(/^@/, '');
            if (tgUsername.length < 3) {
                bot.sendMessage(msg.chat.id, `⚠️ That doesn't look like a valid Telegram username. Please try again (without the @).`);
                return true;
            }
            updateSession(userId, { step: STEP.CONFIRM_ADD, data: { telegramUsername: tgUsername } });

            // Re-fetch complete session to show summary
            const updatedSession = getSession(userId)!;
            const d = updatedSession.data;

            bot.sendMessage(msg.chat.id,
                `✅ Telegram username saved!\n\n` +
                `📋 *Please review the new user details:*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `📧 Email:    \`${d.email}\`\n` +
                `👤 Name:     *${d.displayName}*\n` +
                `🔑 Role:     \`${d.role}\`\n` +
                `💬 Telegram: @${d.telegramUsername}\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Confirm to add this user?`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ Confirm & Add', callback_data: 'users:confirm_add' },
                                { text: '❌ Cancel', callback_data: 'users:cancel' },
                            ],
                        ],
                    },
                }
            );
            return true;
        }

        default:
            return false;
    }
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

async function handleListUsers(
    bot: TelegramBot,
    chatId: number,
    msgId: number
): Promise<void> {
    try {
        const users = await listUsers();

        if (users.length === 0) {
            await bot.editMessageText(
                `📋 *User List*\n\nNo users found in the system.`,
                { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
            );
            return;
        }

        let text = `📋 *User List* (${users.length} total)\n\n`;
        users.forEach((u, i) => {
            const tg = u.telegramUsername ? `@${u.telegramUsername}` : '_not linked_';
            const role = u.role === 'admin' ? '👑 Admin' : '👷 Employee';
            text += `${i + 1}\\. *${escMd(u.displayName)}* — ${role}\n` +
                `   📧 \`${u.email}\`\n` +
                `   💬 ${tg}\n\n`;
        });

        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back to Menu', callback_data: 'users:back_to_menu' }],
                ],
            },
        });
    } catch (e: any) {
        await bot.editMessageText(`❌ *Error fetching users:* ${e.message}`, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
        });
    }
}

async function startDeleteFlow(
    bot: TelegramBot,
    chatId: number,
    msgId: number,
    userId: number
): Promise<void> {
    try {
        const users = await listUsers();

        if (users.length === 0) {
            await bot.editMessageText(`❌ No users to delete.`, {
                chat_id: chatId,
                message_id: msgId,
            });
            return;
        }

        // Build one button per user (max 20 shown to stay within Telegram limits)
        const buttons = users.slice(0, 20).map(u => ([{
            text: `${u.role === 'admin' ? '👑' : '👷'} ${u.displayName} (@${u.telegramUsername || 'no-tg'})`,
            callback_data: `users:delete_pick_${u.id}`,
        }]));

        buttons.push([{ text: '❌ Cancel', callback_data: 'users:cancel' }]);

        clearSession(userId);
        setSession(userId, { flow: FLOW.DELETE_USER, step: STEP.AWAITING_DELETE_PICK, data: {}, chatId });

        await bot.editMessageText(
            `🗑️ *Delete User*\n\nSelect the user you want to remove:`,
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons },
            }
        );
    } catch (e: any) {
        await bot.editMessageText(`❌ *Error:* ${e.message}`, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'Markdown',
        });
    }
}

async function handleDeletePick(
    bot: TelegramBot,
    chatId: number,
    msgId: number,
    userId: number,
    userDocId: string
): Promise<void> {
    try {
        const users = await listUsers();
        const target = users.find(u => u.id === userDocId);

        if (!target) {
            await bot.editMessageText(`❌ User not found. Please try again.`, {
                chat_id: chatId, message_id: msgId,
            });
            return;
        }

        updateSession(userId, {
            step: STEP.CONFIRM_DELETE,
            data: { deleteUserId: userDocId, deleteUserName: target.displayName, deleteUserEmail: target.email },
        });

        await bot.editMessageText(
            `🗑️ *Confirm Delete*\n\n` +
            `Are you sure you want to remove this user?\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 Name:  *${target.displayName}*\n` +
            `📧 Email: \`${target.email}\`\n` +
            `🔑 Role:  \`${target.role}\`\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⚠️ This action cannot be undone.`,
            {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🗑️ Yes, Delete', callback_data: 'users:confirm_delete' },
                            { text: '❌ Cancel', callback_data: 'users:cancel' },
                        ],
                    ],
                },
            }
        );
    } catch (e: any) {
        await bot.editMessageText(`❌ *Error:* ${e.message}`, {
            chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
        });
    }
}

async function handleRoleSelection(
    bot: TelegramBot,
    chatId: number,
    msgId: number,
    userId: number,
    role: 'admin' | 'employee'
): Promise<void> {
    const session = getSession(userId);
    if (!session || session.flow !== FLOW.ADD_USER) return;

    updateSession(userId, { step: STEP.AWAITING_TG_USERNAME, data: { role } });

    const roleLabel = role === 'admin' ? '👑 Admin' : '👷 Employee';
    await bot.editMessageText(
        `✅ Role set to *${roleLabel}*!\n\n` +
        `➕ *Add New User — Step 4 of 4*\n\n` +
        `💬 Now send the user's *Telegram username*:\n_(without the @ symbol — e.g. \`johnsmith\`)_`,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }
    );
}

async function executeAddUser(
    bot: TelegramBot,
    chatId: number,
    msgId: number,
    userId: number,
    adminUsername: string
): Promise<void> {
    const session = getSession(userId);
    if (!session || session.flow !== FLOW.ADD_USER) return;

    const d = session.data as Required<Pick<UserData, 'email' | 'displayName' | 'role' | 'telegramUsername'>>;

    try {
        await bot.editMessageText(`⏳ Adding user, please wait...`, {
            chat_id: chatId, message_id: msgId,
        });

        await addUser({
            email: d.email,
            displayName: d.displayName,
            role: d.role,
            telegramUsername: d.telegramUsername,
        }, adminUsername);

        clearSession(userId);

        const successMsg =
            `✅ *New user added successfully\\!*\n\n` +
            `👤 *${escMd(d.displayName)}* \\(${d.role === 'admin' ? '👑 Admin' : '👷 Employee'}\\)\n` +
            `📧 \`${escMd(d.email)}\`\n` +
            `💬 @${escMd(d.telegramUsername)}\n\n` +
            `_Added by: @${escMd(adminUsername)}_`;

        await bot.editMessageText(successMsg, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'MarkdownV2',
        });

        // Broadcast to the users group channel
        broadcast(GROUPS.USERS, `✅ New user *${d.displayName}* (${d.role}) added by @${adminUsername}`);

    } catch (e: any) {
        clearSession(userId);
        await bot.editMessageText(`❌ *Error adding user:* ${e.message}`, {
            chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
        });
    }
}

async function executeDeleteUser(
    bot: TelegramBot,
    chatId: number,
    msgId: number,
    userId: number,
    adminUsername: string
): Promise<void> {
    const session = getSession(userId);
    if (!session || session.flow !== FLOW.DELETE_USER) return;

    const { deleteUserId, deleteUserName, deleteUserEmail } = session.data;

    try {
        await bot.editMessageText(`⏳ Deleting user, please wait...`, {
            chat_id: chatId, message_id: msgId,
        });

        await deleteUser(deleteUserId, adminUsername);

        clearSession(userId);

        const successMsg = `🗑️ *User deleted successfully\\!*\n\n` +
            `👤 *${escMd(deleteUserName)}*\n` +
            `📧 \`${escMd(deleteUserEmail)}\`\n\n` +
            `_Deleted by: @${escMd(adminUsername)}_`;

        await bot.editMessageText(successMsg, {
            chat_id: chatId,
            message_id: msgId,
            parse_mode: 'MarkdownV2',
        });

        broadcast(GROUPS.USERS, `🗑️ User *${deleteUserName}* deleted by @${adminUsername}`);

    } catch (e: any) {
        clearSession(userId);
        await bot.editMessageText(`❌ *Error deleting user:* ${e.message}`, {
            chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
        });
    }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Escapes special characters for Telegram MarkdownV2 */
function escMd(text: string = ''): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

