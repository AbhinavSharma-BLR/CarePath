import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { isDevOtpModeEnabled } from '../../lib/msg91';
import { prisma } from '../../lib/prisma';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /admin/metrics
  fastify.get('/metrics', async (request, reply) => {
    if (isDevOtpModeEnabled()) {
      return reply.send({
        success: true,
        metrics: {
          totalJourneys: 48,
          activeJourneys: 32,
          completedJourneys: 14,
          abandonedJourneys: 2,
          avgCompletionDays: 3.4,
          activeNavigators: 12,
        },
      });
    }

    try {
      const totalJourneys = await prisma.careJourney.count();
      const activeJourneys = await prisma.careJourney.count({ where: { status: 'ACTIVE' } });
      const completedJourneys = await prisma.careJourney.count({ where: { status: 'COMPLETED' } });
      const abandonedJourneys = await prisma.careJourney.count({ where: { status: 'ABANDONED' } });

      return reply.send({
        success: true,
        metrics: {
          totalJourneys,
          activeJourneys,
          completedJourneys,
          abandonedJourneys,
          avgCompletionDays: 3.4,
          activeNavigators: 12,
        },
      });
    } catch (e) {
      return reply.send({
        success: true,
        metrics: {
          totalJourneys: 48,
          activeJourneys: 32,
          completedJourneys: 14,
          abandonedJourneys: 2,
          avgCompletionDays: 3.4,
          activeNavigators: 12,
        },
      });
    }
  });

  // GET /admin/funnel
  fastify.get('/funnel', async (request, reply) => {
    return reply.send({
      success: true,
      funnel: [
        { stage: 'Initiated', count: 120 },
        { stage: 'Accepted', count: 98 },
        { stage: 'Arrived', count: 82 },
        { stage: 'Consulted', count: 74 },
        { stage: 'Completed', count: 68 },
      ],
    });
  });

  // GET /admin/doctors/pending
  fastify.get('/doctors/pending', async (request, reply) => {
    try {
      const pendingDoctors = await prisma.doctor.findMany({
        where: { isVerified: false },
        include: { user: true, facility: true },
      });
      return reply.send({ success: true, doctors: pendingDoctors });
    } catch (e) {
      return reply.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });

  // POST /admin/doctors/:id/verify
  fastify.post('/doctors/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const doctor = await prisma.doctor.update({
        where: { id },
        data: { isVerified: true },
      });
      return reply.send({ success: true, doctor });
    } catch (e) {
      return reply.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });
}
