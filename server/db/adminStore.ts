import crypto from 'crypto';
import { AdminUser, AdminSession, Tenant, PlanMode, LicenseStatus } from './types.js';
import { tenantStore } from './tenantStore.js';

// Utilitários criptográficos seguros
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const bufA = Buffer.from(hash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Inicializa o hash do superadministrador Rodrigo (R3team)
const defaultSaltRodrigo = generateSalt();
const defaultHashRodrigo = hashPassword('R3teamAdmin2025!', defaultSaltRodrigo);

const defaultSaltAdmin = generateSalt();
const defaultHashAdmin = hashPassword('R3teamAdmin2025!', defaultSaltAdmin);

// Tabela de administradores cadastrados no banco de dados
const adminUsersTable: AdminUser[] = [
  {
    id: 'admin-00000000-0000-0000-0000-000000000001',
    email: 'tecn.rodrigo@gmail.com',
    passwordHash: defaultHashRodrigo,
    salt: defaultSaltRodrigo,
    name: 'Rodrigo (R3team)',
    role: 'superadmin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  },
  {
    id: 'admin-00000000-0000-0000-0000-000000000002',
    email: 'admin@r3play.com.br',
    passwordHash: defaultHashAdmin,
    salt: defaultSaltAdmin,
    name: 'Superadmin Central R3Play',
    role: 'superadmin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  },
];

// Gerenciamento de Sessões Ativas em Memória (24 horas de validade)
const activeSessions = new Map<string, AdminSession>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Proteção contra ataques de força bruta (Rate Limiting por IP / Email)
interface LoginAttempt {
  count: number;
  blockedUntil: number | null;
  lastAttempt: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueio

export const adminStore = {
  /**
   * Verifica se o identificador (IP ou email) está temporariamente bloqueado por força bruta
   */
  checkRateLimit(identifier: string): { isBlocked: boolean; remainingSeconds: number } {
    const attempt = loginAttempts.get(identifier);
    if (!attempt || !attempt.blockedUntil) {
      return { isBlocked: false, remainingSeconds: 0 };
    }

    const now = Date.now();
    if (now < attempt.blockedUntil) {
      const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
      return { isBlocked: true, remainingSeconds };
    }

    // Tempo de bloqueio expirou
    loginAttempts.delete(identifier);
    return { isBlocked: false, remainingSeconds: 0 };
  },

  /**
   * Registra falha de tentativa de login
   */
  recordFailedAttempt(identifier: string): { isBlocked: boolean; remainingAttempts: number; remainingSeconds: number } {
    const now = Date.now();
    let attempt = loginAttempts.get(identifier);

    if (!attempt) {
      attempt = { count: 0, blockedUntil: null, lastAttempt: now };
    }

    attempt.count += 1;
    attempt.lastAttempt = now;

    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blockedUntil = now + BLOCK_DURATION_MS;
      loginAttempts.set(identifier, attempt);
      return {
        isBlocked: true,
        remainingAttempts: 0,
        remainingSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      };
    }

    loginAttempts.set(identifier, attempt);
    return {
      isBlocked: false,
      remainingAttempts: MAX_ATTEMPTS - attempt.count,
      remainingSeconds: 0,
    };
  },

  /**
   * Limpa tentativas após sucesso
   */
  clearFailedAttempts(identifier: string): void {
    loginAttempts.delete(identifier);
  },

  /**
   * Autentica credenciais de administrador contra o banco de dados
   */
  async authenticate(email: string, password: string, clientIp: string): Promise<{
    user: AdminUser | null;
    error?: string;
    remainingAttempts?: number;
    blockedSeconds?: number;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const rateLimitKey = `${clientIp}:${cleanEmail}`;

    // 1. Checa bloqueio por força bruta
    const rateCheck = this.checkRateLimit(rateLimitKey);
    if (rateCheck.isBlocked) {
      return {
        user: null,
        error: `Muitas tentativas incorretas. Acesso bloqueado por segurança por mais ${rateCheck.remainingSeconds} segundos.`,
        blockedSeconds: rateCheck.remainingSeconds,
      };
    }

    // 2. Localiza usuário administrador no banco
    const user = adminUsersTable.find((u) => u.email.toLowerCase() === cleanEmail && u.isActive);
    if (!user) {
      const fail = this.recordFailedAttempt(rateLimitKey);
      return {
        user: null,
        error: fail.isBlocked
          ? `Limite de tentativas excedido. Bloqueado por ${fail.remainingSeconds} segundos.`
          : 'Credenciais de administrador inválidas.',
        remainingAttempts: fail.remainingAttempts,
        blockedSeconds: fail.remainingSeconds,
      };
    }

    // 3. Validação de senha criptografada PBKDF2 com Salt
    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      const fail = this.recordFailedAttempt(rateLimitKey);
      return {
        user: null,
        error: fail.isBlocked
          ? `Limite de tentativas excedido. Bloqueado por ${fail.remainingSeconds} segundos.`
          : 'Credenciais de administrador inválidas.',
        remainingAttempts: fail.remainingAttempts,
        blockedSeconds: fail.remainingSeconds,
      };
    }

    // 4. Sucesso: limpa tentativas e atualiza data de login
    this.clearFailedAttempts(rateLimitKey);
    user.lastLoginAt = new Date().toISOString();

    return { user };
  },

  /**
   * Cria uma nova sessão segura
   */
  createSession(user: AdminUser): AdminSession {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: AdminSession = {
      token,
      adminId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    activeSessions.set(token, session);
    return session;
  },

  /**
   * Valida token de sessão
   */
  validateSession(token: string): AdminSession | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }

    return session;
  },

  /**
   * Encerra sessão (Logout)
   */
  destroySession(token: string): void {
    activeSessions.delete(token);
  },

  /**
   * Altera a senha do administrador
   */
  async updatePassword(adminId: string, currentPass: string, newPass: string): Promise<boolean> {
    const user = adminUsersTable.find((u) => u.id === adminId);
    if (!user) return false;

    if (!verifyPassword(currentPass, user.salt, user.passwordHash)) {
      return false;
    }

    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPass, newSalt);
    return true;
  },

  /**
   * Retorna informações de todos os administradores cadastrados (sem hashes)
   */
  async listAdmins(): Promise<Omit<AdminUser, 'passwordHash' | 'salt'>[]> {
    return adminUsersTable.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }));
  },
};
