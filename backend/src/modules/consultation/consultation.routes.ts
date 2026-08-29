import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '@carepath/database';
import { memoryAppointments } from '../appointment/appointment.routes';
import { memoryQueueEntries } from '../queue/queue.routes';
import { broadcastAppointmentUpdate, emitToRoom } from '../../lib/socket';

export interface ConsultationRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  status: 'WAITING' | 'CALLING' | 'CONNECTING' | 'CONNECTED' | 'ENDED' | 'COMPLETED';
  startedAt: string;
  endedAt?: string;
}

export interface MessageRecord {
  id: string;
  consultationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  content: string;
  timestamp: string;
}

export const memoryConsultations: ConsultationRecord[] = [];
export const memoryMessages: MessageRecord[] = [];

export async function consultationRoutes(fastify: FastifyInstance) {
  
  // GET /consultations/:id - Get Consultation Details
  const handleGetConsultation = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };

    let consult = memoryConsultations.find(c => c.id === id || c.appointmentId === id);

    if (!consult) {
      // Find appointment or queue entry to derive consultation
      const apt = memoryAppointments.find(a => a.id === id || a.id === id.replace(/^consult-/, ''));
      const qe = memoryQueueEntries.find(q => q.appointmentId === id || q.id === id || q.appointmentId === id.replace(/^consult-/, ''));
      
      if (apt || qe) {
        consult = {
          id: `consult-${apt?.id || qe?.appointmentId}`,
          appointmentId: apt?.id || qe?.appointmentId || id,
          patientId: apt?.patientId || qe?.patientId || 'patient-1',
          patientName: apt?.patientName || qe?.patientName || 'Abhinav Sharma',
          doctorId: apt?.doctorId || qe?.doctorId || 'doc-1',
          doctorName: apt?.doctorName || qe?.doctorName || 'Dr. Ananya Sharma',
          specialty: apt?.specialty || qe?.specialty || 'Dermatology',
          status: (qe?.status === 'COMPLETED' || apt?.status === 'COMPLETED') ? 'COMPLETED' : 'CONNECTED',
          startedAt: qe?.enteredAt || new Date().toISOString(),
          endedAt: (qe?.status === 'COMPLETED' || apt?.status === 'COMPLETED') ? new Date().toISOString() : undefined,
        };
        memoryConsultations.push(consult);
      }
    }

    if (!consult) {
      try {
        const dbConsult = await (prisma as any).consultation.findFirst({
          where: { OR: [{ id }, { appointmentId: id }] },
        });
        if (dbConsult) {
          consult = {
            id: dbConsult.id,
            appointmentId: dbConsult.appointmentId,
            patientId: dbConsult.patientId,
            patientName: 'Patient',
            doctorId: dbConsult.doctorId,
            doctorName: 'Dr. Ananya Sharma',
            specialty: 'Dermatology',
            status: dbConsult.status as any,
            startedAt: dbConsult.startedAt.toISOString(),
            endedAt: dbConsult.endedAt?.toISOString(),
          };
        }
      } catch (err) {}
    }

    if (!consult) {
      return reply.status(404).send({ error: 'Not Found', message: 'Consultation record not found.' });
    }

    return reply.send({
      success: true,
      consultation: consult,
    });
  };

  fastify.get('/:id', { preHandler: [authenticate] }, handleGetConsultation);
  fastify.get('/consultations/:id', { preHandler: [authenticate] }, handleGetConsultation);

  // GET /consultations/:id/messages - Get Chat History
  const handleGetMessages = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };

    let messages = memoryMessages.filter(m => m.consultationId === id);

    try {
      const dbMessages = await (prisma as any).message.findMany({
        where: { consultationId: id },
        orderBy: { timestamp: 'asc' },
      });

      if (dbMessages && dbMessages.length > 0) {
        messages = dbMessages.map((m: any) => ({
          id: m.id,
          consultationId: m.consultationId,
          senderId: m.senderId,
          senderName: m.senderName,
          senderRole: m.senderRole as any,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));
      }
    } catch (err) {}

    return reply.send({
      success: true,
      messages,
    });
  };

  fastify.get('/:id/messages', { preHandler: [authenticate] }, handleGetMessages);
  fastify.get('/consultations/:id/messages', { preHandler: [authenticate] }, handleGetMessages);

  // POST /consultations/:id/messages - Save Chat Message
  const handleSendMessage = async (request: any, reply: any) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };

    if (!content || !content.trim()) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Message content cannot be empty.' });
    }

    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const senderRole = user.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
    const senderName = user.name || (senderRole === 'DOCTOR' ? 'Doctor' : 'Patient');

    const newMessage: MessageRecord = {
      id: messageId,
      consultationId: id,
      senderId: user.id,
      senderName,
      senderRole,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    memoryMessages.push(newMessage);

    try {
      await (prisma as any).message.create({
        data: {
          id: messageId,
          consultationId: id,
          senderId: user.id,
          senderName,
          senderRole,
          content: content.trim(),
        },
      });
    } catch (err) {}

    // Broadcast chat message over Socket.io consultation room
    emitToRoom(`consultation:${id}`, 'chat:message', newMessage);
    const targetAptId = id.replace(/^consult-/, '');
    if (targetAptId !== id) {
      emitToRoom(`consultation:${targetAptId}`, 'chat:message', newMessage);
    }

    // Broadcast chat update event via legacy socket
    broadcastAppointmentUpdate({
      id,
      appointmentId: id,
      event: 'chat:message',
      message: newMessage,
    });

    console.log(`[CHAT MESSAGE] Consultation ${id} | ${senderName} (${senderRole}): ${content.trim()}`);

    return reply.status(201).send({
      success: true,
      message: newMessage,
    });
  };

  fastify.post('/:id/messages', { preHandler: [authenticate] }, handleSendMessage);
  fastify.post('/consultations/:id/messages', { preHandler: [authenticate] }, handleSendMessage);

  // POST /consultations/:id/end - Doctor/Patient Ends Consultation Session
  const handleEndConsultation = async (request: any, reply: any) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const targetAptId = id.replace(/^consult-/, '');

    // Update memory store
    const consultIndex = memoryConsultations.findIndex(c => c.id === id || c.appointmentId === id || c.appointmentId === targetAptId);
    if (consultIndex !== -1) {
      memoryConsultations[consultIndex].status = 'COMPLETED';
      memoryConsultations[consultIndex].endedAt = new Date().toISOString();
    } else {
      memoryConsultations.push({
        id: `consult-${targetAptId}`,
        appointmentId: targetAptId,
        patientId: 'patient-1',
        patientName: 'Abhinav Sharma',
        doctorId: 'doc-1',
        doctorName: 'Dr. Ananya Sharma',
        specialty: 'Dermatology',
        status: 'COMPLETED',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
      });
    }

    // Update queue entry
    const qe = memoryQueueEntries.find(q => q.appointmentId === id || q.id === id || q.appointmentId === targetAptId);
    if (qe) {
      qe.status = 'COMPLETED';
    }

    // Update appointment status
    const apt = memoryAppointments.find(a => a.id === id || a.id === targetAptId);
    if (apt) {
      apt.status = 'COMPLETED';
      broadcastAppointmentUpdate(apt);
    }

    try {
      await (prisma as any).consultation.updateMany({
        where: { OR: [{ id }, { appointmentId: id }, { appointmentId: targetAptId }] },
        data: { status: 'COMPLETED', endedAt: new Date() },
      });
      await prisma.appointment.updateMany({
        where: { OR: [{ id }, { id: targetAptId }] },
        data: { status: 'COMPLETED' },
      });
    } catch (err) {}

    const endedBy = user.name || (user.role === 'DOCTOR' ? 'Doctor' : 'Patient');
    const endPayload = {
      id: targetAptId,
      consultationId: id,
      appointmentId: targetAptId,
      status: 'COMPLETED',
      endedBy,
      timestamp: new Date().toISOString(),
      event: 'consultation_ended',
    };

    // Broadcast consultation_ended over Socket.io room
    emitToRoom(`consultation:${id}`, 'consultation:ended', endPayload);
    emitToRoom(`consultation:${id}`, 'consultation_ended', endPayload);
    if (targetAptId !== id) {
      emitToRoom(`consultation:${targetAptId}`, 'consultation:ended', endPayload);
      emitToRoom(`consultation:${targetAptId}`, 'consultation_ended', endPayload);
    }

    // Broadcast real-time consultation completion event
    broadcastAppointmentUpdate(endPayload);

    console.log(`[CONSULTATION ENDED] Consultation ${id} ended by ${user.name || user.role}`);

    return reply.send({
      success: true,
      message: 'Consultation ended successfully.',
      status: 'COMPLETED',
    });
  };

  fastify.post('/:id/end', { preHandler: [authenticate] }, handleEndConsultation);

  // PATCH /consultations/:id/notes - Save Clinical Notes
  const handlePatchNotes = async (request: any, reply: any) => {
    const user = request.user!;
    if (user.role !== 'DOCTOR') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Only doctors can update clinical notes.' });
    }
    const { id } = request.params as { id: string };
    const { notes } = request.body as { notes: string };

    const targetAptId = id.replace(/^consult-/, '');

    try {
      let dbConsults = await (prisma as any).consultation.updateMany({
        where: { OR: [{ id }, { appointmentId: id }, { appointmentId: targetAptId }] },
        data: { notes },
      });

      if (dbConsults.count === 0) {
        // Find from memory or DB appointment to create it
        let patientId = 'patient-1';
        let doctorId = user.doctorId || 'doc-1';
        
        const apt = memoryAppointments.find(a => a.id === id || a.id === targetAptId);
        const qe = memoryQueueEntries.find(q => q.appointmentId === targetAptId || q.id === id);
        
        if (apt) { patientId = apt.patientId; doctorId = apt.doctorId; }
        else if (qe) { patientId = qe.patientId; doctorId = qe.doctorId; }
        else {
          const dbApt = await prisma.appointment.findUnique({ where: { id: targetAptId } });
          if (dbApt) { patientId = dbApt.patientId; doctorId = dbApt.doctorId; }
        }

        // Create the consultation safely
        try {
          await (prisma as any).consultation.create({
            data: {
              id: `consult-${targetAptId}`,
              appointmentId: targetAptId,
              patientId,
              doctorId,
              status: 'CONNECTED',
              notes,
            }
          });
        } catch (e: any) {
          console.error('[NOTES PATCH DB ERROR]', e);
          return reply.status(400).send({ 
            error: 'Database Error', 
            message: 'Failed to update notes in DB. Ensure patient and doctor exist.' 
          });
        }
      }
    } catch (err: any) {
      console.error('[NOTES PATCH ERROR]', err);
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to update notes in DB.' });
    }

    return reply.send({
      success: true,
      message: 'Notes saved successfully.',
    });
  };

  fastify.patch('/:id/notes', { preHandler: [authenticate] }, handlePatchNotes);

  // GET /consultations/history
  fastify.get('/history', { preHandler: [authenticate, requireRole(Role.PATIENT, Role.DOCTOR)] }, async (request: any, reply: any) => {
    const patientId = request.user!.role === Role.PATIENT ? request.user!.patientId : (request.query as any)?.patientId;

    if (!patientId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Patient ID required' });
    }

    try {
      // Fetch all completed appointments/consultations for this patient
      const history = await prisma.appointment.findMany({
        where: {
          patientId,
          status: 'COMPLETED'
        },
        include: {
          doctor: {
            include: { user: true }
          },
          facility: true,
        },
        orderBy: {
          date: 'desc'
        }
      });

      const appointmentIds = history.map((h: any) => h.id);
      const consultations = await prisma.consultation.findMany({
        where: { appointmentId: { in: appointmentIds } },
        include: { prescriptions: true }
      });

      const mergedHistory = history.map((h: any) => ({
        ...h,
        consultation: consultations.find((c: any) => c.appointmentId === h.id) || null
      }));

      return reply.send({ success: true, history: mergedHistory });
    } catch (err: any) {
      console.error('[HISTORY FETCH ERROR]', err);
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to fetch history' });
    }
  });
}
