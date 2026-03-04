
import { db } from '../config/firebase';
import { addActivity } from './activityService';
import { Timestamp } from 'firebase-admin/firestore';

export const addReminder = async (taskName: string, dueDate: string, assignedTo: string[], username: string) => {
    const remindersCol = db.collection('reminders');
    const snapshot = await remindersCol.orderBy('srNo', 'desc').limit(1).get();
    const maxSrNo = snapshot.docs.length > 0 ? snapshot.docs[0].data().srNo : 0;

    const newReminder = {
        taskName,
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        assignedTo,
        status: 'Pending',
        createdBy: username,
        srNo: maxSrNo + 1,
    };

    const docRef = await remindersCol.add(newReminder);
    await addActivity(username, 'Added Reminder', `Assigned task "${taskName}" to ${assignedTo.join(', ')}`);
    return { id: docRef.id, ...newReminder };
};

export const listReminders = async (status?: 'Pending' | 'Done') => {
    // To avoid index requirement, we fetch and then filter or just use a simpler query
    const snapshot = await db.collection('reminders').orderBy('dueDate', 'asc').get();
    const reminders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (status) {
        return reminders.filter((r: any) => r.status === status);
    }
    return reminders;
};

export const markReminderDone = async (reminderId: string, username: string, note?: string) => {
    const reminderRef = db.collection('reminders').doc(reminderId);
    const reminderDoc = await reminderRef.get();

    if (!reminderDoc.exists) throw new Error('Reminder not found');

    await reminderRef.update({
        status: 'Done',
        completionDate: Timestamp.now(),
        notes: note || '',
    });

    await addActivity(username, 'Completed Reminder', `Marked task "${reminderDoc.data()?.taskName}" as Done`);
};

