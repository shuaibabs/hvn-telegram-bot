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
exports.isAdmin = exports.getUserByTelegramUsername = void 0;
const firebase_1 = require("../../config/firebase");
const getUserByTelegramUsername = (telegramUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const usersRef = firebase_1.db.collection('users');
    const snapshot = yield usersRef.where('telegramUsername', '==', telegramUsername).limit(1).get();
    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].data();
});
exports.getUserByTelegramUsername = getUserByTelegramUsername;
const isAdmin = (telegramUsername) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, exports.getUserByTelegramUsername)(telegramUsername);
    return (user === null || user === void 0 ? void 0 : user.role) === 'admin';
});
exports.isAdmin = isAdmin;
