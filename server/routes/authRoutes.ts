import { Router, Request, Response } from 'express';
import { arenaUserStore } from '../db/arenaUserStore.js';
import { signToken } from '../auth/jwt.js';
import { authenticateJwt } from '../middleware/authRole.js';

export const authRoutes = Router();

/**
 * POST /api/auth/login
 * Realiza login para Dono da Arena (OWNER) ou Organizador (ORGANIZER)
 * Retorna JWT assinado com a Role e tenantId correspondente
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'E-mail e senha são obrigatórios.',
      });
      return;
    }

    const user = await arenaUserStore.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas. Usuário não encontrado.',
      });
      return;
    }

    const isMatch = arenaUserStore.verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas. Senha incorreta.',
      });
      return;
    }

    // Gera o token JWT com a Role autorizada
    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      canUseStreamOverlay: user.canUseStreamOverlay,
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        token,
        user: {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          email: user.email,
          role: user.role,
          canUseStreamOverlay: user.canUseStreamOverlay,
        },
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: 'Erro interno no servidor de autenticação.' });
  }
});

/**
 * GET /api/auth/demo-accounts
 * Fornece credenciais e atalhos de demonstração para o tenant atual
 */
authRoutes.get('/demo-accounts', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || '00000000-0000-0000-0000-000000000002';
    const accounts = await arenaUserStore.getDemoAccounts(tenantId);
    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao listar contas de teste.' });
  }
});

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado no token JWT
 */
authRoutes.get('/me', authenticateJwt, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Não autenticado.' });
    return;
  }

  const dbUser = await arenaUserStore.findById(req.user.userId);

  res.json({
    success: true,
    data: {
      ...req.user,
      canUseStreamOverlay: dbUser ? dbUser.canUseStreamOverlay : req.user.canUseStreamOverlay,
    },
  });
});
