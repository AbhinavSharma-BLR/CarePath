import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes';
import { patientRoutes } from './modules/patient/patient.routes';
import { doctorRoutes } from './modules/doctor/doctor.routes';
import { appointmentRoutes } from './modules/appointment/appointment.routes';
import { queueRoutes } from './modules/queue/queue.routes';
import { consultationRoutes } from './modules/consultation/consultation.routes';
import { recordsRoutes } from './modules/records/records.routes';
import { prescriptionRoutes } from './modules/prescription/prescription.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { facilityRoutes } from './modules/facility/facility.routes';
import { referralRoutes } from './modules/referral/referral.routes';
import { carelinkRoutes } from './modules/carelink/carelink.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { auditLoggerHook } from './middleware/audit';
import { initSocketIO } from './lib/socket';


const server = fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
          }
        : undefined,
  },
});

async function main() {
  // Register plugins
  await server.register(cors, { origin: true });
  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max upload

  // Hooks
  server.addHook('onResponse', auditLoggerHook);

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', service: 'CAREPATH API', timestamp: new Date().toISOString() };
  });

  // API Route registrations
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  
  await server.register(patientRoutes, { prefix: '/patient' });
  await server.register(patientRoutes, { prefix: '/api/patient' });
  
  await server.register(doctorRoutes);
  await server.register(doctorRoutes, { prefix: '/api' });
  await server.register(doctorRoutes, { prefix: '/api/v1' });
  
  await server.register(appointmentRoutes);
  await server.register(appointmentRoutes, { prefix: '/api' });
  await server.register(appointmentRoutes, { prefix: '/api/v1' });

  await server.register(queueRoutes);
  await server.register(queueRoutes, { prefix: '/api' });
  await server.register(queueRoutes, { prefix: '/api/v1' });

  await server.register(consultationRoutes, { prefix: '/consultations' });
  await server.register(consultationRoutes, { prefix: '/api/consultations' });
  await server.register(consultationRoutes, { prefix: '/api/v1/consultations' });

  await server.register(prescriptionRoutes, { prefix: '/prescriptions' });
  await server.register(prescriptionRoutes, { prefix: '/api/prescriptions' });
  await server.register(prescriptionRoutes, { prefix: '/api/v1/prescriptions' });

  await server.register(recordsRoutes, { prefix: '/reports' });
  await server.register(aiRoutes, { prefix: '/ai' });
  await server.register(facilityRoutes, { prefix: '/facilities' });
  await server.register(referralRoutes, { prefix: '/referrals' });
  await server.register(carelinkRoutes, { prefix: '/assistance' });
  await server.register(adminRoutes, { prefix: '/admin' });

  const PORT = parseInt(process.env.PORT || '3001', 10);
  const HOST = process.env.HOST || '::';

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`[CAREPATH API] HTTP SERVER LISTENING ON ${PORT}`);

    // Init Socket.io on Fastify's native Node HTTP server
    initSocketIO(server.server);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
