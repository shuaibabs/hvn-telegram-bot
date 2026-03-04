import { db } from '../config/firebase';
import { calculateDigitalRoot, calculateDigitSum } from '../utils/utils';
import { addActivity } from './activityService';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const createLifecycleEvent = (action: string, description: string, performedBy: string) => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    description,
    timestamp: Timestamp.now(),
    performedBy,
});

export interface NumberData {
    mobile: string;
    sellingPrice?: number;
    purchasePrice?: number;
    numberType?: 'Prepaid' | 'Postpaid' | 'COCP' | string;
    purchaseFrom?: string;
    vendor?: string; // alias for purchaseFrom
    currentLocation?: string;
    locationType?: 'Store' | 'Employee' | 'Dealer' | string;
    status: 'RTP' | 'Non-RTP' | string;
    inventoryStatus?: string; // Added to store 'AVAILABLE', 'SOLD' etc if needed
    ownershipType?: 'Individual' | 'Partnership' | string;
    partnerName?: string;
    accountName?: string;
    rtpDate?: Timestamp | null;
    billDate?: Timestamp | null;
    pdBill?: 'Yes' | 'No';
    uploadStatus?: 'Pending' | 'Done' | string;
    assignedTo?: string;
    sum?: number;
    digitSum?: number;
    [key: string]: any;
}

export const addNumber = async (numberData: Partial<NumberData>, username: string) => {
    const numbersCol = db.collection('numbers');

    const snapshot = await numbersCol.where('mobile', '==', numberData.mobile).get();
    if (!snapshot.empty) throw new Error(`Number ${numberData.mobile} already exists in inventory.`);

    const newNumberRef = numbersCol.doc();
    const historyEvent = createLifecycleEvent('Added Number', `Number added to inventory by ${username}.`, username);

    const newNumber = {
        ...numberData,
        id: newNumberRef.id,
        purchaseDate: Timestamp.now(),
        sum: calculateDigitalRoot(numberData.mobile || ''),
        digitSum: calculateDigitSum(numberData.mobile || ''),
        createdBy: username,
        history: [historyEvent],
    };

    await newNumberRef.set(newNumber);
    await addActivity(username, 'Added Number', `Added new number ${numberData.mobile}`);
    return newNumber;
};

export const updateNumber = async (mobile: string, updates: Partial<NumberData>, username: string, actionName: string = 'Updated Number') => {
    const numbersCol = db.collection('numbers');
    const snapshot = await numbersCol.where('mobile', '==', mobile).limit(1).get();

    if (snapshot.empty) throw new Error(`Number ${mobile} not found.`);

    const numberDoc = snapshot.docs[0];
    const numberRef = numberDoc.ref;

    const historyEvent = createLifecycleEvent(actionName, `Updated by ${username}`, username);

    await numberRef.update({
        ...updates,
        history: FieldValue.arrayUnion(historyEvent)
    });

    await addActivity(username, actionName, `Updated fields for ${mobile}`);
};

export const sellNumber = async (numberId: string, saleData: any, username: string) => {
    const numberRef = db.collection('numbers').doc(numberId);
    const numberDoc = await numberRef.get();

    if (!numberDoc.exists) throw new Error('Number not found');

    const numberData = numberDoc.data();
    const salesCol = db.collection('sales');
    const saleRef = salesCol.doc();

    const newSale = {
        ...saleData,
        id: saleRef.id,
        saleDate: saleData.saleDate ? Timestamp.fromDate(new Date(saleData.saleDate)) : Timestamp.now(),
        originalNumberData: numberData,
        srNo: (await salesCol.get()).size + 1,
        createdBy: username,
    };

    await db.runTransaction(async (t) => {
        t.set(saleRef, newSale);
        t.delete(numberRef);
    });

    await addActivity(username, 'Sold Number', `Sold number ${numberData?.mobile} for ₹${saleData.salePrice}`);
    return newSale;
};

export const deleteNumber = async (numberId: string, reason: string, username: string) => {
    const numberRef = db.collection('numbers').doc(numberId);
    const numberDoc = await numberRef.get();

    if (!numberDoc.exists) throw new Error('Number not found');

    const numberData = numberDoc.data();
    const deletedNumbersCol = db.collection('deletedNumbers');
    const deletedRef = deletedNumbersCol.doc();

    const deletedRecord = {
        originalId: numberId,
        srNo: (await deletedNumbersCol.get()).size + 1,
        mobile: numberData?.mobile,
        sum: numberData?.sum,
        deletionReason: reason,
        deletedBy: username,
        deletedAt: Timestamp.now(),
        originalNumberData: numberData,
    };

    await db.runTransaction(async (t) => {
        t.set(deletedRef, deletedRecord);
        t.delete(numberRef);
    });

    await addActivity(username, 'Deleted Number', `Deleted number ${numberData?.mobile}. Reason: ${reason}`);
};

export const advancedSearch = async (filters: any) => {
    let query: any = db.collection('numbers');

    if (filters.STATUS) query = query.where('status', '==', filters.STATUS);
    if (filters.OWN) query = query.where('ownershipType', '==', filters.OWN);
    if (filters.ROOT) query = query.where('sum', '==', Number(filters.ROOT));
    if (filters.TOTAL) query = query.where('digitSum', '==', Number(filters.TOTAL));

    const snapshot = await query.get();
    let results = snapshot.docs.map((doc: any) => doc.data());

    // Post-filter complex digit patterns
    if (filters.START) results = results.filter((n: any) => n.mobile.startsWith(filters.START));
    if (filters.END) results = results.filter((n: any) => n.mobile.endsWith(filters.END));
    if (filters.ANYWHERE) results = results.filter((n: any) => n.mobile.includes(filters.ANYWHERE));

    if (filters.MUST) {
        const mustArr = filters.MUST.toString().split(',');
        results = results.filter((n: any) => mustArr.every((s: string) => n.mobile.includes(s)));
    }

    if (filters.NOT) {
        const notArr = filters.NOT.toString().split(',');
        results = results.filter((n: any) => !notArr.some((s: string) => n.mobile.includes(s)));
    }

    if (filters.ONLY) {
        const allowed = new Set(filters.ONLY.toString().split(''));
        results = results.filter((n: any) => n.mobile.split('').every((char: string) => allowed.has(char)));
    }

    if (filters.MAXCONTAIN) {
        // e.g. 9,1,5 means mobile has these digits
        const digits = filters.MAXCONTAIN.toString().split(',');
        results = results.filter((n: any) => digits.every((d: string) => n.mobile.includes(d)));
    }

    return results;
};

