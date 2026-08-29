import { PrismaClient } from '@carepath/database';

const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRawUnsafe(`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`);
  console.log(result);
  await prisma.$disconnect();
}
check();
