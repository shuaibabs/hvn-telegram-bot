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
function grantAdmin(telegramUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const usersRef = firebase_1.db.collection('users');
            // Check if user already exists
            const query = yield usersRef.where('telegramUsername', '==', telegramUsername).get();
            if (!query.empty) {
                console.log(`User ${telegramUsername} already exists.`);
                return;
            }
            // Add new admin user
            const newUser = {
                telegramUsername: telegramUsername,
                role: 'admin',
                displayName: 'Admin User',
            };
            yield usersRef.add(newUser);
            console.log(`Successfully added ${telegramUsername} as an authorized admin!`);
        }
        catch (error) {
            console.error('Error adding user:', error);
        }
        finally {
            process.exit();
        }
    });
}
const username = process.argv[2];
if (!username) {
    console.log('Please provide a telegram username: npx ts-node grant-admin.ts your_username');
    process.exit();
}
grantAdmin(username);
