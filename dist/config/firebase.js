"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountKey_json_1 = __importDefault(require("../config/serviceAccountKey.json"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountKey_json_1.default)
    // databaseURL: process.env.FIREBASE_DATABASE_URL,
});
console.log('Firebase Admin SDK initialized successfully.');
exports.db = firebase_admin_1.default.firestore();
exports.auth = firebase_admin_1.default.auth();
