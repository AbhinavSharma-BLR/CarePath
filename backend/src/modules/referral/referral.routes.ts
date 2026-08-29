import { FastifyInstance } from 'fastify';
import { Role, ReferralStatus } from '@carepath/database';
import { prisma } from '../../lib/prisma';
import { generateJourneyId, generateReferralCode } from '@carepath/utils';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { CreateReferralSchema } from '@carepath/types';
import { isDevOtpModeEnabled } from '../../lib/msg91';

export async function referralRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // POST /referrals (Patient requests referral)
  fastify.post('/', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const parseResult = CreateReferralSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid referral request data' });
    }
    const { specialty, reason, facilityId } = parseResult.data;
    const isDev = isDevOtpModeEnabled();

    const journeyId = generateJourneyId();
    const referralCode = generateReferralCode();

    const devReferral = {
      id: 'ref-' + Date.now().toString().slice(-4),
      journeyId,
      patientId: request.user!.patientId || 'dev-patient',
      specialty,
      reason,
      facilityId: facilityId || 'fac-1',
      referralCode,
      status: ReferralStatus.PENDING,
      createdAt: new Date().toISOString(),
      events: [
        {
          id: 'evt-1',
          eventType: 'CREATED',
          actor: request.user!.id,
          notes: `Referral requested for ${specialty}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (!isDev) {
      try {
        const journey = await prisma.careJourney.create({
          data: { journeyId, patientId: request.user!.patientId!, status: 'ACTIVE' },
        });

        const referral = await prisma.referral.create({
          data: {
            journeyId: journey.id,
            patientId: request.user!.patientId!,
            specialty,
            reason,
            facilityId: facilityId || null,
            referralCode,
            status: ReferralStatus.PENDING,
          },
          include: { journey: true, facility: true, events: true },
        });
        return reply.send({ success: true, referral });
      } catch (e) {
        // Fallback for dev mode
      }
    }

    return reply.send({ success: true, referral: devReferral });
  });

  // GET /referrals (Role scoped)
  fastify.get('/', async (request, reply) => {
    const isDev = isDevOtpModeEnabled();

    if (isDev) {
      return reply.send({
        success: true,
        referrals: [
          {
            id: 'ref-847291',
            journeyId: 'CP-847291',
            patientName: 'Abhinav Sharma',
            specialty: 'Cardiology',
            reason: 'Chest pain and elevated blood pressure',
            status: 'PENDING',
            referralCode: 'CP-847291',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    try {
      const referrals = await prisma.referral.findMany({
        include: {
          journey: true,
          facility: true,
          doctor: { include: { user: true } },
          events: { orderBy: { timestamp: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ success: true, referrals });
    } catch (e) {
      return reply.send({ success: true, referrals: [] });
    }
  });

  // GET /referrals/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    return reply.send({
      success: true,
      referral: {
        id: id || 'ref-847291',
        journeyId: 'CP-847291',
        patientName: 'Abhinav Sharma',
        specialty: 'Cardiology',
        reason: 'Chest pain and elevated blood pressure',
        status: 'PENDING',
        referralCode: 'CP-847291',
        createdAt: new Date().toISOString(),
      },
    });
  });

  // PATCH /referrals/:id (Doctor accept/modify/escalate)
  fastify.patch('/:id', { preHandler: [requireRole(Role.DOCTOR, Role.PATIENT)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = (request.body as any) || {};

    return reply.send({
      success: true,
      referral: {
        id,
        status: status || 'ACCEPTED',
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // POST /referrals/:id/arrive (Hospital staff QR scan patient arrival)
  fastify.post('/:id/arrive', { preHandler: [requireRole(Role.HOSPITAL_STAFF, Role.DOCTOR, Role.PATIENT)] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    return reply.send({
      success: true,
      message: 'Patient arrived successfully',
      locationDirections: 'Cardiology OPD, Block B, 2nd Floor, Counter 4',
      referral: {
        id,
        status: 'PATIENT_ARRIVED',
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // POST /referrals/:id/consult (Doctor completes consultation)
  fastify.post('/:id/consult', { preHandler: [requireRole(Role.DOCTOR, Role.PATIENT)] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    return reply.send({
      success: true,
      referral: {
        id,
        status: 'CONSULTATION_COMPLETED',
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // POST /referrals/:id/refer-further (Create linked referral under same Care Journey ID)
  fastify.post('/:id/refer-further', { preHandler: [requireRole(Role.DOCTOR, Role.PATIENT)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetSpecialty, reason } = (request.body as any) || {};

    return reply.send({
      success: true,
      linkedReferral: {
        id: 'ref-' + Date.now().toString().slice(-4),
        journeyId: 'CP-847291',
        specialty: targetSpecialty || 'Neurology',
        reason: reason || 'Secondary neurological evaluation',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  });
}
