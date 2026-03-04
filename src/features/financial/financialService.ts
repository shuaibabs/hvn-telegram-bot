import { db } from '../../config/firebase';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export interface FinancialRecord {
    id?: string;
    userId: string; // The user this record belongs to
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    date: Date;      // Timestamp for the record
}

// Add a new financial record
export async function addFinancialRecord(record: Omit<FinancialRecord, 'id' | 'date'>, adminUsername: string): Promise<FinancialRecord> {

    const newRecord: FinancialRecord = {
        ...record,
        date: new Date(),
    };
    const docRef = await db.collection('financial_records').add(newRecord);
    return { ...newRecord, id: docRef.id };
}

// Get all financial records for a specific user
export async function getFinancialRecordsByUser(userId: string): Promise<FinancialRecord[]> {
    const snapshot = await db.collection('financial_records').where('userId', '==', userId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as FinancialRecord));
}

// Get all financial records
export async function getAllFinancialRecords(): Promise<FinancialRecord[]> {
    const snapshot = await db.collection('financial_records').orderBy('date', 'desc').get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as FinancialRecord));
}

// Delete a financial record
export async function deleteFinancialRecord(recordId: string, adminUsername: string): Promise<void> {
    await db.collection('financial_records').doc(recordId).delete();
}
