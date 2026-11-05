import { Request, Response, NextFunction } from 'express';
import { tenantStore } from '../db/tenantStore.js';
import { Tenant } from '../db/types.js';

// Estende a interface Request do Express para incluir o Tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
    }
  }
}

/**
 * Utilitário para extrair o subdomínio da requisição
 * Trata proxy Nginx do Easypanel (X-Forwarded-Host), Hosts locais e parâmetro de teste.
 */
export function extractSubdomain(req: Request): string | null {
  // 1. Prioridade para parâmetro explícito em query string (útil para testes de preview e desenvolvimento)
  if (typeof req.query.tenant === 'string' && req.query.tenant.trim()) {
    return req.query.tenant.trim().toLowerCase();
  }

  // 2. Header customizado caso o cliente passe (ex: mobile app ou API client)
  const headerTenant = req.headers['x-tenant-id'] || req.headers['x-tenant-subdomain'];
  if (typeof headerTenant === 'string' && headerTenant.trim()) {
    return headerTenant.trim().toLowerCase();
  }

  // 3. Extração via Hostname real da URL (através do Nginx ou direto)
  const rawHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  // Remove porta caso exista (ex: localhost:3000 -> localhost)
  const host = rawHost.split(':')[0].toLowerCase();

  // Se for IP, localhost direto ou vazio, não há subdomínio de tenant
  if (!host || host === 'localhost' || host === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return null;
  }

  const parts = host.split('.');

  // Exemplo: arena1.r3play.com.br -> ['arena1', 'r3play', 'com', 'br']
  // Exemplo: arena1.localhost -> ['arena1', 'localhost']
  if (parts.length >= 3 && !parts[0].startsWith('www')) {
    return parts[0];
  }

  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  return null;
}

/**
 * Middleware Express para identificar e validar o Tenant (Empresa) na requisição
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const subdomain = extractSubdomain(req);

    if (subdomain) {
      const tenant = await tenantStore.findBySubdomain(subdomain);
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
        return next();
      }
    }

    // Fallback: Se não encontrou subdomínio específico ou é domínio principal (ex: r3play.com.br), usa o padrão
    const defaultTenant = await tenantStore.getDefaultTenant();
    req.tenant = defaultTenant;
    req.tenantId = defaultTenant.id;
    return next();
  } catch (error) {
    console.error('Erro no Tenant Middleware:', error);
    next(error);
  }
}

/**
 * Middleware de Segurança: Garante Isolamento de Dados
 * Impede que uma requisição acerte dados de outro tenant_id
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  const currentTenantId = req.tenantId;

  if (!currentTenantId) {
    res.status(403).json({
      error: 'Tenant não identificado. Acesso não autorizado ao recurso.',
    });
    return;
  }

  // Se o body ou params contiver um tenantId diferente do validado pelo middleware, rejeita
  const requestedTenantId = req.body?.tenantId || req.query?.tenantId || req.params?.tenantId;
  if (requestedTenantId && requestedTenantId !== currentTenantId) {
    res.status(403).json({
      error: 'Violação de Segurança Multi-tenant: tentativa de acesso a dados de outra empresa.',
    });
    return;
  }

  next();
}
