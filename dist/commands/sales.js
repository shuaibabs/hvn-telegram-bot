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
exports.registerSalesCommands = void 0;
const firebase_1 = require("../config/firebase");
const broadcastService_1 = require("../services/broadcastService");
const env_1 = require("../config/env");
const numberService_1 = require("../services/numberService");
const saleService_1 = require("../services/saleService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
function registerSalesCommands(bot) {
    // Keyboard Handler
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        if (msg.text === '💰 Sales') {
            const sales = yield firebase_1.db.collection('sales').orderBy('saleDate', 'desc').limit(5).get();
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
    }));
    bot.onText(/\/sell (\d{10}) (\d+) (.+)/, (0, auth_1.authorized)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.SALES, 'Sales'))
            return;
        const [_, mobile, price, customer] = match;
        try {
            const snap = yield firebase_1.db.collection('numbers').where('mobile', '==', mobile).limit(1).get();
            if (snap.empty)
                throw new Error('Number not found in inventory.');
            const numberId = snap.docs[0].id;
            yield (0, numberService_1.sellNumber)(numberId, {
                mobile,
                salePrice: Number(price),
                soldTo: customer,
            }, username);
            const successMsg = `💰 Number *${mobile}* sold for ₹${price} to ${customer}! (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            (0, broadcastService_1.broadcast)(env_1.GROUPS.SALES, successMsg);
        }
        catch (e) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    })));
    bot.onText(/\/cancelsale (\S+)/, (0, auth_1.adminOnly)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.SALES, 'Sales'))
            return;
        const saleId = match[1];
        try {
            yield (0, saleService_1.cancelSale)(saleId, username);
            const successMsg = `🔄 Sale *${saleId}* cancelled. Number returned to inventory. (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            (0, broadcastService_1.broadcast)(env_1.GROUPS.SALES, successMsg);
        }
        catch (e) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    })));
}
exports.registerSalesCommands = registerSalesCommands;
