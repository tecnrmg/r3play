import crypto from 'crypto';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ORGANIZER' | 'PLAYER' | 'SUPERADMIN';
  canUseStreamOverlay?: boolean;
  exp: number; // Unix timestamp in seconds
  iat: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'r3play-volleyball-secret-key-2025-vps';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Assina um JWT padrão HMAC-SHA256 usando o módulo crypto nativo do Node.js
 */
export function signToken(
  payload: Omit<JwtPayload, 'exp' | 'iat'>,
  expiresInSeconds: number = 24 * 60 * 60 // 24 horas padrão
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Valida o token JWT e retorna o payload decodificado ou null se inválido/expirado
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verifica assinatura de forma segura contra timing attacks
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    // Verifica expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}
