import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../auth/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware para Autenticação JWT Opcional ou Obrigatória
 */
export function authenticateJwt(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.headers['x-auth-token'] === 'string') {
    token = req.headers['x-auth-token'].trim();
  } else if (typeof req.query.token === 'string') {
    token = req.query.token.trim();
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Middleware de Proteção por Função (RBAC):
 * Garante que o usuário possua um JWT válido E uma das 'roles' autorizadas.
 * Também valida o isolamento multi-tenant (o tenantId do token deve corresponder ao da requisição).
 */
export function requireRole(...allowedRoles: Array<'OWNER' | 'ORGANIZER' | 'PLAYER' | 'SUPERADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.headers['x-auth-token'] === 'string') {
      token = req.headers['x-auth-token'].trim();
    } else if (typeof req.query.token === 'string') {
      token = req.query.token.trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token JWT ausente. Acesso não autorizado.',
        code: 'AUTH_TOKEN_MISSING',
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Token JWT expirado ou inválido. Por favor, realize novo login.',
        code: 'AUTH_TOKEN_INVALID',
      });
      return;
    }

    // Verifica a Role do Token
    if (!allowedRoles.includes(payload.role) && payload.role !== 'SUPERADMIN') {
      res.status(403).json({
        success: false,
        error: `Acesso negado. Sua função ('${payload.role}') não tem permissão para esta rota. Requer: [${allowedRoles.join(', ')}].`,
        code: 'FORBIDDEN_ROLE',
      });
      return;
    }

    // Isolamento Multi-tenant: Verifica se o usuário pertence à Arena (tenant) atual
    if (req.tenantId && payload.role !== 'SUPERADMIN' && payload.tenantId !== req.tenantId) {
      res.status(403).json({
        success: false,
        error: 'Violação de isolamento multi-tenant: você não possui acesso aos dados desta arena.',
        code: 'TENANT_MISMATCH',
      });
      return;
    }

    req.user = payload;
    next();
  };
}
