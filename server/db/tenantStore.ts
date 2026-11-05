import { Tenant, TenantPublicBranding } from './types.js';

// Cache em memória para resolução ultrarrápida na VPS (evita bater no Postgres a cada requisição de asset/página)
interface CacheEntry {
  tenant: Tenant | null;
  expiresAt: number;
}

const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

// Tenants padrões de demonstração (e fallback de desenvolvimento)
const initialTenants: Tenant[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'R3Play Oficial',
    subdomain: 'r3play',
    customDomain: null,
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#2563eb', // Royal Blue
    secondaryColor: '#4f46e5', // Indigo
    accentColor: '#f59e0b', // Amber
    description: 'Sistema oficial R3team para Gestão & Placar de Vôlei',
    isActive: true,
    planMode: 'pro',
    hasStreamAddon: true,
    licenseStatus: 'active',
    licenseExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Arena Vôlei Brasil',
    subdomain: 'arena1',
    customDomain: null,
    logoUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=100&h=100&fit=crop&q=80',
    faviconUrl: null,
    primaryColor: '#059669', // Emerald Green
    secondaryColor: '#0d9488', // Teal
    accentColor: '#f59e0b', // Amber
    description: 'Complexo de Areia & Quadras de Vôlei',
    isActive: true,
    planMode: 'pro',
    hasStreamAddon: true,
    licenseStatus: 'active',
    licenseExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Clube Pinheiros Vôlei',
    subdomain: 'voleiclube',
    customDomain: null,
    logoUrl: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=100&h=100&fit=crop&q=80',
    faviconUrl: null,
    primaryColor: '#e11d48', // Rose Red
    secondaryColor: '#be123c', // Deep Rose
    accentColor: '#fbbf24', // Gold
    description: 'Liga Metropolitana e Equipe Profissional',
    isActive: true,
    planMode: 'lite',
    hasStreamAddon: false,
    licenseStatus: 'active',
    licenseExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Cyber Volley Arena',
    subdomain: 'cyber',
    customDomain: null,
    logoUrl: null,
    primaryColor: '#9333ea', // Purple
    secondaryColor: '#7c3aed', // Violet
    accentColor: '#06b6d4', // Cyan
    description: 'Arena Futurista de Treinamento e Transmissão',
    isActive: true,
    planMode: 'free',
    hasStreamAddon: false,
    licenseStatus: 'active',
    licenseExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Estado de dados em memória
const tenantsTable: Tenant[] = [...initialTenants];

export const tenantStore = {
  /**
   * Busca um tenant por subdomínio ou customDomain, com cache em memória de alta performance
   */
  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const now = Date.now();

    // 1. Verifica no Cache em Memória
    const cached = tenantCache.get(cleanSubdomain);
    if (cached && cached.expiresAt > now) {
      return cached.tenant;
    }

    // 2. Busca na base de dados (ou fallback mock)
    // Em produção com PostgreSQL real:
    // const result = await pool.query('SELECT * FROM tenants WHERE subdomain = $1 AND is_active = true', [cleanSubdomain]);
    const tenant = tenantsTable.find(
      (t) => (t.subdomain === cleanSubdomain || t.customDomain === cleanSubdomain) && t.isActive
    ) || null;

    // 3. Salva no cache
    tenantCache.set(cleanSubdomain, {
      tenant,
      expiresAt: now + CACHE_TTL_MS,
    });

    return tenant;
  },

  /**
   * Retorna o tenant padrão do sistema (R3Play Oficial)
   */
  async getDefaultTenant(): Promise<Tenant> {
    const defaultTenant = tenantsTable[0];
    return defaultTenant;
  },

  /**
   * Retorna lista de todos os tenants ativos (para catálogo e testes)
   */
  async listAll(): Promise<Tenant[]> {
    return tenantsTable.filter((t) => t.isActive);
  },

  /**
   * Cria um novo tenant
   */
  async create(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const newTenant: Tenant = {
      ...data,
      id: `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tenantsTable.push(newTenant);
    tenantCache.delete(newTenant.subdomain);
    return newTenant;
  },

  /**
   * Atualiza a identidade visual (White Label) de um tenant
   */
  async updateBranding(
    id: string,
    updates: Partial<Pick<Tenant, 'name' | 'logoUrl' | 'primaryColor' | 'secondaryColor' | 'accentColor' | 'description'>>
  ): Promise<Tenant | null> {
    const index = tenantsTable.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = tenantsTable[index];
    const updated: Tenant = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    tenantsTable[index] = updated;

    // Invalida o cache
    tenantCache.delete(current.subdomain);
    if (current.customDomain) {
      tenantCache.delete(current.customDomain);
    }

    return updated;
  },

  /**
   * Busca um tenant por ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return tenantsTable.find((t) => t.id === id) || null;
  },

  /**
   * Atualiza a licença e planos comerciais de um tenant (Pós-Venda pelo Superadmin)
   */
  async updateLicense(
    id: string,
    updates: {
      planMode?: 'free' | 'lite' | 'pro';
      hasStreamAddon?: boolean;
      licenseStatus?: 'active' | 'suspended' | 'trial' | 'expired';
      licenseExpiresAt?: string | null;
      isActive?: boolean;
    }
  ): Promise<Tenant | null> {
    const index = tenantsTable.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = tenantsTable[index];
    const updated: Tenant = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    tenantsTable[index] = updated;

    // Invalida cache
    tenantCache.delete(current.subdomain);
    if (current.customDomain) {
      tenantCache.delete(current.customDomain);
    }

    return updated;
  },

  /**
   * Estatísticas da plataforma para o painel de Superadmin
   */
  async getStats() {
    const total = tenantsTable.length;
    const active = tenantsTable.filter((t) => t.isActive && t.licenseStatus === 'active').length;
    const pro = tenantsTable.filter((t) => t.planMode === 'pro' && t.isActive).length;
    const lite = tenantsTable.filter((t) => t.planMode === 'lite' && t.isActive).length;
    const free = tenantsTable.filter((t) => t.planMode === 'free' && t.isActive).length;
    const streamAddon = tenantsTable.filter((t) => t.hasStreamAddon && t.isActive).length;

    return {
      totalTenants: total,
      activeLicenses: active,
      proPlans: pro,
      litePlans: lite,
      freePlans: free,
      streamAddons: streamAddon,
    };
  },

  /**
   * Formata os dados de branding para exposição segura ao frontend (sem chaves/secrets internas)
   */
  toPublicBranding(tenant: Tenant): TenantPublicBranding {
    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      logoUrl: tenant.logoUrl || null,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
      description: tenant.description || null,
      planMode: tenant.planMode || 'pro',
      hasStreamAddon: tenant.hasStreamAddon || false,
      licenseStatus: tenant.licenseStatus || 'active',
    };
  },
};
