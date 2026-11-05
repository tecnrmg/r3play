export type PlayerPosition = 'Ponteiro' | 'Oposto' | 'Central' | 'Levantador' | 'Líbero' | 'Atacante';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string; // Hex color or Tailwind accent class
  secondaryColor?: string;
  logoEmoji?: string;
  players: Player[];
  // Player IDs in rotation positions 1 to 6
  // P1 = Sacador (Trás Direita), P2 = Frente Direita, P3 = Frente Centro, P4 = Frente Esquerda, P5 = Trás Esquerda, P6 = Trás Centro
  rotation: string[];
  liberoId?: string;
}

export type PointType = 'attack' | 'block' | 'ace' | 'opponent_error' | 'other';

export interface PointDetail {
  id: string;
  timestamp: string; // ISO or local time string HH:mm:ss
  setNumber: number;
  teamId: string; // Team that scored
  pointType: PointType;
  playerId?: string; // Player who scored
  assistPlayerId?: string; // e.g. Setter who made the assist
  scoreA: number;
  scoreB: number;
  notes?: string;
}

export interface SetResult {
  setNumber: number;
  scoreA: number;
  scoreB: number;
  winnerTeamId: string;
  durationMinutes: number;
}

export interface TimeoutRecord {
  id: string;
  setNumber: number;
  teamId: string;
  timestamp: string;
  scoreA: number;
  scoreB: number;
}

export interface SubstitutionRecord {
  id: string;
  setNumber: number;
  teamId: string;
  playerOutId: string;
  playerInId: string;
  scoreA: number;
  scoreB: number;
  timestamp: string;
}

export type SanctionType = 'yellow_warning' | 'red_penalty' | 'expulsion' | 'disqualification';

export interface SanctionRecord {
  id: string;
  setNumber: number;
  teamId: string;
  playerId?: string;
  type: SanctionType;
  scoreA: number;
  scoreB: number;
  timestamp: string;
  notes?: string;
}

export interface RefereeInfo {
  firstReferee?: string;
  secondReferee?: string;
  scorekeeper?: string;
  lineJudges?: string;
  city?: string;
  gymnasium?: string;
}

export interface MatchConfig {
  setsToWin: number; // 2 (Best of 3) or 3 (Best of 5)
  pointsPerSet: number; // usually 25
  tieBreakPoints: number; // usually 15
  minPointDiff: number; // 2 points
  maxSubstitutionsPerSet: number; // usually 6
  maxTimeoutsPerSet: number; // usually 2
  courtPlayersPerTeam?: number; // 2 (Dupla), 3 (Trio), 4 (Quarteto), 5 (Quinteto), 6 (Sexteto/Oficial)
  rotationSystem?: '6x0' | '5x1_fixed_setter'; // '6x0' (todos rodam) ou '5x1_fixed_setter' (levantador fixo no P3 e demais rodam)
  maxWaitingTeams?: number; // Limite de quantos times de até no máx 6 jogadores podem ficar na lista de espera (0 = ilimitado)
  maxPlayersPerWaitingTeam?: number; // Máximo de jogadores por time na fila (2 a 6, padrão 6)
  soundEffectsEnabled?: boolean;
  autoSwapSidesOnSetEnd?: boolean;
  swapSidesIntervalSets?: number;
  autoResetOnMatchEnd?: boolean;
}

export interface Match {
  id: string;
  title: string;
  location?: string;
  date: string;
  status: 'setup' | 'live' | 'finished';
  config: MatchConfig;
  teamA: Team;
  teamB: Team;
  currentSet: number;
  currentScoreA: number;
  currentScoreB: number;
  setsWonA: number;
  setsWonB: number;
  setHistory: SetResult[];
  servingTeamId: string;
  servingPlayerId?: string;
  playByPlay: PointDetail[];
  timeouts: TimeoutRecord[];
  substitutions: SubstitutionRecord[];
  sanctions?: SanctionRecord[];
  referees?: RefereeInfo;
  googleScriptWebhookUrl?: string;
  lastSyncedAt?: string;
}

export interface ManagedTeam extends Team {
  category?: 'Adulto' | 'Sub-21' | 'Sub-19' | 'Sub-17' | 'Master' | 'Feminino' | 'Masculino' | 'Misto';
  city?: string;
  coachName?: string;
  assistantCoachName?: string;
}

export interface TournamentMatch {
  id: string;
  roundName: string; // e.g. "Rodada 1", "Semifinal", "Grande Final"
  teamAId: string;
  teamBId: string;
  scoreA?: number;
  scoreB?: number;
  setsWonA?: number;
  setsWonB?: number;
  winnerTeamId?: string;
  status: 'scheduled' | 'live' | 'finished';
  matchId?: string; // Link to actual Match object
}

export interface Tournament {
  id: string;
  name: string;
  category: string;
  season: string;
  location: string;
  teams: ManagedTeam[];
  matches: TournamentMatch[];
  createdDate: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  playerPosition: PlayerPosition;
  teamId: string;
  totalPoints: number;
  attacks: number;
  aces: number;
  blocks: number;
  opponentErrors: number;
  otherPoints: number;
}

export type AttendanceStatus = 'confirmed' | 'pending' | 'absent' | 'waitlist';
export type PaymentStatus = 'paid' | 'pending' | 'exempt';

export interface Participant {
  id: string;
  name: string;
  number?: number;
  position?: PlayerPosition;
  phone?: string;
  attendance: AttendanceStatus;
  payment: PaymentStatus;
  paidAmount?: number;
  notes?: string;
  createdAt: string;
}
