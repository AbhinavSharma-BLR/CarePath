import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@carepath/database';
import { prisma } from '../../lib/prisma';
import { generatePresignedUploadUrl, generatePresignedDownloadUrl } from '../../lib/s3';
import { generateMockSummary } from '@carepath/ai';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const RequestUploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  reportType: z.enum(['ECG', 'BLOOD_REPORT', 'XRAY', 'PRESCRIPTION', 'OTHER']),
});

const ConfirmUploadSchema = z.object({
  reportId: z.string().optional(),
  fileUrl: z.string(),
  reportType: z.string(),
});

export async function recordsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // POST /reports/upload
  fastify.post('/upload', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const { fileName, fileType, reportType } = RequestUploadSchema.parse(request.body);
    const patientId = request.user!.patientId;

    if (!patientId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Patient profile required' });
    }

    const fileKey = `reports/${patientId}/${Date.now()}-${fileName}`;
    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(fileKey, fileType);

    const report = await prisma.report.create({
      data: {
        patientId,
        fileUrl: publicUrl,
        reportType,
        isProcessed: false,
      },
    });

    return reply.send({
      success: true,
      reportId: report.id,
      uploadUrl,
      fileUrl: publicUrl,
    });
  });

  // POST /reports/confirm
  fastify.post('/confirm', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const { reportId, fileUrl, reportType } = ConfirmUploadSchema.parse(request.body);
    const patientId = request.user!.patientId;

    let report;
    if (reportId) {
      report = await prisma.report.findUnique({ where: { id: reportId } });
    }

    if (!report) {
      report = await prisma.report.create({
        data: {
          patientId: patientId!,
          fileUrl,
          reportType,
          isProcessed: false,
        },
      });
    }

    // Trigger AI processing (Synchronous fallback for MVP / Demo)
    const summary = generateMockSummary(report.reportType, report.fileUrl);

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        extractedSummary: summary.summary,
        extractedData: summary as any,
        isProcessed: true,
      },
    });

    return reply.send({ success: true, report: updated });
  });

  // GET /reports
  fastify.get('/', { preHandler: [requireRole(Role.PATIENT, Role.DOCTOR)] }, async (request, reply) => {
    const patientId = request.user!.role === Role.PATIENT ? request.user!.patientId : (request.query as any)?.patientId;

    if (!patientId) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Patient ID required' });
    }

    const reports = await prisma.report.findMany({
      where: { patientId },
      orderBy: { uploadedAt: 'desc' },
    });

    return reply.send({ success: true, reports });
  });

  // GET /reports/:id
  fastify.get('/:id', { preHandler: [requireRole(Role.PATIENT, Role.DOCTOR)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    const presignedDownloadUrl = await generatePresignedDownloadUrl(report.fileUrl);

    return reply.send({
      success: true,
      report: {
        ...report,
        presignedDownloadUrl,
      },
    });
  });

  // DELETE /reports/:id
  fastify.delete('/:id', { preHandler: [requireRole(Role.PATIENT)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const patientId = request.user!.patientId;

    await prisma.report.deleteMany({
      where: { id, patientId: patientId! },
    });

    return reply.send({ success: true, message: 'Report deleted' });
  });
}
