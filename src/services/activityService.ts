import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const addActivity = async (employeeName: string, action: string, description: string) => {
  try {
    const activitiesCol = db.collection('activities');
    const snapshot = await activitiesCol.orderBy('srNo', 'desc').limit(1).get();
    const maxSrNo = snapshot.docs.length > 0 ? snapshot.docs[0].data().srNo : 0;

    await activitiesCol.add({
      employeeName,
      action,
      description,
      timestamp: FieldValue.serverTimestamp(),
      srNo: maxSrNo + 1,
    });
  } catch (error) {
    console.error('Error adding activity:', error);
  }
};

