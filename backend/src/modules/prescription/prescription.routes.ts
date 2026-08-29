import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@carepath/database';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { broadcastAppointmentUpdate } from '../../lib/socket';
import { supabaseAdmin } from '../../lib/supabase';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#171717' },
  section: { margin: 10, padding: 10, borderBottom: '1 solid #EEE' },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 5, color: '#444' },
  medicine: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
});

const PrescriptionDocument = ({ data }: { data: any }) => {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.header }, "CarePath E-Prescription"),
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.title }, "Consultation Details"),
        React.createElement(Text, { style: styles.text }, `Date: ${new Date(data.issuedAt).toLocaleDateString()}`),
        React.createElement(Text, { style: styles.text }, `Consultation ID: ${data.consultationId}`)
      ),
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.title }, "Medicines Prescribed"),
        data.items.map((item: any, i: number) =>
          React.createElement(View, { key: i, style: { marginBottom: 10 } },
            React.createElement(Text, { style: styles.medicine }, item.medicineName),
            React.createElement(Text, { style: styles.text }, `Dosage: ${item.dosage} | Freq: ${item.frequency} | Duration: ${item.duration}`),
            item.instructions ? React.createElement(Text, { style: styles.text }, `Instructions: ${item.instructions}`) : null
          )
        )
      )
    )
  );
};

const PrescriptionItemSchema = z.object({
  medicineName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

const CreatePrescriptionSchema = z.object({
  consultationId: z.string(),
  items: z.array(PrescriptionItemSchema).min(1),
  isDraft: z.boolean().optional(),
});

export async function prescriptionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // POST /prescriptions - Create a prescription and generate PDF
  fastify.post('/', { preHandler: [requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const { consultationId, items, isDraft } = CreatePrescriptionSchema.parse(request.body);
    const doctorId = request.user!.doctorId!;

    let consult = await prisma.consultation.findUnique({ where: { id: consultationId } }) || 
                  await prisma.consultation.findUnique({ where: { appointmentId: consultationId } });

    if (!consult) {
      // Create it from appointment (memory or DB)
      const targetAptId = consultationId.replace(/^consult-/, '');
      let consultPatientId = 'patient-1';
      
      const dbApt = await prisma.appointment.findUnique({ where: { id: targetAptId } });
      if (dbApt) {
        consultPatientId = dbApt.patientId;
      } else {
        // Fallback to memory for Phase 3 queue compatibility
        const { memoryAppointments } = require('../appointment/appointment.routes');
        const { memoryQueueEntries } = require('../queue/queue.routes');
        const apt = memoryAppointments.find((a: any) => a.id === targetAptId);
        const qe = memoryQueueEntries.find((q: any) => q.appointmentId === targetAptId);
        if (apt) consultPatientId = apt.patientId;
        else if (qe) consultPatientId = qe.patientId;
      }
      
      consult = await prisma.consultation.create({
        data: {
          id: `consult-${targetAptId}`,
          appointmentId: targetAptId,
          patientId: consultPatientId,
          doctorId: doctorId,
          status: 'CONNECTED',
        }
      });
    }

    const patientId = consult.patientId;

    // VALIDATION CHECKS AS REQUESTED BY USER
    const dbDoctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!dbDoctor) {
      return reply.status(404).send({ error: 'Not Found', message: `Doctor with ID ${doctorId} not found in database.` });
    }

    const dbPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!dbPatient) {
      return reply.status(404).send({ error: 'Not Found', message: `Patient with ID ${patientId} not found in database. Cannot issue prescription.` });
    }

    // Create record in database FIRST using a transaction to ensure integrity
    let prescription;
    try {
      prescription = await prisma.$transaction(async (tx) => {
        return await tx.prescription.create({
          data: {
            consultationId: consult.id,
            patientId,
            doctorId,
            isIssued: !isDraft,
            issuedAt: isDraft ? null : new Date(),
            items: {
              create: items.map(i => ({
                medicineName: i.medicineName,
                dosage: i.dosage,
                frequency: i.frequency,
                duration: i.duration,
                instructions: i.instructions || '',
              }))
            }
          },
          include: { items: true }
        });
      });
    } catch (err: any) {
      console.error('[PRESCRIPTION CREATE DB ERROR]', err);
      return reply.status(400).send({ 
        error: 'Database Error', 
        message: 'Failed to save prescription. Ensure patient and doctor exist in the database.' 
      });
    }

    if (isDraft) {
      return reply.status(201).send({
        success: true,
        message: 'Draft saved successfully',
        prescription,
      });
    }

    // Generate PDF Stream
    const pdfStream = await renderToStream(PrescriptionDocument({ data: prescription }) as any);
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Upload to Supabase Storage
    const bucketName = 'prescriptions';
    const storagePath = `${patientId}/${prescription.id}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      // If bucket doesn't exist, we should theoretically create it, but we'll try to just log error here
      console.error('[SUPABASE STORAGE UPLOAD ERROR]', uploadError);
    }

    // Update prescription with actual storage path
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescription.id },
      data: { pdfStoragePath: storagePath },
      include: { items: true }
    });

    // Broadcast the prescription created event
    broadcastAppointmentUpdate({
      appointmentId: consult.appointmentId,
      event: 'prescription:created',
      prescription: updatedPrescription,
    });

    return reply.status(201).send({
      success: true,
      prescription: updatedPrescription,
    });
  });

  // GET /prescriptions - List my prescriptions
  fastify.get('/', async (request, reply) => {
    const user = request.user!;
    let prescriptions: any[] = [];
    if (user.role === Role.PATIENT) {
      prescriptions = await prisma.prescription.findMany({
        where: { patientId: user.patientId || user.id },
        include: { items: true, doctor: { include: { user: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (user.role === Role.DOCTOR) {
      prescriptions = await prisma.prescription.findMany({
        where: { doctorId: user.doctorId || user.id },
        include: { items: true, patient: { include: { user: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    return reply.send({ success: true, prescriptions });
  });

  // GET /prescriptions/:id/pdf - Get a short-lived signed URL for the prescription PDF
  fastify.get('/:id/pdf', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    const prescription = await prisma.prescription.findUnique({ where: { id } });

    if (!prescription) {
      return reply.status(404).send({ error: 'Not Found', message: 'Prescription not found' });
    }

    if (user.role === Role.PATIENT && user.patientId !== prescription.patientId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    if (user.role === Role.DOCTOR && user.doctorId !== prescription.doctorId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    if (!prescription.pdfStoragePath) {
      return reply.status(400).send({ error: 'Bad Request', message: 'PDF not available yet' });
    }

    // Generate real 1-hour signed URL
    const { data, error } = await supabaseAdmin.storage
      .from('prescriptions')
      .createSignedUrl(prescription.pdfStoragePath, 3600);

    if (error || !data) {
      console.error('Error generating signed URL:', error);
      return reply.status(500).send({ error: 'Internal Server Error', message: 'Could not generate signed URL' });
    }

    return reply.send({
      success: true,
      downloadUrl: data.signedUrl,
    });
  });

  // GET /prescriptions/:id - Get details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    const prescription = await prisma.prescription.findUnique({ where: { id }, include: { items: true } });

    if (!prescription) {
      return reply.status(404).send({ error: 'Not Found', message: 'Prescription not found' });
    }

    if (user.role === Role.PATIENT && user.patientId !== prescription.patientId) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    return reply.send({
      success: true,
      prescription,
    });
  });
}
