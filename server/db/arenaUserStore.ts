import crypto from 'crypto';
import { tenantStore } from './tenantStore.js';

export type UserRole = 'OWNER' | 'ORGANIZER' | 'PLAYER' | 'SUPERADMIN';

export interface ArenaUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  canUseStreamOverlay: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

// Seeds iniciais de demonstração para Dono da Arena e Organizador
const saltOwnerArena1 = generateSalt();
const hashOwnerArena1 = hashPassword('ArenaOwner2025!', saltOwnerArena1);

const saltOrgArena1 = generateSalt();
const hashOrgArena1 = hashPassword('Organizador2025!', saltOrgArena1);

const saltOwnerR3 = generateSalt();
const hashOwnerR3 = hashPassword('ArenaOwner2025!', saltOwnerR3);

const saltOrgR3 = generateSalt();
const hashOrgR3 = hashPassword('Organizador2025!', saltOrgR3);

const arenaUsersTable: ArenaUser[] = [
  // Dono da Arena 1 (Arena Vôlei Brasil)
  {
    id: 'user-owner-arena1',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Carlos Mendes',
    email: 'dono.arena1@r3play.com.br',
    phone: '(11) 98765-4321',
    role: 'OWNER',
    passwordHash: hashOwnerArena1,
    salt: saltOwnerArena1,
    canUseStreamOverlay: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Organizador da Arena 1
  {
    id: 'user-org-arena1',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Lucas Silva',
    email: 'organizador.lucas@r3play.com.br',
    phone: '(11) 99887-6655',
    role: 'ORGANIZER',
    passwordHash: hashOrgArena1,
    salt: saltOrgArena1,
    canUseStreamOverlay: true, // Já ativado pelo Dono da Arena
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Segundo Organizador da Arena 1
  {
    id: 'user-org-arena1-2',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Fernanda Lima',
    email: 'organizador.fernanda@r3play.com.br',
    phone: '(11) 97766-5544',
    role: 'ORGANIZER',
    passwordHash: hashOrgArena1,
    salt: saltOrgArena1,
    canUseStreamOverlay: false, // Dono da arena pode ligar
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Dono da Arena R3Play Oficial
  {
    id: 'user-owner-r3play',
    tenantId: '00000000-0000-0000-0000-000000000001',
    name: 'Rodrigo R3team',
    email: 'dono.r3play@r3play.com.br',
    phone: '(11) 99999-8888',
    role: 'OWNER',
    passwordHash: hashOwnerR3,
    salt: saltOwnerR3,
    canUseStreamOverlay: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Organizador da Arena R3Play Oficial
  {
    id: 'user-org-r3play',
    tenantId: '00000000-0000-0000-0000-000000000001',
    name: 'Thiago Martins',
    email: 'organizador.thiago@r3play.com.br',
    phone: '(11) 98888-7777',
    role: 'ORGANIZER',
    passwordHash: hashOrgR3,
    salt: saltOrgR3,
    canUseStreamOverlay: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const arenaUserStore = {
  async findByEmail(email: string): Promise<ArenaUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    const user = arenaUsersTable.find((u) => u.email.toLowerCase() === cleanEmail && u.isActive);
    return user || null;
  },

  async findById(id: string): Promise<ArenaUser | null> {
    const user = arenaUsersTable.find((u) => u.id === id);
    return user || null;
  },

  async listOrganizers(tenantId: string): Promise<Omit<ArenaUser, 'passwordHash' | 'salt'>[]> {
    return arenaUsersTable
      .filter((u) => u.tenantId === tenantId && u.role === 'ORGANIZER')
      .map(({ passwordHash, salt, ...rest }) => rest);
  },

  async createOrganizer(data: {
    tenantId: string;
    name: string;
    email: string;
    phone?: string;
    password?: string;
    canUseStreamOverlay?: boolean;
  }): Promise<Omit<ArenaUser, 'passwordHash' | 'salt'>> {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = arenaUsersTable.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`O e-mail '${data.email}' já está cadastrado no sistema.`);
    }

    const salt = generateSalt();
    const rawPass = data.password || 'Organizador2025!';
    const passwordHash = hashPassword(rawPass, salt);

    const newUser: ArenaUser = {
      id: `user-org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: data.tenantId,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      role: 'ORGANIZER',
      passwordHash,
      salt,
      canUseStreamOverlay: !!data.canUseStreamOverlay,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    arenaUsersTable.push(newUser);
    const { passwordHash: _ph, salt: _s, ...safeUser } = newUser;
    return safeUser;
  },

  async updateStreamPermission(
    organizerId: string,
    tenantId: string,
    canUseStreamOverlay: boolean
  ): Promise<boolean> {
    const user = arenaUsersTable.find((u) => u.id === organizerId && u.tenantId === tenantId);
    if (!user) return false;

    // Se estiver tentando ativar, valida se o Tenant possui licença de Stream
    if (canUseStreamOverlay) {
      const tenant = await tenantStore.findById(tenantId);
      if (!tenant || !tenant.hasStreamAddon) {
        throw new Error('Sua arena não possui a licença avulsa de Transmissão (Overlay OBS) ativa no momento. Solicite a liberação no painel R3team.');
      }
    }

    user.canUseStreamOverlay = canUseStreamOverlay;
    user.updatedAt = new Date().toISOString();
    return true;
  },

  async getStreamLicenseStatus(tenantId: string): Promise<{
    tenantHasStreamLicense: boolean;
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
  }> {
    const tenant = await tenantStore.findById(tenantId);
    const tenantHasStreamLicense = !!tenant?.hasStreamAddon;

    // Por padrão uma arena com addon contratado tem cota de 3 organizadores simultâneos com stream
    const totalSlots = tenantHasStreamLicense ? 3 : 0;
    const usedSlots = arenaUsersTable.filter(
      (u) => u.tenantId === tenantId && u.role === 'ORGANIZER' && u.canUseStreamOverlay && u.isActive
    ).length;

    return {
      tenantHasStreamLicense,
      totalSlots,
      usedSlots,
      availableSlots: Math.max(0, totalSlots - usedSlots),
    };
  },

  verifyPassword(password: string, salt: string, storedHash: string): boolean {
    return verifyPassword(password, salt, storedHash);
  },

  // Retorna contas de teste para o ambiente atual
  async getDemoAccounts(tenantId: string) {
    const users = arenaUsersTable.filter((u) => u.tenantId === tenantId && u.isActive);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      canUseStreamOverlay: u.canUseStreamOverlay,
      defaultPassword: u.role === 'OWNER' ? 'ArenaOwner2025!' : 'Organizador2025!',
    }));
  },
};
