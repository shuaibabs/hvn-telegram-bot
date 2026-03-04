"use strict";
/**
 * SessionManager
 * ---------------------------------------------------------------------------
 * Tracks the multi-step conversation state for each user and each flow.
 * Keyed by Telegram userId (number) and flow name (string).
 *
 * Sessions auto-expire after SESSION_TIMEOUT_MS of inactivity so stale
 * flows do not block users who abandoned a flow mid-way.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSession = setSession;
exports.getSession = getSession;
exports.clearSession = clearSession;
exports.hasSession = hasSession;
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const sessions = new Map();
/** Start or overwrite a session for a user in a specific flow */
function setSession(userId, flow, session) {
    clearSession(userId, flow); // clear any existing timer first
    const timer = setTimeout(() => {
        if (sessions.has(userId)) {
            sessions.get(userId).delete(flow);
            if (sessions.get(userId).size === 0) {
                sessions.delete(userId);
            }
        }
        console.log(`🗑️  [SessionManager] Session expired for user ${userId} in flow ${flow}`);
    }, SESSION_TIMEOUT_MS);
    if (!sessions.has(userId)) {
        sessions.set(userId, new Map());
    }
    const newSession = Object.assign(Object.assign({}, session), { _timer: timer });
    sessions.get(userId).set(flow, newSession);
}
/** Get the current session for a user in a specific flow, or undefined if none exists */
function getSession(userId, flow) {
    var _a;
    return (_a = sessions.get(userId)) === null || _a === void 0 ? void 0 : _a.get(flow);
}
/** Remove a session (flow completed or cancelled) */
function clearSession(userId, flow) {
    var _a;
    const session = (_a = sessions.get(userId)) === null || _a === void 0 ? void 0 : _a.get(flow);
    if (session === null || session === void 0 ? void 0 : session._timer)
        clearTimeout(session._timer);
    if (sessions.has(userId)) {
        sessions.get(userId).delete(flow);
        if (sessions.get(userId).size === 0) {
            sessions.delete(userId);
        }
    }
}
/** Check whether a user is currently inside a specific flow */
function hasSession(userId, flow) {
    return sessions.has(userId) && sessions.get(userId).has(flow);
}
