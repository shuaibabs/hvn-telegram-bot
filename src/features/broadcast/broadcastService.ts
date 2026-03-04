
import TelegramBot from 'node-telegram-bot-api';
import { env, GROUPS } from '../../config/env';

const botToken = env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(botToken); // Dedicated broadcast instance

/**
 * Robust broadcast service with centralized error handling.
 */
export async function broadcast(
    groupInput: string,
    message: string,
    source: 'BOT' | 'UI' = 'BOT'
): Promise<{ success: boolean; error?: string }> {

    const formattedMasterMsg = `**🔔 Master Alert**\n**Source:** ${source}\n**Action Type:** ${groupInput}\n\n${message}`;

    // 1. Determine Target Group ID
    let targetGroupId = groupInput;
    if (GROUPS[groupInput as keyof typeof GROUPS]) {
        targetGroupId = GROUPS[groupInput as keyof typeof GROUPS];
    }

    const results: string[] = [];
    const errors: string[] = [];

    try {
        // 2. Send to Dedicated Group (if valid)
        if (targetGroupId && targetGroupId.startsWith('-')) {
            await bot.sendMessage(targetGroupId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
            results.push(`Sent to Group: ${targetGroupId}`);
        }

        // 3. Mirror to Master Channel (if configured)
        const masterId = GROUPS.MASTER_CHANNEL;
        if (masterId && masterId.startsWith('-')) {
            await bot.sendMessage(masterId, formattedMasterMsg, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
            results.push(`Mirrored to Master Channel: ${masterId}`);
        }

        console.log(`📡 Broadcast completed:`, results);
        return { success: true };

    } catch (err: any) {
        const errMsg = err.description || err.message || 'Unknown Telegram Error';
        console.error(`❌ Broadcast Error:`, errMsg);
        return { success: false, error: errMsg };
    }
}

