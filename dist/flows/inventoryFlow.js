"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.handleInventoryCommand = exports.parseInventoryCommand = exports.handleInventoryMessageStep = exports.handleInventoryCallbackQuery = exports.sendInventoryMenu = void 0;
const numberService_1 = require("../services/numberService");
const preBookingService_1 = require("../services/preBookingService");
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
const SessionManager = __importStar(require("../services/sessionManager"));
const Logger_1 = require("../utils/Logger");
const logger = new Logger_1.Logger();
// ─── Menu System ─────────────────────────────────────────────────────────────
const sendInventoryMenu = (bot, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const menu = {
        inline_keyboard: [
            [
                { text: '➕ NEWADD', callback_data: 'inventory:init:NEWADD' },
                { text: '💰 PRICE', callback_data: 'inventory:init:PRICEUPDATE' }
            ],
            [
                { text: '📍 LOC', callback_data: 'inventory:init:LOCATIONUPDATE' },
                { text: '🔄 RTP', callback_data: 'inventory:init:RTPSTATUSUPDATE' }
            ],
            [
                { text: '🔍 SEARCH', callback_data: 'inventory:init:SEARCH' },
                { text: '🔢 MAX', callback_data: 'inventory:init:MAXCONTAIN' }
            ],
            [
                { text: 'ℹ️ CHECK', callback_data: 'inventory:init:CHECK' },
                { text: '📝 DETAIL', callback_data: 'inventory:init:DETAIL' }
            ],
            [
                { text: '🤝 SOLD', callback_data: 'inventory:init:SOLD' },
                { text: '☁️ UPLOAD', callback_data: 'inventory:init:UPLOADUPDATE' }
            ],
            [
                { text: '👤 ASSIGN', callback_data: 'inventory:init:ASSIGNUPDATE' },
                { text: '🗑️ DELETE', callback_data: 'inventory:init:DELETEUPDATE' }
            ],
            [
                { text: '📅 PREBOOK', callback_data: 'inventory:init:PREBOOKIUPDATE' }
            ]
        ]
    };
    yield bot.sendMessage(chatId, '📦 *Inventory Management Menu*\nChoose an action below or send a multi-line template.', {
        parse_mode: 'Markdown',
        reply_markup: menu
    });
});
exports.sendInventoryMenu = sendInventoryMenu;
const handleInventoryCallbackQuery = (bot, query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = (_a = query.message) === null || _a === void 0 ? void 0 : _a.chat.id;
    const userId = query.from.id;
    const data = query.data;
    if (!chatId || !data)
        return;
    if (data.startsWith('inventory:init:')) {
        const type = data.split(':')[2];
        yield startInventoryFlow(bot, chatId, userId, type);
    }
    else if (data.startsWith('inventory:step_select:')) {
        const [, , field, value] = data.split(':');
        const session = SessionManager.getSession(userId);
        if (session && session.flow === 'inventory') {
            // Simulate a message with the selected value
            const step = session.step;
            const data = session.data;
            if (data.type === 'NEWADD') {
                yield handleNewAddStep(bot, chatId, userId, step, value, data, query.from.username || 'User');
            }
        }
    }
    yield bot.answerCallbackQuery(query.id);
});
exports.handleInventoryCallbackQuery = handleInventoryCallbackQuery;
function startInventoryFlow(bot, chatId, userId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        SessionManager.setSession(userId, {
            flow: 'inventory',
            step: `awaiting_number_${type}`,
            data: { type, chatId },
            chatId
        });
        let prompt = '';
        switch (type) {
            case 'SEARCH':
                SessionManager.updateSession(userId, { step: 'awaiting_search_params' });
                prompt = "🔍 *SEARCH*\nEnter search filters (e.g., `START=987 STATUS=AVAILABLE`) or `ALL` to see recent.";
                break;
            case 'MAXCONTAIN':
                SessionManager.updateSession(userId, { step: 'awaiting_digits' });
                prompt = "🔢 *MAXCONTAIN*\nEnter the digits to search for (e.g., `9,1,5`).";
                break;
            default:
                prompt = `📱 *${type}*\nPlease enter the *MOBILE NUMBER*:`;
                break;
        }
        yield bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown' });
    });
}
const handleInventoryMessageStep = (bot, msg, admin) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const chatId = msg.chat.id;
    const userId = (_b = msg.from) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId)
        return false;
    const session = SessionManager.getSession(userId);
    if (!session || session.flow !== 'inventory') {
        console.log(`[Inventory] No session found for user ${userId}. Session exists: ${SessionManager.hasSession(userId)}`);
        return false;
    }
    const input = ((_c = msg.text) === null || _c === void 0 ? void 0 : _c.trim()) || '';
    logger.info(`Message Step - User: ${userId} - Flow: ${session.flow} - Step: ${session.step} - Input: ${input}`);
    if (input.toLowerCase() === 'cancel') {
        SessionManager.clearSession(userId);
        bot.sendMessage(chatId, '❌ Inventory operation cancelled.');
        return true;
    }
    const { step, data } = session;
    try {
        const multiStepFlows = ['NEWADD', 'SOLD', 'PREBOOKIUPDATE'];
        if (step.startsWith('awaiting_number_') && !multiStepFlows.includes(data.type)) {
            const type = data.type;
            SessionManager.updateSession(userId, {
                step: `awaiting_next_for_${type}`,
                data: Object.assign(Object.assign({}, data), { number: input })
            });
            yield promptNextField(bot, chatId, userId, type, input);
            return true;
        }
        // Handle specific steps for each command
        switch (data.type) {
            case 'NEWADD':
                return yield handleNewAddStep(bot, chatId, userId, step, input, data, admin);
            case 'PRICEUPDATE':
                yield handlePriceUpdate(bot, chatId, { NUMBER: data.number, SP: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'LOCATIONUPDATE':
                yield handleLocationUpdate(bot, chatId, { NUMBER: data.number, LOC: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'RTPSTATUSUPDATE':
                yield handleRtpStatusUpdate(bot, chatId, { NUMBER: data.number, STATUS: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'CHECK':
            case 'DETAIL':
                yield handleCheckDetail(bot, chatId, { NUMBER: data.number });
                SessionManager.clearSession(userId);
                return true;
            case 'SEARCH':
                return yield handleSearchStep(bot, chatId, userId, input);
            case 'MAXCONTAIN':
                yield handleSearch(bot, chatId, { DIGIT: input }, 'MAXCONTAIN');
                SessionManager.clearSession(userId);
                return true;
            case 'SOLD':
                return yield handleSoldStep(bot, chatId, userId, step, input, data, admin);
            case 'UPLOADUPDATE':
                yield handleUploadUpdate(bot, chatId, { NUMBER: data.number, UPLOAD: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'ASSIGNUPDATE':
                yield handleAssignUpdate(bot, chatId, { NUMBER: data.number, ASSIGN: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'DELETEUPDATE':
                yield handleDeleteUpdate(bot, chatId, { NUMBER: data.number, NOTES: input }, admin);
                SessionManager.clearSession(userId);
                return true;
            case 'PREBOOKIUPDATE':
                return yield handlePrebookStep(bot, chatId, userId, step, input, data, admin);
        }
    }
    catch (e) {
        bot.sendMessage(chatId, `❌ *Error:* ${e.message}\nPlease try again or type \`cancel\`.`, { parse_mode: 'Markdown' });
    }
    return true;
});
exports.handleInventoryMessageStep = handleInventoryMessageStep;
function promptNextField(bot, chatId, userId, type, number) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let prompt = '';
        let options = null;
        if (type === 'NEWADD') {
            const session = SessionManager.getSession(userId);
            const step = session === null || session === void 0 ? void 0 : session.step;
            const currentNumber = ((_a = session === null || session === void 0 ? void 0 : session.data) === null || _a === void 0 ? void 0 : _a.number) || 'number';
            switch (step) {
                case 'awaiting_sp':
                    prompt = `💰 [2/12] Enter *SELLING PRICE (SP)* for ${currentNumber}:`;
                    break;
                case 'awaiting_pp':
                    prompt = `📉 [3/12] Enter *PURCHASE PRICE (PP)*:`;
                    break;
                case 'awaiting_type':
                    prompt = `🏷️ [4/12] Select *NUMBER TYPE*:`;
                    options = {
                        inline_keyboard: [
                            [
                                { text: 'Prepaid', callback_data: 'inventory:step_select:TYPE:PREPAID' },
                                { text: 'Postpaid', callback_data: 'inventory:step_select:TYPE:POSTPAID' },
                                { text: 'COCP', callback_data: 'inventory:step_select:TYPE:COCP' }
                            ]
                        ]
                    };
                    break;
                case 'awaiting_from':
                    prompt = `👤 [5/12] Enter *PURCHASE FROM* (Vendor/Name):`;
                    break;
                case 'awaiting_loc':
                    prompt = `📍 [6/12] Enter *LOCATION* (e.g., DELHI):`;
                    break;
                case 'awaiting_ltype':
                    prompt = `🏬 [7/12] Select *LOCATION TYPE*:`;
                    options = {
                        inline_keyboard: [
                            [
                                { text: 'Store', callback_data: 'inventory:step_select:LTYPE:STORE' },
                                { text: 'Employee', callback_data: 'inventory:step_select:LTYPE:EMPLOYEE' },
                                { text: 'Dealer', callback_data: 'inventory:step_select:LTYPE:DEALER' }
                            ]
                        ]
                    };
                    break;
                case 'awaiting_status':
                    prompt = `📊 [8/12] Enter *STATUS* (e.g., AVAILABLE):`;
                    options = {
                        inline_keyboard: [[{ text: 'AVAILABLE', callback_data: 'inventory:step_select:STATUS:AVAILABLE' }]]
                    };
                    break;
                case 'awaiting_own':
                    prompt = `👤 [9/12] Select *OWNERSHIP*:`;
                    options = {
                        inline_keyboard: [
                            [
                                { text: 'Individual', callback_data: 'inventory:step_select:OWN:INDIVIDUAL' },
                                { text: 'Partnership', callback_data: 'inventory:step_select:OWN:PARTNER' }
                            ]
                        ]
                    };
                    break;
                case 'awaiting_rtp':
                    prompt = `🔄 [10/12] Enter *RTP* (Format: \`RTP:DD-MM-YYYY\` or send \`RTP\`):`;
                    break;
                case 'awaiting_upload':
                    prompt = `☁️ [11/12] Select *UPLOAD STATUS*:`;
                    options = {
                        inline_keyboard: [
                            [
                                { text: 'Done', callback_data: 'inventory:step_select:UPLOAD:DONE' },
                                { text: 'Pending', callback_data: 'inventory:step_select:UPLOAD:PENDING' }
                            ]
                        ]
                    };
                    break;
                case 'awaiting_assign':
                    prompt = `👤 [12/12] Enter *ASSIGNED TO* (Username) or sent \`NONE\`:`;
                    break;
            }
        }
        else {
            switch (type) {
                case 'PRICEUPDATE':
                    prompt = `💰 Enter NEW *SELLING PRICE (SP)* for ${number}:`;
                    break;
                case 'LOCATIONUPDATE':
                    prompt = `📍 Enter NEW *LOCATION* for ${number}:`;
                    break;
                case 'RTPSTATUSUPDATE':
                    prompt = `🔄 Enter *RTP STATUS* (Format: \`STATUS-NONRTP-DATE\`):`;
                    break;
                case 'SOLD':
                    prompt = `💰 Enter *SALE PRICE* for ${number}:`;
                    break;
                case 'PREBOOKIUPDATE':
                    prompt = `👤 Enter *BUYER NAME* for pre-booking:`;
                    break;
            }
        }
        if (!prompt)
            prompt = "❓ Please enter the next required detail:";
        yield bot.sendMessage(chatId, prompt, {
            parse_mode: 'Markdown',
            reply_markup: options
        });
    });
}
function handleNewAddStep(bot, chatId, userId, step, input, data, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const nextSteps = {
            'awaiting_number_NEWADD': 'awaiting_sp',
            'awaiting_sp': 'awaiting_pp',
            'awaiting_pp': 'awaiting_type',
            'awaiting_type': 'awaiting_from',
            'awaiting_from': 'awaiting_loc',
            'awaiting_loc': 'awaiting_ltype',
            'awaiting_ltype': 'awaiting_status',
            'awaiting_status': 'awaiting_own',
            'awaiting_own': 'awaiting_rtp',
            'awaiting_rtp': 'awaiting_upload',
            'awaiting_upload': 'awaiting_assign',
            'awaiting_assign': 'complete'
        };
        const fieldMap = {
            'awaiting_number_NEWADD': 'number',
            'awaiting_sp': 'sp',
            'awaiting_pp': 'pp',
            'awaiting_type': 'type',
            'awaiting_from': 'from',
            'awaiting_loc': 'loc',
            'awaiting_ltype': 'ltype',
            'awaiting_status': 'status',
            'awaiting_own': 'own',
            'awaiting_rtp': 'rtp',
            'awaiting_upload': 'upload',
            'awaiting_assign': 'assign'
        };
        const currentField = fieldMap[step];
        const nextStep = nextSteps[step];
        logger.info(`NEWADD Flow - User: ${userId} - Step: ${step} - Input: ${input}`);
        if (currentField === 'own' && input === 'PARTNER') {
            logger.info(`NEWADD Flow - Branching to partner name for userId: ${userId}`);
            // Special case for partnership, ask for name
            SessionManager.updateSession(userId, { step: 'awaiting_partner_name' });
            yield bot.sendMessage(chatId, "🤝 Enter *PARTNER NAME* (e.g. HASHMI):");
            return true;
        }
        if (step === 'awaiting_partner_name') {
            logger.info(`NEWADD Flow - Partner name received: ${input} for userId: ${userId}`);
            const newData = Object.assign(Object.assign({}, data), { own: `PARTNER:${input}` });
            SessionManager.updateSession(userId, { step: 'awaiting_rtp', data: newData });
            yield promptNextField(bot, chatId, userId, 'NEWADD', newData.number);
            return true;
        }
        const newData = Object.assign(Object.assign({}, data), { [currentField]: input });
        if (nextStep === 'complete') {
            logger.info(`NEWADD Flow - Completion triggered for number: ${newData.number} by userId: ${userId}`);
            const p = {
                NUMBER: newData.number,
                SP: newData.sp,
                PP: newData.pp,
                TYPE: newData.type,
                FROM: newData.from,
                LOC: newData.loc,
                LTYPE: newData.ltype,
                STATUS: newData.status,
                OWN: newData.own,
                RTP: newData.rtp,
                UPLOAD: newData.upload,
                ASSIGN: newData.assign === 'NONE' ? '' : newData.assign
            };
            yield handleNewAdd(bot, chatId, p, admin);
            SessionManager.clearSession(userId);
        }
        else {
            logger.info(`NEWADD Flow - Moving to ${nextStep} for userId: ${userId}`);
            SessionManager.updateSession(userId, { step: nextStep, data: newData });
            yield promptNextField(bot, chatId, userId, 'NEWADD', newData.number);
        }
        return true;
    });
}
function handleSoldStep(bot, chatId, userId, step, input, data, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (step === 'awaiting_number_SOLD') {
            SessionManager.updateSession(userId, { step: 'awaiting_sale_price', data: Object.assign(Object.assign({}, data), { number: input }) });
            yield bot.sendMessage(chatId, `💰 Enter *SALE PRICE* for ${input}:`, { parse_mode: 'Markdown' });
        }
        else if (step === 'awaiting_sale_price') {
            SessionManager.updateSession(userId, { step: 'awaiting_buyer', data: Object.assign(Object.assign({}, data), { sp: input }) });
            yield bot.sendMessage(chatId, "👤 Enter *BUYER NAME*:");
        }
        else if (step === 'awaiting_buyer') {
            yield handleSold(bot, chatId, { NUMBER: data.number, SP: data.sp, BUYER: input }, admin);
            SessionManager.clearSession(userId);
        }
        return true;
    });
}
function handlePrebookStep(bot, chatId, userId, step, input, data, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (step === 'awaiting_number_PREBOOKIUPDATE') {
            SessionManager.updateSession(userId, { step: 'awaiting_prebook_name', data: Object.assign(Object.assign({}, data), { number: input }) });
            yield bot.sendMessage(chatId, `👤 Enter *BUYER NAME* for pre-booking ${input}:`, { parse_mode: 'Markdown' });
        }
        else if (step === 'awaiting_prebook_name') {
            yield handlePrebookUpdate(bot, chatId, { NUMBER: data.number, NAME: input }, admin);
            SessionManager.clearSession(userId);
        }
        return true;
    });
}
function handleSearchStep(bot, chatId, userId, input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (input.toUpperCase() === 'ALL') {
            yield handleSearch(bot, chatId, {}, 'SEARCH');
        }
        else {
            const params = {};
            input.split(' ').forEach(part => {
                const [k, v] = part.split('=');
                if (k && v)
                    params[k.toUpperCase()] = v;
            });
            yield handleSearch(bot, chatId, params, 'SEARCH');
        }
        SessionManager.clearSession(userId);
        return true;
    });
}
function parseInventoryCommand(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 1)
        return null;
    const type = lines[0].trim().toUpperCase();
    const params = {};
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            params[key.trim().toUpperCase()] = valueParts.join('=').trim();
        }
    }
    return { type, params };
}
exports.parseInventoryCommand = parseInventoryCommand;
// ─── Main Handler ───────────────────────────────────────────────────────────
function handleInventoryCommand(bot, msg, adminUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = parseInventoryCommand(msg.text || '');
        if (!command)
            return false;
        const chatId = msg.chat.id;
        const p = command.params;
        try {
            switch (command.type) {
                case 'NEWADD':
                    yield handleNewAdd(bot, chatId, p, adminUsername);
                    return true;
                case 'PRICEUPDATE':
                    yield handlePriceUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'LOCATIONUPDATE':
                    yield handleLocationUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'RTPSTATUSUPDATE':
                    yield handleRtpStatusUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'CHECK':
                case 'DETAIL':
                    yield handleCheckDetail(bot, chatId, p);
                    return true;
                case 'SEARCH':
                case 'MAXCONTAIN':
                    yield handleSearch(bot, chatId, p, command.type);
                    return true;
                case 'SOLD':
                    yield handleSold(bot, chatId, p, adminUsername);
                    return true;
                case 'UPLOADUPDATE':
                    yield handleUploadUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'ASSIGNUPDATE':
                    yield handleAssignUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'DELETEUPDATE':
                    yield handleDeleteUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'PREBOOKIUPDATE':
                    yield handlePrebookUpdate(bot, chatId, p, adminUsername);
                    return true;
                case 'INVENTORY':
                    bot.sendMessage(chatId, "📊 *Inventory Commands Guide*\n\nAvailable: NEWADD, PRICEUPDATE, LOCATIONUPDATE, RTPSTATUSUPDATE, CHECK, SEARCH, MAXCONTAIN, DETAIL, SOLD, UPLOADUPDATE, ASSIGNUPDATE, DELETEUPDATE, PREBOOKIUPDATE.", { parse_mode: 'Markdown' });
                    return true;
                default:
                    return false; // Not an inventory command
            }
        }
        catch (e) {
            logger.error(`Inventory command error: ${e.message}`);
            bot.sendMessage(chatId, `❌ *Error:* ${e.message}`, { parse_mode: 'Markdown' });
            return true;
        }
    });
}
exports.handleInventoryCommand = handleInventoryCommand;
// ─── Individual Command Handlers ─────────────────────────────────────────────
function handleNewAdd(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        logger.info(`Processing NEWADD (Template) for number: ${p.NUMBER} by admin: ${admin}`);
        if (!p.NUMBER || !/^\d{10}$/.test(p.NUMBER)) {
            logger.error(`NEWADD Validation Failed: Invalid number format: ${p.NUMBER}`);
            throw new Error("NUMBER must be exactly 10 digits.");
        }
        if (!p.PP)
            throw new Error("PP (Purchase Price) is required.");
        if (!p.FROM)
            throw new Error("FROM (Vendor) is required.");
        if (!p.LOC)
            throw new Error("LOC (Location) is required.");
        // Parse Ownership
        let ownershipType = 'Individual';
        let partnerName = '';
        if (p.OWN) {
            if (p.OWN.toUpperCase().startsWith('PARTNER:')) {
                ownershipType = 'Partnership';
                partnerName = ((_a = p.OWN.split(':')[1]) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            }
            else {
                ownershipType = p.OWN;
            }
        }
        // Parse Status (Template RTP field maps to DB status field)
        let dbStatus = 'Non-RTP';
        let rtpDate = null;
        if (p.RTP) {
            const parts = p.RTP.split(':');
            dbStatus = 'RTP'; // Template provided RTP field implies RTP intent
            if (parts[1]) {
                rtpDate = parseFormattedDate(parts[1]);
            }
        }
        const numberData = {
            mobile: p.NUMBER,
            sellingPrice: Number(p.SP) || 0,
            purchasePrice: Number(p.PP),
            numberType: p.TYPE || 'Prepaid',
            purchaseFrom: p.FROM,
            currentLocation: p.LOC,
            locationType: p.LTYPE || 'Store',
            status: dbStatus,
            inventoryStatus: p.STATUS || 'AVAILABLE',
            ownershipType,
            partnerName,
            rtpDate,
            uploadStatus: p.UPLOAD || 'Pending',
            assignedTo: p.ASSIGN || 'Unassigned',
        };
        yield (0, numberService_1.addNumber)(numberData, admin);
        logger.info(`Successfully added number: ${p.NUMBER} to inventory via template.`);
        bot.sendMessage(chatId, `✅ Number *${p.NUMBER}* added to inventory!`, { parse_mode: 'Markdown' });
    });
}
function handlePriceUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.SP)
            throw new Error("NUMBER and SP are required.");
        yield (0, numberService_1.updateNumber)(p.NUMBER, { sellingPrice: Number(p.SP) }, admin, 'Price Update');
        bot.sendMessage(chatId, `💰 Updated selling price of *${p.NUMBER}* to ₹${p.SP}.`, { parse_mode: 'Markdown' });
    });
}
function handleLocationUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.LOC)
            throw new Error("NUMBER and LOC are required.");
        yield (0, numberService_1.updateNumber)(p.NUMBER, { currentLocation: p.LOC }, admin, 'Location Update');
        bot.sendMessage(chatId, `📍 Updated location of *${p.NUMBER}* to ${p.LOC}.`, { parse_mode: 'Markdown' });
    });
}
function handleRtpStatusUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.STATUS)
            throw new Error("NUMBER and STATUS are required.");
        // Format: RTP-NONRTP-DATE or just RTP-DATE
        const parts = p.STATUS.split('-');
        const status = parts[0].toUpperCase() === 'RTP' ? 'RTP' : (parts[0].toUpperCase() === 'NONRTP' ? 'Non-RTP' : 'RTP'); // Default to RTP if not explicitly Non-RTP
        const rtpDate = parts.length > 1 ? parseFormattedDate(parts[parts.length - 1]) : null;
        yield (0, numberService_1.updateNumber)(p.NUMBER, { status, rtpDate }, admin, 'RTP Status Update');
        bot.sendMessage(chatId, `🔄 Updated RTP Status of *${p.NUMBER}* to ${status}${rtpDate ? ` (${parts[parts.length - 1]})` : ''}.`, { parse_mode: 'Markdown' });
    });
}
function handleCheckDetail(bot, chatId, p) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER)
            throw new Error("NUMBER is required.");
        const results = yield (0, numberService_1.advancedSearch)({ mobile: p.NUMBER });
        if (results.length === 0)
            throw new Error("Number not found.");
        const data = results[0];
        const info = `📱 *VIP Number Details*\n\n` +
            `• Mobile: \`${data.mobile}\`\n` +
            `• RTP Status: *${data.status}*\n` +
            `• Inv Status: *${data.inventoryStatus || 'AVAILABLE'}*\n` +
            `• Price: ₹${data.sellingPrice || 0}\n` +
            `• Loc: ${data.currentLocation} (${data.locationType})\n` +
            `• Owner: ${data.ownershipType}${data.partnerName ? ` (${data.partnerName})` : ''}\n` +
            `• RTP Date: ${data.rtpDate ? data.rtpDate.toDate().toLocaleDateString() : 'N/A'}\n` +
            `• Upload: ${data.uploadStatus}\n` +
            `• Assign: ${data.assignedTo}`;
        bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
    });
}
function handleSearch(bot, chatId, p, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const filters = type === 'MAXCONTAIN' ? Object.assign(Object.assign({}, p), { MAXCONTAIN: p.DIGIT }) : p;
        const results = yield (0, numberService_1.advancedSearch)(filters);
        if (results.length === 0) {
            bot.sendMessage(chatId, "🔍 No numbers found matching filters.");
            return;
        }
        let text = `🔍 *Search Results (${results.length}):*\n\n`;
        results.slice(0, 15).forEach((n) => {
            text += `• \`${n.mobile}\` - ₹${n.sellingPrice} (${n.status})\n`;
        });
        if (results.length > 15)
            text += `\n_...and ${results.length - 15} more_`;
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });
}
function handleSold(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.SP || !p.BUYER)
            throw new Error("NUMBER, SP, and BUYER are required.");
        const snap = yield firebase_1.db.collection('numbers').where('mobile', '==', p.NUMBER).limit(1).get();
        if (snap.empty)
            throw new Error("Number not found.");
        yield (0, numberService_1.sellNumber)(snap.docs[0].id, { mobile: p.NUMBER, salePrice: Number(p.SP), soldTo: p.BUYER }, admin);
        bot.sendMessage(chatId, `💰 Number *${p.NUMBER}* sold to ${p.BUYER} for ₹${p.SP}!`, { parse_mode: 'Markdown' });
    });
}
function handleUploadUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.UPLOAD)
            throw new Error("NUMBER and UPLOAD are required.");
        yield (0, numberService_1.updateNumber)(p.NUMBER, { uploadStatus: p.UPLOAD }, admin, 'Upload Update');
        bot.sendMessage(chatId, `☁️ Updated upload status of *${p.NUMBER}* to ${p.UPLOAD}.`, { parse_mode: 'Markdown' });
    });
}
function handleAssignUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.ASSIGN)
            throw new Error("NUMBER and ASSIGN are required.");
        yield (0, numberService_1.updateNumber)(p.NUMBER, { assignedTo: p.ASSIGN }, admin, 'Assignment Update');
        bot.sendMessage(chatId, `👤 Assigned *${p.NUMBER}* to ${p.ASSIGN}.`, { parse_mode: 'Markdown' });
    });
}
function handleDeleteUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.NOTES)
            throw new Error("NUMBER and NOTES are required.");
        const snap = yield firebase_1.db.collection('numbers').where('mobile', '==', p.NUMBER).limit(1).get();
        if (snap.empty)
            throw new Error("Number not found.");
        yield (0, numberService_1.deleteNumber)(snap.docs[0].id, p.NOTES, admin);
        bot.sendMessage(chatId, `🗑️ Deleted *${p.NUMBER}* from inventory. Notes: ${p.NOTES}`, { parse_mode: 'Markdown' });
    });
}
function handlePrebookUpdate(bot, chatId, p, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!p.NUMBER || !p.NAME)
            throw new Error("NUMBER and NAME are required.");
        const snap = yield firebase_1.db.collection('numbers').where('mobile', '==', p.NUMBER).limit(1).get();
        if (snap.empty)
            throw new Error("Number not found.");
        yield (0, preBookingService_1.markAsPreBooked)(snap.docs[0].id, admin);
        bot.sendMessage(chatId, `📅 Number *${p.NUMBER}* pre-booked by ${p.NAME}.`, { parse_mode: 'Markdown' });
    });
}
// ─── Utilities ──────────────────────────────────────────────────────────────
function parseFormattedDate(dateStr) {
    if (!dateStr || dateStr.toLowerCase().includes('date'))
        return null;
    // Handle DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        if (isNaN(d.getTime()))
            return null;
        return firestore_1.Timestamp.fromDate(d);
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime()))
        return null;
    return firestore_1.Timestamp.fromDate(d);
}
