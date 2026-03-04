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
exports.markReminderDone = exports.listReminders = exports.addReminder = void 0;
const firebase_1 = require("../config/firebase");
const activityService_1 = require("./activityService");
const firestore_1 = require("firebase-admin/firestore");
const addReminder = (taskName, dueDate, assignedTo, username) => __awaiter(void 0, void 0, void 0, function* () {
    const remindersCol = firebase_1.db.collection('reminders');
    const snapshot = yield remindersCol.orderBy('srNo', 'desc').limit(1).get();
    const maxSrNo = snapshot.docs.length > 0 ? snapshot.docs[0].data().srNo : 0;
    const newReminder = {
        taskName,
        dueDate: firestore_1.Timestamp.fromDate(new Date(dueDate)),
        assignedTo,
        status: 'Pending',
        createdBy: username,
        srNo: maxSrNo + 1,
    };
    const docRef = yield remindersCol.add(newReminder);
    yield (0, activityService_1.addActivity)(username, 'Added Reminder', `Assigned task "${taskName}" to ${assignedTo.join(', ')}`);
    return Object.assign({ id: docRef.id }, newReminder);
});
exports.addReminder = addReminder;
const listReminders = (status) => __awaiter(void 0, void 0, void 0, function* () {
    // To avoid index requirement, we fetch and then filter or just use a simpler query
    const snapshot = yield firebase_1.db.collection('reminders').orderBy('dueDate', 'asc').get();
    const reminders = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    if (status) {
        return reminders.filter((r) => r.status === status);
    }
    return reminders;
});
exports.listReminders = listReminders;
const markReminderDone = (reminderId, username, note) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reminderRef = firebase_1.db.collection('reminders').doc(reminderId);
    const reminderDoc = yield reminderRef.get();
    if (!reminderDoc.exists)
        throw new Error('Reminder not found');
    yield reminderRef.update({
        status: 'Done',
        completionDate: firestore_1.Timestamp.now(),
        notes: note || '',
    });
    yield (0, activityService_1.addActivity)(username, 'Completed Reminder', `Marked task "${(_a = reminderDoc.data()) === null || _a === void 0 ? void 0 : _a.taskName}" as Done`);
});
exports.markReminderDone = markReminderDone;
