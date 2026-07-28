import { PrismaClient } from '@prisma/client';

async function test(url: string) {
  console.log('Testing URL:', url.replace(/:([^@:]+)@/, ':****@'));
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
  try {
    const res = await prisma.user.findMany({ take: 1 });
    console.log('SUCCESS for URL! Result:', res);
    return true;
  } catch (err: any) {
    console.log('FAILED. Error:', err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const url1 = "postgresql://neondb_owner:npg_A3gpdSU8RyBs@ep-purple-sky-axhjbbvn-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30";
  const url2 = "postgresql://neondb_owner:npg_A3gpdSU8RyBs@ep-purple-sky-axhjbbvn.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30";
  const url3 = "postgresql://neondb_owner:npg_A3gpdSU8RyBs@ep-purple-sky-axhjbbvn.us-east-2.aws.neon.tech/neondb?sslmode=require";
  const url4 = "postgresql://neondb_owner:npg_A3gpdSU8RyBs@ep-purple-sky-axhjbbvn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

  await test(url1);
  await test(url2);
  await test(url3);
  await test(url4);
}

main();
