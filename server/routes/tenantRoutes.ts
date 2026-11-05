import { Router, Request, Response } from 'express';
import { tenantStore } from '../db/tenantStore.js';
import { createTenantSchema, updateBrandingSchema } from '../validation/schemas.js';

export const tenantRoutes = Router();

/**
 * GET /api/tenant/current
 * Retorna as informações de marca e estilização da empresa atual baseado no subdomínio
 */
tenantRoutes.get('/current', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant || (await tenantStore.getDefaultTenant());
    const branding = tenantStore.toPublicBranding(tenant);

    res.json({
      success: true,
      data: branding,
    });
  } catch (error) {
    console.error('Erro ao obter branding do tenant atual:', error);
    res.status(500).json({ success: false, error: 'Falha interna ao carregar identidade visual da empresa' });
  }
});

/**
 * GET /api/tenant/list
 * Lista todas as empresas parceiras cadastradas (útil para o simulador White Label no frontend)
 */
tenantRoutes.get('/list', async (req: Request, res: Response) => {
  try {
    const all = await tenantStore.listAll();
    const publicList = all.map((t) => tenantStore.toPublicBranding(t));

    res.json({
      success: true,
      data: publicList,
    });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ success: false, error: 'Falha ao listar empresas' });
  }
});

/**
 * POST /api/tenant/branding
 * Atualiza a identidade visual (Cores, Logo, Nome) do tenant autenticado/atual
 * Validado com Zod para proteção contra Mass Assignment
 */
tenantRoutes.post('/branding', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Empresa não encontrada' });
      return;
    }

    // Validação estrita com Zod (rejeita campos não permitidos)
    const parseResult = updateBrandingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de customização visual inválidos',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const updated = await tenantStore.updateBranding(tenant.id, parseResult.data);
    if (!updated) {
      res.status(500).json({ success: false, error: 'Erro ao persistir nova identidade visual' });
      return;
    }

    res.json({
      success: true,
      message: 'Identidade visual atualizada com sucesso!',
      data: tenantStore.toPublicBranding(updated),
    });
  } catch (error) {
    console.error('Erro ao atualizar branding:', error);
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  }
});

/**
 * POST /api/tenant/create
 * Cadastra uma nova empresa parceira White Label
 */
tenantRoutes.post('/create', async (req: Request, res: Response) => {
  try {
    // Validação estrita com Zod
    const parseResult = createTenantSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validação falhou para novo cliente White Label',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    // Verifica se subdomínio já existe
    const existing = await tenantStore.findBySubdomain(parseResult.data.subdomain);
    if (existing) {
      res.status(409).json({
        success: false,
        error: `O subdomínio '${parseResult.data.subdomain}' já está em uso por outro cliente.`,
      });
      return;
    }

    const created = await tenantStore.create({
      ...parseResult.data,
      customDomain: parseResult.data.customDomain || null,
      logoUrl: parseResult.data.logoUrl || null,
      faviconUrl: null,
      description: parseResult.data.description || null,
      isActive: true,
      planMode: parseResult.data.planMode || 'pro',
      hasStreamAddon: parseResult.data.hasStreamAddon || false,
      licenseStatus: 'active',
      licenseExpiresAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Empresa parceira cadastrada com sucesso!',
      data: tenantStore.toPublicBranding(created),
    });
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  }
});
