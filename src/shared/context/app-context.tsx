

// "use client";

// import type { ReactNode } from 'react';
// import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   type Activity,
//   type NumberRecord,
//   type Reminder,
//   type SaleRecord,
//   NewNumberData,
//   type DealerPurchaseRecord,
//   NewDealerPurchaseData,
//   NewReminderData,
//   type User,
//   PreBookingRecord,
//   NewPaymentData,
//   PaymentRecord,
//   GlobalHistoryRecord,
//   LifecycleEvent,
//   DeletedNumberRecord,
// } from '@/lib/data';
// import { useToast } from '@/hooks/use-toast';
// import { isToday, isPast, isValid, parse, subDays } from 'date-fns';
// import { useAuth } from '@/context/auth-context';
// import {
//   collection,
//   query,
//   addDoc,
//   updateDoc,
//   doc,
//   serverTimestamp,
//   deleteDoc,
//   writeBatch,
//   Timestamp,
//   onSnapshot,
//   getDocs,
//   where,
//   DocumentData,
//   Unsubscribe,
//   QuerySnapshot,
//   QueryDocumentSnapshot,
//   arrayUnion,
// } from 'firebase/firestore';
// import { useFirestore } from '@/firebase';
// import { errorEmitter } from '@/firebase/error-emitter';
// import { FirestorePermissionError } from '@/firebase/errors';
// import { calculateDigitalRoot, cn } from '@/lib/utils';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Spinner } from '@/components/ui/spinner';

// // Helper to get the next serial number for a collection
// const getNextSrNo = (records: { srNo?: number }[]): number => {
//   if (!records || records.length === 0) {
//     return 1;
//   }
//   const maxSrNo = Math.max(...records.map(r => r.srNo || 0));
//   return maxSrNo + 1;
// };

// // Helper function to map snapshot to data with ID
// const mapSnapshotToData = <T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] => {
//   return snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data(),
//   } as T));
// };

// // Helper function to convert undefined values to null in an object
// const sanitizeObjectForFirestore = (obj: any): any => {
//     if (obj === null || obj === undefined) {
//         return null;
//     }
//     if (typeof obj !== 'object' || obj instanceof Timestamp || obj instanceof Date) {
//         return obj;
//     }

//     if (Array.isArray(obj)) {
//         return obj.map(item => sanitizeObjectForFirestore(item));
//     }

//     const newObj: { [key: string]: any } = {};
//     for (const key in obj) {
//         if (Object.prototype.hasOwnProperty.call(obj, key)) {
//             const value = obj[key];
//             newObj[key] = value === undefined ? null : sanitizeObjectForFirestore(value);
//         }
//     }
//     return newObj;
// };

// const createDetailedDescription = (baseText: string, affectedNumbers: string[]) => {
//     if (affectedNumbers.length === 0) {
//         return `${baseText} 0 numbers.`;
//     }
//     return `${baseText} ${affectedNumbers.length} numbers: ${affectedNumbers.join(', ')}.`;
// };


// type BulkAddResult = {
//   successCount: number;
//   updatedCount: number;
//   failedRecords: { record: any, reason: string }[];
// }

// type AppContextType = {
//   loading: boolean;
//   numbers: NumberRecord[];
//   sales: SaleRecord[];
//   reminders: Reminder[];
//   activities: Activity[];
//   users: User[];
//   employees: string[];
//   vendors: string[];
//   dealerPurchases: DealerPurchaseRecord[];
//   preBookings: PreBookingRecord[];
//   payments: PaymentRecord[];
//   globalHistory: GlobalHistoryRecord[];
//   deletedNumbers: DeletedNumberRecord[];
//   seenActivitiesCount: number;
//   recentlyAutoRtpIds: string[];
//   showReminderPopup: boolean;
//   pendingRemindersForPopup: Reminder[];
//   closeReminderPopup: () => void;
//   markActivitiesAsSeen: () => void;
//   isMobileNumberDuplicate: (mobile: string, currentId?: string) => boolean;
//   updateUser: (uid: string, data: { displayName: string, telegramUsername?: string }) => void;
//   updateNumber: (id: string, data: NewNumberData) => void;
//   updateNumberStatus: (id: string, status: 'RTP' | 'Non-RTP', rtpDate: Date | null, note?: string) => void;
//   updateUploadStatus: (id: string, uploadStatus: 'Pending' | 'Done') => void;
//   bulkUpdateUploadStatus: (numberIds: string[], uploadStatus: 'Pending' | 'Done') => void;
//   markReminderDone: (id: string, note?: string) => void;
//   addActivity: (activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast?: boolean) => void;
//   assignNumbersToEmployee: (numberIds: string[], employeeName: string, location: { locationType: 'Store' | 'Employee' | 'Dealer'; currentLocation: string; }) => void;
//   checkInNumber: (id: string) => void;
//   sellNumber: (id: string, details: { salePrice: number; soldTo: string; saleDate: Date }) => void;
//   bulkSellNumbers: (numbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => void;
//   cancelSale: (saleId: string) => void;
//   addNumber: (data: NewNumberData) => void;
//   addMultipleNumbers: (data: NewNumberData, validNumbers: string[]) => Promise<void>;
//   addDealerPurchase: (data: NewDealerPurchaseData) => void;
//   bulkAddNumbers: (records: any[]) => Promise<BulkAddResult>;
//   addReminder: (data: NewReminderData, showToast?: boolean) => Promise<void>;
//   deleteReminder: (id: string) => void;
//   assignRemindersToUsers: (reminderIds: string[], userNames: string[]) => void;
//   deleteDealerPurchases: (records: DealerPurchaseRecord[]) => void;
//   deleteActivities: (activityIds: string[]) => void;
//   updateSafeCustodyDate: (numberId: string, newDate: Date) => void;
//   bulkUpdateSafeCustodyDate: (numberIds: string[], newDate: Date) => void;
//   deleteNumbers: (numberIds: string[], reason: string) => void;
//   restoreDeletedNumber: (deletedNumberId: string) => void;
//   deleteUser: (uid: string) => void;
//   updateNumberLocation: (numberIds: string[], location: { locationType: 'Store' | 'Employee' | 'Dealer', currentLocation: string }) => void;
//   markAsPreBooked: (numberIds: string[]) => void;
//   cancelPreBooking: (preBookingId: string) => void;
//   sellPreBookedNumber: (preBookingId: string, details: { salePrice: number; soldTo: string; saleDate: Date }) => void;
//   bulkSellPreBookedNumbers: (preBookedNumbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => void;
//   addPayment: (data: NewPaymentData) => void;
//   updatePostpaidDetails: (id: string, details: { billDate: Date, pdBill: 'Yes' | 'No' }) => void;
//   bulkUpdatePostpaidDetails: (numberIds: string[], details: { billDate: Date, pdBill: 'Yes' | 'No' }) => void;
//   bulkMarkRemindersDone: (reminderIds: string[], note?: string) => void;
//   bulkDeleteReminders: (reminderIds: string[]) => void;
// };

// const AppContext = createContext<AppContextType | undefined>(undefined);

// export function AppProvider({ children }: { children: ReactNode }) {
//   const { toast } = useToast();
//   const { user, role, loading: authLoading } = useAuth();
//   const db = useFirestore();

//   const [numbers, setNumbers] = useState<NumberRecord[]>([]);
//   const [sales, setSales] = useState<SaleRecord[]>([]);
//   const [reminders, setReminders] = useState<Reminder[]>([]);
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [dealerPurchases, setDealerPurchases] = useState<DealerPurchaseRecord[]>([]);
//   const [preBookings, setPreBookings] = useState<PreBookingRecord[]>([]);
//   const [deletedNumbers, setDeletedNumbers] = useState<DeletedNumberRecord[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [payments, setPayments] = useState<PaymentRecord[]>([]);
//   const [employees, setEmployees] = useState<string[]>([]);
//   const [vendors, setVendors] = useState<string[]>([]);
  
//   const [roleFilteredActivities, setRoleFilteredActivities] = useState<Activity[]>([]);
//   const [seenActivitiesCount, setSeenActivitiesCount] = useState(0);
//   const [recentlyAutoRtpIds, setRecentlyAutoRtpIds] = useState<string[]>([]);
//   const [showReminderPopup, setShowReminderPopup] = useState(false);
//   const [pendingRemindersForPopup, setPendingRemindersForPopup] = useState<Reminder[]>([]);
//   const [remindersShownInPopup, setRemindersShownInPopup] = useState<Set<string>>(new Set());

//   const [numbersLoading, setNumbersLoading] = useState(true);
//   const [salesLoading, setSalesLoading] = useState(true);
//   const [remindersLoading, setRemindersLoading] = useState(true);
//   const [activitiesLoading, setActivitiesLoading] = useState(true);
//   const [dealerPurchasesLoading, setDealerPurchasesLoading] = useState(true);
//   const [preBookingsLoading, setPreBookingsLoading] = useState(true);
//   const [deletedNumbersLoading, setDeletedNumbersLoading] = useState(true);
//   const [usersLoading, setUsersLoading] = useState(true);
//   const [paymentsLoading, setPaymentsLoading] = useState(true);

//     // Combined loading state: true if auth is loading OR if auth is done but any data is still loading.
//   const loading =
//     authLoading || 
//     (!!user && (
//       numbersLoading ||
//       salesLoading ||
//       remindersLoading ||
//       activitiesLoading ||
//       dealerPurchasesLoading ||
//       preBookingsLoading ||
//       deletedNumbersLoading ||
//       usersLoading ||
//       paymentsLoading
//     ));

//   const createLifecycleEvent = useCallback((action: string, description: string, performedBy: string): LifecycleEvent => ({
//     id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
//     action,
//     description,
//     timestamp: Timestamp.now(),
//     performedBy,
//   }), []);
    
//   const getSeenCountKey = useCallback(() => {
//     return user ? `seenActivitiesCount_${user.uid}` : null;
//   }, [user?.uid]);

//   const addActivity = useCallback((activity: Omit<Activity, 'id' | 'srNo' | 'timestamp' | 'createdBy'>, showToast = true) => {
//     if (!db || !user) return;
//     const newActivity = { 
//         ...activity, 
//         srNo: getNextSrNo(activities),
//         timestamp: serverTimestamp(),
//         createdBy: user.uid,
//     };
//     addDoc(collection(db, 'activities'), newActivity)
//       .then(() => {
//         if (showToast) {
//           toast({
//             title: activity.action,
//             description: activity.description,
//           });
//         }
//       })
//       .catch(async (serverError) => {
//           const permissionError = new FirestorePermissionError({
//             path: 'activities',
//             operation: 'create',
//             requestResourceData: newActivity,
//           });
//           errorEmitter.emit('permission-error', permissionError);
//       });
//   }, [db, user, activities, toast]);

//   const addReminder = useCallback(async (data: NewReminderData, showToast = true) => {
//     if (!db || !user) return;

//     const newReminder: Omit<Reminder, 'id'> = {
//       ...data,
//       srNo: getNextSrNo(reminders),
//       status: 'Pending',
//       dueDate: Timestamp.fromDate(data.dueDate),
//       createdBy: user.uid,
//     };
    
//     const remindersCollection = collection(db, 'reminders');
//     try {
//         await addDoc(remindersCollection, newReminder);
//         if (showToast) {
//             addActivity({
//                 employeeName: user.displayName || user.email || 'User',
//                 action: 'Added Reminder',
//                 description: `Assigned task "${data.taskName}" to ${data.assignedTo.join(', ')}`
//             });
//         }
//     } catch (serverError) {
//         const permissionError = new FirestorePermissionError({
//             path: 'reminders',
//             operation: 'create',
//             requestResourceData: newReminder,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     }
//   }, [db, user, reminders, addActivity]);

//   useEffect(() => {
//     if (activitiesLoading || !user) return; 

//     const seenCountKey = getSeenCountKey();
//     if (seenCountKey) {
//         let storedCount = Number(localStorage.getItem(seenCountKey) || 0);
//         if (storedCount > activities.length) {
//             storedCount = activities.length;
//             localStorage.setItem(seenCountKey, String(storedCount));
//         }
//         setSeenActivitiesCount(storedCount);
//     } else {
//         setSeenActivitiesCount(0);
//     }
//   }, [activities.length, activitiesLoading, user, getSeenCountKey]);


//   const markActivitiesAsSeen = useCallback(() => {
//     const total = activities.length;
//     const seenCountKey = getSeenCountKey();
//     if (seenCountKey) {
//         setSeenActivitiesCount(total);
//         localStorage.setItem(seenCountKey, String(total));
//     }
//   }, [activities.length, getSeenCountKey]);
  

//   useEffect(() => {
//     if (!db || !user) {
//       // If not logged in, reset state and stop loading
//       setNumbers([]);
//       setSales([]);
//       setReminders([]);
//       setActivities([]);
//       setDealerPurchases([]);
//       setPreBookings([]);
//       setDeletedNumbers([]);
//       setUsers([]);
//       setPayments([]);
//       setEmployees([]);
//       setVendors([]);
//       setNumbersLoading(false);
//       setSalesLoading(false);
//       setRemindersLoading(false);
//       setActivitiesLoading(false);
//       setDealerPurchasesLoading(false);
//       setPreBookingsLoading(false);
//       setDeletedNumbersLoading(false);
//       setUsersLoading(false);
//       setPaymentsLoading(false);
//       return;
//     }
    
//     // Set loading true when user changes
//     setNumbersLoading(true);
//     setSalesLoading(true);
//     setRemindersLoading(true);
//     setActivitiesLoading(true);
//     setDealerPurchasesLoading(true);
//     setPreBookingsLoading(true);
//     setDeletedNumbersLoading(true);
//     setUsersLoading(true);
//     setPaymentsLoading(true);

//     const subscriptions: Unsubscribe[] = [];
//     const collectionMappings = [
//       { name: 'numbers', setter: setNumbers, loader: setNumbersLoading },
//       { name: 'sales', setter: setSales, loader: setSalesLoading },
//       { name: 'reminders', setter: setReminders, loader: setRemindersLoading },
//       { name: 'activities', setter: setActivities, loader: setActivitiesLoading },
//       { name: 'dealerPurchases', setter: setDealerPurchases, loader: setDealerPurchasesLoading },
//       { name: 'prebookings', setter: setPreBookings, loader: setPreBookingsLoading },
//       { name: 'deletedNumbers', setter: setDeletedNumbers, loader: setDeletedNumbersLoading },
//       { name: 'payments', setter: setPayments, loader: setPaymentsLoading },
//       { name: 'users', setter: (data: User[]) => {
//           setUsers(data);
//           setEmployees(data.map(u => u.displayName).sort())
//         }, 
//         loader: setUsersLoading 
//       },
//     ];

//     collectionMappings.forEach(({ name, setter, loader }) => {
//       const collectionRef = collection(db, name);
//       const q = query(collectionRef);
//       const unsubscribe = onSnapshot(q, (querySnapshot) => {
//         const data = mapSnapshotToData(querySnapshot);
//         setter(data as any); // Cast as any because setters have different types
//         loader(false);
//       }, (error) => {
//         const permissionError = new FirestorePermissionError({
//             path: collectionRef.path,
//             operation: 'list',
//         });
//         errorEmitter.emit('permission-error', permissionError);
//         loader(false);
//       });
//       subscriptions.push(unsubscribe);
//     });

//     return () => {
//       subscriptions.forEach(sub => sub());
//     };
//   }, [db, user]);

//   useEffect(() => {
//     if (loading || !user) return;

//     if (role === 'admin') {
//       setRoleFilteredActivities(activities);
//     } else {
//       const filtered = activities.filter(
//         (activity) => activity.employeeName === user.displayName
//       );
//       setRoleFilteredActivities(filtered);
//     }
//   }, [activities, role, user, loading]);

//   // Effect to derive vendors list
//   useEffect(() => {
//     const defaultVendors = [
//         "lifetimenumber",
//         "vipnumberstore",
//         "vipnumbershop",
//         "numberwale",
//         "numberspoint",
//         "vipfancynumber",
//         "numberatm",
//         "numbersolution"
//     ];
//     const allSalesVendors = sales.map(s => s.soldTo).filter(Boolean);
//     const uniqueVendors = [...new Set([...defaultVendors, ...allSalesVendors])];
//     setVendors(uniqueVendors.sort());
//   }, [sales]);

//   const globalHistory = useMemo<GlobalHistoryRecord[]>(() => {
//     if (loading) return [];

//     const inventoryHistory: GlobalHistoryRecord[] = numbers.map(num => ({
//       id: `numbers-${num.id}`,
//       mobile: num.mobile,
//       rtpStatus: num.status,
//       numberType: num.numberType,
//       currentStage: 'In Inventory',
//       purchaseInfo: {
//         purchaseFrom: num.purchaseFrom,
//         purchaseDate: num.purchaseDate,
//         purchasePrice: num.purchasePrice,
//       },
//       history: num.history,
//     }));

//     const salesHistory: GlobalHistoryRecord[] = sales.map(sale => ({
//       id: `sales-${sale.id}`,
//       mobile: sale.mobile,
//       rtpStatus: sale.originalNumberData?.status || 'N/A',
//       numberType: sale.originalNumberData?.numberType || 'N/A',
//       currentStage: 'Sold',
//       purchaseInfo: sale.originalNumberData ? {
//         purchaseFrom: sale.originalNumberData.purchaseFrom,
//         purchaseDate: sale.originalNumberData.purchaseDate,
//         purchasePrice: sale.originalNumberData.purchasePrice,
//       } : undefined,
//       saleInfo: {
//         soldTo: sale.soldTo,
//         saleDate: sale.saleDate,
//         salePrice: sale.salePrice,
//       },
//       history: sale.originalNumberData?.history,
//     }));

//     const preBookingHistory: GlobalHistoryRecord[] = preBookings.map(pb => ({
//         id: `prebookings-${pb.id}`,
//         mobile: pb.mobile,
//         rtpStatus: pb.originalNumberData?.status || 'N/A',
//         numberType: pb.originalNumberData?.numberType || 'N/A',
//         currentStage: 'Pre-Booked',
//         purchaseInfo: pb.originalNumberData ? {
//             purchaseFrom: pb.originalNumberData.purchaseFrom,
//             purchaseDate: pb.originalNumberData.purchaseDate,
//             purchasePrice: pb.originalNumberData.purchasePrice,
//         } : undefined,
//         history: pb.originalNumberData?.history,
//     }));
    
//     const dealerPurchaseHistory: GlobalHistoryRecord[] = dealerPurchases.map(dp => ({
//         id: `dealerPurchases-${dp.id}`,
//         mobile: dp.mobile,
//         rtpStatus: 'N/A',
//         numberType: 'N/A',
//         currentStage: 'Dealer Purchase',
//         purchaseInfo: {
//             purchaseFrom: dp.dealerName,
//             purchaseDate: null, // This info is not available in DealerPurchaseRecord
//             purchasePrice: dp.price,
//         },
//     }));

//     const deletedHistory: GlobalHistoryRecord[] = deletedNumbers.map(dn => ({
//       id: `deleted-${dn.id}`,
//       mobile: dn.mobile,
//       rtpStatus: dn.originalNumberData.status,
//       numberType: dn.originalNumberData.numberType,
//       currentStage: 'Deleted',
//       purchaseInfo: {
//         purchaseFrom: dn.originalNumberData.purchaseFrom,
//         purchaseDate: dn.originalNumberData.purchaseDate,
//         purchasePrice: dn.originalNumberData.purchasePrice,
//       },
//       deletionInfo: {
//         reason: dn.deletionReason,
//         deletedBy: dn.deletedBy,
//         deletedAt: dn.deletedAt,
//       },
//       history: dn.originalNumberData.history,
//     }));


//     return [...inventoryHistory, ...salesHistory, ...preBookingHistory, ...dealerPurchaseHistory, ...deletedHistory];
//   }, [loading, numbers, sales, preBookings, dealerPurchases, deletedNumbers]);

//   const isMobileNumberDuplicate = (mobile: string, currentId?: string): boolean => {
//     if (!mobile) return false;
//     const allMobiles = new Set([
//       ...numbers.map(n => n.mobile),
//       ...sales.map(s => s.mobile),
//       ...dealerPurchases.map(dp => dp.mobile),
//       ...preBookings.map(pb => pb.mobile),
//     ]);
  
//     // For an update operation, we need to check if the new mobile number
//     // exists anywhere *except* for the document being updated.
//     if (currentId) {
//       const currentRecord = numbers.find(n => n.id === currentId);
//       if (currentRecord && currentRecord.mobile !== mobile) {
//         return allMobiles.has(mobile);
//       }
//       return false;
//     }
  
//     return allMobiles.has(mobile);
//   };


//   useEffect(() => {
//     if (!db || numbersLoading || authLoading || !user) {
//       return;
//     }

//     const checkRtpDates = async () => {
//         if (!db) return;

//         const batch = writeBatch(db);
//         const updatedIds: string[] = [];
        
//         numbers.forEach(num => {
//             if (num.status === 'Non-RTP' && num.rtpDate) {
//                 const rtpDateObj = num.rtpDate.toDate();
//                 if (isValid(rtpDateObj) && (isToday(rtpDateObj) || isPast(rtpDateObj))) {
//                     const docRef = doc(db, 'numbers', num.id);
//                     const historyEvent = createLifecycleEvent('RTP Status Changed', 'Number automatically became RTP as per schedule.', 'System');
//                     batch.update(docRef, { status: 'RTP', rtpDate: null, history: arrayUnion(historyEvent) });
//                     addActivity({
//                         employeeName: 'System',
//                         action: 'Auto-updated to RTP',
//                         description: `Number ${num.mobile} automatically became RTP.`
//                     }, false);
//                     updatedIds.push(num.id);
//                 }
//             }
//         });

//         if (updatedIds.length > 0) {
//             setRecentlyAutoRtpIds(updatedIds);
//             setTimeout(() => setRecentlyAutoRtpIds([]), 5 * 60 * 1000); // Clear after 5 minutes
            
//             await batch.commit().catch(async (serverError) => {
//                 const permissionError = new FirestorePermissionError({
//                     path: 'numbers',
//                     operation: 'update',
//                     requestResourceData: {info: 'Batch update for RTP status'},
//                 });
//                 errorEmitter.emit('permission-error', permissionError);
//             });
//         }
//     };

//     checkRtpDates();
//     const interval = setInterval(checkRtpDates, 60000);
//     return () => clearInterval(interval);
//   }, [db, numbers, numbersLoading, authLoading, user, addActivity, createLifecycleEvent]);
  
//   useEffect(() => {
//     const createSystemReminders = async () => {
//       if (loading || !user || !db || !users.length || !reminders) return;

//       const adminUsers = users.filter(u => u.role === 'admin').map(u => u.displayName);
//       if (adminUsers.length === 0) return;

//       const batch = writeBatch(db);
//       let currentReminderSrNo = getNextSrNo(reminders);
//       const remindersCollection = collection(db, 'reminders');
//       let operationsExist = false;
      
//       const existingTaskIds = new Set(reminders.map(r => r.taskId).filter(Boolean));

//       // COCP Safe Custody Date Reminders
//       const cocpNumbers = numbers.filter(n => n.numberType === 'COCP' && n.safeCustodyDate && (isToday(n.safeCustodyDate.toDate()) || isPast(n.safeCustodyDate.toDate())));
//       for (const num of cocpNumbers) {
//         const taskId = `cocp-safecustody-${num.id}`;
//          if (!existingTaskIds.has(taskId)) {
//             batch.set(doc(remindersCollection), {
//               taskId: taskId,
//               taskName: `Safe Custody Date arrived for ${num.mobile}`,
//               assignedTo: adminUsers,
//               dueDate: num.safeCustodyDate,
//               status: 'Pending', createdBy: 'system', srNo: currentReminderSrNo++,
//             });
//             operationsExist = true;
//             addActivity({
//                 employeeName: 'System',
//                 action: 'Safe Custody Date Arrived',
//                 description: `Safe Custody Date for COCP number ${num.mobile} has arrived.`,
//             }, false);
//          }
//       }
      
//       // Pre-Booked RTP Reminders
//       const rtpPreBookings = preBookings.filter(pb => pb.originalNumberData?.status === 'RTP');
//       for (const pb of rtpPreBookings) {
//           const taskId = `prebooked-rtp-${pb.id}`;
//           if (!existingTaskIds.has(taskId)) {
//              batch.set(doc(remindersCollection), {
//                 taskId: taskId,
//                 taskName: `Pre-Booked Number is now RTP: ${pb.mobile}`,
//                 assignedTo: adminUsers,
//                 dueDate: Timestamp.now(),
//                 status: 'Pending', createdBy: 'system', srNo: currentReminderSrNo++,
//              });
//              operationsExist = true;
//           }
//       }
      
//       if (operationsExist) {
//          await batch.commit().catch(e => console.error("Error in system reminder creation batch:", e));
//       }
//     };

//     createSystemReminders();
//   }, [loading, user, users, numbers, reminders, preBookings, db, addActivity]);


//   useEffect(() => {
//     // This effect solely handles displaying the popup for due, pending reminders
//     const checkAndShowPopup = () => {
//       if (loading || !user) return;
//       const dueReminders = reminders.filter(r => {
//         if (r.status !== 'Pending') return false;
//         const dueDate = r.dueDate.toDate();
//         return isValid(dueDate) && (isToday(dueDate) || isPast(dueDate));
//       });
//       const newDueReminders = dueReminders.filter(r => !remindersShownInPopup.has(r.id));
//       if (newDueReminders.length > 0) {
//         setPendingRemindersForPopup(prev => {
//           const existingIds = new Set(prev.map(p => p.id));
//           const combined = [...prev, ...newDueReminders.filter(r => !existingIds.has(r.id))];
//           return combined;
//         });
//         setShowReminderPopup(true);
//         const newShownSet = new Set(remindersShownInPopup);
//         newDueReminders.forEach(r => newShownSet.add(r.id));
//         setRemindersShownInPopup(newShownSet);
//       }
//     };
//     const timeoutId = setTimeout(checkAndShowPopup, 2000); 
//     const intervalId = setInterval(checkAndShowPopup, 15 * 60 * 1000);
//     return () => {
//       clearTimeout(timeoutId);
//       clearInterval(intervalId);
//     };
//   }, [loading, user, reminders, remindersShownInPopup]);

//   useEffect(() => {
//     if (!db || remindersLoading || role !== 'admin') {
//       return;
//     }

//     const cleanupOldReminders = async () => {
//       const sevenDaysAgo = subDays(new Date(), 7);
//       const remindersToDelete: Reminder[] = [];

//       reminders.forEach(reminder => {
//         if (
//           reminder.status === 'Done' &&
//           reminder.completionDate &&
//           reminder.completionDate.toDate() < sevenDaysAgo
//         ) {
//           remindersToDelete.push(reminder);
//         }
//       });

//       if (remindersToDelete.length > 0) {
//         const batch = writeBatch(db);
//         remindersToDelete.forEach(reminder => {
//           batch.delete(doc(db, 'reminders', reminder.id));
//         });
        
//         await batch.commit().catch(e => console.error("Error auto-deleting reminders:", e));
        
//         addActivity({
//             employeeName: 'System',
//             action: 'Auto-deleted reminders',
//             description: `Automatically deleted ${remindersToDelete.length} completed reminder(s) older than 7 days.`,
//         }, false);
//       }
//     };
    
//     // Run once on load, then set an interval
//     cleanupOldReminders();
//     const intervalId = setInterval(cleanupOldReminders, 24 * 60 * 60 * 1000); // Check once a day
    
//     return () => clearInterval(intervalId);

//   }, [db, reminders, remindersLoading, role, addActivity]);

//   const updateUser = (uid: string, data: { displayName: string, telegramUsername?: string }) => {
//     if (!db || !user || role !== 'admin') {
//       toast({
//         variant: "destructive",
//         title: "Permission Denied",
//         description: "You do not have permission to update users.",
//       });
//       return;
//     }
//     const docRef = doc(db, 'users', uid);
//     const updateData = {
//         displayName: data.displayName,
//         telegramUsername: data.telegramUsername || null,
//     };
//     updateDoc(docRef, updateData).then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Updated User',
//             description: `Updated details for user ${data.displayName}.`
//         });
//         toast({
//             title: "User Updated",
//             description: `Details for ${data.displayName} have been saved.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: docRef.path,
//             operation: 'update',
//             requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const updateNumber = async (id: string, data: NewNumberData) => {
//     if (!db || !user) return;
//     const numDocRef = doc(db, 'numbers', id);
//     const existingNumber = numbers.find(n => n.id === id);
//     if (!existingNumber) return;

//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Details Updated', `Number details updated by ${performedBy}.`, performedBy);
  
//     const updateData: Partial<NumberRecord> = {
//       ...data,
//       sum: calculateDigitalRoot(data.mobile),
//       purchaseDate: Timestamp.fromDate(data.purchaseDate),
//       rtpDate: data.rtpDate ? Timestamp.fromDate(data.rtpDate) : null,
//       safeCustodyDate: data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
//       billDate: data.billDate ? Timestamp.fromDate(data.billDate) : null,
//       salePrice: data.salePrice || 0,
//     };
  
//     await updateDoc(numDocRef, {...sanitizeObjectForFirestore(updateData), history: arrayUnion(historyEvent) })
//       .then(() => {
//         addActivity({
//           employeeName: user.displayName || user.email || 'User',
//           action: 'Updated Number',
//           description: `Updated details for number ${data.mobile}`,
//         });
//       })
//       .catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//           path: numDocRef.path,
//           operation: 'update',
//           requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//       });
//   };

//   const updateNumberStatus = (id: string, status: 'RTP' | 'Non-RTP', rtpDate: Date | null, note?: string) => {
//     if (!db || !user) return;
//     const numDocRef = doc(db, 'numbers', id);
//     const num = numbers.find(n => n.id === id);
//     if (!num) return;

//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent(
//       'RTP Status Changed',
//       `Status changed to ${status}${rtpDate ? ` with RTP date ${rtpDate.toLocaleDateString()}` : ''}. ${note || ''}`.trim(),
//       performedBy
//     );

//     const updateData: any = {
//         status: status,
//         rtpDate: status === 'RTP' ? null : (rtpDate ? Timestamp.fromDate(rtpDate) : null)
//     };
//     if (note) {
//         updateData.notes = `${num.notes || ''}\n${note}`.trim();
//     }
//     updateDoc(numDocRef, {...updateData, history: arrayUnion(historyEvent)}).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Updated RTP Status',
//             description: `Marked ${num.mobile} as ${status}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: numDocRef.path,
//             operation: 'update',
//             requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const updateUploadStatus = (id: string, uploadStatus: 'Pending' | 'Done') => {
//     if (!db || !user) return;
//     const numDocRef = doc(db, 'numbers', id);
//     const num = numbers.find(n => n.id === id);
//     if (!num) return;
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Upload Status Changed', `Upload status changed to ${uploadStatus}.`, performedBy);

//     const updateData = { uploadStatus };
    
//     updateDoc(numDocRef, {...updateData, history: arrayUnion(historyEvent)}).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Updated Upload Status',
//             description: `Set upload status for ${num.mobile} to ${uploadStatus}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: numDocRef.path,
//             operation: 'update',
//             requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkUpdateUploadStatus = (numberIds: string[], uploadStatus: 'Pending' | 'Done') => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     const updateData = { uploadStatus };
//     const affectedNumbers = numbers.filter(n => numberIds.includes(n.id)).map(n => n.mobile);

//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Upload Status Changed', `Upload status changed to ${uploadStatus}.`, performedBy);

//     numberIds.forEach(id => {
//       const docRef = doc(db, 'numbers', id);
//       batch.update(docRef, {...updateData, history: arrayUnion(historyEvent)});
//     });
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Bulk Updated Upload Status',
//             description: createDetailedDescription(`Updated upload status to ${uploadStatus} for`, affectedNumbers)
//         });
//          toast({
//             title: "Update Successful",
//             description: `Updated upload status for ${numberIds.length} record(s).`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'update',
//             requestResourceData: {info: `Bulk upload status update for ${numberIds.length} numbers`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const canReminderBeMarkedDone = (reminder: Reminder): { canBeDone: boolean; message: string } => {
//     if (!reminder.taskId) {
//       return { canBeDone: true, message: "" };
//     }

//     if (reminder.taskId.startsWith('cocp-safecustody-')) {
//       const numberId = reminder.taskId.replace('cocp-safecustody-', '');
//       const number = numbers.find(n => n.id === numberId);
//       if (number && number.safeCustodyDate) {
//         const custodyDate = number.safeCustodyDate.toDate();
//         if (isToday(custodyDate) || isPast(custodyDate)) {
//           return { canBeDone: false, message: `The Safe Custody Date for ${number.mobile} has not been updated to a future date.` };
//         }
//       }
//     } else if (reminder.taskId.startsWith('prebooked-rtp-')) {
//       const preBookingId = reminder.taskId.replace('prebooked-rtp-', '');
//       const preBooking = preBookings.find(pb => pb.id === preBookingId);
//       if (preBooking) {
//         return { canBeDone: false, message: `The Pre-Booked number ${preBooking.mobile} has not been marked as sold yet.` };
//       }
//     }

//     return { canBeDone: true, message: "" };
//   };

//   const markReminderDone = async (id: string, note?: string) => {
//     if (!db || !user) return;
//     const reminder = reminders.find(r => r.id === id);
//     if (!reminder) return;

//     const { canBeDone, message } = canReminderBeMarkedDone(reminder);

//     if (!canBeDone) {
//         toast({
//             variant: "destructive",
//             title: "Action Required",
//             description: message,
//             duration: 7000,
//         });
//         return;
//     }

//     const reminderDocRef = doc(db, 'reminders', id);

//     const updateData: { status: 'Done'; notes?: string; completionDate: Timestamp } = { 
//         status: 'Done',
//         completionDate: Timestamp.now(),
//     };
//     if (note) {
//       updateData.notes = note;
//     }
    
//     updateDoc(reminderDocRef, updateData).then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Marked Task Done',
//             description: `Completed task: ${reminder.taskName}`
//         })
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: reminderDocRef.path,
//             operation: 'update',
//             requestResourceData: { status: 'Done', note },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const assignNumbersToEmployee = (numberIds: string[], employeeName: string, location: { locationType: 'Store' | 'Employee' | 'Dealer'; currentLocation: string; }) => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     const performedBy = user.displayName || user.email || 'User';

//     const historyEvent = createLifecycleEvent('Assigned', `Assigned to ${employeeName} and moved to ${location.currentLocation}.`, performedBy);
    
//     const updateData = {
//         assignedTo: employeeName,
//         name: employeeName,
//         locationType: location.locationType,
//         currentLocation: location.currentLocation,
//     };
//     const affectedNumbers = numbers.filter(n => numberIds.includes(n.id)).map(n => n.mobile);

//     numberIds.forEach(id => {
//       const docRef = doc(db, 'numbers', id);
//       batch.update(docRef, {...updateData, history: arrayUnion(historyEvent)});
//     });
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Assigned Numbers',
//             description: createDetailedDescription(`Assigned to ${employeeName}:`, affectedNumbers)
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'update',
//             requestResourceData: {info: `Batch assign to ${employeeName}`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };
  
//   const checkInNumber = (id: string) => {
//     if (!db || !user) return;
//     const num = numbers.find(n => n.id === id);
//     if (!num) return;
//     const numDocRef = doc(db, 'numbers', id);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Checked In', `SIM Checked In at ${num.currentLocation}.`, performedBy);

//     updateDoc(numDocRef, { checkInDate: Timestamp.now(), history: arrayUnion(historyEvent) }).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Checked In Number',
//             description: `Checked in SIM number ${num.mobile}.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: numDocRef.path,
//             operation: 'update',
//             requestResourceData: { checkInDate: 'NOW' },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const sellNumber = (id: string, details: { salePrice: number; soldTo: string; saleDate: Date }) => {
//     if (!db || !user) return;
//     const soldNumber = numbers.find(n => n.id === id);
//     if (!soldNumber) return;

//     const { id: numberId, ...originalDataWithoutId } = soldNumber;
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Sold', `Sold to ${details.soldTo} for ₹${details.salePrice}.`, performedBy);
    
//     const history = [...(originalDataWithoutId.history || []), historyEvent];

//     const sanitizedOriginalData = sanitizeObjectForFirestore({...originalDataWithoutId, history });

//     const newSale: Omit<SaleRecord, 'id'> = {
//       srNo: getNextSrNo(sales),
//       mobile: soldNumber.mobile,
//       sum: calculateDigitalRoot(soldNumber.mobile),
//       salePrice: details.salePrice,
//       soldTo: details.soldTo,
//       uploadStatus: soldNumber.uploadStatus || 'Pending',
//       saleDate: Timestamp.fromDate(details.saleDate),
//       createdBy: user.uid,
//       originalNumberData: sanitizedOriginalData,
//     };

//     const batch = writeBatch(db);
//     batch.set(doc(collection(db, 'sales')), newSale);
//     batch.delete(doc(db, 'numbers', id));
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Sold Number',
//             description: `Sold number ${soldNumber.mobile} to ${details.soldTo} for ₹${details.salePrice}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'sales',
//             operation: 'create',
//             requestResourceData: { info: `Sell number ${soldNumber.mobile}` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkSellNumbers = (numbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => {
//     if (!db || !user) return;
//     if (numbersToSell.length === 0) return;

//     let currentSaleSrNo = getNextSrNo(sales);
//     const batch = writeBatch(db);
//     const affectedNumbers = numbersToSell.map(n => n.mobile);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Sold', `Sold to ${details.soldTo} for ₹${details.salePrice}.`, performedBy);

//     numbersToSell.forEach(soldNumber => {
//       const { id: numberId, ...originalDataWithoutId } = soldNumber;
      
//       const history = [...(originalDataWithoutId.history || []), historyEvent];
//       const sanitizedOriginalData = sanitizeObjectForFirestore({...originalDataWithoutId, history });

//       const newSale: Omit<SaleRecord, 'id'> = {
//         srNo: currentSaleSrNo++,
//         mobile: soldNumber.mobile,
//         sum: calculateDigitalRoot(soldNumber.mobile),
//         salePrice: details.salePrice,
//         soldTo: details.soldTo,
//         uploadStatus: soldNumber.uploadStatus || 'Pending',
//         saleDate: Timestamp.fromDate(details.saleDate),
//         createdBy: user.uid,
//         originalNumberData: sanitizedOriginalData,
//       };
      
//       batch.set(doc(collection(db, 'sales')), newSale);
//       batch.delete(doc(db, 'numbers', soldNumber.id));
//     });

//     batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Bulk Sold Numbers',
//             description: createDetailedDescription(`Sold to ${details.soldTo}:`, affectedNumbers)
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'sales/numbers',
//             operation: 'write',
//             requestResourceData: { info: `Bulk sell of ${numbersToSell.length} numbers.` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const cancelSale = (saleId: string) => {
//     if (!db || !user) return;
//     const saleToCancel = sales.find(s => s.id === saleId);
    
//     if (!saleToCancel) {
//          toast({
//             variant: "destructive",
//             title: "Cancellation Failed",
//             description: "Could not find the sale record.",
//         });
//         return;
//     }
    
//     if (!saleToCancel.originalNumberData) {
//         toast({
//             variant: "destructive",
//             title: "Cancellation Failed",
//             description: "Could not find original number data to restore.",
//         });
//         return;
//     }
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Sale Cancelled', `Sale cancelled and number returned to inventory.`, performedBy);

//     const restoredNumberData = sanitizeObjectForFirestore({
//         ...saleToCancel.originalNumberData,
//         history: [...(saleToCancel.originalNumberData.history || []), historyEvent]
//     });

//     const restoredNumber: Omit<NumberRecord, 'id'> = {
//         ...(restoredNumberData as Omit<NumberRecord, 'id'>),
//         assignedTo: 'Unassigned',
//         name: 'Unassigned',
//     };

//     const batch = writeBatch(db);
//     batch.set(doc(collection(db, 'numbers')), restoredNumber);
//     batch.delete(doc(db, 'sales', saleId));
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Cancelled Sale',
//             description: `Sale of number ${saleToCancel.mobile} was cancelled and it was returned to inventory.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'sales/numbers',
//             operation: 'write',
//             requestResourceData: { info: `Cancel sale for ${saleToCancel.mobile}` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const addNumber = (data: NewNumberData) => {
//     if (!db || !user) return;
    
//     if (isMobileNumberDuplicate(data.mobile)) {
//       toast({
//         variant: 'destructive',
//         title: 'Duplicate Number',
//         description: `The mobile number ${data.mobile} already exists in the system.`,
//       });
//       return;
//     }
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Created', `Number added to inventory by ${performedBy}.`, performedBy);

//     const newNumber: Partial<NumberRecord> = {
//         ...data,
//         srNo: getNextSrNo(numbers),
//         sum: calculateDigitalRoot(data.mobile),
//         rtpDate: data.status === 'Non-RTP' && data.rtpDate ? Timestamp.fromDate(data.rtpDate) : null,
//         safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
//         billDate: data.numberType === 'Postpaid' && data.billDate ? Timestamp.fromDate(data.billDate) : null,
//         assignedTo: data.assignedTo || 'Unassigned',
//         name: data.assignedTo || 'Unassigned',
//         checkInDate: null,
//         createdBy: user.uid,
//         purchaseDate: Timestamp.fromDate(data.purchaseDate),
//         history: [historyEvent]
//     };

//     if (data.ownershipType !== 'Partnership') {
//         newNumber.partnerName = '';
//     } else {
//         newNumber.partnerName = data.partnerName;
//     }
    
//     if (data.numberType === 'COCP') {
//         newNumber.accountName = data.accountName;
//     } else {
//         delete (newNumber as any).accountName;
//         delete (newNumber as any).safeCustodyDate;
//     }

//     if (data.numberType !== 'Postpaid') {
//       delete (newNumber as any).billDate;
//       delete (newNumber as any).pdBill;
//     }

//     const numbersCollection = collection(db, 'numbers');
//     addDoc(numbersCollection, sanitizeObjectForFirestore(newNumber)).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Added Number',
//             description: `Manually added new number ${data.mobile}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'create',
//             requestResourceData: newNumber,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const addMultipleNumbers = async (data: NewNumberData, validNumbers: string[]) => {
//     if (!db || !user || validNumbers.length === 0) return;
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Created', `Number added to inventory via bulk add by ${performedBy}.`, performedBy);
//     let currentSrNo = getNextSrNo(numbers);
//     const batch = writeBatch(db);
//     const numbersCollection = collection(db, 'numbers');

//     validNumbers.forEach(mobile => {
//       const newDocRef = doc(numbersCollection);
//       const newNumber: Partial<NumberRecord> = {
//           ...data,
//           mobile,
//           srNo: currentSrNo++,
//           sum: calculateDigitalRoot(mobile),
//           rtpDate: data.status === 'Non-RTP' && data.rtpDate ? Timestamp.fromDate(data.rtpDate) : null,
//           safeCustodyDate: data.numberType === 'COCP' && data.safeCustodyDate ? Timestamp.fromDate(data.safeCustodyDate) : null,
//           billDate: data.numberType === 'Postpaid' && data.billDate ? Timestamp.fromDate(data.billDate) : null,
//           assignedTo: data.assignedTo || 'Unassigned',
//           name: data.assignedTo || 'Unassigned',
//           checkInDate: null,
//           createdBy: user.uid,
//           purchaseDate: Timestamp.fromDate(data.purchaseDate),
//           history: [historyEvent]
//       };

//       if (data.ownershipType !== 'Partnership') newNumber.partnerName = '';
//       if (data.numberType !== 'COCP') {
//         delete (newNumber as any).accountName;
//         delete (newNumber as any).safeCustodyDate;
//       }
//       if (data.numberType !== 'Postpaid') {
//         delete (newNumber as any).billDate;
//         delete (newNumber as any).pdBill;
//       }
//       batch.set(newDocRef, sanitizeObjectForFirestore(newNumber));
//     });

//     await batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Bulk Added Numbers',
//             description: createDetailedDescription('Added', validNumbers)
//         });
//         let toastDescription = `Successfully added ${validNumbers.length} number(s).`;
//         toast({
//           title: 'Bulk Add Complete',
//           description: toastDescription,
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'create',
//             requestResourceData: { info: `Bulk add of ${validNumbers.length} numbers.` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };
  
//   const addDealerPurchase = (data: NewDealerPurchaseData) => {
//     if (!db || !user) return;

//     if (isMobileNumberDuplicate(data.mobile)) {
//       toast({
//         variant: 'destructive',
//         title: 'Duplicate Number',
//         description: `The mobile number ${data.mobile} already exists in the system.`,
//       });
//       return;
//     }

//     const newPurchase: Omit<DealerPurchaseRecord, 'id'> = {
//       ...data,
//       srNo: getNextSrNo(dealerPurchases),
//       sum: calculateDigitalRoot(data.mobile),
//       createdBy: user.uid,
//     };
//     const dealerPurchasesCollection = collection(db, 'dealerPurchases');
//     addDoc(dealerPurchasesCollection, newPurchase).then(() => {
//         addActivity({
//           employeeName: user.displayName || user.email || 'User',
//           action: 'Added Dealer Purchase',
//           description: `Added new dealer purchase for ${data.mobile}`,
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'dealerPurchases',
//             operation: 'create',
//             requestResourceData: newPurchase,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const deleteDealerPurchases = (recordsToDelete: DealerPurchaseRecord[]) => {
//     if (!db || !user) return;

//     const idsToDelete = recordsToDelete.map(r => r.id);
//     const affectedNumbers = recordsToDelete.map(r => r.mobile);
//     const batch = writeBatch(db);
//     idsToDelete.forEach(id => {
//       batch.delete(doc(db, 'dealerPurchases', id));
//     });

//     batch.commit().then(() => {
//       addActivity({
//         employeeName: user.displayName || user.email || 'User',
//         action: 'Deleted Dealer Purchases',
//         description: createDetailedDescription('Deleted from dealer purchases:', affectedNumbers)
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'dealerPurchases',
//         operation: 'delete',
//         requestResourceData: { info: `Batch delete ${idsToDelete.length} records` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const deleteActivities = (activityIds: string[]) => {
//     if (!db || !user || role !== 'admin') {
//       toast({
//         variant: "destructive",
//         title: "Permission Denied",
//         description: "You do not have permission to delete activities.",
//       });
//       return;
//     };
    
//     const batch = writeBatch(db);
//     activityIds.forEach(id => {
//         batch.delete(doc(db, 'activities', id));
//     });

//     batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Deleted Activities',
//             description: `Deleted ${activityIds.length} activity record(s).`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'activities',
//             operation: 'delete',
//             requestResourceData: {info: `Batch delete ${activityIds.length} activities`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   }

//   const updateSafeCustodyDate = (numberId: string, newDate: Date) => {
//     if (!db || !user) return;
//     const num = numbers.find(n => n.id === numberId);
//     if (!num) return;

//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('COCP Date Changed', `Safe Custody Date changed to ${newDate.toLocaleDateString()}.`, performedBy);
//     const numDocRef = doc(db, 'numbers', numberId);
//     const updateData = { safeCustodyDate: Timestamp.fromDate(newDate) };
    
//     updateDoc(numDocRef, {...updateData, history: arrayUnion(historyEvent)}).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Updated Safe Custody Date',
//             description: `Updated Safe Custody Date for ${num.mobile} to ${newDate.toLocaleDateString()}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: numDocRef.path,
//             operation: 'update',
//             requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkUpdateSafeCustodyDate = (numberIds: string[], newDate: Date) => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('COCP Date Changed', `Safe Custody Date changed to ${newDate.toLocaleDateString()}.`, performedBy);
//     const updateData = { safeCustodyDate: Timestamp.fromDate(newDate) };
//     const affectedNumbers = numbers.filter(n => numberIds.includes(n.id)).map(n => n.mobile);

//     numberIds.forEach(id => {
//         const docRef = doc(db, 'numbers', id);
//         batch.update(docRef, {...updateData, history: arrayUnion(historyEvent)});
//     });
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Bulk Updated Safe Custody Date',
//             description: createDetailedDescription(`Updated Safe Custody Date to ${newDate.toLocaleDateString()} for`, affectedNumbers)
//         });
//         toast({
//             title: "Update Successful",
//             description: `Updated Safe Custody Date for ${numberIds.length} record(s).`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'update',
//             requestResourceData: {info: `Bulk update of Safe Custody Date for ${numberIds.length} records`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const deleteNumbers = (numberIds: string[], reason: string) => {
//     if (!db || !user || role !== 'admin') {
//       toast({
//         variant: "destructive",
//         title: "Permission Denied",
//         description: "You do not have permission to delete number records.",
//       });
//       return;
//     }
    
//     if (!reason?.trim()) {
//         toast({
//             variant: "destructive",
//             title: "Reason Required",
//             description: "A reason for deletion is required.",
//         });
//         return;
//     }

//     const numbersToDelete = numbers.filter(n => numberIds.includes(n.id));
//     if (numbersToDelete.length === 0) {
//       toast({ variant: 'destructive', title: 'Error', description: 'No matching numbers found to delete.' });
//       return;
//     }

//     const affectedNumbers = numbersToDelete.map(n => n.mobile);
//     const batch = writeBatch(db);
//     const performedBy = user.displayName || user.email || 'User';

//     numbersToDelete.forEach(num => {
//       const { id, ...originalData } = num;
//       const historyEvent = createLifecycleEvent('Deleted', `Deleted from inventory. Reason: ${reason}`, performedBy);
//       const history = [...(originalData.history || []), historyEvent];

//       const newDeletedRecord: Omit<DeletedNumberRecord, 'id'> = {
//         originalId: id,
//         originalSrNo: num.srNo ?? 0,
//         mobile: num.mobile,
//         sum: num.sum,
//         deletionReason: reason,
//         deletedBy: performedBy,
//         deletedAt: Timestamp.now(),
//         originalNumberData: sanitizeObjectForFirestore({ ...originalData, history }),
//       };

//       batch.set(doc(collection(db, 'deletedNumbers')), newDeletedRecord);
//       batch.delete(doc(db, 'numbers', id));
//     });

//     batch.commit().then(() => {
//       addActivity({
//         employeeName: performedBy,
//         action: 'Deleted Numbers',
//         description: createDetailedDescription(`Archived from master inventory:`, affectedNumbers)
//       });
//       toast({ title: 'Numbers Deleted', description: `${numbersToDelete.length} number(s) moved to Deleted Numbers.` });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'numbers/deletedNumbers',
//         operation: 'write',
//         requestResourceData: { info: `Soft delete of ${numberIds.length} numbers` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const restoreDeletedNumber = (deletedNumberId: string) => {
//     if (!db || !user || role !== 'admin') {
//         toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot restore numbers.' });
//         return;
//     }
//     const recordToRestore = deletedNumbers.find(dn => dn.id === deletedNumberId);
//     if (!recordToRestore) {
//         toast({ variant: 'destructive', title: 'Not Found', description: 'Could not find the deleted record to restore.' });
//         return;
//     }
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Restored', `Number restored to inventory.`, performedBy);
    
//     const restoredData = sanitizeObjectForFirestore({
//         ...recordToRestore.originalNumberData,
//         history: [...(recordToRestore.originalNumberData.history || []), historyEvent],
//     });

//     const restoredNumber: Omit<NumberRecord, 'id'> = {
//       ...(restoredData as Omit<NumberRecord, 'id'>),
//     };

//     const batch = writeBatch(db);
//     batch.set(doc(db, 'numbers', recordToRestore.originalId), restoredNumber);
//     batch.delete(doc(db, 'deletedNumbers', deletedNumberId));

//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Restored Number',
//             description: `Restored number ${recordToRestore.mobile} to the master inventory.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers/deletedNumbers',
//             operation: 'write',
//             requestResourceData: { info: `Restore number ${recordToRestore.mobile}` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };
  
//   const deleteUser = (uid: string) => {
//     if (!uid) {
//         toast({
//             variant: "destructive",
//             title: "Deletion Failed",
//             description: "Cannot delete user: invalid user ID provided.",
//         });
//         return;
//     }
//     if (!db || !user || role !== 'admin') {
//       toast({
//         variant: "destructive",
//         title: "Permission Denied",
//         description: "You do not have permission to delete users.",
//       });
//       return;
//     }
//     if (uid === user.uid) {
//         toast({
//             variant: "destructive",
//             title: "Action Forbidden",
//             description: "You cannot delete your own account.",
//         });
//         return;
//     }
//     const docRef = doc(db, 'users', uid);
//     // This will trigger the onDelete cloud function to delete the user from Auth
//     deleteDoc(docRef).then(() => {
//         const deletedUser = users.find(u => u.uid === uid);
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Deleted User',
//             description: `Deleted the user account for ${deletedUser?.displayName || 'Unknown'}.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: docRef.path,
//             operation: 'delete',
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const updateNumberLocation = (numberIds: string[], location: { locationType: 'Store' | 'Employee' | 'Dealer', currentLocation: string }) => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Location Updated', `Location changed to ${location.currentLocation}.`, performedBy);
//     const affectedNumbers = numbers.filter(n => numberIds.includes(n.id)).map(n => n.mobile);
    
//     numberIds.forEach(id => {
//       const docRef = doc(db, 'numbers', id);
//       batch.update(docRef, {...location, history: arrayUnion(historyEvent)});
//     });
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Updated Number Location',
//             description: createDetailedDescription(`Updated location to ${location.currentLocation} for`, affectedNumbers)
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'update',
//             requestResourceData: {info: `Batch location update for ${numberIds.length} numbers`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const markAsPreBooked = (numberIds: string[]) => {
//     if (!db || !user) return;
//     let currentPreBookingSrNo = getNextSrNo(preBookings);
//     const batch = writeBatch(db);
//     const numbersToPreBook = numbers.filter(n => numberIds.includes(n.id));
//     const affectedNumbers = numbersToPreBook.map(n => n.mobile);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Pre-Booked', 'Number moved to pre-booking list.', performedBy);

//     numbersToPreBook.forEach(num => {
//       const { id, ...originalData } = num;
//       const history = [...(originalData.history || []), historyEvent];
//       const newPreBooking: Omit<PreBookingRecord, 'id'> = {
//         srNo: currentPreBookingSrNo++,
//         mobile: originalData.mobile,
//         sum: originalData.sum,
//         uploadStatus: originalData.uploadStatus,
//         preBookingDate: Timestamp.now(),
//         createdBy: user.uid,
//         originalNumberData: sanitizeObjectForFirestore({...originalData, history}),
//       };
//       batch.set(doc(collection(db, 'prebookings')), newPreBooking);
//       batch.delete(doc(db, 'numbers', num.id));
//     });

//     batch.commit().then(() => {
//       addActivity({
//         employeeName: performedBy,
//         action: 'Pre-Booked Numbers',
//         description: createDetailedDescription('Moved to Pre-Booking:', affectedNumbers),
//       });
//       toast({
//         title: 'Numbers Pre-Booked',
//         description: `${affectedNumbers.length} number(s) have been moved to the Pre-Booking list.`
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'prebookings/numbers',
//         operation: 'write',
//         requestResourceData: { info: `Pre-booking ${numberIds.length} numbers` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const cancelPreBooking = (preBookingId: string) => {
//     if (!db || !user) return;
//     const preBookingToCancel = preBookings.find(pb => pb.id === preBookingId);
//     if (!preBookingToCancel || !preBookingToCancel.originalNumberData) {
//       toast({ variant: 'destructive', title: 'Error', description: 'Could not find the pre-booking record to cancel.' });
//       return;
//     }
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Pre-booking Cancelled', `Pre-booking was cancelled.`, performedBy);
    
//     const restoredNumberData = sanitizeObjectForFirestore({
//         ...preBookingToCancel.originalNumberData,
//         history: [...(preBookingToCancel.originalNumberData.history || []), historyEvent]
//     });
//     const restoredNumber: Omit<NumberRecord, 'id'> = {
//       ...(restoredNumberData as Omit<NumberRecord, 'id'>),
//     };

//     const batch = writeBatch(db);
//     batch.set(doc(collection(db, 'numbers')), restoredNumber);
//     batch.delete(doc(db, 'prebookings', preBookingId));
    
//     batch.commit().then(() => {
//       addActivity({
//         employeeName: performedBy,
//         action: 'Cancelled Pre-Booking',
//         description: `Cancelled pre-booking for ${preBookingToCancel.mobile} and returned it to inventory.`,
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'prebookings/numbers',
//         operation: 'write',
//         requestResourceData: { info: `Cancel pre-booking for ${preBookingToCancel.mobile}` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const sellPreBookedNumber = (preBookingId: string, details: { salePrice: number; soldTo: string; saleDate: Date; }) => {
//     if (!db || !user) return;
//     const preBookingToSell = preBookings.find(pb => pb.id === preBookingId);
//     if (!preBookingToSell || !preBookingToSell.originalNumberData) {
//       toast({ variant: 'destructive', title: 'Error', description: 'Could not find the pre-booking record to sell.' });
//       return;
//     }

//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Sold', `Sold from pre-booking to ${details.soldTo} for ₹${details.salePrice}.`, performedBy);

//     const history = [...(preBookingToSell.originalNumberData.history || []), historyEvent];

//     const newSale: Omit<SaleRecord, 'id'> = {
//       srNo: getNextSrNo(sales),
//       mobile: preBookingToSell.mobile,
//       sum: preBookingToSell.sum,
//       salePrice: details.salePrice,
//       soldTo: details.soldTo,
//       uploadStatus: preBookingToSell.uploadStatus || 'Pending',
//       saleDate: Timestamp.fromDate(details.saleDate),
//       createdBy: user.uid,
//       originalNumberData: sanitizeObjectForFirestore({...preBookingToSell.originalNumberData, history}),
//     };

//     const batch = writeBatch(db);
//     batch.set(doc(collection(db, 'sales')), newSale);
//     batch.delete(doc(db, 'prebookings', preBookingId));
    
//     batch.commit().then(() => {
//       addActivity({
//         employeeName: user.displayName || user.email || 'User',
//         action: 'Sold Pre-Booked Number',
//         description: `Sold pre-booked number ${preBookingToSell.mobile} to ${details.soldTo}.`
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'sales/prebookings',
//         operation: 'write',
//         requestResourceData: { info: `Sell pre-booked number ${preBookingToSell.mobile}` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkSellPreBookedNumbers = (preBookedNumbersToSell: NumberRecord[], details: { salePrice: number; soldTo: string; saleDate: Date; }) => {
//     if (!db || !user || preBookedNumbersToSell.length === 0) return;
    
//     let currentSaleSrNo = getNextSrNo(sales);
//     const batch = writeBatch(db);
//     const affectedNumbers = preBookedNumbersToSell.map(n => n.mobile);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Sold', `Sold from pre-booking to ${details.soldTo} for ₹${details.salePrice}.`, performedBy);

//     preBookedNumbersToSell.forEach(pb => {
//       const preBookingToSell = preBookings.find(pre => pre.id === pb.id);
//       if (!preBookingToSell || !preBookingToSell.originalNumberData) return;
      
//       const history = [...(preBookingToSell.originalNumberData.history || []), historyEvent];
      
//       const newSale: Omit<SaleRecord, 'id'> = {
//         srNo: currentSaleSrNo++,
//         mobile: preBookingToSell.mobile,
//         sum: preBookingToSell.sum,
//         salePrice: details.salePrice,
//         soldTo: details.soldTo,
//         uploadStatus: preBookingToSell.uploadStatus || 'Pending',
//         saleDate: Timestamp.fromDate(details.saleDate),
//         createdBy: user.uid,
//         originalNumberData: sanitizeObjectForFirestore({...preBookingToSell.originalNumberData, history}),
//       };
      
//       batch.set(doc(collection(db, 'sales')), newSale);
//       batch.delete(doc(db, 'prebookings', pb.id));
//     });

//     batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Bulk Sold Pre-Booked',
//             description: createDetailedDescription(`Sold to ${details.soldTo}:`, affectedNumbers)
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'sales/prebookings',
//             operation: 'write',
//             requestResourceData: { info: `Bulk sell of ${preBookedNumbersToSell.length} pre-booked numbers.` },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const addPayment = (data: NewPaymentData) => {
//     if (!db || !user) return;
//     const newPayment: Omit<PaymentRecord, 'id'> = {
//         ...data,
//         srNo: getNextSrNo(payments),
//         paymentDate: Timestamp.fromDate(data.paymentDate),
//         createdBy: user.uid,
//     };
//     addDoc(collection(db, 'payments'), newPayment).then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Received Payment',
//             description: `Received payment of ₹${data.amount.toLocaleString()} from ${data.vendorName}.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'payments',
//             operation: 'create',
//             requestResourceData: newPayment,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };


//   const bulkAddNumbers = async (records: any[]): Promise<BulkAddResult> => {
//     if (!db || !user) return { successCount: 0, updatedCount: 0, failedRecords: [] };
    
//     let currentSrNo = getNextSrNo(numbers);
//     const creations: Partial<NumberRecord>[] = [];
//     const failedRecords: { record: any, reason: string }[] = [];

//     const processedMobiles = new Set<string>();
    
//     const parseDate = (rawDate: any): Date | null => {
//         if (rawDate instanceof Date && isValid(rawDate)) return rawDate;
//         if (typeof rawDate === 'string') {
//             const dateFormats = ['dd-MM-yyyy', 'MM-dd-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'yyyy/MM/dd', "M/d/yy", "M/d/yyyy", "MM/dd/yy"];
//             for (const formatStr of dateFormats) {
//                 const parsed = parse(rawDate, formatStr, new Date());
//                 if (isValid(parsed)) return parsed;
//             }
//         }
//         return null;
//     };

//     for (const record of records) {
//         const mobile = record.Mobile?.toString().trim();

//         if (!mobile || !/^\d{10}$/.test(mobile)) {
//             failedRecords.push({ record, reason: 'Invalid or missing mobile number (must be 10 digits).' });
//             continue;
//         }
//         if (processedMobiles.has(mobile)) {
//             failedRecords.push({ record, reason: 'Duplicate mobile number found within the import file.' });
//             continue;
//         }
//          if (isMobileNumberDuplicate(mobile)) {
//             failedRecords.push({ record, reason: 'Mobile number already exists in the system.' });
//             continue;
//         }
        
//         const status = record.Status;
//         if (!status || !['RTP', 'Non-RTP'].includes(status)) {
//             failedRecords.push({ record, reason: 'Status is a required field. Must be "RTP" or "Non-RTP".' });
//             continue;
//         }
        
//         const uploadStatus = ['Pending', 'Done'].includes(record.UploadStatus) ? record.UploadStatus : 'Pending';
//         const numberType = ['Prepaid', 'Postpaid', 'COCP'].includes(record.NumberType) ? record.NumberType : 'Prepaid';
//         const ownershipType = ['Individual', 'Partnership'].includes(record.OwnershipType) ? record.OwnershipType : 'Individual';
//         const partnerName = record.PartnerName?.trim();

//         if (ownershipType === 'Partnership' && !partnerName) {
//             failedRecords.push({ record, reason: 'PartnerName is required for Partnership ownership.' });
//             continue;
//         }

//         const safeCustodyDate = parseDate(record.SafeCustodyDate);
//         if (numberType === 'COCP' && !safeCustodyDate) {
//             failedRecords.push({ record, reason: 'Invalid or missing SafeCustodyDate (required for COCP).' });
//             continue;
//         }

//         const accountName = record.AccountName;
//         if (numberType === 'COCP' && !accountName) {
//             failedRecords.push({ record, reason: 'Missing AccountName (required for COCP).' });
//             continue;
//         }
        
//         const billDate = parseDate(record.BillDate);
//         if (numberType === 'Postpaid' && !billDate) {
//             failedRecords.push({ record, reason: 'Invalid or missing BillDate (required for Postpaid).' });
//             continue;
//         }

//         let rtpDate: Date | null = null;
//         if (status === 'Non-RTP') {
//             rtpDate = parseDate(record.RTPDate);
//              if (!rtpDate) {
//                 failedRecords.push({ record, reason: 'Invalid or missing RTPDate (required for Non-RTP status).' });
//                 continue;
//             }
//         }
        
//         const purchaseDate = parseDate(record.PurchaseDate);
//         if (!purchaseDate) {
//              failedRecords.push({ record, reason: 'Invalid or missing PurchaseDate.' });
//              continue;
//         }
        
//         const purchasePrice = parseFloat(record.PurchasePrice);
//         if (isNaN(purchasePrice)) {
//             failedRecords.push({ record, reason: 'Invalid or missing PurchasePrice. Must be a number.' });
//             continue;
//         }
        
//         const salePrice = record.SalePrice ? parseFloat(record.SalePrice) : 0;
//         const assignedTo = record.AssignedTo?.trim();
//         const assignedUser = employees.includes(assignedTo) ? assignedTo : 'Unassigned';

//         const recordData: Partial<NumberRecord> = {
//             mobile: mobile,
//             name: assignedUser,
//             assignedTo: assignedUser,
//             numberType: numberType,
//             status: status,
//             uploadStatus: uploadStatus,
//             rtpDate: rtpDate ? Timestamp.fromDate(rtpDate) : null,
//             purchaseFrom: record.PurchaseFrom || 'N/A',
//             purchasePrice: purchasePrice,
//             salePrice: isNaN(salePrice) ? 0 : salePrice,
//             purchaseDate: Timestamp.fromDate(purchaseDate),
//             currentLocation: record.CurrentLocation || 'N/A',
//             locationType: ['Store', 'Employee', 'Dealer'].includes(record.LocationType) ? record.LocationType : 'Store',
//             notes: record.Notes || '',
//             ownershipType: ownershipType,
//             partnerName: partnerName || '',
//             sum: calculateDigitalRoot(mobile),
//         };
        
//         if (numberType === 'COCP') {
//             recordData.safeCustodyDate = safeCustodyDate ? Timestamp.fromDate(safeCustodyDate) : null;
//             recordData.accountName = accountName;
//         }
//         if (numberType === 'Postpaid') {
//             recordData.billDate = billDate ? Timestamp.fromDate(billDate) : null;
//             recordData.pdBill = ['Yes', 'No'].includes(record.PDBill) ? record.PDBill : 'No';
//         }

//         const performedBy = user.displayName || user.email || 'User';
//         const historyEvent = createLifecycleEvent('Created', `Number imported from CSV file.`, performedBy);

//         creations.push({ ...recordData, srNo: currentSrNo++, createdBy: user.uid, checkInDate: null, history: [historyEvent] });
//         processedMobiles.add(mobile);
//     }
    
//     if (creations.length > 0) {
//       const batch = writeBatch(db);
      
//       creations.forEach(record => {
//         const newDocRef = doc(collection(db, 'numbers'));
//         batch.set(newDocRef, sanitizeObjectForFirestore(record));
//       });

//       await batch.commit().catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'write',
//             requestResourceData: {info: `Bulk add of ${creations.length} records.`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//         // If the whole batch fails, move all processed records to failed
//         creations.forEach(cr => failedRecords.push({ record: cr, reason: "Firestore permission denied."}));
//         return { successCount: 0, updatedCount: 0, failedRecords };
//       });
//     }
    
//     return { successCount: creations.length, updatedCount: 0, failedRecords };
//   };

//   const deleteReminder = (id: string) => {
//     if (!db || !user || role !== 'admin') return;
//     const reminderToDelete = reminders.find(r => r.id === id);
//     if (!reminderToDelete) return;
//     const docRef = doc(db, 'reminders', id);
//     deleteDoc(docRef).then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Deleted Reminder',
//             description: `Deleted task: ${reminderToDelete.taskName}`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: docRef.path,
//             operation: 'delete',
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const assignRemindersToUsers = (reminderIds: string[], userNames: string[]) => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     reminderIds.forEach(id => {
//       const docRef = doc(db, 'reminders', id);
//       batch.update(docRef, { assignedTo: userNames });
//     });
//     batch.commit().then(() => {
//         addActivity({
//             employeeName: user.displayName || user.email || 'User',
//             action: 'Assigned Reminders',
//             description: `Assigned ${reminderIds.length} reminder(s) to ${userNames.join(', ')}.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'reminders',
//             operation: 'update',
//             requestResourceData: { assignedTo: userNames },
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const updatePostpaidDetails = (id: string, details: { billDate: Date, pdBill: 'Yes' | 'No' }) => {
//     if (!db || !user) return;
//     const num = numbers.find(n => n.id === id);
//     if (!num) return;
    
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Postpaid Details Updated', `Bill Date set to ${details.billDate.toLocaleDateString()}, PD Bill set to ${details.pdBill}.`, performedBy);
    
//     const numDocRef = doc(db, 'numbers', id);
//     const updateData = {
//         billDate: Timestamp.fromDate(details.billDate),
//         pdBill: details.pdBill
//     };
//     updateDoc(numDocRef, {...updateData, history: arrayUnion(historyEvent)}).then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Updated Postpaid Details',
//             description: `Updated bill details for ${num.mobile}.`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: numDocRef.path,
//             operation: 'update',
//             requestResourceData: updateData,
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkUpdatePostpaidDetails = (numberIds: string[], details: { billDate: Date, pdBill: 'Yes' | 'No' }) => {
//     if (!db || !user) return;
//     const batch = writeBatch(db);
//     const performedBy = user.displayName || user.email || 'User';
//     const historyEvent = createLifecycleEvent('Postpaid Details Updated', `Bulk updated: Bill Date to ${details.billDate.toLocaleDateString()}, PD Bill to ${details.pdBill}.`, performedBy);
//     const updateData = {
//         billDate: Timestamp.fromDate(details.billDate),
//         pdBill: details.pdBill
//     };
//     const affectedNumbers = numbers.filter(n => numberIds.includes(n.id)).map(n => n.mobile);

//     numberIds.forEach(id => {
//         const docRef = doc(db, 'numbers', id);
//         batch.update(docRef, {...updateData, history: arrayUnion(historyEvent)});
//     });

//     batch.commit().then(() => {
//         addActivity({
//             employeeName: performedBy,
//             action: 'Bulk Updated Postpaid Details',
//             description: createDetailedDescription(`Updated bill details for`, affectedNumbers)
//         });
//         toast({
//             title: "Update Successful",
//             description: `Updated bill details for ${numberIds.length} record(s).`
//         });
//     }).catch(async (serverError) => {
//         const permissionError = new FirestorePermissionError({
//             path: 'numbers',
//             operation: 'update',
//             requestResourceData: {info: `Bulk update of postpaid details for ${numberIds.length} records`},
//         });
//         errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkMarkRemindersDone = (reminderIds: string[], note?: string) => {
//     if (!db || !user) return;
    
//     const remindersToUpdate = reminderIds.map(id => reminders.find(r => r.id === id)).filter(Boolean) as Reminder[];
    
//     const remindersThatCanBeDone: Reminder[] = [];
//     const remindersThatCannotBeDone: { reminder: Reminder, reason: string }[] = [];

//     for (const reminder of remindersToUpdate) {
//         const { canBeDone, message } = canReminderBeMarkedDone(reminder);
//         if (canBeDone) {
//             remindersThatCanBeDone.push(reminder);
//         } else {
//             remindersThatCannotBeDone.push({ reminder, reason: message });
//         }
//     }

//     if (remindersThatCannotBeDone.length > 0) {
//         const errorMessages = remindersThatCannotBeDone.map(item => `- ${item.reminder.taskName}: ${item.reason}`).join('\n');
//         toast({
//             variant: "destructive",
//             title: `${remindersThatCannotBeDone.length} reminder(s) could not be marked as done`,
//             description: <pre className="mt-2 w-full rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{errorMessages}</code></pre>,
//             duration: 10000,
//         });
//     }

//     if (remindersThatCanBeDone.length === 0) {
//         return;
//     }
    
//     const batch = writeBatch(db);
//     const updateData: { status: 'Done'; notes?: string; completionDate: Timestamp } = { 
//         status: 'Done',
//         completionDate: Timestamp.now(),
//     };
//     if (note) {
//       updateData.notes = note;
//     }

//     remindersThatCanBeDone.forEach(reminder => {
//       const docRef = doc(db, 'reminders', reminder.id);
//       batch.update(docRef, updateData);
//     });

//     batch.commit().then(() => {
//       addActivity({
//         employeeName: user.displayName || user.email || 'User',
//         action: 'Bulk Marked Tasks Done',
//         description: `Completed ${remindersThatCanBeDone.length} task(s).`
//       });
//       toast({
//         title: 'Update Successful',
//         description: `${remindersThatCanBeDone.length} reminder(s) marked as done.`
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'reminders',
//         operation: 'update',
//         requestResourceData: { info: `Bulk mark done for ${remindersThatCanBeDone.length} reminders.` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   const bulkDeleteReminders = (reminderIds: string[]) => {
//     if (!db || !user || role !== 'admin') return;

//     const batch = writeBatch(db);
//     const affectedTasks = reminders.filter(r => reminderIds.includes(r.id)).map(r => r.taskName);

//     reminderIds.forEach(id => {
//       const docRef = doc(db, 'reminders', id);
//       batch.delete(docRef);
//     });

//     batch.commit().then(() => {
//       addActivity({
//         employeeName: user.displayName || user.email || 'User',
//         action: 'Bulk Deleted Reminders',
//         description: `Deleted ${reminderIds.length} reminder(s).`
//       });
//       toast({
//         title: 'Deletion Successful',
//         description: `${reminderIds.length} reminder(s) have been deleted.`
//       });
//     }).catch(async (serverError) => {
//       const permissionError = new FirestorePermissionError({
//         path: 'reminders',
//         operation: 'delete',
//         requestResourceData: { info: `Bulk delete of ${reminderIds.length} reminders.` },
//       });
//       errorEmitter.emit('permission-error', permissionError);
//     });
//   };

//   // Filter data based on role
//   const roleFilteredNumbers = role === 'admin' ? numbers : (numbers || []).filter(n => n.assignedTo === user?.displayName);
//   const roleFilteredReminders = role === 'admin' ? reminders : (reminders || []).filter(r => Array.isArray(r.assignedTo) && r.assignedTo.includes(user?.displayName || ''));
//   const roleFilteredPreBookings = role === 'admin' ? preBookings : (preBookings || []).filter(pb => pb.originalNumberData?.assignedTo === user?.displayName);


//   const value: AppContextType = {
//     loading,
//     numbers: roleFilteredNumbers,
//     sales,
//     reminders: roleFilteredReminders,
//     activities: roleFilteredActivities,
//     users,
//     employees,
//     vendors,
//     dealerPurchases,
//     preBookings: roleFilteredPreBookings,
//     payments,
//     globalHistory,
//     deletedNumbers,
//     seenActivitiesCount,
//     recentlyAutoRtpIds,
//     showReminderPopup,
//     pendingRemindersForPopup,
//     closeReminderPopup: () => {
//         setShowReminderPopup(false);
//         setPendingRemindersForPopup([]);
//     },
//     markActivitiesAsSeen,
//     isMobileNumberDuplicate,
//     updateUser,
//     updateNumber,
//     updateNumberStatus,
//     updateUploadStatus,
//     bulkUpdateUploadStatus,
//     markReminderDone,
//     addActivity,
//     assignNumbersToEmployee,
//     checkInNumber,
//     sellNumber,
//     bulkSellNumbers,
//     cancelSale,
//     addNumber,
//     addMultipleNumbers,
//     addDealerPurchase,
//     bulkAddNumbers,
//     addReminder,
//     deleteReminder,
//     assignRemindersToUsers,
//     deleteDealerPurchases,
//     deleteActivities,
//     updateSafeCustodyDate,
//     bulkUpdateSafeCustodyDate,
//     deleteNumbers,
//     restoreDeletedNumber,
//     deleteUser,
//     updateNumberLocation,
//     markAsPreBooked,
//     cancelPreBooking,
//     sellPreBookedNumber,
//     bulkSellPreBookedNumbers,
//     addPayment,
//     updatePostpaidDetails,
//     bulkUpdatePostpaidDetails,
//     bulkMarkRemindersDone,
//     bulkDeleteReminders,
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// }

// export function useApp() {
//   const context = useContext(AppContext);
//   if (context === undefined) {
//     throw new Error('useApp must be used within an AppProvider');
//   }
//   return context;
// }
