import { Router, Request, Response } from 'express';

// Estrutura do estado da partida em tempo real na memória do servidor
let currentLiveMatch: any = null;
let currentTenantId: string = '00000000-0000-0000-0000-000000000002'; // default arena

// Lista de clientes conectados ouvindo eventos em tempo real (SSE)
interface SSEClient {
  id: string;
  res: Response;
  tenantId?: string;
}

const sseClients: SSEClient[] = [];

export const matchLiveRoutes = Router();

/**
 * GET /api/match/live
 * Retorna o estado atual da partida no servidor
 */
matchLiveRoutes.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: currentLiveMatch,
    timestamp: Date.now(),
  });
});

/**
 * POST /api/match/live
 * Atualiza o placar e envia broadcast para todos os aparelhos conectados (Smart TV, celulares, etc.)
 */
matchLiveRoutes.post('/live', (req: Request, res: Response) => {
  const matchData = req.body;
  if (!matchData) {
    res.status(400).json({ success: false, error: 'Dados da partida não enviados' });
    return;
  }

  currentLiveMatch = matchData;
  const tenantId = req.tenantId || req.headers['x-tenant-id'] || 'default';

  // Broadcast instantâneo via SSE para todas as telas (Smart TV, etc.)
  const eventPayload = `data: ${JSON.stringify({ type: 'MATCH_UPDATED', match: currentLiveMatch, timestamp: Date.now() })}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.res.write(eventPayload);
    } catch (err) {
      // Ignora erro de cliente que desconectou
    }
  });

  res.json({
    success: true,
    message: 'Placar sincronizado com sucesso!',
    timestamp: Date.now(),
  });
});

/**
 * GET /api/match/events (Server-Sent Events - SSE)
 * Conexão persistente de latência zero para Smart TVs e outros smartphones.
 * Não precisa de WebSockets complicados, funciona em qualquer navegador de Smart TV (Tizen, WebOS, Android TV).
 */
matchLiveRoutes.get('/events', (req: Request, res: Response) => {
  // Headers obrigatórios para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desativa buffer de proxy Nginx

  // Envia estado inicial imediato se existir
  if (currentLiveMatch) {
    res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', match: currentLiveMatch, timestamp: Date.now() })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`);
  }

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Heartbeat a cada 15 segundos para manter a conexão aberta na TV
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Remove cliente ao desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    const index = sseClients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});
