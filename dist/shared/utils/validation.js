"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalHistoryRecordSchema = exports.paymentRecordSchema = exports.dealerPurchaseRecordSchema = exports.reminderSchema = exports.activitySchema = exports.saleRecordSchema = exports.numberRecordSchema = exports.lifecycleEventSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
// Multi-environment Timestamp validation
const timestampSchema = zod_1.z.custom((val) => {
    return val instanceof firestore_1.Timestamp || (val && typeof val.toDate === 'function');
}, { message: "Invalid Firestore Timestamp" });
exports.userSchema = zod_1.z.object({
    uid: zod_1.z.string(),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string(),
    role: zod_1.z.enum(['admin', 'employee']),
    id: zod_1.z.string(),
    telegramUsername: zod_1.z.string().optional(),
});
exports.lifecycleEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    action: zod_1.z.string(),
    description: zod_1.z.string(),
    timestamp: timestampSchema,
    performedBy: zod_1.z.string(),
});
exports.numberRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    mobile: zod_1.z.string(),
    sum: zod_1.z.number(),
    status: zod_1.z.enum(['RTP', 'Non-RTP']),
    uploadStatus: zod_1.z.enum(['Pending', 'Done']),
    numberType: zod_1.z.enum(['Prepaid', 'Postpaid', 'COCP']),
    purchaseFrom: zod_1.z.string(),
    purchasePrice: zod_1.z.number(),
    salePrice: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    rtpDate: timestampSchema.nullable(),
    name: zod_1.z.string(),
    currentLocation: zod_1.z.string(),
    locationType: zod_1.z.enum(['Store', 'Employee', 'Dealer']),
    assignedTo: zod_1.z.string(),
    purchaseDate: timestampSchema,
    notes: zod_1.z.string().optional(),
    checkInDate: timestampSchema.nullable(),
    safeCustodyDate: timestampSchema.nullable(),
    createdBy: zod_1.z.string(),
    accountName: zod_1.z.string().optional(),
    ownershipType: zod_1.z.enum(['Individual', 'Partnership']),
    partnerName: zod_1.z.string().optional(),
    billDate: timestampSchema.nullable().optional(),
    pdBill: zod_1.z.enum(['Yes', 'No']).optional(),
    history: zod_1.z.array(exports.lifecycleEventSchema).optional(),
});
exports.saleRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    mobile: zod_1.z.string(),
    sum: zod_1.z.number(),
    soldTo: zod_1.z.string(),
    salePrice: zod_1.z.number(),
    saleDate: timestampSchema,
    uploadStatus: zod_1.z.enum(['Pending', 'Done']),
    createdBy: zod_1.z.string(),
    originalNumberData: exports.numberRecordSchema.omit({ id: true }),
});
exports.activitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    employeeName: zod_1.z.string(),
    action: zod_1.z.string(),
    description: zod_1.z.string(),
    timestamp: timestampSchema,
    createdBy: zod_1.z.string(),
});
exports.reminderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    taskId: zod_1.z.string().optional(),
    taskName: zod_1.z.string(),
    assignedTo: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.enum(['Done', 'Pending']),
    dueDate: timestampSchema,
    createdBy: zod_1.z.string(),
    completionDate: timestampSchema.optional(),
    notes: zod_1.z.string().optional(),
});
exports.dealerPurchaseRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    mobile: zod_1.z.string(),
    sum: zod_1.z.number(),
    dealerName: zod_1.z.string(),
    price: zod_1.z.number(),
    createdBy: zod_1.z.string(),
});
exports.paymentRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    srNo: zod_1.z.number(),
    vendorName: zod_1.z.string(),
    amount: zod_1.z.number(),
    paymentDate: timestampSchema,
    notes: zod_1.z.string().optional(),
    createdBy: zod_1.z.string(),
});
exports.globalHistoryRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    mobile: zod_1.z.string(),
    rtpStatus: zod_1.z.enum(['RTP', 'Non-RTP', 'N/A']),
    numberType: zod_1.z.enum(['Prepaid', 'Postpaid', 'COCP', 'N/A']),
    currentStage: zod_1.z.enum(['In Inventory', 'Sold', 'Pre-Booked', 'Dealer Purchase', 'Deleted']),
    saleInfo: zod_1.z.object({
        soldTo: zod_1.z.string(),
        saleDate: timestampSchema,
        salePrice: zod_1.z.number(),
    }).optional(),
    purchaseInfo: zod_1.z.object({
        purchaseFrom: zod_1.z.string(),
        purchaseDate: timestampSchema.nullable(),
        purchasePrice: zod_1.z.number(),
    }).optional(),
    deletionInfo: zod_1.z.object({
        reason: zod_1.z.string(),
        deletedBy: zod_1.z.string(),
        deletedAt: timestampSchema,
    }).optional(),
    history: zod_1.z.array(exports.lifecycleEventSchema).optional(),
});
