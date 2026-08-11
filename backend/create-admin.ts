/**
 * Run this script to create a verified ADMIN account directly in the database.
 * Usage: cd backend && npx ts-node create-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'bloomonrestaurant@gmail.com';
  const adminPassword = 'Admin@1234'; // Change this to your desired password!
  const adminName = 'Bloomon Admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingUser) {
    // Update existing user to be admin and verified
    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log('✅ Admin account updated:', updated.email, '| Role:', updated.role);
  } else {
    // Create fresh admin user
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log('✅ Admin account created:', admin.email, '| Role:', admin.role);
  }

  console.log('🔑 Login with:');
  console.log('   Email:', adminEmail);
  console.log('   Password:', adminPassword);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
