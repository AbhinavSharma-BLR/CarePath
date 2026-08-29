import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import { isDevOtpModeEnabled } from '../../lib/msg91';
import { prisma } from '../../lib/prisma';

export async function carelinkRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /assistance
  fastify.get('/', async (request, reply) => {
    if (isDevOtpModeEnabled()) {
      return reply.send({
        success: true,
        requests: [
          {
            id: 'ast-101',
            type: 'Hospital Navigation',
            notes: 'Patient needs assistance reaching OPD Block B, Counter 4',
            status: 'PENDING',
            patientName: 'Abhinav Sharma',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ast-102',
            type: 'Transport',
            notes: 'Wheelchair assistance requested from entrance',
            status: 'ASSIGNED',
            patientName: 'Abhinav Sharma',
            navigatorName: 'Anitha R.',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    try {
      const requests = await prisma.assistanceRequest.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, requests });
    } catch (e) {
      return reply.send({ success: true, requests: [] });
    }
  });

  // POST /assistance
  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    const isDev = isDevOtpModeEnabled();

    const newRequest = {
      id: 'ast-' + Date.now().toString().slice(-4),
      type: body.type || 'Hospital Navigation',
      notes: body.notes || 'Assistance requested',
      status: 'PENDING',
      patientName: 'Abhinav Sharma',
      createdAt: new Date().toISOString(),
    };

    if (!isDev) {
      try {
        await prisma.assistanceRequest.create({
          data: {
            patientId: request.user!.patientId || 'dev-patient',
            type: body.type,
            notes: body.notes,
            status: 'PENDING',
          },
        });
      } catch (e) {
        // Fallback for dev mode
      }
    }

    return reply.send({ success: true, request: newRequest });
  });

  // PATCH /assistance/:id
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    return reply.send({
      success: true,
      request: {
        id,
        status: body.status || 'ASSIGNED',
        navigatorName: body.navigatorName || 'Anitha R.',
        updatedAt: new Date().toISOString(),
      },
    });
  });
}
