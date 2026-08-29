const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const consultations = await prisma.consultation.findMany();
  for (const c of consultations) {
    const p = await prisma.patient.findUnique({ where: { id: c.patientId } });
    if (!p) {
      console.log(`Deleting consultation ${c.id} because patient ${c.patientId} does not exist`);
      await prisma.consultation.delete({ where: { id: c.id } });
    }
    const d = await prisma.doctor.findUnique({ where: { id: c.doctorId } });
    if (!d) {
      console.log(`Deleting consultation ${c.id} because doctor ${c.doctorId} does not exist`);
      await prisma.consultation.delete({ where: { id: c.id } });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
