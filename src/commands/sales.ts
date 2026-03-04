
import TelegramBot from 'node-telegram-bot-api';
import { db } from '../config/firebase';
import { broadcast } from '../services/broadcastService';
import { GROUPS } from '../config/env';
import { sellNumber } from '../services/numberService';
import { cancelSale } from '../services/saleService';
import { adminOnly, authorized } from '../middleware/auth';
import { validateGroup } from '../middleware/validation';

export function registerSalesCommands(bot: TelegramBot) {
    // Keyboard Handler
    bot.on('message', async (msg) => {
        if (msg.text === '💰 Sales') {
            const sales = await db.collection('sales').orderBy('saleDate', 'desc').limit(5).get();
            if (sales.empty) {
                bot.sendMessage(msg.chat.id, "💰 No sales yet.");
                return;
            }
            let text = `💰 *Recent Sales:*\n\n`;
            sales.docs.forEach(d => {
                const data = d.data();
                text += `• ${data.mobile} - ₹${data.salePrice} (${data.soldTo})\n`;
            });
            bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
        }
    });

    bot.onText(/\/sell (\d{10}) (\d+) (.+)/, authorized(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.SALES, 'Sales')) return;
        const [_, mobile, price, customer] = match!;
        try {
            const snap = await db.collection('numbers').where('mobile', '==', mobile).limit(1).get();
            if (snap.empty) throw new Error('Number not found in inventory.');

            const numberId = snap.docs[0].id;
            await sellNumber(numberId, {
                mobile,
                salePrice: Number(price),
                soldTo: customer,
            }, username);

            const successMsg = `💰 Number *${mobile}* sold for ₹${price} to ${customer}! (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.SALES, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));

    bot.onText(/\/cancelsale (\S+)/, adminOnly(bot, async (msg, match, username) => {
        if (!validateGroup(bot, msg, GROUPS.SALES, 'Sales')) return;
        const saleId = match![1];
        try {
            await cancelSale(saleId, username);
            const successMsg = `🔄 Sale *${saleId}* cancelled. Number returned to inventory. (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            broadcast(GROUPS.SALES, successMsg);
        } catch (e: any) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    }));
}

