"use strict";
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
const userService_1 = require("../services/userService");
const firebase_1 = require("../config/firebase");
const activityService_1 = require("../services/activityService");
jest.mock('../config/firebase', () => ({
    db: {
        collection: jest.fn(),
    },
}));
jest.mock('../services/activityService', () => ({
    addActivity: jest.fn(),
}));
describe('User Service', () => {
    let collectionMock;
    let docMock;
    let getMock;
    let setMock;
    let deleteMock;
    let whereMock;
    beforeEach(() => {
        setMock = jest.fn();
        deleteMock = jest.fn();
        getMock = jest.fn(() => Promise.resolve({ exists: true, data: () => ({ displayName: 'Test User' }) }));
        docMock = jest.fn(() => ({
            get: getMock,
            set: setMock,
            delete: deleteMock,
        }));
        whereMock = jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ empty: true })),
        }));
        collectionMock = jest.fn(() => ({
            doc: docMock,
            where: whereMock,
            get: jest.fn(() => Promise.resolve({ docs: [] })),
        }));
        firebase_1.db.collection.mockImplementation(collectionMock);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('addUser', () => {
        const userData = { email: 'test@example.com', displayName: 'Test User', role: 'employee' };
        const adminUsername = 'admin';
        it('should add a new user and log activity', () => __awaiter(void 0, void 0, void 0, function* () {
            docMock.mockImplementation(() => ({
                id: 'mock-user-id',
                set: setMock,
            }));
            const result = yield (0, userService_1.addUser)(userData, adminUsername);
            expect(collectionMock).toHaveBeenCalledWith('users');
            expect(docMock).toHaveBeenCalled();
            expect(setMock).toHaveBeenCalledWith(expect.objectContaining(userData));
            expect(activityService_1.addActivity).toHaveBeenCalledWith(adminUsername, 'Added User', expect.any(String));
            expect(result).toEqual(expect.objectContaining(userData));
        }));
        it('should throw an error if user with the same email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            whereMock.mockImplementation(() => ({
                get: jest.fn(() => Promise.resolve({ empty: false })),
            }));
            yield expect((0, userService_1.addUser)(userData, adminUsername)).rejects.toThrow('User with this email already exists.');
        }));
    });
    describe('deleteUser', () => {
        const userId = 'mock-user-id';
        const adminUsername = 'admin';
        it('should delete a user and log activity', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, userService_1.deleteUser)(userId, adminUsername);
            expect(collectionMock).toHaveBeenCalledWith('users');
            expect(docMock).toHaveBeenCalledWith(userId);
            expect(deleteMock).toHaveBeenCalled();
            expect(activityService_1.addActivity).toHaveBeenCalledWith(adminUsername, 'Deleted User', expect.any(String));
        }));
        it('should throw an error if the user does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementation(() => Promise.resolve({ exists: false }));
            yield expect((0, userService_1.deleteUser)(userId, adminUsername)).rejects.toThrow('User not found.');
        }));
    });
    describe('getAllUsers', () => {
        it('should return a list of all users', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUsers = [
                { id: '1', data: () => ({ email: 'user1@example.com', displayName: 'User One', role: 'admin' }) },
                { id: '2', data: () => ({ email: 'user2@example.com', displayName: 'User Two', role: 'employee' }) },
            ];
            collectionMock.mockImplementation(() => ({
                get: jest.fn(() => Promise.resolve({ docs: mockUsers })),
            }));
            const result = yield (0, userService_1.getAllUsers)();
            expect(collectionMock).toHaveBeenCalledWith('users');
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(expect.objectContaining({ email: 'user1@example.com' }));
        }));
    });
});
