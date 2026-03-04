
import TelegramBot from 'node-telegram-bot-api';
import { db } from '../config/firebase';
import { broadcast } from '../services/broadcastService';
import { GROUPS } from '../config/env';
import { markAsPreBooked } from '../services/preBookingService';
import { authorized } from '../middleware/auth';
import { validateGroup } from '../middleware/validation';

export function registerPreBookingCommands(bot: TelegramBot) {
    // Keyboard Handler
    bot.on('message', async (msg) => {
        if (msg.text === '📅 Pre-Bookings') {
            const snap = await db.collection('prebookings').get();
            bot.sendMessage(msg.chat.id, `📅 Pre-Bookings: *${snap.size}* numbers pre-booked.`, { parse_mode: 'Markdown' });
        }
    });

    bot.onText(/\/prebook (\d{10})/, authorized(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.PREBOOKING, 'Pre-Booking')) return;
        const mobile = match![1];
        try {
            const snap = await db.collection('numbers').where('mobile', '==', mobile).limit(1).get();
            if (snap.empty) throw new Error('Number not found in inventory.');

            await markAsPreBooked(snap.docs[0].id, username);
            const successMsg = `📅 Number *${mobile}* marked as Pre-Booked! (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.PREBOOKING, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));
}

