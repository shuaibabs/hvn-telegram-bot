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
exports.updateUserTelegramUsername = exports.getAllUsers = exports.deleteUser = exports.addUser = void 0;
const firebase_1 = require("../config/firebase");
const addUser = (userData, adminUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const usersRef = firebase_1.db.collection('users');
    // Check if user already exists (by email or telegramUsername)
    if (userData.email) {
        const existingEmail = yield usersRef.where('email', '==', userData.email).get();
        if (!existingEmail.empty)
            throw new Error('User with this email already exists.');
    }
    if (userData.telegramUsername) {
        const existingTelegram = yield usersRef.where('telegramUsername', '==', userData.telegramUsername).get();
        if (!existingTelegram.empty)
            throw new Error('User with this Telegram username already exists.');
    }
    const newUserRef = usersRef.doc();
    const newUser = Object.assign(Object.assign({}, userData), { uid: newUserRef.id, id: newUserRef.id });
    yield newUserRef.set(newUser);
    return newUser;
});
exports.addUser = addUser;
const deleteUser = (userId, adminUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userDoc = yield userRef.get();
    if (!userDoc.exists)
        throw new Error('User not found.');
    yield userRef.delete();
});
exports.deleteUser = deleteUser;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = yield firebase_1.db.collection('users').get();
    return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
});
exports.getAllUsers = getAllUsers;
const updateUserTelegramUsername = (userId, telegramUsername, adminUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userDoc = yield userRef.get();
    if (!userDoc.exists)
        throw new Error('User not found.');
    yield userRef.update({ telegramUsername });
});
exports.updateUserTelegramUsername = updateUserTelegramUsername;
