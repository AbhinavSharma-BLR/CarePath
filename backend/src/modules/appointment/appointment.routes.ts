import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '@carepath/database';
import { broadcastAppointmentUpdate } from '../../lib/socket';
import { memoryDoctors } from '../doctor/doctor.routes';

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: string; // 'CONFIRMED' | 'CALLING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED'
  notes?: string;
  createdAt: string;
}

// In-memory store for appointments in dev mode
export const memoryAppointments: AppointmentRecord[] = [];

export async function appointmentRoutes(fastify: FastifyInstance) {
  
  // Shared Booking Handler for POST /appointments and POST /appointment
  const handleBookAppointment = async (request: any, reply: any) => {
    const { doctorId, date, timeSlot, notes } = request.body as {
      doctorId: string;
      date: string; // YYYY-MM-DD
      timeSlot: string; // e.g. "10:30 AM"
      notes?: string;
    };

    const user = request.user!;
    const patientId = user.patientId || user.id;
    const patientName = user.name || `Patient-${patientId.slice(-4)}`;
    const patientPhone = user.phone || '';

    if (!doctorId || !date || !timeSlot) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Doctor ID, date, and time slot are required.',
      });
    }

    // 1. Double Booking Check (Memory Store)
    const isMemoryBooked = memoryAppointments.some(
      a => a.doctorId === doctorId && a.date === date && a.timeSlot === timeSlot && a.status !== 'CANCELLED'
    );

    if (isMemoryBooked) {
      return reply.status(409).send({
        error: 'Slot Unavailable',
        message: 'This time slot has already been booked by another patient. Please choose another slot.',
      });
    }

    // 2. Double Booking Check (Prisma DB)
    try {
      const existingDbAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          date: new Date(date),
          timeSlot,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingDbAppointment) {
        return reply.status(409).send({
          error: 'Slot Unavailable',
          message: 'This time slot has already been booked by another patient. Please choose another slot.',
        });
      }
    } catch (err) {}

    // Resolve Doctor details
    const docObj = memoryDoctors.find(d => d.id === doctorId);
    const resolvedDoctorName = docObj?.name || (doctorId === 'doc-2' ? 'Dr. Rahul Mehta' : 'Dr. Ananya Sharma');
    const resolvedSpecialty = docObj?.specialty || (doctorId === 'doc-2' ? 'Cardiology' : 'Dermatology');

    // 3. Create appointment object
    const appointmentId = `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newAppointment: AppointmentRecord = {
      id: appointmentId,
      patientId,
      patientName,
      patientPhone,
      doctorId,
      doctorName: resolvedDoctorName,
      specialty: resolvedSpecialty,
      date,
      timeSlot,
      status: 'CONFIRMED',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    memoryAppointments.push(newAppointment);

    try {
      await prisma.appointment.create({
        data: {
          id: appointmentId,
          patientId,
          doctorId,
          date: new Date(date),
          timeSlot,
          status: 'CONFIRMED',
          notes,
        },
      });
    } catch (err) {}

    // Real-time notification to Doctor
    broadcastAppointmentUpdate(newAppointment);

    console.log(`[APPOINTMENT CREATED] ID: ${appointmentId}, Patient: ${patientName}, Doctor: ${resolvedDoctorName}, Date: ${date}, Slot: ${timeSlot}`);

    return reply.status(201).send({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment,
    });
  };

  // Register both plural /appointments and singular /appointment POST endpoints
  fastify.post('/appointments', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleBookAppointment);
  fastify.post('/appointment', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleBookAppointment);

  // POST /appointments/followup - Doctor books a follow-up appointment
  fastify.post('/appointments/followup', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const { patientId, date, timeSlot, notes } = request.body as { patientId: string; date: string; timeSlot: string; notes?: string };
    const doctorId = request.user!.doctorId!;

    if (!patientId || !date || !timeSlot) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Patient ID, date, and time slot are required.' });
    }

    const appointmentId = `apt-followup-${Date.now()}`;

    try {
      const newApt = await prisma.appointment.create({
        data: {
          id: appointmentId,
          patientId,
          doctorId,
          date: new Date(date),
          timeSlot,
          status: 'CONFIRMED',
          notes: notes || 'Follow-up appointment',
        },
      });

      return reply.status(201).send({
        success: true,
        message: 'Follow-up appointment booked successfully',
        appointment: newApt,
      });
    } catch (err) {
      console.error('[FOLLOWUP CREATE ERROR]', err);
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Failed to create follow-up appointment' });
    }
  });

  // Shared List Handler for Patient Appointments
  const handleGetPatientAppointments = async (request: any, reply: any) => {
    const user = request.user!;
    const patientId = user.patientId || user.id;

    try {
      const dbAppointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { patientId },
            { patientId: user.id },
            { patient: { user: { phone: user.phone } } },
          ],
        },
        include: { doctor: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (dbAppointments && dbAppointments.length > 0) {
        return reply.send({
          success: true,
          appointments: dbAppointments.map(a => ({
            id: a.id,
            patientId: a.patientId,
            patientName: user.name || 'Patient',
            patientPhone: user.phone || '',
            doctorId: a.doctorId,
            doctorName: a.doctor?.user?.name || 'CarePath Doctor',
            specialty: a.doctor?.specialty || 'General Medicine',
            date: a.date.toISOString().split('T')[0],
            timeSlot: a.timeSlot,
            status: a.status,
            notes: a.notes || undefined,
            createdAt: a.createdAt.toISOString(),
          })),
        });
      }
    } catch (err) {}

    const userAppointments = memoryAppointments.filter(
      a => a.patientId === patientId || a.patientId === user.id || (user.phone && a.patientPhone === user.phone)
    );
    return reply.send({ success: true, appointments: userAppointments });
  };

  // Register GET endpoints for patient appointments
  fastify.get('/appointments', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleGetPatientAppointments);
  fastify.get('/appointment', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleGetPatientAppointments);
  fastify.get('/appointments/my-appointments', { preHandler: [authenticate, requireRole(Role.PATIENT)] }, handleGetPatientAppointments);

  // Shared List Handler for Doctor Appointments
  const handleGetDoctorAppointments = async (request: any, reply: any) => {
    const user = request.user!;
    const doctorId = user.doctorId || 'doc-1';

    try {
      const dbAppointments = await prisma.appointment.findMany({
        where: { doctorId },
        include: { patient: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (dbAppointments && dbAppointments.length > 0) {
        return reply.send({
          success: true,
          appointments: dbAppointments.map(a => ({
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient?.user?.name || 'Patient',
            patientPhone: a.patient?.user?.phone || '',
            doctorId: a.doctorId,
            doctorName: user.name || 'Dr. Ananya Sharma',
            specialty: 'Dermatology',
            date: a.date.toISOString().split('T')[0],
            timeSlot: a.timeSlot,
            status: a.status,
            notes: a.notes || undefined,
            createdAt: a.createdAt.toISOString(),
          })),
        });
      }
    } catch (err) {}

    const docAppointments = memoryAppointments.filter(a => a.doctorId === doctorId || doctorId === 'doc-1');
    return reply.send({ success: true, appointments: docAppointments });
  };

  // Register GET endpoints for doctor appointments
  fastify.get('/doctor/appointments', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleGetDoctorAppointments);
  fastify.get('/appointments/doctor-appointments', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleGetDoctorAppointments);

  // Shared Status Update Handler
  const handleUpdateStatus = async (request: any, reply: any) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ['CONFIRMED', 'CALLING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid appointment status' });
    }

    const aptIndex = memoryAppointments.findIndex(a => a.id === id);
    if (aptIndex !== -1) {
      memoryAppointments[aptIndex].status = status;
    }

    try {
      await prisma.appointment.update({
        where: { id },
        data: { status },
      });
    } catch (err) {}

    const updatedApt = aptIndex !== -1 ? memoryAppointments[aptIndex] : { id, status };
    broadcastAppointmentUpdate(updatedApt);

    return reply.send({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: updatedApt,
    });
  };

  // Register PUT status endpoints
  fastify.put('/appointments/:id/status', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleUpdateStatus);
  fastify.put('/appointment/:id/status', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, handleUpdateStatus);
}
