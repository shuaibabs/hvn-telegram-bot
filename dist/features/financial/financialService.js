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
exports.addFinancialRecord = addFinancialRecord;
exports.getFinancialRecordsByUser = getFinancialRecordsByUser;
exports.getAllFinancialRecords = getAllFinancialRecords;
exports.deleteFinancialRecord = deleteFinancialRecord;
const firebase_1 = require("../../config/firebase");
// Add a new financial record
function addFinancialRecord(record, adminUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        const newRecord = Object.assign(Object.assign({}, record), { date: new Date() });
        const docRef = yield firebase_1.db.collection('financial_records').add(newRecord);
        return Object.assign(Object.assign({}, newRecord), { id: docRef.id });
    });
}
// Get all financial records for a specific user
function getFinancialRecordsByUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const snapshot = yield firebase_1.db.collection('financial_records').where('userId', '==', userId).get();
        return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    });
}
// Get all financial records
function getAllFinancialRecords() {
    return __awaiter(this, void 0, void 0, function* () {
        const snapshot = yield firebase_1.db.collection('financial_records').orderBy('date', 'desc').get();
        return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    });
}
// Delete a financial record
function deleteFinancialRecord(recordId, adminUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        yield firebase_1.db.collection('financial_records').doc(recordId).delete();
    });
}
