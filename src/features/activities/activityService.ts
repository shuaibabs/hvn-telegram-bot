import { db } from '../../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { Activity } from '../../shared/types/data';
import { activitySchema } from '../../shared/utils/validation';
import TelegramBot from 'node-telegram-bot-api';
import { env } from '../../config/env';
import { escapeMarkdown } from '../../shared/utils/telegram';

export const logActivity = async (
    bot: TelegramBot,
    data: Omit<Activity, 'id' | 'srNo' | 'timestamp'>,
    shouldBroadcast: boolean = false
) => {
    try {
        const activitiesRef = db.collection('activities');

        // Get last srNo
        const lastActivity = await activitiesRef.orderBy('srNo', 'desc').limit(1).get();
        const lastSrNo = lastActivity.empty ? 0 : lastActivity.docs[0].data().srNo;
        const nextSrNo = lastSrNo + 1;
        const newDocRef = activitiesRef.doc();

        const newActivity: Activity = {
            ...data,
            id: newDocRef.id,
            srNo: nextSrNo,
            timestamp: Timestamp.now()
        };

        // Validate
        const validation = activitySchema.safeParse(newActivity);
        if (!validation.success) {
            throw new Error(`Activity validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
        }

        await newDocRef.set(newActivity);

        // Notification Message
        const message = `📊 *Activity Log #${nextSrNo}*\n\n` +
            `🔹 *Action:* ${escapeMarkdown(newActivity.action)}\n` +
            `🔹 *Target:* ${escapeMarkdown(newActivity.employeeName)}\n` +
            `🔹 *Description:* ${escapeMarkdown(newActivity.description)}\n` +
            `👤 *By:* ${escapeMarkdown(newActivity.createdBy)}\n` +
            `⏰ *Time:* ${escapeMarkdown(newActivity.timestamp.toDate().toLocaleString())}`;

        // Send to Activity Group
        if (env.TG_GROUP_ACTIVITY) {
            await bot.sendMessage(env.TG_GROUP_ACTIVITY, message, { parse_mode: 'Markdown' });
        }

        // Broadcast to Master Channel if requested
        if (shouldBroadcast && env.TG_MASTER_CHANNEL) {
            await bot.sendMessage(env.TG_MASTER_CHANNEL, message, { parse_mode: 'Markdown' });
        }

        return newActivity;
    } catch (error) {
        console.error('Error logging activity:', error);
        throw error;
    }
};

export const getRecentActivities = async (limit: number = 10): Promise<Activity[]> => {
    const snapshot = await db.collection('activities')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => doc.data() as Activity);
};

export const getAllActivities = async (): Promise<Activity[]> => {
    const snapshot = await db.collection('activities')
        .orderBy('timestamp', 'desc')
        .get();

    return snapshot.docs.map(doc => doc.data() as Activity);
};

export const deleteActivity = async (id: string) => {
    await db.collection('activities').doc(id).delete();
};

export const clearAllActivities = async () => {
    const snapshot = await db.collection('activities').get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
};
