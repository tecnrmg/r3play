export type PlanMode = 'free' | 'lite' | 'pro';
export type LicenseStatus = 'active' | 'suspended' | 'trial' | 'expired';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;    // Hex ex: #f59e0b
  secondaryColor: string;  // Hex ex: #3b82f6
  accentColor: string;     // Hex ex: #10b981
  description?: string | null;
  isActive: boolean;
  // Gestão de Licença e Planos Comercial (Pós-Venda)
  planMode: PlanMode;
  hasStreamAddon: boolean;
  licenseStatus: LicenseStatus;
  licenseExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantPublicBranding {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string | null;
  planMode: PlanMode;
  hasStreamAddon: boolean;
  licenseStatus: LicenseStatus;
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: 'superadmin';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminSession {
  token: string;
  adminId: string;
  email: string;
  name: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

