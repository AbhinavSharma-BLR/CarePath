import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '@carepath/database';
import { memoryAppointments } from '../appointment/appointment.routes';
import { memoryDoctors } from '../doctor/doctor.routes';
import { broadcastAppointmentUpdate } from '../../lib/socket';
import { sendPushNotification } from '../../lib/firebase';

export interface QueueEntryRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  appointmentId: string;
  position: number;
  status: 'WAITING' | 'CALLING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  enteredAt: string;
  calledAt?: string;
}

// In-memory queue storage for development fallback
export const memoryQueueEntries: QueueEntryRecord[] = [];

// Helper to recalculate queue positions for a doctor
export function recalculateQueuePositions(doctorId: string) {
  const doctorWaitingEntries = memoryQueueEntries
    .filter(q => q.doctorId === doctorId && q.status === 'WAITING')
    .sort((a, b) => new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime());

  doctorWaitingEntries.forEach((entry, index) => {
    entry.position = index + 1;
  });
}

export async function queueRoutes(fastify: FastifyInstance) {
  
  // POST /queue/join - Patient joins virtual waiting queue for appointment
  const handleQueueJoin = async (request: any, reply: any) => {
    const user = request.user!;
    const { appointmentId } = request.body as { appointmentId: string };

    if (!appointmentId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Appointment ID is required to join queue.' });
    }

    const patientId = user.patientId || user.id;

    // 1. Resolve appointment from memory or DB
    let apt = memoryAppointments.find(a => a.id === appointmentId || a.id === appointmentId.replace(/^consult-/, ''));
    let dbApt = null;

    if (!apt) {
      try {
        dbApt = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
        });
      } catch (err) {}
    }

    // Guard: Prevent joining queue for completed appointment
    const currentAptStatus = apt?.status || dbApt?.status;
    if (currentAptStatus === 'COMPLETED' || currentAptStatus === 'ENDED') {
      console.log(`[CONSULTATION GUARD] Completed consultation cannot be joined: ${appointmentId}`);
      return reply.status(409).send({
        error: 'CONSULTATION_COMPLETED',
        message: 'This consultation has already been completed.',
      });
    }

    const resolvedDoctorId = apt?.doctorId || dbApt?.doctorId || 'doc-1';
    const resolvedDoctorName = apt?.doctorName || dbApt?.doctor?.user?.name || 'Dr. Ananya Sharma';
    const resolvedSpecialty = apt?.specialty || dbApt?.doctor?.specialty || 'Dermatology';
    const resolvedPatientName = user.name || apt?.patientName || dbApt?.patient?.user?.name || `Patient-${patientId.slice(-4)}`;

    // 2. Check if already in queue
    let existingEntry = memoryQueueEntries.find(q => q.appointmentId === appointmentId && q.status !== 'COMPLETED' && q.status !== 'CANCELLED');

    if (existingEntry) {
      recalculateQueuePositions(resolvedDoctorId);
      return reply.send({
        success: true,
        message: 'Already in queue',
        queueEntry: existingEntry,
      });
    }

    // 3. Create Queue Entry
    const doctorWaitingCount = memoryQueueEntries.filter(q => q.doctorId === resolvedDoctorId && q.status === 'WAITING').length;
    const newPosition = doctorWaitingCount + 1;

    const queueEntryId = `qe-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newQueueEntry: QueueEntryRecord = {
      id: queueEntryId,
      patientId,
      patientName: resolvedPatientName,
      doctorId: resolvedDoctorId,
      doctorName: resolvedDoctorName,
      specialty: resolvedSpecialty,
      appointmentId,
      position: newPosition,
      status: 'WAITING',
      enteredAt: new Date().toISOString(),
    };

    memoryQueueEntries.push(newQueueEntry);

    try {
      await (prisma as any).queueEntry.create({
        data: {
          id: queueEntryId,
          patientId,
          doctorId: resolvedDoctorId,
          appointmentId,
          position: newPosition,
          status: 'WAITING',
        },
      });
    } catch (err) {}

    // Broadcast socket event
    broadcastAppointmentUpdate({
      id: appointmentId,
      doctorId: resolvedDoctorId,
      patientId,
      status: 'WAITING_ROOM',
      queuePosition: newPosition,
    });

    console.log(`[QUEUE JOIN] Patient ${resolvedPatientName} joined queue for Doctor ${resolvedDoctorName} at Position #${newPosition}`);

    return reply.status(201).send({
      success: true,
      message: 'Joined virtual queue successfully',
      queueEntry: newQueueEntry,
    });
  };

  fastify.post('/join', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleQueueJoin);
  fastify.post('/queue/join', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleQueueJoin);

  // POST /queue/call - Doctor calls patient for consultation
  const handleQueueCall = async (request: any, reply: any) => {
    const user = request.user!;
    const { appointmentId, queueEntryId } = request.body as { appointmentId?: string; queueEntryId?: string };

    const doctorId = user.doctorId || 'doc-1';

    let queueEntry = memoryQueueEntries.find(q =>
      (appointmentId && q.appointmentId === appointmentId) || (queueEntryId && q.id === queueEntryId)
    );

    if (!queueEntry) {
      // Find first waiting patient for doctor
      queueEntry = memoryQueueEntries.find(q => q.doctorId === doctorId && q.status === 'WAITING');
    }

    if (!queueEntry) {
      return reply.status(404).send({ error: 'Not Found', message: 'No patient currently waiting in queue.' });
    }

    if (queueEntry.status === 'COMPLETED') {
      console.log(`[CONSULTATION GUARD] Cannot call completed consultation: ${queueEntry.appointmentId}`);
      return reply.status(409).send({
        error: 'CONSULTATION_COMPLETED',
        message: 'This consultation has already been completed.',
      });
    }

    queueEntry.status = 'CALLING';
    queueEntry.calledAt = new Date().toISOString();

    try {
      await (prisma as any).queueEntry.update({
        where: { id: queueEntry.id },
        data: { status: 'CALLING', calledAt: new Date() },
      });
    } catch (err) {}

    // Mock patient FCM token (in a real app, fetch from User model)
    const patientFcmToken = `mock-fcm-token-${queueEntry.patientId}`;
    
    // Send Push Notification
    await sendPushNotification(
      patientFcmToken,
      'It is your turn!',
      `Doctor ${user.name} is ready for your consultation.`,
      { appointmentId: queueEntry.appointmentId }
    );

    // Broadcast status change
    broadcastAppointmentUpdate({
      id: queueEntry.appointmentId,
      doctorId: queueEntry.doctorId,
      patientId: queueEntry.patientId,
      status: 'CALLING',
    });

    console.log(`[QUEUE CALL] Doctor ${user.name} called Patient ${queueEntry.patientName} for Appointment ${queueEntry.appointmentId}`);

    return reply.send({
      success: true,
      message: `Doctor called patient ${queueEntry.patientName}`,
      queueEntry,
    });
  };

  fastify.post('/call', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleQueueCall);
  fastify.post('/queue/call', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleQueueCall);

  // GET /queue/status?appointmentId=... - Fetch queue status & position
  const handleQueueStatus = async (request: any, reply: any) => {
    const { appointmentId } = request.query as { appointmentId?: string };

    if (!appointmentId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Appointment ID required' });
    }

    let queueEntry = memoryQueueEntries.find(q => q.appointmentId === appointmentId);

    if (!queueEntry) {
      try {
        const dbQe = await (prisma as any).queueEntry.findUnique({
          where: { appointmentId },
        });
        if (dbQe) {
          queueEntry = {
            id: dbQe.id,
            patientId: dbQe.patientId,
            patientName: 'Patient',
            doctorId: dbQe.doctorId,
            doctorName: 'Doctor',
            specialty: 'General Medicine',
            appointmentId: dbQe.appointmentId,
            position: dbQe.position,
            status: dbQe.status as any,
            enteredAt: dbQe.enteredAt.toISOString(),
            calledAt: dbQe.calledAt?.toISOString(),
          };
        }
      } catch (err) {}
    }

    if (!queueEntry) {
      return reply.status(404).send({ error: 'Not Found', message: 'No active queue entry found for appointment.' });
    }

    const doctorId = queueEntry.doctorId;
    recalculateQueuePositions(doctorId);

    const updatedEntry = memoryQueueEntries.find(q => q.id === queueEntry!.id) || queueEntry;
    const totalWaiting = memoryQueueEntries.filter(q => q.doctorId === doctorId && q.status === 'WAITING').length;

    return reply.send({
      success: true,
      queueEntry: updatedEntry,
      position: updatedEntry.position,
      totalWaiting,
      status: updatedEntry.status,
    });
  };

  fastify.get('/status', handleQueueStatus);
  fastify.get('/queue/status', handleQueueStatus);
}
