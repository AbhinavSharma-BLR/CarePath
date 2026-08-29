const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { phone: '8090286983' }
  });
  console.log('User from DB:', user);
  if (user && user.role !== 'ADMIN') {
    console.log('Fixing user role to ADMIN...');
    await prisma.user.update({
      where: { phone: '8090286983' },
      data: { role: 'ADMIN' }
    });
    console.log('Fixed!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
