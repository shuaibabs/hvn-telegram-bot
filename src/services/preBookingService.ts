
import { db } from '../config/firebase';
import { addActivity } from './activityService';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const listPreBookings = async () => {
    const snapshot = await db.collection('prebookings').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const markAsPreBooked = async (numberId: string, username: string) => {
    const numberRef = db.collection('numbers').doc(numberId);
    const numberDoc = await numberRef.get();

    if (!numberDoc.exists) throw new Error('Number not found');

    const numberData = numberDoc.data() as any;
    const prebookingsCol = db.collection('prebookings');
    const prebookingRef = prebookingsCol.doc();

    const prebookingRecord = {
        id: prebookingRef.id,
        mobile: numberData.mobile,
        sum: numberData.sum,
        uploadStatus: numberData.uploadStatus || 'Pending',
        preBookingDate: Timestamp.now(),
        createdBy: username,
        originalNumberData: numberData,
        srNo: (await prebookingsCol.get()).size + 1,
    };

    const historyEvent = {
        id: `${Date.now()}-prebook`,
        action: 'Marked as Pre-Booked',
        description: `Number marked as pre-booked by ${username}.`,
        timestamp: Timestamp.now(),
        performedBy: username,
    };

    await db.runTransaction(async (t) => {
        t.set(prebookingRef, prebookingRecord);
        t.delete(numberRef);
    });

    await addActivity(username, 'Pre-Booked Number', `Pre-booked ${numberData.mobile}`);
};

export const cancelPreBooking = async (prebookingId: string, username: string) => {
    const pbRef = db.collection('prebookings').doc(prebookingId);
    const pbDoc = await pbRef.get();

    if (!pbDoc.exists) throw new Error('Pre-booking not found');

    const pbData = pbDoc.data() as any;
    const numberRef = db.collection('numbers').doc();

    await db.runTransaction(async (t) => {
        t.set(numberRef, {
            ...pbData.originalNumberData,
            id: numberRef.id,
        });
        t.delete(pbRef);
    });

    await addActivity(username, 'Cancelled Pre-Booking', `Cancelled pre-booking for ${pbData.mobile} and returned to inventory.`);
};

