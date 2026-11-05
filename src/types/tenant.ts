export interface TenantBranding {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string | null;
  planMode?: 'free' | 'lite' | 'pro';
  hasStreamAddon?: boolean;
  licenseStatus?: 'active' | 'suspended' | 'trial' | 'expired';
  licenseExpiresAt?: string | null;
}

