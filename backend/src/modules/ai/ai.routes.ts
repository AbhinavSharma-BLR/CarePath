import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { checkSafetyKeywords, mockCareNavigation, generateMockSummary } from '@carepath/ai';
import { authenticate } from '../../middleware/auth';
import { aiRateLimiter } from '../../middleware/rateLimit';

const CareSuggestSchema = z.object({
  symptoms: z.string().min(2, 'Symptoms description required'),
  reportIds: z.array(z.string()).optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
});

const SafetyCheckSchema = z.object({
  symptoms: z.string(),
});

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // POST /ai/safety-check (Rule-based emergency check, fast path)
  fastify.post('/safety-check', async (request, reply) => {
    const { symptoms } = SafetyCheckSchema.parse(request.body);
    const result = checkSafetyKeywords(symptoms);
    return reply.send({ success: true, ...result });
  });

  // POST /ai/suggest-care (Care navigation suggestion, rate limited)
  fastify.post('/suggest-care', { preHandler: [aiRateLimiter] }, async (request, reply) => {
    const { symptoms, reportIds } = CareSuggestSchema.parse(request.body);

    let reportSummaries = '';
    if (reportIds && reportIds.length > 0) {
      const reports = await prisma.report.findMany({
        where: { id: { in: reportIds } },
      });
      reportSummaries = reports.map((r) => r.extractedSummary).filter(Boolean).join('\n');
    }

    const navigation = mockCareNavigation(symptoms, reportSummaries);
    return reply.send({ success: true, ...navigation });
  });

  // POST /ai/process-report
  fastify.post('/process-report', async (request, reply) => {
    const { reportId } = request.body as { reportId: string };
    const report = await prisma.report.findUnique({ where: { id: reportId } });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    const summary = generateMockSummary(report.reportType, report.fileUrl);

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        extractedSummary: summary.summary,
        extractedData: summary as any,
        isProcessed: true,
      },
    });

    return reply.send({ success: true, report: updated });
  });

  // GET /ai/summary/:reportId
  fastify.get('/summary/:reportId', async (request, reply) => {
    const { reportId } = request.params as { reportId: string };
    const report = await prisma.report.findUnique({ where: { id: reportId } });

    if (!report) {
      return reply.status(404).send({ error: 'Not Found', message: 'Report not found' });
    }

    return reply.send({
      success: true,
      summary: report.extractedSummary,
      data: report.extractedData,
      isProcessed: report.isProcessed,
    });
  });
}
