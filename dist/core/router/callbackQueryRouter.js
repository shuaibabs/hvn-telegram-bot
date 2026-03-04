"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackQueryRouter = void 0;
class CallbackQueryRouter {
    constructor() {
        this.routes = new Map();
    }
    register(pattern, handler) {
        this.routes.set(pattern, handler);
    }
    handle(bot, callbackQuery) {
        const data = callbackQuery.data;
        if (data) {
            for (const [pattern, handler] of this.routes.entries()) {
                if (pattern.test(data)) {
                    handler(bot, callbackQuery);
                    return;
                }
            }
        }
    }
}
exports.CallbackQueryRouter = CallbackQueryRouter;
