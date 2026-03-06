import { db } from '../../config/firebase';
import { User } from '../../shared/types/data';
import { userSchema } from '../../shared/utils/validation';

export const addUser = async (userData: User) => {
    // Validate data structure
    const validation = userSchema.partial().safeParse(userData);
    if (!validation.success) {
        throw new Error(`Data validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

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

export const deleteUser = async (userId: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) throw new Error('User not found.');

    await userRef.delete();
};

export const getAllUsers = async (): Promise<User[]> => {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as User));
};

export const updateUserTelegramUsername = async (userId: string, telegramUsername: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) throw new Error('User not found.');

    await userRef.update({ telegramUsername });
};

export const updateUserDisplayName = async (userId: string, displayName: string) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) throw new Error('User not found.');

    await userRef.update({ displayName });
};

export const getUserByTelegramUsername = async (telegramUsername: string): Promise<User | null> => {
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('telegramUsername', '==', telegramUsername).get();

    if (querySnapshot.empty) {
        return null;
    }

    // Assuming telegramUsername is unique, return the first found user
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
};
