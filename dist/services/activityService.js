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
exports.addActivity = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const addActivity = (employeeName, action, description) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activitiesCol = firebase_1.db.collection('activities');
        const snapshot = yield activitiesCol.orderBy('srNo', 'desc').limit(1).get();
        const maxSrNo = snapshot.docs.length > 0 ? snapshot.docs[0].data().srNo : 0;
        yield activitiesCol.add({
            employeeName,
            action,
            description,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            srNo: maxSrNo + 1,
        });
    }
    catch (error) {
        console.error('Error adding activity:', error);
    }
});
exports.addActivity = addActivity;
