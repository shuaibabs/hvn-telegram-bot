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
exports.clearAllActivities = exports.deleteActivity = exports.getAllActivities = exports.getRecentActivities = exports.logActivity = void 0;
const firebase_1 = require("../../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const validation_1 = require("../../shared/utils/validation");
const env_1 = require("../../config/env");
const telegram_1 = require("../../shared/utils/telegram");
const logActivity = (bot_1, data_1, ...args_1) => __awaiter(void 0, [bot_1, data_1, ...args_1], void 0, function* (bot, data, shouldBroadcast = false) {
    try {
        const activitiesRef = firebase_1.db.collection('activities');
        // Get last srNo
        const lastActivity = yield activitiesRef.orderBy('srNo', 'desc').limit(1).get();
        const lastSrNo = lastActivity.empty ? 0 : lastActivity.docs[0].data().srNo;
        const nextSrNo = lastSrNo + 1;
        const newDocRef = activitiesRef.doc();
        const newActivity = Object.assign(Object.assign({}, data), { id: newDocRef.id, srNo: nextSrNo, timestamp: firestore_1.Timestamp.now() });
        // Validate
        const validation = validation_1.activitySchema.safeParse(newActivity);
        if (!validation.success) {
            throw new Error(`Activity validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
        }
        yield newDocRef.set(newActivity);
        // Notification Message
        const message = `📊 *Activity Log #${nextSrNo}*\n\n` +
            `🔹 *Action:* ${(0, telegram_1.escapeMarkdown)(newActivity.action)}\n` +
            `🔹 *Target:* ${(0, telegram_1.escapeMarkdown)(newActivity.employeeName)}\n` +
            `🔹 *Description:* ${(0, telegram_1.escapeMarkdown)(newActivity.description)}\n` +
            `👤 *By:* ${(0, telegram_1.escapeMarkdown)(newActivity.createdBy)}\n` +
            `⏰ *Time:* ${(0, telegram_1.escapeMarkdown)(newActivity.timestamp.toDate().toLocaleString())}`;
        // Send to Activity Group
        if (env_1.env.TG_GROUP_ACTIVITY) {
            yield bot.sendMessage(env_1.env.TG_GROUP_ACTIVITY, message, { parse_mode: 'Markdown' });
        }
        // Broadcast to Master Channel if requested
        if (shouldBroadcast && env_1.env.TG_MASTER_CHANNEL) {
            yield bot.sendMessage(env_1.env.TG_MASTER_CHANNEL, message, { parse_mode: 'Markdown' });
        }
        return newActivity;
    }
    catch (error) {
        console.error('Error logging activity:', error);
        throw error;
    }
});
exports.logActivity = logActivity;
const getRecentActivities = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 10) {
    const snapshot = yield firebase_1.db.collection('activities')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map(doc => doc.data());
});
exports.getRecentActivities = getRecentActivities;
const getAllActivities = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('activities')
        .orderBy('timestamp', 'desc')
        .get();
    return snapshot.docs.map(doc => doc.data());
});
exports.getAllActivities = getAllActivities;
const deleteActivity = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield firebase_1.db.collection('activities').doc(id).delete();
});
exports.deleteActivity = deleteActivity;
const clearAllActivities = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('activities').get();
    const batch = firebase_1.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    yield batch.commit();
});
exports.clearAllActivities = clearAllActivities;
