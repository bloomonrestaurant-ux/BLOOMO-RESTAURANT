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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.db = exports.auth = void 0;
const admin = __importStar(require("firebase-admin"));
const getServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        }
        catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable:', e);
        }
    }
    return {
        projectId: process.env.FIREBASE_PROJECT_ID || 'mock-project-id',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'mock-client-email@gserviceaccount.com',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || 'mock-private-key').replace(/\\n/g, '\n'),
    };
};
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'mock-bucket.appspot.com',
    });
}
exports.auth = admin.auth();
exports.db = admin.firestore();
exports.storage = admin.storage();
// Configure collection settings if needed
exports.db.settings({ ignoreUndefinedProperties: true });
exports.default = admin;
