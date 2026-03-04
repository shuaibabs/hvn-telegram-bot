"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGroup = void 0;
const telegram_1 = require("../utils/telegram");
/**
 * Validates that a command is being typed in the correct Telegram group.
 * If typed elsewhere, it blocks and warns the user.
 */
const validateGroup = (bot, msg, expectedGroupId, moduleName) => {
    const currentId = msg.chat.id.toString().trim();
    const targets = Array.isArray(expectedGroupId)
        ? expectedGroupId.map(id => id.toString().trim())
        : [expectedGroupId.toString().trim()];
    console.log(`🔍 [VALIDATE] Module: ${moduleName} | ChatID: ${currentId} | Target-List: ${targets.join(', ')}`);
    // 1. Bypass check for Private Chats (Admin direct management)
    if (msg.chat.type === 'private') {
        return true;
    }
    // 2. Validate Group ID
    const isValid = targets.includes(currentId);
    if (!isValid) {
        const warning = telegram_1.RESPONSES.WARNING(`This group is dedicated to **${moduleName} Management**.\n\nPlease use the correct group or message the bot privately.`);
        bot.sendMessage(msg.chat.id, warning, { parse_mode: 'Markdown' });
        return false;
    }
    return true;
};
exports.validateGroup = validateGroup;
