import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export async function auditLoggerHook(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) return;

  const path = request.url;
  if (path.includes('/reports') || path.includes('/referrals') || path.includes('/patient/profile')) {
    const action = `${request.method} ${request.routerPath || request.url}`;
    const resource = path.split('/')[1] || 'health-record';
    const resourceId = (request.params as any)?.id || 'collection';

    try {
      await prisma.auditLog.create({
        data: {
          userId: request.user.id,
          action,
          resource,
          resourceId,
          ipAddress: request.ip,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
