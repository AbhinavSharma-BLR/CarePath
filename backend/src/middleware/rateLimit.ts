import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis';

export function createRateLimiter(prefix: string, maxRequests: number, windowSeconds: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // In non-production development mode, use a generous limit to prevent developer lockouts
    const effectiveLimit = process.env.NODE_ENV === 'production' ? maxRequests : 1000;
    const identifier = request.user?.id || request.ip || 'localhost';
    const key = `ratelimit:${prefix}:${identifier}`;

    const current = await redis.incr(key);

    if (current > effectiveLimit) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded (${maxRequests} requests per ${windowSeconds}s). Please try again later.`,
      });
    }
  };
}

export const otpRateLimiter = createRateLimiter('otp', 5, 3600); // 5 OTP attempts/hour in prod
export const aiRateLimiter = createRateLimiter('ai', 100, 3600); // 100 AI requests/hour in prod
