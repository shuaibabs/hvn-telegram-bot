"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentTimestamp = exports.calculateDigitalRoot = exports.calculateDigitSum = void 0;
const firestore_1 = require("firebase-admin/firestore");
const calculateDigitSum = (mobile) => {
    if (!mobile)
        return 0;
    return mobile
        .toString()
        .replace(/\D/g, '') // remove non-digits
        .split('')
        .map(Number)
        .reduce((a, b) => a + b, 0);
};
exports.calculateDigitSum = calculateDigitSum;
const calculateDigitalRoot = (mobile) => {
    let sum = (0, exports.calculateDigitSum)(mobile);
    while (sum > 9) {
        sum = sum
            .toString()
            .split('')
            .map(Number)
            .reduce((a, b) => a + b, 0);
    }
    return sum;
};
exports.calculateDigitalRoot = calculateDigitalRoot;
const getCurrentTimestamp = () => {
    return firestore_1.Timestamp.now();
};
exports.getCurrentTimestamp = getCurrentTimestamp;
