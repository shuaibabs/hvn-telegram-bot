"use strict";
/**
 * Utilities for Telegram message formatting and sanitization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPONSES = void 0;
exports.escapeMarkdown = escapeMarkdown;
exports.formatTime = formatTime;
/**
 * Escapes characters that break Legacy Markdown (V1).
 * Specifically addresses: _, *, [
 */
function escapeMarkdown(text) {
    if (!text)
        return '';
    // Legacy Markdown (V1) only needs to escape _, *, [
    // We escape them with a backslash.
    return text.replace(/[_*\[]/g, '\\$&');
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
