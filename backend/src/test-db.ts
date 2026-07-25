import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

console.log('Testing connection to Neon PostgreSQL...');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Connection successful! Query returned:', users);
  } catch (error: any) {
    console.error('Connection failed with error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
