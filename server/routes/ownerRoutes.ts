import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/authRole.js';
import { arenaUserStore } from '../db/arenaUserStore.js';
import { tenantStore } from '../db/tenantStore.js';
import { peladaStore } from '../db/peladaStore.js';

export const ownerRoutes = Router();

// Protege todas as rotas do Dono da Arena exigindo JWT com Role 'OWNER'
ownerRoutes.use(requireRole('OWNER'));

/**
 * GET /api/owner/overview
 * Retorna visão geral de licenças da Arena, cotas de Stream OBS e métricas
 */
ownerRoutes.get('/overview', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const tenant = await tenantStore.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Arena não encontrada.' });
      return;
    }

    const streamLicense = await arenaUserStore.getStreamLicenseStatus(tenantId);
    const organizers = await arenaUserStore.listOrganizers(tenantId);
    const peladas = await peladaStore.listByTenant(tenantId);

    res.json({
      success: true,
      data: {
        arena: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          planMode: tenant.planMode,
          hasStreamAddon: tenant.hasStreamAddon,
          licenseStatus: tenant.licenseStatus,
        },
        streamLicense,
        totalOrganizers: organizers.length,
        totalPeladas: peladas.length,
        organizers,
      },
    });
  } catch (error) {
    console.error('Erro ao carregar visão geral do dono:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar dados da arena.' });
  }
});

/**
 * GET /api/owner/organizers
 * Lista todos os organizadores parceiros vinculados a esta Arena
 */
ownerRoutes.get('/organizers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const organizers = await arenaUserStore.listOrganizers(tenantId);

    res.json({
      success: true,
      data: organizers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao listar organizadores.' });
  }
});

/**
 * POST /api/owner/organizers
 * Formulário para cadastrar um novo Organizador (Nome, E-mail) gerando acesso
 * vinculado ao ID da Arena dele (tenant_id).
 */
ownerRoutes.post('/organizers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { name, email, phone, password, canUseStreamOverlay } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'Nome do organizador é obrigatório (mínimo 3 caracteres).',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'E-mail válido é obrigatório para gerar o acesso do organizador.',
      });
      return;
    }

    // Se solicitou stream addon, valida se a arena possui licença
    if (canUseStreamOverlay) {
      const streamStatus = await arenaUserStore.getStreamLicenseStatus(tenantId);
      if (!streamStatus.tenantHasStreamLicense) {
        res.status(400).json({
          success: false,
          error: 'Sua arena não possui a licença de Transmissão (Overlay OBS) ativa. Você pode criá-lo sem stream ou solicitar a licença à R3team.',
        });
        return;
      }
      if (streamStatus.availableSlots <= 0) {
        res.status(400).json({
          success: false,
          error: 'Todas as suas licenças avulsas de Stream OBS já estão atribuídas a outros organizadores.',
        });
        return;
      }
    }

    const createdOrganizer = await arenaUserStore.createOrganizer({
      tenantId, // Vinculado ao ID da Arena de forma estrita!
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      password: password?.trim() || 'Organizador2025!',
      canUseStreamOverlay: !!canUseStreamOverlay,
    });

    res.status(201).json({
      success: true,
      message: `Organizador ${createdOrganizer.name} cadastrado com sucesso e vinculado à arena!`,
      data: createdOrganizer,
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar organizador:', error);
    res.status(400).json({ success: false, error: error.message || 'Erro ao cadastrar organizador.' });
  }
});

/**
 * PATCH /api/owner/organizers/:id/stream-permission
 * Ativar/desativar o uso do "Overlay de Transmissão (OBS)" para as peladas
 * dos seus organizadores parceiros, baseado nas licenças avulsas que a arena possui.
 */
ownerRoutes.patch('/organizers/:id/stream-permission', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { id } = req.params;
    const { canUseStreamOverlay } = req.body;

    if (typeof canUseStreamOverlay !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'O parâmetro canUseStreamOverlay (boolean) é obrigatório.',
      });
      return;
    }

    // Se está ativando, confere slots disponíveis
    if (canUseStreamOverlay) {
      const streamStatus = await arenaUserStore.getStreamLicenseStatus(tenantId);
      if (!streamStatus.tenantHasStreamLicense) {
        res.status(403).json({
          success: false,
          error: 'Sua arena não possui o pacote de Transmissão Ao Vivo contratado.',
        });
        return;
      }
      if (streamStatus.availableSlots <= 0) {
        res.status(400).json({
          success: false,
          error: `Limite de ${streamStatus.totalSlots} licenças OBS atingido. Desative de outro organizador para transferir.`,
        });
        return;
      }
    }

    const success = await arenaUserStore.updateStreamPermission(id, tenantId, canUseStreamOverlay);
    if (!success) {
      res.status(404).json({ success: false, error: 'Organizador não encontrado nesta arena.' });
      return;
    }

    const updatedLicense = await arenaUserStore.getStreamLicenseStatus(tenantId);

    res.json({
      success: true,
      message: canUseStreamOverlay
        ? 'Licença de Overlay OBS ativada para o organizador!'
        : 'Licença de Overlay OBS desativada para o organizador.',
      data: {
        organizerId: id,
        canUseStreamOverlay,
        streamLicense: updatedLicense,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar permissão de stream:', error);
    res.status(400).json({ success: false, error: error.message || 'Erro ao alterar permissão.' });
  }
});
