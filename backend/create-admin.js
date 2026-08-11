const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'bloomonrestaurant@gmail.com';
  const password = 'Admin@1234'; // ← Login with this password
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const u = await prisma.user.update({
      where: { email },
      data: { password: hash, role: 'ADMIN', isVerified: true },
    });
    console.log('✅ Admin updated:', u.email, '| Role:', u.role);
  } else {
    const u = await prisma.user.create({
      data: {
        name: 'Bloomon Admin',
        email,
        password: hash,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log('✅ Admin created:', u.email, '| Role:', u.role);
  }

  console.log('');
  console.log('Login credentials:');
  console.log('  Email:   ', email);
  console.log('  Password:', password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
