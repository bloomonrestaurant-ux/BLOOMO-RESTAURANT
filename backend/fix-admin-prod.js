const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// This uses the DATABASE_URL from environment
// Run: DATABASE_URL="<render_db_url>" node fix-admin-prod.js
const prisma = new PrismaClient();

async function main() {
  const email = 'bloomonrestaurant@gmail.com';
  const password = 'Admin@1234';
  const hash = await bcrypt.hash(password, 12);

  const u = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN', isVerified: true, password: hash },
  });

  console.log('✅ Fixed:', u.email, '| Role:', u.role, '| Verified:', u.isVerified);
  console.log('Login: Email =', email, '| Password = Admin@1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
