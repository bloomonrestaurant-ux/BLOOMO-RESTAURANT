"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Load env variables
dotenv_1.default.config();
console.log('Testing connection to Neon PostgreSQL...');
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Connection successful! Query returned:', users);
    }
    catch (error) {
        console.error('Connection failed with error:');
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
