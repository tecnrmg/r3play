import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantBranding } from '../types/tenant';

interface TenantContextValue {
  tenant: TenantBranding;
  isLoading: boolean;
  availableTenants: TenantBranding[];
  switchTenant: (subdomain: string) => Promise<void>;
  updateBranding: (updates: Partial<TenantBranding>) => Promise<boolean>;
}

const DEFAULT_TENANT: TenantBranding = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'R3Play Oficial',
  subdomain: 'r3play',
  logoUrl: null,
  primaryColor: '#2563eb', // Royal Blue
  secondaryColor: '#4f46e5', // Indigo
  accentColor: '#f59e0b', // Amber
  description: 'Sistema oficial R3team para Gestão & Placar de Vôlei',
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantBranding>(() => {
    // Check saved preview tenant in localStorage for quick switching during demos
    const saved = localStorage.getItem('r3play_preview_tenant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved tenant branding', e);
      }
    }
    return DEFAULT_TENANT;
  });

  const [availableTenants, setAvailableTenants] = useState<TenantBranding[]>([DEFAULT_TENANT]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Aplica as variáveis CSS dinâmicas no documento HTML (:root)
  const applyBrandingStyles = (brand: TenantBranding) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.primaryColor);
    root.style.setProperty('--brand-secondary', brand.secondaryColor);
    root.style.setProperty('--brand-accent', brand.accentColor);

    // Atualiza o título da página com o nome da empresa parceira
    document.title = `${brand.name} | R3Play`;
  };

  // Carrega os dados do tenant atual da API do backend (ou subdomínio)
  useEffect(() => {
    let isMounted = true;

    async function loadTenantData() {
      setIsLoading(true);
      try {
        // Detecta subdomínio ou query param
        const urlParams = new URLSearchParams(window.location.search);
        const queryTenant = urlParams.get('tenant');
        const fetchUrl = queryTenant ? `/api/tenant/current?tenant=${encodeURIComponent(queryTenant)}` : '/api/tenant/current';

        const [currRes, listRes] = await Promise.all([
          fetch(fetchUrl).catch(() => null),
          fetch('/api/tenant/list').catch(() => null),
        ]);

        if (currRes && currRes.ok) {
          const currData = await currRes.json();
          if (currData.success && currData.data && isMounted) {
            setTenant(currData.data);
            applyBrandingStyles(currData.data);
            localStorage.setItem('r3play_preview_tenant', JSON.stringify(currData.data));
          }
        } else {
          // Fallback seguro caso backend ainda não esteja respondendo
          applyBrandingStyles(tenant);
        }

        if (listRes && listRes.ok) {
          const listData = await listRes.json();
          if (listData.success && Array.isArray(listData.data) && isMounted) {
            setAvailableTenants(listData.data);
          }
        }
      } catch (error) {
        console.warn('Usando configuração local de tenant (fallback):', error);
        applyBrandingStyles(tenant);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTenantData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Alterna dinamicamente entre tenants cadastrados
  const switchTenant = async (subdomain: string) => {
    try {
      const res = await fetch(`/api/tenant/current?tenant=${encodeURIComponent(subdomain)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setTenant(data.data);
          applyBrandingStyles(data.data);
          localStorage.setItem('r3play_preview_tenant', JSON.stringify(data.data));
          return;
        }
      }

      // Fallback da lista local
      const found = availableTenants.find((t) => t.subdomain === subdomain);
      if (found) {
        setTenant(found);
        applyBrandingStyles(found);
        localStorage.setItem('r3play_preview_tenant', JSON.stringify(found));
      }
    } catch (e) {
      console.error('Erro ao trocar tenant:', e);
    }
  };

  // Atualiza identidade visual do tenant ativo
  const updateBranding = async (updates: Partial<TenantBranding>): Promise<boolean> => {
    try {
      const updatedTenant: TenantBranding = {
        ...tenant,
        ...updates,
      };

      // Atualiza visual imediatamente
      setTenant(updatedTenant);
      applyBrandingStyles(updatedTenant);
      localStorage.setItem('r3play_preview_tenant', JSON.stringify(updatedTenant));

      // Persiste no backend
      const res = await fetch('/api/tenant/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setTenant(data.data);
          applyBrandingStyles(data.data);
          return true;
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao persistir branding no backend:', error);
      return false;
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        availableTenants,
        switchTenant,
        updateBranding,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
};
