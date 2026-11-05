import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/authRole.js';
import { peladaStore } from '../db/peladaStore.js';
import { tenantStore } from '../db/tenantStore.js';

export const organizerRoutes = Router();

// Protege todas as rotas de organizador garantindo JWT com Role 'ORGANIZER' ou 'OWNER'
organizerRoutes.use(requireRole('ORGANIZER', 'OWNER'));

/**
 * GET /api/organizer/peladas
 * Lista todas as peladas da arena gerenciadas por este organizador
 */
organizerRoutes.get('/peladas', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const peladas = await peladaStore.listByTenant(tenantId);

    // Se for organizador, filtra as dele; se for owner da arena, vê todas
    const filtered =
      req.user?.role === 'ORGANIZER'
        ? peladas.filter((p) => p.organizerId === req.user?.userId)
        : peladas;

    res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Erro ao listar peladas do organizador:', error);
    res.status(500).json({ success: false, error: 'Erro ao carregar peladas.' });
  }
});

/**
 * POST /api/organizer/peladas
 * Cria uma nova lista de pelada com limite de participantes e modo (Quartetos/Sextetos)
 */
organizerRoutes.post('/peladas', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { title, date, location, maxParticipants, gameMode } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'Título da pelada é obrigatório (mínimo 3 caracteres).',
      });
      return;
    }

    const newPelada = await peladaStore.createPelada({
      tenantId,
      organizerId: req.user!.userId,
      organizerName: req.user!.name,
      title: title.trim(),
      date: date?.trim() || 'Hoje às 19:30',
      location: location?.trim() || 'Quadra Principal',
      maxParticipants: Number(maxParticipants) || 16,
      gameMode: gameMode === 'sextetos' ? 'sextetos' : 'quartetos',
      streamOverlayEnabled: req.user!.canUseStreamOverlay,
    });

    res.status(201).json({
      success: true,
      message: 'Lista de Pelada criada com sucesso!',
      data: newPelada,
    });
  } catch (error: any) {
    console.error('Erro ao criar pelada:', error);
    res.status(500).json({ success: false, error: error.message || 'Erro ao criar pelada.' });
  }
});

/**
 * GET /api/organizer/peladas/:id
 * Retorna detalhes da pelada, participantes e placar atual
 */
organizerRoutes.get('/peladas/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { id } = req.params;

    const pelada = await peladaStore.findById(id);
    if (!pelada || pelada.tenantId !== tenantId) {
      res.status(404).json({ success: false, error: 'Pelada não encontrada nesta arena.' });
      return;
    }

    const participants = await peladaStore.getParticipants(id, tenantId);

    res.json({
      success: true,
      data: {
        pelada,
        participants,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao obter dados da pelada.' });
  }
});

/**
 * POST /api/organizer/peladas/:id/sort-teams
 * Sorteia times justos em Quartetos (4) ou Sextetos (6) com base nos participantes confirmados
 */
organizerRoutes.post('/peladas/:id/sort-teams', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { id } = req.params;
    const { mode } = req.body; // 'quartetos' | 'sextetos'

    const sortedTeams = await peladaStore.sortTeams(id, tenantId, mode);

    res.json({
      success: true,
      message: `Times sorteados com sucesso em ${mode === 'sextetos' ? 'Sextetos (6x6)' : 'Quartetos (4x4)'}!`,
      data: sortedTeams,
    });
  } catch (error: any) {
    console.error('Erro ao sortear times:', error);
    res.status(400).json({ success: false, error: error.message || 'Erro ao sortear times.' });
  }
});

/**
 * POST /api/organizer/peladas/:id/score
 * Atualização do placar da quadra pelo celular do organizador
 * Ações: 'point_a', 'point_b', 'undo_a', 'undo_b', 'switch_serve', 'finish_set', 'reset'
 */
organizerRoutes.post('/peladas/:id/score', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { id } = req.params;
    const { action, pointsPerSet } = req.body;

    if (!action) {
      res.status(400).json({ success: false, error: 'Ação de pontuação não informada.' });
      return;
    }

    const updatedScoreboard = await peladaStore.updateScoreboard(id, tenantId, {
      type: action,
      pointsPerSet,
    });

    res.json({
      success: true,
      message: 'Placar atualizado!',
      data: updatedScoreboard,
    });
  } catch (error: any) {
    console.error('Erro ao pontuar partida:', error);
    res.status(400).json({ success: false, error: error.message || 'Erro ao atualizar placar.' });
  }
});

/**
 * DELETE /api/organizer/peladas/:id/participant/:participantId
 * Permite ao organizador remover um participante da lista (se faltar ou desistir)
 */
organizerRoutes.delete('/peladas/:id/participant/:participantId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (await tenantStore.getDefaultTenant()).id;
    const { participantId } = req.params;

    const removed = await peladaStore.removeParticipant(participantId, tenantId);
    if (!removed) {
      res.status(404).json({ success: false, error: 'Participante não encontrado.' });
      return;
    }

    res.json({
      success: true,
      message: 'Participante removido da lista.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao remover participante.' });
  }
});
