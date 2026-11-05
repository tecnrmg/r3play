import { Router, Request, Response } from 'express';
import { adminStore } from '../db/adminStore.js';
import { tenantStore } from '../db/tenantStore.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';
import {
  adminLoginSchema,
  adminChangePasswordSchema,
  updateLicenseSchema,
  updateBrandingSchema,
  createTenantSchema,
} from '../validation/schemas.js';

export const adminRoutes = Router();

/**
 * POST /api/admin/auth/login
 * Autentica o Superadmin contra a tabela admin_users com PBKDF2/Salt e proteção de força bruta
 */
adminRoutes.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const parse = adminLoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de login inválidos',
        details: parse.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parse.data;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const authResult = await adminStore.authenticate(email, password, clientIp);

    if (!authResult.user) {
      const status = authResult.blockedSeconds ? 429 : 401;
      res.status(status).json({
        success: false,
        error: authResult.error || 'Credenciais inválidas',
        remainingAttempts: authResult.remainingAttempts,
        blockedSeconds: authResult.blockedSeconds,
      });
      return;
    }

    const session = adminStore.createSession(authResult.user);

    res.json({
      success: true,
      message: `Bem-vindo, ${authResult.user.name}!`,
      token: session.token,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
      },
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Erro no login do admin:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor de autenticação' });
  }
});

/**
 * GET /api/admin/auth/me
 * Retorna dados da sessão ativa do Superadmin
 */
adminRoutes.get('/auth/me', requireAdminAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.adminSession?.adminId,
      email: req.adminSession?.email,
      name: req.adminSession?.name,
      role: req.adminSession?.role,
    },
    expiresAt: req.adminSession?.expiresAt,
  });
});

/**
 * POST /api/admin/auth/logout
 * Encerra e invalida a sessão de administrador
 */
adminRoutes.post('/auth/logout', requireAdminAuth, async (req: Request, res: Response) => {
  if (req.adminSession) {
    adminStore.destroySession(req.adminSession.token);
  }
  res.json({ success: true, message: 'Sessão encerrada com sucesso' });
});

/**
 * POST /api/admin/auth/change-password
 * Permite ao Superadmin atualizar sua senha com nova derivação de Salt/PBKDF2
 */
adminRoutes.post('/auth/change-password', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const parse = adminChangePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de senha inválidos',
        details: parse.error.flatten().fieldErrors,
      });
      return;
    }

    const { currentPassword, newPassword } = parse.data;
    const adminId = req.adminId!;

    const ok = await adminStore.updatePassword(adminId, currentPassword, newPassword);
    if (!ok) {
      res.status(400).json({ success: false, error: 'Senha atual incorreta' });
      return;
    }

    res.json({ success: true, message: 'Senha do administrador alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao trocar senha:', error);
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  }
});

/**
 * GET /api/admin/tenants
 * Lista todas as empresas/tenants com dados completos de licença para gestão de pós-venda
 */
adminRoutes.get('/tenants', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const tenants = await tenantStore.listAll();
    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error('Erro ao listar tenants para admin:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar empresas' });
  }
});

/**
 * PUT /api/admin/tenants/:id/license
 * Atualiza a licença comercial e liberação de planos de um cliente no pós-venda
 */
adminRoutes.put('/tenants/:id/license', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parse = updateLicenseSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de licença inválidos',
        details: parse.error.flatten().fieldErrors,
      });
      return;
    }

    const updated = await tenantStore.updateLicense(id, parse.data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Empresa parceira não encontrada' });
      return;
    }

    res.json({
      success: true,
      message: `Licença da empresa '${updated.name}' atualizada com sucesso no pós-venda!`,
      data: updated,
    });
  } catch (error) {
    console.error('Erro ao atualizar licença:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar licença' });
  }
});

/**
 * PUT /api/admin/tenants/:id/branding
 * Atualiza a identidade visual White Label de qualquer cliente parceiro
 */
adminRoutes.put('/tenants/:id/branding', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parse = updateBrandingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de identidade visual inválidos',
        details: parse.error.flatten().fieldErrors,
      });
      return;
    }

    const updated = await tenantStore.updateBranding(id, parse.data);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Empresa parceira não encontrada' });
      return;
    }

    res.json({
      success: true,
      message: `Identidade visual de '${updated.name}' atualizada com sucesso!`,
      data: updated,
    });
  } catch (error) {
    console.error('Erro ao atualizar branding pelo admin:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar marca' });
  }
});

/**
 * POST /api/admin/tenants
 * Cadastra uma nova empresa parceira no pós-venda diretamente pelo Superadmin
 */
adminRoutes.post('/tenants', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const parse = createTenantSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'Validação falhou para novo cliente parceiro',
        details: parse.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await tenantStore.findBySubdomain(parse.data.subdomain);
    if (existing) {
      res.status(409).json({
        success: false,
        error: `O subdomínio '${parse.data.subdomain}' já está em uso por outro cliente.`,
      });
      return;
    }

    const created = await tenantStore.create({
      name: parse.data.name,
      subdomain: parse.data.subdomain,
      customDomain: parse.data.customDomain || null,
      logoUrl: parse.data.logoUrl || null,
      faviconUrl: null,
      primaryColor: parse.data.primaryColor,
      secondaryColor: parse.data.secondaryColor,
      accentColor: parse.data.accentColor,
      description: parse.data.description || null,
      isActive: true,
      planMode: parse.data.planMode || 'pro',
      hasStreamAddon: parse.data.hasStreamAddon || false,
      licenseStatus: 'active',
      licenseExpiresAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Nova empresa parceira cadastrada com sucesso!',
      data: created,
    });
  } catch (error) {
    console.error('Erro ao criar tenant pelo admin:', error);
    res.status(500).json({ success: false, error: 'Erro ao cadastrar empresa' });
  }
});

/**
 * GET /api/admin/stats
 * Visão consolidada da infraestrutura e pós-venda
 */
adminRoutes.get('/stats', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await tenantStore.getStats();
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    res.json({
      success: true,
      data: {
        ...stats,
        system: {
          uptimeSeconds,
          nodeMemoryMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          platform: process.platform,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar estatísticas' });
  }
});
