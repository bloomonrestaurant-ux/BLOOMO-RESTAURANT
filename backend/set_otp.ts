import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'kondamanojkumar06@gmail.com';
  const otp = '123456';
  
  // Hash the OTP using bcrypt for security
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Store or update OTP in DB
  await prisma.oTP.upsert({
    where: { email },
    update: {
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      attempts: 0,
      createdAt: new Date(),
    },
    create: {
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      attempts: 0,
    },
  });
  
  console.log(`Successfully set OTP for ${email} to: ${otp}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
