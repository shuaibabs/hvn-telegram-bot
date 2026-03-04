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
exports.cancelSale = exports.listSales = void 0;
const firebase_1 = require("../config/firebase");
const activityService_1 = require("./activityService");
const listSales = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('sales').orderBy('saleDate', 'desc').get();
    return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
});
exports.listSales = listSales;
const cancelSale = (saleId, username) => __awaiter(void 0, void 0, void 0, function* () {
    const saleRef = firebase_1.db.collection('sales').doc(saleId);
    const saleDoc = yield saleRef.get();
    if (!saleDoc.exists)
        throw new Error('Sale not found');
    const saleData = saleDoc.data();
    const numberRef = firebase_1.db.collection('numbers').doc(); // Create new number back in inventory
    yield firebase_1.db.runTransaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        t.set(numberRef, Object.assign(Object.assign({}, saleData.originalNumberData), { id: numberRef.id, status: 'RTP' }));
        t.delete(saleRef);
    }));
    yield (0, activityService_1.addActivity)(username, 'Cancelled Sale', `Cancelled sale for ${saleData === null || saleData === void 0 ? void 0 : saleData.mobile} and returned to inventory.`);
});
exports.cancelSale = cancelSale;
