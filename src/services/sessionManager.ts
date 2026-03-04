/**
 * SessionManager
 * ---------------------------------------------------------------------------
 * Tracks the multi-step conversation state for each user.
 * Keyed by Telegram userId (number) so it works in both groups and DMs
 * with multiple concurrent users without collisions.
 *
 * Sessions auto-expire after SESSION_TIMEOUT_MS of inactivity so stale
 * flows do not block users who abandoned a flow mid-way.
 */

export interface Session {
    /** Identifies which flow the user is currently inside, e.g. 'add_user' */
    flow: string;
    /** Sub-step within the flow, e.g. 'awaiting_email' */
    step: string;
    /** Accumulated data collected across steps */
    data: Record<string, any>;
    /** The chat the flow was started in (used to reply back) */
    chatId: number;
    /** Internal: timer handle for auto-expiry */
    _timer?: ReturnType<typeof setTimeout>;
}

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const sessions = new Map<number, Session>();

/** Start or overwrite a session for a user */
export function setSession(userId: number, session: Omit<Session, '_timer'>): void {
    clearSession(userId); // clear any existing timer first

    const timer = setTimeout(() => {
        sessions.delete(userId);
        console.log(`🗑️  [SessionManager] Session expired for user ${userId}`);
    }, SESSION_TIMEOUT_MS);

    sessions.set(userId, { ...session, _timer: timer });
}

/** Get the current session for a user, or undefined if none exists */
export function getSession(userId: number): Session | undefined {
    return sessions.get(userId);
}

/** Update only specific fields of an existing session (step + data) */
export function updateSession(userId: number, updates: Partial<Pick<Session, 'step' | 'data'>>): void {
    const existing = sessions.get(userId);
    if (!existing) return;

    // Reset the expiry timer on each interaction
    if (existing._timer) clearTimeout(existing._timer);

    const timer = setTimeout(() => {
        sessions.delete(userId);
        console.log(`🗑️  [SessionManager] Session expired for user ${userId}`);
    }, SESSION_TIMEOUT_MS);

    const newData = { ...existing.data, ...(updates.data || {}) };

    sessions.set(userId, {
        ...existing,
        ...updates,
        data: newData,
        _timer: timer,
    });
}

/** Remove a session (flow completed or cancelled) */
export function clearSession(userId: number): void {
    const existing = sessions.get(userId);
    if (existing?._timer) clearTimeout(existing._timer);
    sessions.delete(userId);
}

/** Check whether a user is currently inside any flow */
export function hasSession(userId: number): boolean {
    return sessions.has(userId);
}

