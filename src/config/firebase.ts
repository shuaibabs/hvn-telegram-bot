import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(
    serviceAccount as admin.ServiceAccount
  )
  // databaseURL: process.env.FIREBASE_DATABASE_URL,
});

console.log('Firebase Admin SDK initialized successfully.');

export const db = admin.firestore();
export const auth = admin.auth();
