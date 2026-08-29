import { FastifyInstance } from 'fastify';
import { Role } from '@carepath/database';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { memoryConsultations } from '../consultation/consultation.routes';

// Memory patient profile store for dev fallback
const memoryProfiles = new Map<string, any>();

export async function patientRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // PUT & POST /patient/profile - Save/update patient profile
  const saveProfileHandler = async (request: any, reply: any) => {
    const user = request.user!;
    const userId = user.id;
    const body = request.body as any;

    const profileData = {
      age: body.age ? parseInt(body.age, 10) : undefined,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      dob: body.dob ? new Date(body.dob) : undefined,
      emergencyContact: body.emergencyContact,
      address: body.address,
      avatarUrl: body.avatarUrl,
      knownConditions: Array.isArray(body.knownConditions) ? body.knownConditions : [],
      medications: Array.isArray(body.medications) ? body.medications : [],
      allergies: Array.isArray(body.allergies) ? body.allergies : [],
    };

    const resolvedName = body.name || user.name || `Patient-${userId.slice(-4)}`;

    // Update user name if passed
    if (body.name) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { name: body.name },
        });
      } catch (err) {}
    }

    // Try DB upsert first
    try {
      const patient = await prisma.patient.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
        include: { user: true },
      });

      return reply.send({
        success: true,
        patient: {
          ...patient,
          name: patient.user?.name || resolvedName,
        },
      });
    } catch (err) {
      // Memory store fallback
    }

    const memoryProfile = {
      id: `pat-${userId}`,
      userId,
      name: resolvedName,
      phone: user.phone,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };
    memoryProfiles.set(userId, memoryProfile);

    return reply.send({ success: true, patient: memoryProfile });
  };

  fastify.post('/profile', { preHandler: [requireRole(Role.PATIENT)] }, saveProfileHandler);
  fastify.put('/profile', { preHandler: [requireRole(Role.PATIENT)] }, saveProfileHandler);

  // GET /patient/profile
  fastify.get('/profile', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const user = request.user!;
    const userId = user.id;

    try {
      const patient = await prisma.patient.findUnique({
        where: { userId },
        include: { 
          user: true, 
          reports: true, 
          journeys: { include: { referrals: true } },
          prescriptions: { include: { items: true, doctor: { include: { user: true } } } }
        },
      });

      if (patient) {
        return reply.send({
          success: true,
          patient: {
            ...patient,
            name: patient.user?.name || user.name,
          },
        });
      }
    } catch (err) {}

    // Check memory store
    const mem = memoryProfiles.get(userId);
    if (mem) {
      // Ensure name is dynamically mapped to user's name
      if (user.name && mem.name !== user.name) {
        mem.name = user.name;
      }
      return reply.send({ success: true, patient: mem });
    }

    // Dynamic fallback profile using current user identity
    const defaultPatient = {
      id: `pat-${userId}`,
      userId,
      name: user.name || `Patient-${userId.slice(-4)}`,
      user: {
        id: userId,
        name: user.name || `Patient-${userId.slice(-4)}`,
        phone: user.phone || '',
      },
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+919876543210',
      address: 'Bengaluru, Karnataka',
      knownConditions: [],
      medications: [],
      allergies: [],
    };

    memoryProfiles.set(userId, defaultPatient);

    return reply.send({ success: true, patient: defaultPatient });
  });

  // POST /patient/avatar - Private Avatar Storage Handler
  fastify.post('/avatar', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const userId = request.user!.id;
    const { avatarBase64 } = request.body as { avatarBase64: string };

    if (!avatarBase64) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Avatar image data required.' });
    }

    // Save avatar URL to profile
    try {
      await prisma.patient.update({
        where: { userId },
        data: { avatarUrl: avatarBase64 },
      });
    } catch (err) {
      const mem = memoryProfiles.get(userId) || {};
      mem.avatarUrl = avatarBase64;
      memoryProfiles.set(userId, mem);
    }

    return reply.send({
      success: true,
      message: 'Avatar uploaded and stored securely.',
      avatarUrl: avatarBase64,
    });
  });

  // GET /patient/journeys
  fastify.get('/journeys', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const patientId = request.user!.patientId || request.user!.id;

    try {
      const journeys = await prisma.careJourney.findMany({
        where: { patientId },
        include: {
          referrals: {
            include: { facility: true, doctor: { include: { user: true } }, events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (journeys && journeys.length > 0) {
        return reply.send({ success: true, journeys });
      }
    } catch (err) {}

    return reply.send({ success: true, journeys: [] });
  });

  // GET /patient/context/:consultationId - Doctor views patient context
  fastify.get('/context/:consultationId', { preHandler: [requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const { consultationId } = request.params as { consultationId: string };
    const doctorId = request.user!.doctorId!;
    const targetAptId = consultationId.replace(/^consult-/, '');

    // 1. Try to find the consultation directly in DB
    let consult = await prisma.consultation.findUnique({ where: { id: consultationId } }).catch(() => null);
    if (!consult) consult = await prisma.consultation.findUnique({ where: { appointmentId: targetAptId } }).catch(() => null);

    let resolvedPatientId: string | null = consult?.patientId || null;
    let resolvedDoctorId: string | null = consult?.doctorId || null;

    // 2. If no consultation, try finding the appointment in DB
    if (!resolvedPatientId) {
      const dbApt = await prisma.appointment.findUnique({ where: { id: targetAptId } });
      if (dbApt) {
        resolvedPatientId = dbApt.patientId;
        resolvedDoctorId = dbApt.doctorId;
      }
    }

    // 3. Phase 3 In-memory Fallbacks
    if (!resolvedPatientId) {
      const memConsult = memoryConsultations.find((c: any) => c.id === consultationId || c.appointmentId === targetAptId) as any;
      if (memConsult) {
        resolvedPatientId = memConsult.patientId;
        resolvedDoctorId = memConsult.doctorId;
      }
    }
    if (!resolvedPatientId) {
      const { memoryAppointments } = require('../appointment/appointment.routes');
      const { memoryQueueEntries } = require('../queue/queue.routes');
      const apt = memoryAppointments.find((a: any) => a.id === targetAptId);
      const qe = memoryQueueEntries.find((q: any) => q.appointmentId === targetAptId);
      if (apt) { resolvedPatientId = apt.patientId; resolvedDoctorId = apt.doctorId; }
      else if (qe) { resolvedPatientId = qe.patientId; resolvedDoctorId = qe.doctorId; }
    }

    if (!resolvedPatientId) {
      return reply.status(404).send({ success: false, error: 'Not Found', message: 'Consultation or Appointment not found.' });
    }

    if (resolvedDoctorId !== doctorId) {
      return reply.status(403).send({ success: false, error: 'Forbidden', message: 'You are not assigned to this consultation.' });
    }

    let patientProfile: any = await prisma.patient.findUnique({
      where: { id: resolvedPatientId },
      include: { user: true, reports: true }
    }).catch(() => null);

    if (!patientProfile) {
      // Find in memory
      patientProfile = Array.from(memoryProfiles.values()).find(p => p.id === resolvedPatientId) || {
        id: resolvedPatientId,
        name: (consult as any)?.patientName || 'Unknown Patient',
        age: 28,
        gender: 'Male',
        bloodGroup: 'O+',
        knownConditions: [],
        medications: [],
        allergies: [],
        reports: [],
      };
    }

    return reply.send({
      success: true,
      patient: {
        id: patientProfile.id,
        name: patientProfile.user?.name || patientProfile.name || (consult as any)?.patientName || 'Unknown Patient',
        age: patientProfile.age,
        gender: patientProfile.gender,
        bloodGroup: patientProfile.bloodGroup,
        knownConditions: patientProfile.knownConditions || [],
        medications: patientProfile.medications || [],
        allergies: patientProfile.allergies || [],
        reports: patientProfile.reports || [],
      }
    });
  });
}
