import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@carepath/database';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { sendOTP, normalizeIndianPhone, isDevOtpModeEnabled } from '../../lib/msg91';
import { generateTokens, verifyJWT, authenticate } from '../../middleware/auth';
import { otpRateLimiter } from '../../middleware/rateLimit';
import { memoryDoctors } from '../doctor/doctor.routes';

const SendOTPSchema = z
  .object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
    purpose: z.enum(['login', 'signup']).optional(),
    intent: z.enum(['login', 'signup']).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => !!(data.phone || data.mobile), {
    message: 'Mobile or phone number is required',
  });

const VerifyOTPSchema = z
  .object({
    phone: z.string().min(10).optional(),
    mobile: z.string().min(10).optional(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    name: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    purpose: z.enum(['login', 'signup']).optional(),
    intent: z.enum(['login', 'signup']).optional(),
  })
  .refine((data) => !!(data.phone || data.mobile), {
    message: 'Mobile or phone number is required',
  });

// In-memory store for registered dev users
export const registeredDevUsers = new Map<string, { id: string; name: string; phone: string; role: Role; patientId?: string; doctorId?: string }>();

// Pre-seed default test accounts
registeredDevUsers.set('8090286983', { id: 'dev-admin-id-6983', name: 'System Admin', phone: '8090286983', role: Role.ADMIN });
registeredDevUsers.set('9876543210', { id: 'dev-user-id-3210', name: 'Rahul Kumar', phone: '9876543210', role: Role.PATIENT, patientId: 'dev-patient-id-3210' });
registeredDevUsers.set('9876543211', { id: 'dev-doctor-user-1', name: 'Dr. Ananya Sharma', phone: '9876543211', role: Role.DOCTOR, doctorId: 'doc-1' });
registeredDevUsers.set('9999999999', { id: 'dev-doctor-user-2', name: 'Dr. Rajesh Kumar', phone: '9999999999', role: Role.DOCTOR, doctorId: 'doc-2' });
registeredDevUsers.set('9876543212', { id: 'dev-doctor-user-3', name: 'Dr. Priya Nair', phone: '9876543212', role: Role.DOCTOR, doctorId: 'doc-3' });
registeredDevUsers.set('9876543213', { id: 'dev-doctor-user-4', name: 'Dr. Vikramaditya Rao', phone: '9876543213', role: Role.DOCTOR, doctorId: 'doc-4' });

async function findExistingUser(digitsOnly: string, normalizedPhone: string) {
  // 1. Check DB First to ensure real foreign keys are used
  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone: digitsOnly }, { phone: normalizedPhone }],
      },
      include: { patient: true, doctor: true },
    });

    if (dbUser) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        phone: dbUser.phone,
        role: dbUser.role,
        patientId: dbUser.patient?.id,
        doctorId: dbUser.doctor?.id,
      };
    }
  } catch (err) {}

  // 2. Check in-memory registered dev users
  const memUser = registeredDevUsers.get(digitsOnly);
  if (memUser) {
    try {
      // Upsert into DB so that Foreign Keys (like Prescriptions -> Patient) work in dev mode
      await prisma.user.upsert({
        where: { id: memUser.id },
        update: {},
        create: {
          id: memUser.id,
          name: memUser.name,
          phone: memUser.phone,
          role: memUser.role,
          ...(memUser.role === Role.PATIENT && memUser.patientId
            ? { patient: { create: { id: memUser.patientId } } }
            : {}),
          ...(memUser.role === Role.DOCTOR && memUser.doctorId
            ? { doctor: { create: { id: memUser.doctorId, specialty: 'General Physician', bio: 'Dev Doctor' } } }
            : {}),
        },
      });
    } catch (e) {
      console.warn('[DEV_MOCK] DB Upsert skipped. Error:', e);
    }
    return memUser;
  }

  // 3. Check memoryDoctors list
  const doctorMatch = memoryDoctors.find(d => d.phone.replace(/\D/g, '').slice(-10) === digitsOnly);
  if (doctorMatch) {
    const docUser = {
      id: doctorMatch.userId || `dev-doctor-user-${doctorMatch.id}`,
      name: doctorMatch.name,
      phone: doctorMatch.phone.replace(/\D/g, '').slice(-10),
      role: Role.DOCTOR,
      doctorId: doctorMatch.id,
    };
    registeredDevUsers.set(digitsOnly, docUser);
    
    try {
      await prisma.user.upsert({
        where: { id: docUser.id },
        update: {},
        create: {
          id: docUser.id,
          name: docUser.name,
          phone: docUser.phone,
          role: docUser.role,
          doctor: { create: { id: docUser.doctorId, specialty: 'General Physician', bio: 'Dev Doctor' } }
        },
      });
    } catch (e) {
      console.warn('[DEV_MOCK] DB Upsert skipped. Error:', e);
    }

    return docUser;
  }

  return null;
}

export async function authRoutes(fastify: FastifyInstance) {
  // POST /send-otp
  fastify.post('/send-otp', { preHandler: [otpRateLimiter] }, async (request, reply) => {
    const parseResult = SendOTPSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid phone number format. Please enter a valid 10-digit mobile number.',
      });
    }

    const rawPhone = parseResult.data.mobile || parseResult.data.phone!;
    const digitsOnly = rawPhone.replace(/\D/g, '').slice(-10);
    const normalizedPhone = normalizeIndianPhone(digitsOnly);
    const purpose = parseResult.data.purpose || parseResult.data.intent || 'login';
    const requestedRole = parseResult.data.role || Role.PATIENT;

    // Check account existence based on purpose
    const existingUser = await findExistingUser(digitsOnly, normalizedPhone);

    if (purpose === 'login') {
      if (!existingUser) {
        if (requestedRole === Role.DOCTOR) {
          return reply.status(404).send({
            error: 'Doctor Not Found',
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor account not found. Please contact CarePath administration.',
          });
        }
        return reply.status(404).send({
          error: 'User Not Found',
          code: 'USER_NOT_FOUND',
          message: 'No patient account found. Please sign up first.',
        });
      }

      // Check role mismatch
      if (existingUser.role !== requestedRole) {
        if (existingUser.role === Role.PATIENT && requestedRole === Role.DOCTOR) {
          return reply.status(400).send({
            error: 'Role Mismatch',
            code: 'ROLE_MISMATCH',
            message: 'This mobile number is registered as a Patient account. Please select the Patient login option.',
          });
        }
        if (existingUser.role === Role.DOCTOR && requestedRole === Role.PATIENT) {
          return reply.status(400).send({
            error: 'Role Mismatch',
            code: 'ROLE_MISMATCH',
            message: 'This mobile number is registered as a Doctor account. Please select the Doctor login option.',
          });
        }
      }
    } else if (purpose === 'signup') {
      if (existingUser) {
        return reply.status(409).send({
          error: 'Account Already Exists',
          code: 'ACCOUNT_ALREADY_EXISTS',
          message: 'An account with this mobile number already exists. Please log in instead.',
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 300s expiration under key variations
    await redis.setEx(`otp:${normalizedPhone}`, 300, otp);
    await redis.setEx(`otp:${digitsOnly}`, 300, otp);
    await redis.setEx(`otp:${rawPhone}`, 300, otp);

    const otpResult = await sendOTP(digitsOnly, otp);

    if (!otpResult.success) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: otpResult.message,
      });
    }

    return reply.send({
      success: true,
      message: otpResult.message,
      isDevMode: otpResult.isMock,
      debugOtp: otpResult.isMock ? otp : undefined,
    });
  });

  // POST /verify-otp
  fastify.post('/verify-otp', { preHandler: [otpRateLimiter] }, async (request, reply) => {
    const parseResult = VerifyOTPSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid request data. OTP must be 6 digits.',
      });
    }

    const rawPhone = parseResult.data.mobile || parseResult.data.phone!;
    const digitsOnly = rawPhone.replace(/\D/g, '').slice(-10);
    const normalizedPhone = normalizeIndianPhone(digitsOnly);
    const { otp, name, role } = parseResult.data;
    const purpose = parseResult.data.purpose || parseResult.data.intent || 'login';

    const requestedRole = role || Role.PATIENT;

    // Check Redis for stored OTP across normalized key variants
    const storedOtp =
      (await redis.get(`otp:${normalizedPhone}`)) ||
      (await redis.get(`otp:${digitsOnly}`)) ||
      (await redis.get(`otp:${rawPhone}`));

    const isDevMode = isDevOtpModeEnabled();

    // In dev mode, accept stored OTP or universal master dev OTP '123456'
    // Also support special OTP '201007' for the admin phone
    const isOtpValid = (storedOtp && storedOtp === otp) || 
                       (isDevMode && otp === '123456') || 
                       (isDevMode && digitsOnly === '8090286983' && otp === '201007');

    if (!isOtpValid) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid or expired OTP. Please check the code and try again.',
      });
    }

    // Clean up used OTP from Redis
    await redis.del(`otp:${normalizedPhone}`);
    await redis.del(`otp:${digitsOnly}`);
    await redis.del(`otp:${rawPhone}`);

    // Fetch existing account
    let user = await findExistingUser(digitsOnly, normalizedPhone);

    // 1. LOGIN FLOW VERIFICATION
    if (purpose === 'login') {
      if (!user) {
        if (requestedRole === Role.DOCTOR) {
          return reply.status(404).send({
            error: 'Doctor Not Found',
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor account not found. Please contact CarePath administration.',
          });
        }
        return reply.status(404).send({
          error: 'User Not Found',
          code: 'USER_NOT_FOUND',
          message: 'No patient account found. Please sign up first.',
        });
      }

      if (user.role !== requestedRole) {
        if (user.role === Role.PATIENT && requestedRole === Role.DOCTOR) {
          return reply.status(400).send({
            error: 'Role Mismatch',
            code: 'ROLE_MISMATCH',
            message: 'This mobile number is registered as a Patient account. Please select the Patient login option.',
          });
        }
        if (user.role === Role.DOCTOR && requestedRole === Role.PATIENT) {
          return reply.status(400).send({
            error: 'Role Mismatch',
            code: 'ROLE_MISMATCH',
            message: 'This mobile number is registered as a Doctor account. Please select the Doctor login option.',
          });
        }
      }

      // Generate session for existing user
      const tokens = await generateTokens(user);
      return reply.send({
        success: true,
        user,
        ...tokens,
      });
    }

    // 2. SIGNUP FLOW VERIFICATION
    if (purpose === 'signup') {
      if (user) {
        return reply.status(409).send({
          error: 'Account Already Exists',
          code: 'ACCOUNT_ALREADY_EXISTS',
          message: 'An account with this mobile number already exists. Please log in instead.',
        });
      }

      // Create new Patient account
      const newUserId = `user-${Date.now()}-${digitsOnly.slice(-4)}`;
      const newPatientId = `pat-${Date.now()}-${digitsOnly.slice(-4)}`;
      const registeredName = name || `Patient-${digitsOnly.slice(-4)}`;

      const newUser = {
        id: newUserId,
        name: registeredName,
        phone: digitsOnly,
        role: Role.PATIENT,
        patientId: newPatientId,
      };

      // In-memory dev registration
      registeredDevUsers.set(digitsOnly, newUser);

      // DB registration if active
      try {
        const dbCreated = await prisma.user.create({
          data: {
            id: newUserId,
            phone: digitsOnly,
            name: registeredName,
            role: Role.PATIENT,
            patient: {
              create: {
                id: newPatientId,
                age: 30,
                gender: 'Male',
                locationText: 'Bengaluru, Karnataka',
              },
            },
          },
          include: { patient: true },
        });

        newUser.id = dbCreated.id;
        newUser.name = dbCreated.name;
        if (dbCreated.patient?.id) newUser.patientId = dbCreated.patient.id;
      } catch (err) {}

      const tokens = await generateTokens(newUser);
      return reply.send({
        success: true,
        user: newUser,
        ...tokens,
      });
    }

    return reply.status(400).send({ error: 'Bad Request', message: 'Invalid authentication purpose' });
  });

  // POST /refresh
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (!refreshToken) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Refresh token required' });
    }

    const decoded = await verifyJWT(refreshToken);
    if (!decoded) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    const payload = {
      id: decoded.id,
      phone: decoded.phone,
      name: decoded.name,
      role: decoded.role,
      patientId: decoded.patientId,
      doctorId: decoded.doctorId,
    };

    const tokens = await generateTokens(payload);
    return reply.send({ success: true, ...tokens });
  });

  // GET /me
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send({ success: true, user: request.user });
  });

  // POST /logout
  fastify.post('/logout', async (request, reply) => {
    return reply.send({ success: true, message: 'Logged out successfully' });
  });
}
