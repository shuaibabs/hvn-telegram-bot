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
exports.registerPreBookingCommands = void 0;
const firebase_1 = require("../config/firebase");
const broadcastService_1 = require("../services/broadcastService");
const env_1 = require("../config/env");
const preBookingService_1 = require("../services/preBookingService");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
function registerPreBookingCommands(bot) {
    // Keyboard Handler
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        if (msg.text === '📅 Pre-Bookings') {
            const snap = yield firebase_1.db.collection('prebookings').get();
            bot.sendMessage(msg.chat.id, `📅 Pre-Bookings: *${snap.size}* numbers pre-booked.`, { parse_mode: 'Markdown' });
        }
    }));
    bot.onText(/\/prebook (\d{10})/, (0, auth_1.authorized)(bot, (msg, match, username) => __awaiter(this, void 0, void 0, function* () {
        if (!(0, validation_1.validateGroup)(bot, msg, env_1.GROUPS.PREBOOKING, 'Pre-Booking'))
            return;
        const mobile = match[1];
        try {
            const snap = yield firebase_1.db.collection('numbers').where('mobile', '==', mobile).limit(1).get();
            if (snap.empty)
                throw new Error('Number not found in inventory.');
            yield (0, preBookingService_1.markAsPreBooked)(snap.docs[0].id, username);
            const successMsg = `📅 Number *${mobile}* marked as Pre-Booked! (By: ${username})`;
            bot.sendMessage(msg.chat.id, successMsg, { parse_mode: 'Markdown' });
            (0, broadcastService_1.broadcast)(env_1.GROUPS.PREBOOKING, successMsg);
        }
        catch (e) {
            bot.sendMessage(msg.chat.id, `❌ Error: ${e.message}`);
        }
    })));
}
exports.registerPreBookingCommands = registerPreBookingCommands;
