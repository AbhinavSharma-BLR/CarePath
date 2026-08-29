const { SignJWT } = require('jose');
const crypto = require('crypto');
require('dotenv').config({ path: 'apps/api/.env' });

async function getToken() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'carepath_jwt_secret_32_bytes_long_key_123456');
  const token = await new SignJWT({ id: 'dev-doctor-user-1', name: 'Dr. Ananya Sharma', role: 'DOCTOR', doctorId: 'doc-1' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
  console.log(token);
}
getToken();
