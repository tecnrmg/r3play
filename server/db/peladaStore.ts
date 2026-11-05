export interface MatchParticipant {
  id: string;
  peladaId: string;
  tenantId: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'waiting_list';
  position?: string;
  createdAt: string;
}

export interface TeamSorted {
  name: string;
  color: string;
  badge: string;
  players: Array<{
    id: string;
    name: string;
    phone?: string;
  }>;
}

export interface SetHistoryEntry {
  setNumber: number;
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B';
}

export interface PeladaScoreboard {
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  currentSet: number;
  servingTeam: 'A' | 'B';
  setHistory: SetHistoryEntry[];
}

export interface Pelada {
  id: string;
  tenantId: string;
  organizerId: string;
  organizerName: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  gameMode: 'quartetos' | 'sextetos';
  status: 'open' | 'in_progress' | 'finished';
  scoreboard: PeladaScoreboard;
  teams: TeamSorted[];
  streamOverlayEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cores e nomes elegantes para sorteio de times de vôlei
const TEAM_CONFIGS = [
  { name: 'Time Amarelo', color: '#eab308', badge: '🟡' },
  { name: 'Time Azul', color: '#3b82f6', badge: '🔵' },
  { name: 'Time Verde', color: '#10b981', badge: '🟢' },
  { name: 'Time Laranja', color: '#f97316', badge: '🟠' },
  { name: 'Time Roxo', color: '#a855f7', badge: '🟣' },
  { name: 'Time Vermelho', color: '#ef4444', badge: '🔴' },
];

/**
 * Função TypeScript justa para sortear times de vôlei (Quartetos ou Sextetos)
 * Utiliza o algoritmo Fisher-Yates com distribuição equilibrada de vagas e reservas
 */
export function sortVolleyballTeams(
  participants: MatchParticipant[],
  mode: 'quartetos' | 'sextetos'
): TeamSorted[] {
  const confirmed = participants.filter((p) => p.status === 'confirmed');
  if (confirmed.length === 0) return [];

  const teamSize = mode === 'quartetos' ? 4 : 6;

  // Embaralhamento determinístico e justo (Fisher-Yates)
  const shuffled = [...confirmed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Calcula número ideal de times
  const numTeams = Math.max(2, Math.floor(shuffled.length / teamSize));
  const teams: TeamSorted[] = [];

  for (let i = 0; i < numTeams; i++) {
    const config = TEAM_CONFIGS[i % TEAM_CONFIGS.length];
    teams.push({
      name: `${config.name} (${i + 1})`,
      color: config.color,
      badge: config.badge,
      players: [],
    });
  }

  // Distribuição round-robin justa de cada jogador
  shuffled.forEach((player, index) => {
    const targetTeam = teams[index % numTeams];
    targetTeam.players.push({
      id: player.id,
      name: player.name,
      phone: player.phone,
    });
  });

  return teams;
}

// Tabela de Peladas (Matches) em memória
const peladasTable: Pelada[] = [
  {
    id: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002', // Arena Vôlei Brasil
    organizerId: 'user-org-arena1',
    organizerName: 'Lucas Silva',
    title: 'Pelada de Terça Noturna - Areia Quadra 1',
    date: 'Terça-feira, 19:30',
    location: 'Quadra Central (Areia)',
    maxParticipants: 16,
    gameMode: 'quartetos',
    status: 'open',
    streamOverlayEnabled: true,
    scoreboard: {
      teamAName: 'Time Amarelo',
      teamBName: 'Time Azul',
      scoreA: 18,
      scoreB: 15,
      setsA: 1,
      setsB: 0,
      currentSet: 2,
      servingTeam: 'A',
      setHistory: [{ setNumber: 1, scoreA: 25, scoreB: 21, winner: 'A' }],
    },
    teams: [
      {
        name: 'Time Amarelo',
        color: '#eab308',
        badge: '🟡',
        players: [
          { id: 'part-1', name: 'Lucas Silva' },
          { id: 'part-2', name: 'Marcos Souza' },
          { id: 'part-3', name: 'Rodrigo Teixeira' },
          { id: 'part-4', name: 'Felipe Santos' },
        ],
      },
      {
        name: 'Time Azul',
        color: '#3b82f6',
        badge: '🔵',
        players: [
          { id: 'part-5', name: 'Gabriel Costa' },
          { id: 'part-6', name: 'Bruno Oliveira' },
          { id: 'part-7', name: 'Rafael Mendes' },
          { id: 'part-8', name: 'Thiago Nogueira' },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pelada-arena1-02',
    tenantId: '00000000-0000-0000-0000-000000000002',
    organizerId: 'user-org-arena1',
    organizerName: 'Lucas Silva',
    title: 'Racha de Sexta Misto - Quadra Coberta',
    date: 'Sexta-feira, 20:00',
    location: 'Quadra 2 (Piso Polímero)',
    maxParticipants: 24,
    gameMode: 'sextetos',
    status: 'open',
    streamOverlayEnabled: true,
    scoreboard: {
      teamAName: 'Time Verde',
      teamBName: 'Time Laranja',
      scoreA: 8,
      scoreB: 11,
      setsA: 0,
      setsB: 0,
      currentSet: 1,
      servingTeam: 'B',
      setHistory: [],
    },
    teams: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pelada-r3play-01',
    tenantId: '00000000-0000-0000-0000-000000000001', // R3Play Oficial
    organizerId: 'user-org-r3play',
    organizerName: 'Thiago Martins',
    title: 'Treino Oficial & Pelada Aberta',
    date: 'Quinta-feira, 19:00',
    location: 'Arena Central',
    maxParticipants: 16,
    gameMode: 'quartetos',
    status: 'open',
    streamOverlayEnabled: true,
    scoreboard: {
      teamAName: 'Time Alpha',
      teamBName: 'Time Beta',
      scoreA: 12,
      scoreB: 12,
      setsA: 0,
      setsB: 0,
      currentSet: 1,
      servingTeam: 'A',
      setHistory: [],
    },
    teams: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Tabela matches_participants em memória
const participantsTable: MatchParticipant[] = [
  {
    id: 'part-1',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Lucas Silva',
    phone: '(11) 99887-6655',
    status: 'confirmed',
    position: 'Levantador',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'part-2',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Marcos Souza',
    phone: '(11) 98111-2233',
    status: 'confirmed',
    position: 'Ponteiro',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'part-3',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Rodrigo Teixeira',
    phone: '(11) 97222-3344',
    status: 'confirmed',
    position: 'Central',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'part-4',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Felipe Santos',
    phone: '(11) 96333-4455',
    status: 'confirmed',
    position: 'Oposto',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'part-5',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Gabriel Costa',
    phone: '(11) 95444-5566',
    status: 'confirmed',
    position: 'Líbero',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'part-6',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Bruno Oliveira',
    phone: '(11) 94555-6677',
    status: 'confirmed',
    position: 'Ponteiro',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'part-7',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Rafael Mendes',
    phone: '(11) 93666-7788',
    status: 'confirmed',
    position: 'Central',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'part-8',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Thiago Nogueira',
    phone: '(11) 92777-8899',
    status: 'confirmed',
    position: 'Levantador',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'part-9',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Alexandre Pires',
    phone: '(11) 91888-9900',
    status: 'confirmed',
    position: 'Ponteiro',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-10',
    peladaId: 'pelada-arena1-01',
    tenantId: '00000000-0000-0000-0000-000000000002',
    name: 'Diego Ramos',
    phone: '(11) 90999-0011',
    status: 'confirmed',
    position: 'Universal',
    createdAt: new Date().toISOString(),
  },
];

export const peladaStore = {
  async findById(id: string): Promise<Pelada | null> {
    const pelada = peladasTable.find((p) => p.id === id);
    return pelada || null;
  },

  async listByTenant(tenantId: string): Promise<Pelada[]> {
    return peladasTable.filter((p) => p.tenantId === tenantId);
  },

  async createPelada(data: {
    tenantId: string;
    organizerId: string;
    organizerName: string;
    title: string;
    date: string;
    location: string;
    maxParticipants: number;
    gameMode: 'quartetos' | 'sextetos';
    streamOverlayEnabled?: boolean;
  }): Promise<Pelada> {
    const newPelada: Pelada = {
      id: `pelada-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: data.tenantId,
      organizerId: data.organizerId,
      organizerName: data.organizerName,
      title: data.title.trim(),
      date: data.date.trim(),
      location: data.location.trim(),
      maxParticipants: data.maxParticipants || 16,
      gameMode: data.gameMode || 'quartetos',
      status: 'open',
      streamOverlayEnabled: !!data.streamOverlayEnabled,
      scoreboard: {
        teamAName: 'Time 1',
        teamBName: 'Time 2',
        scoreA: 0,
        scoreB: 0,
        setsA: 0,
        setsB: 0,
        currentSet: 1,
        servingTeam: 'A',
        setHistory: [],
      },
      teams: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    peladasTable.unshift(newPelada);
    return newPelada;
  },

  async getParticipants(peladaId: string, tenantId: string): Promise<MatchParticipant[]> {
    return participantsTable.filter(
      (p) => p.peladaId === peladaId && p.tenantId === tenantId
    );
  },

  /**
   * Insere um jogador na tabela 'matches_participants' vinculando ao tenant_id atual de forma segura
   */
  async addParticipant(data: {
    peladaId: string;
    tenantId: string;
    name: string;
    phone: string;
    position?: string;
  }): Promise<MatchParticipant> {
    const pelada = await this.findById(data.peladaId);
    if (!pelada) {
      throw new Error('Pelada não encontrada.');
    }

    if (pelada.tenantId !== data.tenantId) {
      throw new Error('Violação de segurança: pelada não pertence à arena atual.');
    }

    const currentParticipants = participantsTable.filter(
      (p) => p.peladaId === data.peladaId && p.tenantId === data.tenantId
    );

    // Evita duplicidade de telefone na mesma pelada
    const cleanPhone = data.phone.replace(/\D/g, '');
    const alreadyRegistered = currentParticipants.some(
      (p) => p.phone.replace(/\D/g, '') === cleanPhone
    );
    if (alreadyRegistered) {
      throw new Error('Este número de WhatsApp já está cadastrado nesta pelada.');
    }

    // Se já atingiu o limite de participantes, vai para a lista de espera
    const confirmedCount = currentParticipants.filter((p) => p.status === 'confirmed').length;
    const isWaitingList = confirmedCount >= pelada.maxParticipants;

    const newParticipant: MatchParticipant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      peladaId: data.peladaId,
      tenantId: data.tenantId, // Vinculado ao tenant_id atual de forma segura!
      name: data.name.trim(),
      phone: data.phone.trim(),
      position: data.position?.trim() || 'Geral',
      status: isWaitingList ? 'waiting_list' : 'confirmed',
      createdAt: new Date().toISOString(),
    };

    participantsTable.push(newParticipant);
    return newParticipant;
  },

  async removeParticipant(participantId: string, tenantId: string): Promise<boolean> {
    const index = participantsTable.findIndex(
      (p) => p.id === participantId && p.tenantId === tenantId
    );
    if (index === -1) return false;

    const removed = participantsTable.splice(index, 1)[0];

    // Se havia alguém na lista de espera para essa pelada, promove para confirmado
    const nextInLine = participantsTable.find(
      (p) => p.peladaId === removed.peladaId && p.tenantId === tenantId && p.status === 'waiting_list'
    );
    if (nextInLine) {
      nextInLine.status = 'confirmed';
    }

    return true;
  },

  /**
   * Realiza o sorteio justo dos times da pelada
   */
  async sortTeams(peladaId: string, tenantId: string, mode?: 'quartetos' | 'sextetos'): Promise<TeamSorted[]> {
    const pelada = await this.findById(peladaId);
    if (!pelada || pelada.tenantId !== tenantId) {
      throw new Error('Pelada não encontrada ou não autorizada para esta arena.');
    }

    const participants = await this.getParticipants(peladaId, tenantId);
    const targetMode = mode || pelada.gameMode;
    const sorted = sortVolleyballTeams(participants, targetMode);

    pelada.teams = sorted;
    if (sorted.length >= 2) {
      pelada.scoreboard.teamAName = sorted[0].name;
      pelada.scoreboard.teamBName = sorted[1].name;
    }
    pelada.updatedAt = new Date().toISOString();

    return sorted;
  },

  /**
   * Atualização de placar em tempo real pelo celular do organizador
   */
  async updateScoreboard(
    peladaId: string,
    tenantId: string,
    action: {
      type: 'point_a' | 'point_b' | 'undo_a' | 'undo_b' | 'switch_serve' | 'finish_set' | 'reset';
      pointsPerSet?: number;
    }
  ): Promise<PeladaScoreboard> {
    const pelada = await this.findById(peladaId);
    if (!pelada || pelada.tenantId !== tenantId) {
      throw new Error('Pelada não encontrada nesta arena.');
    }

    const sc = pelada.scoreboard;
    const minPoints = action.pointsPerSet || 25;

    switch (action.type) {
      case 'point_a':
        sc.scoreA += 1;
        sc.servingTeam = 'A';
        break;

      case 'point_b':
        sc.scoreB += 1;
        sc.servingTeam = 'B';
        break;

      case 'undo_a':
        if (sc.scoreA > 0) sc.scoreA -= 1;
        break;

      case 'undo_b':
        if (sc.scoreB > 0) sc.scoreB -= 1;
        break;

      case 'switch_serve':
        sc.servingTeam = sc.servingTeam === 'A' ? 'B' : 'A';
        break;

      case 'finish_set':
        // Registra set vencedor
        const winner: 'A' | 'B' = sc.scoreA > sc.scoreB ? 'A' : 'B';
        sc.setHistory.push({
          setNumber: sc.currentSet,
          scoreA: sc.scoreA,
          scoreB: sc.scoreB,
          winner,
        });

        if (winner === 'A') sc.setsA += 1;
        else sc.setsB += 1;

        // Inicia próximo set
        sc.currentSet += 1;
        sc.scoreA = 0;
        sc.scoreB = 0;
        break;

      case 'reset':
        sc.scoreA = 0;
        sc.scoreB = 0;
        sc.setsA = 0;
        sc.setsB = 0;
        sc.currentSet = 1;
        sc.servingTeam = 'A';
        sc.setHistory = [];
        break;
    }

    pelada.updatedAt = new Date().toISOString();
    return sc;
  },
};
