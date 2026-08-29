import { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify, SignJWT } from 'jose';
import { Role } from '@carepath/database';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'carepath_jwt_secret_32_bytes_long_key_123456');

export interface AuthUserPayload {
  id: string;
  phone: string;
  name?: string;
  role: Role;
  patientId?: string;
  doctorId?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUserPayload;
  }
}

export async function generateTokens(payload: AuthUserPayload) {
  const accessToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ id: payload.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

export async function verifyJWT(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUserPayload;
  } catch (err) {
    return null;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = await verifyJWT(token);

  if (!decoded) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token expired or invalid' });
  }

  request.user = decoded;
}
