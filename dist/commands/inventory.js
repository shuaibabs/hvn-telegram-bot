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
exports.registerInventoryCommands = void 0;
const env_1 = require("../config/env");
const authService_1 = require("../services/authService");
const inventoryFlow_1 = require("../flows/inventoryFlow");
function registerInventoryCommands(bot) {
    // ─── Main Inventory Command Handler ──────────────────────────────────────
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Only trigger if in Inventory Group
        if (msg.chat.id.toString() !== env_1.GROUPS.INVENTORY)
            return;
        if (!msg.text || msg.text.startsWith('/'))
            return;
        try {
            // Check auth manually since this is a general message listener
            const user = yield (0, authService_1.getUserByTelegramUsername)(((_a = msg.from) === null || _a === void 0 ? void 0 : _a.username) || '');
            if (!user)
                return; // Unregistered user in group - ignore or warn
            const username = user.displayName || ((_b = msg.from) === null || _b === void 0 ? void 0 : _b.username) || 'Unknown';
            const handled = yield (0, inventoryFlow_1.handleInventoryCommand)(bot, msg, username);
            if (!handled) {
                // If not one of our 13 commands, we just ignore it
                console.log(`[Inventory] Ignored message: ${msg.text.substring(0, 20)}...`);
            }
        }
        catch (e) {
            console.error('[Inventory Error]', e);
        }
    }));
    // ─── Inventory Menu Trigger ──────────────────────────────────────────────
    bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        var _c;
        const text = (_c = msg.text) === null || _c === void 0 ? void 0 : _c.trim().toUpperCase();
        if (text === '📦 MANAGE INVENTORY' || text === 'START') {
            if (msg.chat.id.toString() !== env_1.GROUPS.INVENTORY) {
                if (text === '📦 MANAGE INVENTORY') {
                    bot.sendMessage(msg.chat.id, "⚠️ This menu is only available in the Inventory group.");
                }
                return;
            }
            const { sendInventoryMenu } = require('../flows/inventoryFlow');
            yield sendInventoryMenu(bot, msg.chat.id);
        }
    }));
    // Note: Old slash commands (/add, /delete, /rts, /info) are now managed via the multi-line templates.
}
exports.registerInventoryCommands = registerInventoryCommands;
