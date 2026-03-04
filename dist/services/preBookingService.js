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
exports.cancelPreBooking = exports.markAsPreBooked = exports.listPreBookings = void 0;
const firebase_1 = require("../config/firebase");
const activityService_1 = require("./activityService");
const firestore_1 = require("firebase-admin/firestore");
const listPreBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('prebookings').get();
    return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
exports.listPreBookings = listPreBookings;
const markAsPreBooked = (numberId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const numberRef = firebase_1.db.collection('numbers').doc(numberId);
    const numberDoc = yield numberRef.get();
    if (!numberDoc.exists)
        throw new Error('Number not found');
    const numberData = numberDoc.data();
    const prebookingsCol = firebase_1.db.collection('prebookings');
    const prebookingRef = prebookingsCol.doc();
    const prebookingRecord = {
        id: prebookingRef.id,
        mobile: numberData.mobile,
        sum: numberData.sum,
        uploadStatus: numberData.uploadStatus || 'Pending',
        preBookingDate: firestore_1.Timestamp.now(),
        createdBy: username,
        originalNumberData: numberData,
        srNo: (yield prebookingsCol.get()).size + 1,
    };
    const historyEvent = {
        id: `${Date.now()}-prebook`,
        action: 'Marked as Pre-Booked',
        description: `Number marked as pre-booked by ${username}.`,
        timestamp: firestore_1.Timestamp.now(),
        performedBy: username,
    };
    yield firebase_1.db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        t.set(prebookingRef, prebookingRecord);
        t.delete(numberRef);
    }));
    yield (0, activityService_1.addActivity)(username, 'Pre-Booked Number', `Pre-booked ${numberData.mobile}`);
});
exports.markAsPreBooked = markAsPreBooked;
const cancelPreBooking = (prebookingId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const pbRef = firebase_1.db.collection('prebookings').doc(prebookingId);
    const pbDoc = yield pbRef.get();
    if (!pbDoc.exists)
        throw new Error('Pre-booking not found');
    const pbData = pbDoc.data();
    const numberRef = firebase_1.db.collection('numbers').doc();
    yield firebase_1.db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        t.set(numberRef, Object.assign(Object.assign({}, pbData.originalNumberData), { id: numberRef.id }));
        t.delete(pbRef);
    }));
    yield (0, activityService_1.addActivity)(username, 'Cancelled Pre-Booking', `Cancelled pre-booking for ${pbData.mobile} and returned to inventory.`);
});
exports.cancelPreBooking = cancelPreBooking;
