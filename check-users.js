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
const firebase_1 = require("./src/config/firebase");
function listUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const snapshot = yield firebase_1.db.collection('users').get();
            if (snapshot.empty) {
                console.log('No users found.');
                return;
            }
            console.log('--- Authorized Users ---');
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`Document ID: ${doc.id}`);
                console.log(`- telegramUsername: ${data.telegramUsername}`);
                console.log(`- role: ${data.role}`);
                console.log(`- displayName: ${data.displayName}`);
                console.log('-------------------------');
            });
        }
        catch (error) {
            console.error('Error fetching users:', error);
        }
        finally {
            process.exit();
        }
    });
}
listUsers();
