"use strict";
/**
 * Utilities for Telegram message formatting and sanitization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPONSES = void 0;
exports.escapeMarkdown = escapeMarkdown;
exports.formatTime = formatTime;
/**
 * Escapes characters that may break MarkdownV2 or regular Markdown.
 */
function escapeMarkdown(text) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
/**
 * Format timestamp for consistent logging.
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
}
/**
 * Common response templates.
 */
exports.RESPONSES = {
    ERROR: (msg) => `❌ **Error:** ${msg}`,
    SUCCESS: (msg) => `✅ **Success:** ${msg}`,
    WARNING: (msg) => `⚠️ **Warning:** ${msg}`,
    LOADING: `⏳ **Processing request...**`,
};
