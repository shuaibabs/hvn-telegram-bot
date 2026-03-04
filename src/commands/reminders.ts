
import TelegramBot from 'node-telegram-bot-api';
import { broadcast } from '../services/broadcastService';
import { GROUPS } from '../config/env';
import { addReminder, listReminders } from '../services/reminderService';
import { authorized } from '../middleware/auth';
import { validateGroup } from '../middleware/validation';

export function registerReminderCommands(bot: TelegramBot) {
    // Keyboard Handler
    bot.on('message', async (msg) => {
        if (msg.text === '⏰ Reminders') {
            try {
                const items = await listReminders('Pending');
                if (items.length === 0) {
                    bot.sendMessage(msg.chat.id, "✅ No pending reminders.");
                    return;
                }

                const displayItems = items.slice(0, 20);
                let text = `⏰ *Pending Reminders (Showing ${displayItems.length}/${items.length}):*\n\n`;

                displayItems.forEach((r: any) => {
                    let dateStr = 'No date';
                    try {
                        if (r.dueDate && typeof r.dueDate.toDate === 'function') {
                            dateStr = r.dueDate.toDate().toLocaleDateString();
                        } else if (r.dueDate instanceof Date) {
                            dateStr = r.dueDate.toLocaleDateString();
                        }
                    } catch (e) { }

                    const safeTaskName = (r.taskName || '').replace(/[_*`]/g, (m: string) => `\\${m}`);
                    text += `• [${dateStr}] ${safeTaskName}\n`;
                });

                if (items.length > 20) {
                    text += `\n_...and ${items.length - 20} more. Join the web UI to see full list._`;
                }

                bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
            } catch (error: any) {
                console.error('Error fetching reminders:', error);
                bot.sendMessage(msg.chat.id, "❌ Sorry, I couldn't fetch the reminders right now.");
            }
        }
    });

    bot.onText(/\/remind (.+) (\d{4}-\d{2}-\d{2})/, authorized(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.ACTIVITY, 'Activity/Reminders')) return;
        const [_, task, date] = match!;
        try {
            await addReminder(task, date, [username], username);
            const successMsg = `⏰ Reminder set for *${date}*: ${task} (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.ACTIVITY, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));

    bot.onText(/\/reminders/, authorized(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.ACTIVITY, 'Activity/Reminders')) return;
        try {
            const items = await listReminders('Pending');
            if (items.length === 0) {
                bot.sendMessage(msg.chat.id, "✅ No pending reminders.");
                return;
            }

            const displayItems = items.slice(0, 20);
            let text = `⏰ *Pending Reminders (Showing ${displayItems.length}/${items.length}):*\n\n`;

            displayItems.forEach((r: any) => {
                let dateStr = 'No date';
                try {
                    if (r.dueDate && typeof r.dueDate.toDate === 'function') {
                        dateStr = r.dueDate.toDate().toLocaleDateString();
                    } else if (r.dueDate instanceof Date) {
                        dateStr = r.dueDate.toLocaleDateString();
                    }
                } catch (e) { }

                const safeTaskName = (r.taskName || '').replace(/[_*`]/g, (m: string) => `\\${m}`);
                text += `• [${dateStr}] ${safeTaskName}\n`;
            });

            if (items.length > 20) {
                text += `\n_...and ${items.length - 20} more._`;
            }

            bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
        } catch (error: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
        }
    }));
}

