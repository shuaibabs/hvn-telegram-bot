
import TelegramBot from 'node-telegram-bot-api';
import { db } from '../config/firebase';
import { GROUPS } from '../config/env';
import { authorized } from '../middleware/auth';
import { validateGroup } from '../middleware/validation';
import { getUserByTelegramUsername } from '../services/authService';
import { handleInventoryCommand } from '../flows/inventoryFlow';

export function registerInventoryCommands(bot: TelegramBot) {
    // ─── Main Inventory Command Handler ──────────────────────────────────────
    bot.on('message', async (msg) => {
        // Only trigger if in Inventory Group
        if (msg.chat.id.toString() !== GROUPS.INVENTORY) return;
        if (!msg.text || msg.text.startsWith('/')) return;

        try {
            // Check auth manually since this is a general message listener
            const user = await getUserByTelegramUsername(msg.from?.username || '');
            if (!user) return; // Unregistered user in group - ignore or warn

            const username = user.displayName || msg.from?.username || 'Unknown';
            const handled = await handleInventoryCommand(bot, msg, username);

            if (!handled) {
                // If not one of our 13 commands, we just ignore it
                console.log(`[Inventory] Ignored message: ${msg.text.substring(0, 20)}...`);
            }
        } catch (e) {
            console.error('[Inventory Error]', e);
        }
    });

    // ─── Inventory Menu Trigger ──────────────────────────────────────────────
    bot.on('message', async (msg) => {
        const text = msg.text?.trim().toUpperCase();
        if (text === '📦 MANAGE INVENTORY' || text === 'START') {
            if (msg.chat.id.toString() !== GROUPS.INVENTORY) {
                if (text === '📦 MANAGE INVENTORY') {
                    bot.sendMessage(msg.chat.id, "⚠️ This menu is only available in the Inventory group.");
                }
                return;
            }
            const { sendInventoryMenu } = require('../flows/inventoryFlow');
            await sendInventoryMenu(bot, msg.chat.id);
        }
    });

    // Note: Old slash commands (/add, /delete, /rts, /info) are now managed via the multi-line templates.
}

