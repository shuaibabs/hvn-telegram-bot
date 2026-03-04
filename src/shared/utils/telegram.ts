
/**
 * Utilities for Telegram message formatting and sanitization.
 */

/**
 * Escapes characters that may break MarkdownV2 or regular Markdown.
 */
export function escapeMarkdown(text: string): string {
    const unescaped = text.replace(/\\([_*\[\]()~`>#+\-=|{}.!])/g, '$1');
    const escaped = unescaped.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
    return escaped;
}

/**
 * Format timestamp for consistent logging.
 */
export function formatTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
}

/**
 * Common response templates.
 */
export const RESPONSES = {
    ERROR: (msg: string) => `❌ **Error:** ${msg}`,
    SUCCESS: (msg: string) => `✅ **Success:** ${msg}`,
    WARNING: (msg: string) => `⚠️ **Warning:** ${msg}`,
    LOADING: `⏳ **Processing request...**`,
};

