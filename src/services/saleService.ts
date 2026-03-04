
import { db } from '../config/firebase';
import { addActivity } from './activityService';

export const listSales = async () => {
    const snapshot = await db.collection('sales').orderBy('saleDate', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const cancelSale = async (saleId: string, username: string) => {
    const saleRef = db.collection('sales').doc(saleId);
    const saleDoc = await saleRef.get();

    if (!saleDoc.exists) throw new Error('Sale not found');

    const saleData = saleDoc.data() as any;
    const numberRef = db.collection('numbers').doc(); // Create new number back in inventory

    await db.runTransaction(async (t) => {
        t.set(numberRef, {
            ...saleData.originalNumberData,
            id: numberRef.id,
            status: 'RTP', // Usually returned to RTP
        });
        t.delete(saleRef);
    });

    await addActivity(username, 'Cancelled Sale', `Cancelled sale for ${saleData?.mobile} and returned to inventory.`);
};

