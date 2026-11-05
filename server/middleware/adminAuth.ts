import { Request, Response, NextFunction } from 'express';
import { adminStore } from '../db/adminStore.js';
import { AdminSession } from '../db/types.js';

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSession;
      adminId?: string;
    }
  }
}

/**
 * Middleware para Proteger Rotas do Painel de Administrador
 * Exige token de sessão Bearer válido gerado no login contra o banco de dados
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.headers['x-admin-token'] === 'string') {
    token = req.headers['x-admin-token'].trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Acesso negado. Esta área é restrita aos administradores da plataforma R3Play.',
    });
    return;
  }

  const session = adminStore.validateSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Sessão de administrador expirada ou inválida. Por favor, faça login novamente.',
    });
    return;
  }

  req.adminSession = session;
  req.adminId = session.adminId;
  next();
}
