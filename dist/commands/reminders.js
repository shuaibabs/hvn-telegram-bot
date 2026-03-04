"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReminderCommands = void 0;
const broadcastService_1 = require("../services/broadcastService");
const env_1 = require("../config/env");
const reminderService_1 = require("../services/reminderService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
function registerReminderCommands(bot) {
    // Keyboard Handler
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        if (msg.text === '⏰ Reminders') {
            try {
                const items = yield (0, reminderService_1.listReminders)('Pending');
                if (items.length === 0) {
                    bot.sendMessage(msg.chat.id, "✅ No pending reminders.");
                    return;
                }
                const displayItems = items.slice(0, 20);
                let text = `⏰ *Pending Reminders (Showing ${displayItems.length}/${items.length}):*\n\n`;
                displayItems.forEach((r) => {
                    let dateStr = 'No date';
                    try {
                        if (r.dueDate && typeof r.dueDate.toDate === 'function') {
                            dateStr = r.dueDate.toDate().toLocaleDateString();
                        }
                        else if (r.dueDate instanceof Date) {
                            dateStr = r.dueDate.toLocaleDateString();
                        }
                    }
                    catch (e) { }
                    const safeTaskName = (r.taskName || '').replace(/[_*`]/g, (m) => `\\${m}`);
                    text += `• [${dateStr}] ${safeTaskName}\n`;
                });
                if (items.length > 20) {
                    text += `\n_...and ${items.length - 20} more. Join the web UI to see full list._`;
                }
                bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
            }
            catch (error) {
                console.error('Error fetching reminders:', error);
                bot.sendMessage(msg.chat.id, "❌ Sorry, I couldn't fetch the reminders right now.");
            }
        }
    }));
    bot.onText(/\/remind (.+) (\d{4}-\d{2}-\d{2})/, (0, auth_1.authorized)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.ACTIVITY, 'Activity/Reminders'))
            return;
        const [_, task, date] = match;
        try {
            yield (0, reminderService_1.addReminder)(task, date, [username], username);
            const successMsg = `⏰ Reminder set for *${date}*: ${task} (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            (0, broadcastService_1.broadcast)(env_1.GROUPS.ACTIVITY, successMsg);
        }
        catch (e) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    })));
    bot.onText(/\/reminders/, (0, auth_1.authorized)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.ACTIVITY, 'Activity/Reminders'))
            return;
        try {
            const items = yield (0, reminderService_1.listReminders)('Pending');
            if (items.length === 0) {
                bot.sendMessage(msg.chat.id, "✅ No pending reminders.");
                return;
            }
            const displayItems = items.slice(0, 20);
            let text = `⏰ *Pending Reminders (Showing ${displayItems.length}/${items.length}):*\n\n`;
            displayItems.forEach((r) => {
                let dateStr = 'No date';
                try {
                    if (r.dueDate && typeof r.dueDate.toDate === 'function') {
                        dateStr = r.dueDate.toDate().toLocaleDateString();
                    }
                    else if (r.dueDate instanceof Date) {
                        dateStr = r.dueDate.toLocaleDateString();
                    }
                }
                catch (e) { }
                const safeTaskName = (r.taskName || '').replace(/[_*`]/g, (m) => `\\${m}`);
                text += `• [${dateStr}] ${safeTaskName}\n`;
            });
            if (items.length > 20) {
                text += `\n_...and ${items.length - 20} more._`;
            }
            bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
        }
        catch (error) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
        }
    })));
}
exports.registerReminderCommands = registerReminderCommands;
