
import { db } from '../../config/firebase';

export type UserRole = 'admin' | 'employee';

export interface UserData {
    uid?: string;
    email: string;
    displayName: string;
    role: UserRole;
    telegramUsername?: string;
    id?: string;
}

export const addUser = async (userData: UserData, adminUsername: string) => {
    const usersRef = db.collection('users');

    // Check if user already exists (by email or telegramUsername)
    if (userData.email) {
        const existingEmail = await usersRef.where('email', '==', userData.email).get();
        if (!existingEmail.empty) throw new Error('User with this email already exists.');
    }

    if (userData.telegramUsername) {
        const existingTelegram = await usersRef.where('telegramUsername', '==', userData.telegramUsername).get();
        if (!existingTelegram.empty) throw new Error('User with this Telegram username already exists.');
    }

    const newUserRef = usersRef.doc();
    const newUser = {
        ...userData,
        uid: newUserRef.id,
        id: newUserRef.id,
    };

    await newUserRef.set(newUser);
    return newUser;
};

export const deleteUser = async (userId: string, adminUsername: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) throw new Error('User not found.');

    await userRef.delete();
};

export const getAllUsers = async () => {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as UserData));
};

export const updateUserTelegramUsername = async (userId: string, telegramUsername: string, adminUsername: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) throw new Error('User not found.');

    await userRef.update({ telegramUsername });
};

