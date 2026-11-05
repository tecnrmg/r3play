import { Router, Request, Response } from 'express';
import { peladaStore } from '../db/peladaStore.js';
import { tenantStore } from '../db/tenantStore.js';

export const peladaRoutes = Router();

/**
 * 1. JOGADOR COMUM (Role: 'PLAYER')
 * Rota pública: GET /api/pelada/:id
 * O jogador visualiza o Placar ao Vivo do vôlei e a lista de presença da pelada.
 */
peladaRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentTenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;

    const pelada = await peladaStore.findById(id);
    if (!pelada) {
      res.status(404).json({
        success: false,
        error: 'Pelada não encontrada.',
      });
      return;
    }

    // Validação de isolamento: pelada deve pertencer à arena (tenant) atual
    if (pelada.tenantId !== currentTenantId) {
      res.status(403).json({
        success: false,
        error: 'Esta pelada pertence a outra arena parceira.',
      });
      return;
    }

    const participants = await peladaStore.getParticipants(id, currentTenantId);
    const tenant = req.tenant || (await tenantStore.findById(currentTenantId));

    res.json({
      success: true,
      data: {
        pelada,
        participants,
        tenantBranding: tenant ? tenantStore.toPublicBranding(tenant) : null,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pelada pública:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao carregar a pelada.' });
  }
});

/**
 * 1. JOGADOR COMUM (Role: 'PLAYER')
 * POST /api/pelada/:id/participate
 * Botão "Participar da Lista". Insere o jogador na tabela 'matches_participants'
 * vinculando ao tenant_id atual de forma segura.
 */
peladaRoutes.post('/:id/participate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, position } = req.body;
    const currentTenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Por favor, informe seu Nome Completo (mínimo 2 caracteres).',
      });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 8) {
      res.status(400).json({
        success: false,
        error: 'Por favor, informe um WhatsApp válido para confirmação.',
      });
      return;
    }

    // Insere com segurança garantindo o tenantId da requisição
    const newParticipant = await peladaStore.addParticipant({
      peladaId: id,
      tenantId: currentTenantId,
      name: name.trim(),
      phone: phone.trim(),
      position: position?.trim(),
    });

    const updatedParticipants = await peladaStore.getParticipants(id, currentTenantId);

    res.status(201).json({
      success: true,
      message:
        newParticipant.status === 'confirmed'
          ? 'Presença confirmada com sucesso! Seu nome já está na lista da pelada.'
          : 'Limite de vagas atingido! Seu nome foi incluído na lista de espera.',
      data: {
        participant: newParticipant,
        participants: updatedParticipants,
      },
    });
  } catch (error: any) {
    console.error('Erro ao adicionar participante:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao registrar participação.',
    });
  }
});
