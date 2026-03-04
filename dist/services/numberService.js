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
exports.advancedSearch = exports.deleteNumber = exports.sellNumber = exports.updateNumber = exports.addNumber = void 0;
const firebase_1 = require("../config/firebase");
const utils_1 = require("../utils/utils");
const activityService_1 = require("./activityService");
const firestore_1 = require("firebase-admin/firestore");
const createLifecycleEvent = (action, description, performedBy) => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    description,
    timestamp: firestore_1.Timestamp.now(),
    performedBy,
});
const addNumber = (numberData, username) => __awaiter(void 0, void 0, void 0, function* () {
    const numbersCol = firebase_1.db.collection('numbers');
    const snapshot = yield numbersCol.where('mobile', '==', numberData.mobile).get();
    if (!snapshot.empty)
        throw new Error(`Number ${numberData.mobile} already exists in inventory.`);
    const newNumberRef = numbersCol.doc();
    const historyEvent = createLifecycleEvent('Added Number', `Number added to inventory by ${username}.`, username);
    const newNumber = Object.assign(Object.assign({}, numberData), { id: newNumberRef.id, purchaseDate: firestore_1.Timestamp.now(), sum: (0, utils_1.calculateDigitalRoot)(numberData.mobile || ''), digitSum: (0, utils_1.calculateDigitSum)(numberData.mobile || ''), createdBy: username, history: [historyEvent] });
    yield newNumberRef.set(newNumber);
    yield (0, activityService_1.addActivity)(username, 'Added Number', `Added new number ${numberData.mobile}`);
    return newNumber;
});
exports.addNumber = addNumber;
const updateNumber = (mobile_1, updates_1, username_1, ...args_1) => __awaiter(void 0, [mobile_1, updates_1, username_1, ...args_1], void 0, function* (mobile, updates, username, actionName = 'Updated Number') {
    const numbersCol = firebase_1.db.collection('numbers');
    const snapshot = yield numbersCol.where('mobile', '==', mobile).limit(1).get();
    if (snapshot.empty)
        throw new Error(`Number ${mobile} not found.`);
    const numberDoc = snapshot.docs[0];
    const numberRef = numberDoc.ref;
    const historyEvent = createLifecycleEvent(actionName, `Updated by ${username}`, username);
    yield numberRef.update(Object.assign(Object.assign({}, updates), { history: firestore_1.FieldValue.arrayUnion(historyEvent) }));
    yield (0, activityService_1.addActivity)(username, actionName, `Updated fields for ${mobile}`);
});
exports.updateNumber = updateNumber;
const sellNumber = (numberId, saleData, username) => __awaiter(void 0, void 0, void 0, function* () {
    const numberRef = firebase_1.db.collection('numbers').doc(numberId);
    const numberDoc = yield numberRef.get();
    if (!numberDoc.exists)
        throw new Error('Number not found');
    const numberData = numberDoc.data();
    const salesCol = firebase_1.db.collection('sales');
    const saleRef = salesCol.doc();
    const newSale = Object.assign(Object.assign({}, saleData), { id: saleRef.id, saleDate: saleData.saleDate ? firestore_1.Timestamp.fromDate(new Date(saleData.saleDate)) : firestore_1.Timestamp.now(), originalNumberData: numberData, srNo: (yield salesCol.get()).size + 1, createdBy: username });
    yield firebase_1.db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        t.set(saleRef, newSale);
        t.delete(numberRef);
    }));
    yield (0, activityService_1.addActivity)(username, 'Sold Number', `Sold number ${numberData === null || numberData === void 0 ? void 0 : numberData.mobile} for ₹${saleData.salePrice}`);
    return newSale;
});
exports.sellNumber = sellNumber;
const deleteNumber = (numberId, reason, username) => __awaiter(void 0, void 0, void 0, function* () {
    const numberRef = firebase_1.db.collection('numbers').doc(numberId);
    const numberDoc = yield numberRef.get();
    if (!numberDoc.exists)
        throw new Error('Number not found');
    const numberData = numberDoc.data();
    const deletedNumbersCol = firebase_1.db.collection('deletedNumbers');
    const deletedRef = deletedNumbersCol.doc();
    const deletedRecord = {
        originalId: numberId,
        srNo: (yield deletedNumbersCol.get()).size + 1,
        mobile: numberData === null || numberData === void 0 ? void 0 : numberData.mobile,
        sum: numberData === null || numberData === void 0 ? void 0 : numberData.sum,
        deletionReason: reason,
        deletedBy: username,
        deletedAt: firestore_1.Timestamp.now(),
        originalNumberData: numberData,
    };
    yield firebase_1.db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        t.set(deletedRef, deletedRecord);
        t.delete(numberRef);
    }));
    yield (0, activityService_1.addActivity)(username, 'Deleted Number', `Deleted number ${numberData === null || numberData === void 0 ? void 0 : numberData.mobile}. Reason: ${reason}`);
});
exports.deleteNumber = deleteNumber;
const advancedSearch = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let query = firebase_1.db.collection('numbers');
    if (filters.STATUS)
        query = query.where('status', '==', filters.STATUS);
    if (filters.OWN)
        query = query.where('ownershipType', '==', filters.OWN);
    if (filters.ROOT)
        query = query.where('sum', '==', Number(filters.ROOT));
    if (filters.TOTAL)
        query = query.where('digitSum', '==', Number(filters.TOTAL));
    const snapshot = yield query.get();
    let results = snapshot.docs.map((doc) => doc.data());
    // Post-filter complex digit patterns
    if (filters.START)
        results = results.filter((n) => n.mobile.startsWith(filters.START));
    if (filters.END)
        results = results.filter((n) => n.mobile.endsWith(filters.END));
    if (filters.ANYWHERE)
        results = results.filter((n) => n.mobile.includes(filters.ANYWHERE));
    if (filters.MUST) {
        const mustArr = filters.MUST.toString().split(',');
        results = results.filter((n) => mustArr.every((s) => n.mobile.includes(s)));
    }
    if (filters.NOT) {
        const notArr = filters.NOT.toString().split(',');
        results = results.filter((n) => !notArr.some((s) => n.mobile.includes(s)));
    }
    if (filters.ONLY) {
        const allowed = new Set(filters.ONLY.toString().split(''));
        results = results.filter((n) => n.mobile.split('').every((char) => allowed.has(char)));
    }
    if (filters.MAXCONTAIN) {
        // e.g. 9,1,5 means mobile has these digits
        const digits = filters.MAXCONTAIN.toString().split(',');
        results = results.filter((n) => digits.every((d) => n.mobile.includes(d)));
    }
    return results;
});
exports.advancedSearch = advancedSearch;
