import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { tenantMiddleware } from './server/middleware/tenant.js';
import { tenantRoutes } from './server/routes/tenantRoutes.js';
import { adminRoutes } from './server/routes/adminRoutes.js';
import { authRoutes } from './server/routes/authRoutes.js';
import { peladaRoutes } from './server/routes/peladaRoutes.js';
import { organizerRoutes } from './server/routes/organizerRoutes.js';
import { ownerRoutes } from './server/routes/ownerRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Otimização de Proxy para Nginx do Easypanel:
  // Permite ler headers X-Forwarded-For, X-Forwarded-Proto e X-Forwarded-Host corretamente
  app.set('trust proxy', 1);

  // 2. Headers de Segurança Essenciais (Defense-in-depth)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // 3. Proteção de Memória: Limite razoável para payloads JSON (previne DoS por estouro de heap na VPS de 4GB)
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 4. Middleware Multi-tenant: Identifica o subdomínio da requisição
  app.use(tenantMiddleware);

  // 5. Rotas de API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'R3Play Multi-tenant Engine',
      tenant: req.tenant?.subdomain || 'default',
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    });
  });

  // Rotas do White Label / Tenant
  app.use('/api/tenant', tenantRoutes);

  // Rotas Seguras de Administração do Superadmin
  app.use('/api/admin', adminRoutes);

  // Rotas de Autenticação JWT (Dono da Arena & Organizador)
  app.use('/api/auth', authRoutes);

  // 1. JOGADOR COMUM (Role: 'PLAYER'): Rota pública /pelada/:id e lista de presença
  app.use('/api/pelada', peladaRoutes);

  // 2. ORGANIZADOR DE LISTA (Role: 'ORGANIZER'): Peladas, Sorteio justo e Placar Mobile
  app.use('/api/organizer', organizerRoutes);

  // 3. DONO DA QUADRA / ARENA (Role: 'OWNER'): Gestão de Organizadores e Subvenda Stream OBS
  app.use('/api/owner', ownerRoutes);

  // 6. Integração com Vite (Desenvolvimento vs. Produção Estática)
  if (process.env.NODE_ENV !== 'production') {
    // Modo Desenvolvimento: Middleware Vite com recarga rápida
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo Produção na VPS: Serve os arquivos estáticos compilados em 'dist'
    const distPath = path.join(process.cwd(), 'dist');

    // Cache agressivo para assets imutáveis gerados pelo Vite (com hash no nome)
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      })
    );

    // Servidor estático geral para favicon, manifest, etc.
    app.use(
      express.static(distPath, {
        maxAge: '1h',
        index: false,
      })
    );

    // Fallback SPA: Qualquer rota não reconhecida serve o index.html com no-cache
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[R3Play] Servidor Multi-tenant ativo em http://0.0.0.0:${PORT}`);
  });

  // 6. Graceful Shutdown para Easypanel / Docker / Linux
  // Fecha conexões limpas ao reiniciar ou fazer redeploy
  const shutdown = (signal: string) => {
    console.log(`[R3Play] Recebido ${signal}. Encerrando servidor graciosamente...`);
    server.close(() => {
      console.log('[R3Play] Servidor encerrado com sucesso.');
      process.exit(0);
    });

    // Força encerramento após 10 segundos caso conexões fiquem presas
    setTimeout(() => {
      console.error('[R3Play] Encerramento forçado por timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[R3Play] Falha fatal ao iniciar o servidor:', err);
  process.exit(1);
});
