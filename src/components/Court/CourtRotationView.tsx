import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UserCheck,
  Zap,
  Info,
  Eye,
  EyeOff,
  UserPlus,
  X,
  ChevronRight,
  Shield,
  MessageCircle,
  Plus,
  Trash2,
  ListOrdered,
  Users,
  Send,
  CheckCircle2,
  ArrowRightLeft,
  Play,
} from 'lucide-react';
import { Match, Player, Team, PlayerPosition } from '../../types/volleyball';
import { rotateTeamClockwise, rotateTeamCounterClockwise, addPlayerToWaitingList } from '../../utils/volleyballUtils';

interface CourtRotationViewProps {
  match: Match;
  setMatch: React.Dispatch<React.SetStateAction<Match>>;
}

const DEFAULT_WAITING_LIST: Player[] = [
  { id: 'wait-1', name: 'Lucas Silva', number: 12, position: 'Ponteiro' },
  { id: 'wait-2', name: 'Mariana Costa', number: 8, position: 'Levantador' },
  { id: 'wait-3', name: 'Rafael Souza', number: 15, position: 'Central' },
  { id: 'wait-4', name: 'Camila Lima', number: 3, position: 'Líbero' },
];

export const CourtRotationView: React.FC<CourtRotationViewProps> = ({ match, setMatch }) => {
  const [showRotationArrows, setShowRotationArrows] = useState<boolean>(true);
  const [selectedPlayerPos, setSelectedPlayerPos] = useState<{
    teamId: string;
    posIndex: number; // 0..5
    posCode: string;
    player?: Player;
  } | null>(null);

  // Waiting list state (Lista de Espera / Fila de Jogadores)
  const [waitingList, setWaitingList] = useState<(Player | null)[]>(() => {
    const saved = localStorage.getItem('r3play_waiting_list');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_WAITING_LIST;
  });

  // Active (non-null) players in waiting list
  const activeWaitingList = waitingList.filter((p): p is Player => p !== null && p !== undefined);

  // Modal / Form state for "Quero Jogar"
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(99);
  const [newPlayerPosition, setNewPlayerPosition] = useState<PlayerPosition>('Atacante');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Sync waiting list to localStorage
  useEffect(() => {
    localStorage.setItem('r3play_waiting_list', JSON.stringify(waitingList));
  }, [waitingList]);

  // Re-sync from localStorage when component mounts or storage event fires
  useEffect(() => {
    const loadWaitingList = () => {
      const saved = localStorage.getItem('r3play_waiting_list');
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setWaitingList(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadWaitingList();

    window.addEventListener('storage', loadWaitingList);
    return () => {
      window.removeEventListener('storage', loadWaitingList);
    };
  }, []);

  // Handle "Quero Jogar" submission
  const handleAddPlayerToWaitingList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    if (isWaitingListFull) {
      alert(`A lista de espera atingiu o limite de ${maxWaitingTeams} ${maxWaitingTeams === 1 ? 'time' : 'times'} de até ${maxPlayersPerWaitingTeam} jogadores (${maxWaitingCapacity} no total)!`);
      return;
    }

    const assignedNumber = newPlayerNumber || Math.floor(Math.random() * 90) + 10;

    const newPlayer: Player = {
      id: `wait-${Date.now()}`,
      name: newPlayerName.trim(),
      number: assignedNumber,
      position: newPlayerPosition || 'Ponteiro',
    };

    const updated = addPlayerToWaitingList(waitingList, newPlayer, teamCapacity, maxWaitingTeams);
    setWaitingList(updated);
    setNewPlayerName('');
    setShowJoinModal(false);
  };

  // Remove player from waiting list
  const handleRemoveFromWaitingList = (playerId: string) => {
    const newList = waitingList.map((p) => (p?.id === playerId ? null : p));
    while (newList.length > 0 && newList[newList.length - 1] === null) {
      newList.pop();
    }
    setWaitingList(newList);
  };

  // Assign player from waiting list into Team A or Team B
  const handlePromoteToTeam = (player: Player, targetTeamId: string) => {
    const isTeamA = targetTeamId === match.teamA.id;
    const targetTeam = isTeamA ? match.teamA : match.teamB;

    // Check if player already in team
    if (targetTeam.players.some((p) => p.id === player.id)) {
      alert(`O jogador ${player.name} já está na ${targetTeam.name}.`);
      return;
    }

    const updatedTeam: Team = {
      ...targetTeam,
      players: [...targetTeam.players, player],
    };

    setMatch({
      ...match,
      [isTeamA ? 'teamA' : 'teamB']: updatedTeam,
    });

    const newList = waitingList.map((p) => (p?.id === player.id ? null : p));
    while (newList.length > 0 && newList[newList.length - 1] === null) {
      newList.pop();
    }
    setWaitingList(newList);
  };

  // Share Roster & Waiting List via WhatsApp
  const handleShareWhatsApp = () => {
    const title = match.title || 'R3Play Vôlei - Lista da Pelada';
    const location = match.location || 'Quadra Principal';
    const date = match.date || new Date().toLocaleDateString('pt-BR');

    let msg = `🏐 *R3PLAY VÔLEI - LISTA DE JOGADORES* 🏐\n`;
    msg += `📌 *${title}*\n`;
    msg += `🏟️ *Local:* ${location} | 📅 *Data:* ${date}\n\n`;

    msg += `🔵 *EQUIPE A (${match.teamA.name}):*\n`;
    if (match.teamA.players.length === 0) {
      msg += `  _(Nenhum jogador escalado)_\n`;
    } else {
      match.teamA.players.forEach((p, idx) => {
        msg += `  ${idx + 1}. #${p.number} ${p.name} (${p.position})\n`;
      });
    }

    msg += `\n🔴 *EQUIPE B (${match.teamB.name}):*\n`;
    if (match.teamB.players.length === 0) {
      msg += `  _(Nenhum jogador escalado)_\n`;
    } else {
      match.teamB.players.forEach((p, idx) => {
        msg += `  ${idx + 1}. #${p.number} ${p.name} (${p.position})\n`;
      });
    }

    msg += `\n📋 *LISTA DE ESPERA / FILA DE JOGADORES (${activeWaitingList.length}):*\n`;
    if (activeWaitingList.length === 0) {
      msg += `  _(Fila vazia. Clique em "Quero Jogar" no app!)_\n`;
    } else {
      activeWaitingList.forEach((p, idx) => {
        msg += `  ${idx + 1}º - #${p.number} ${p.name} (${p.position})\n`;
      });
    }

    msg += `\n🔥 *Acesse o R3Play para entrar na fila de espera!*`;

    const encodedText = encodeURIComponent(msg);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const courtPlayerCount = match.config.courtPlayersPerTeam || 6;
  const maxWaitingTeams = match.config.maxWaitingTeams ?? 0;
  const maxPlayersPerWaitingTeam = match.config.maxPlayersPerWaitingTeam || courtPlayerCount;
  const teamCapacity = maxPlayersPerWaitingTeam;
  const maxWaitingCapacity = maxWaitingTeams > 0 ? maxWaitingTeams * maxPlayersPerWaitingTeam : Infinity;
  const isWaitingListFull = maxWaitingTeams > 0 && activeWaitingList.length >= maxWaitingCapacity;

  const handleRotate = (teamId: string, direction: 'cw' | 'ccw') => {
    const isTeamA = teamId === match.teamA.id;
    const team = isTeamA ? match.teamA : match.teamB;

    const rotationSystem = match.config.rotationSystem || '6x0';

    const newRotation =
      direction === 'cw'
        ? rotateTeamClockwise(team.rotation, courtPlayerCount, rotationSystem)
        : rotateTeamCounterClockwise(team.rotation, courtPlayerCount, rotationSystem);

    const updatedTeam: Team = {
      ...team,
      rotation: newRotation,
    };

    setMatch({
      ...match,
      teamA: isTeamA ? updatedTeam : match.teamA,
      teamB: !isTeamA ? updatedTeam : match.teamB,
    });
  };

  const getPlayerInPos = (team: Team, posIndex: number): Player | undefined => {
    // Before match start (status === 'setup'), return undefined so court positions are empty without player names
    if (match.status === 'setup') {
      return undefined;
    }
    const playerId = team.rotation[posIndex];
    return team.players.find((p) => p.id === playerId);
  };

  // Start match & populate rotation positions
  const handleStartMatch = () => {
    const rotA =
      match.teamA.rotation && match.teamA.rotation.length >= courtPlayerCount
        ? match.teamA.rotation.slice(0, courtPlayerCount)
        : match.teamA.players.slice(0, courtPlayerCount).map((p) => p.id);
    const rotB =
      match.teamB.rotation && match.teamB.rotation.length >= courtPlayerCount
        ? match.teamB.rotation.slice(0, courtPlayerCount)
        : match.teamB.players.slice(0, courtPlayerCount).map((p) => p.id);

    setMatch({
      ...match,
      status: 'live',
      teamA: { ...match.teamA, rotation: rotA },
      teamB: { ...match.teamB, rotation: rotB },
    });
  };

  // Reset match to pre-game setup state with empty court
  const handleResetToSetup = () => {
    setMatch({
      ...match,
      status: 'setup',
    });
  };

  // Substitute a bench player into position
  const handleSubstitutePlayer = (subPlayerId: string) => {
    if (!selectedPlayerPos) return;

    const isTeamA = selectedPlayerPos.teamId === match.teamA.id;
    const team = isTeamA ? match.teamA : match.teamB;

    const newRotation = [...team.rotation];
    newRotation[selectedPlayerPos.posIndex] = subPlayerId;

    const updatedTeam: Team = {
      ...team,
      rotation: newRotation,
    };

    setMatch({
      ...match,
      teamA: isTeamA ? updatedTeam : match.teamA,
      teamB: !isTeamA ? updatedTeam : match.teamB,
    });

    setSelectedPlayerPos(null);
  };

  // Switch court player format directly
  const handleSetCourtPlayerCount = (newCount: number) => {
    setMatch({
      ...match,
      config: {
        ...match.config,
        courtPlayersPerTeam: newCount,
      },
    });
  };

  // Positions descriptions according to volleyball rules based on court player count
  const getPositionDescriptions = (count: number): Record<string, { name: string; zone: string; role: string }> => {
    if (count === 2) {
      return {
        P1: { name: 'Posição 1 (Sacador / Defesa Direita)', zone: 'Zona de Defesa / Saque', role: 'Sacador e Defensor' },
        P2: { name: 'Posição 2 (Rede / Esquerda)', zone: 'Zona de Rede (Esquerda)', role: 'Atacante e Bloqueador' },
      };
    }
    if (count === 3) {
      return {
        P1: { name: 'Posição 1 (Sacador / Defesa Direita)', zone: 'Zona de Defesa (Direita)', role: 'Sacador e Defensor' },
        P2: { name: 'Posição 2 (Rede / Ataque Centro)', zone: 'Zona de Rede (Centro)', role: 'Atacante Principal' },
        P3: { name: 'Posição 3 (Defesa Esquerda)', zone: 'Zona de Defesa (Esquerda)', role: 'Passador e Defensor' },
      };
    }
    if (count === 4) {
      return {
        P1: { name: 'Posição 1 (Sacador / Defesa Direita)', zone: 'Zona de Defesa (Direita)', role: 'Sacador e Defensor' },
        P2: { name: 'Posição 2 (Ataque Direita)', zone: 'Zona de Ataque (Direita)', role: 'Atacante Direita' },
        P3: { name: 'Posição 3 (Ataque Esquerda)', zone: 'Zona de Ataque (Esquerda)', role: 'Atacante Esquerda' },
        P4: { name: 'Posição 4 (Defesa Esquerda)', zone: 'Zona de Defesa (Esquerda)', role: 'Passador e Defensor' },
      };
    }
    if (count === 5) {
      return {
        P1: { name: 'Posição 1 (Sacador / Defesa Direita)', zone: 'Zona de Defesa (Direita)', role: 'Sacador / Defesa' },
        P2: { name: 'Posição 2 (Saída de Rede)', zone: 'Zona de Ataque (Direita)', role: 'Ataque Ponta/Oposto' },
        P3: { name: 'Posição 3 (Central de Rede)', zone: 'Zona de Ataque (Centro)', role: 'Bloqueio/Ataque Central' },
        P4: { name: 'Posição 4 (Entrada de Rede)', zone: 'Zona de Ataque (Esquerda)', role: 'Passador/Ponta' },
        P5: { name: 'Posição 5 (Defesa Esquerda)', zone: 'Zona de Defesa (Esquerda)', role: 'Defensor / Passador' },
      };
    }
    return {
      P1: { name: 'Posição 1 (Defesa Direita)', zone: 'Zona de Defesa / Saque', role: 'Sacador / Defesa' },
      P2: { name: 'Posição 2 (Saída de Rede)', zone: 'Zona de Ataque (Direita)', role: 'Ataque Ponta/Oposto' },
      P3: { name: 'Posição 3 (Central de Rede)', zone: 'Zona de Ataque (Centro)', role: 'Bloqueio/Ataque Central' },
      P4: { name: 'Posição 4 (Entrada de Rede)', zone: 'Zona de Ataque (Esquerda)', role: 'Passador/Ponta' },
      P5: { name: 'Posição 5 (Defesa Esquerda)', zone: 'Zona de Defesa (Esquerda)', role: 'Defensor / Passador' },
      P6: { name: 'Posição 6 (Defesa Centro)', zone: 'Zona de Defesa (Centro)', role: 'Líbero / Defesa Central' },
    };
  };

  const positionDescriptions = getPositionDescriptions(courtPlayerCount);

  // Render player badge card positioned in real court zone
  const renderPlayerNode = (
    team: Team,
    posIndex: number,
    posCode: string,
    isTeamA: boolean,
    customStyle: React.CSSProperties
  ) => {
    const player = getPlayerInPos(team, posIndex);
    const isServer = team.rotation[0] === player?.id && match.servingTeamId === team.id;
    const isLibero = player?.position.toLowerCase().includes('líbero') || player?.position.toLowerCase().includes('libero');

    const isFixedSetter = match.config.rotationSystem === '5x1_fixed_setter' && posCode === 'P3';

    return (
      <div
        key={`player-node-${team.id}-${posIndex}-${posCode}`}
        style={customStyle}
        onClick={() =>
          setSelectedPlayerPos({
            teamId: team.id,
            posIndex,
            posCode,
            player,
          })
        }
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-24 sm:w-28 p-1.5 sm:p-2 rounded-2xl border-2 transition-all cursor-pointer shadow-2xl hover:scale-105 hover:z-30 group ${
          isServer
            ? 'bg-gradient-to-b from-amber-500/30 to-orange-600/30 border-amber-400 text-white ring-4 ring-amber-400/40 animate-pulse'
            : isFixedSetter
            ? 'bg-gradient-to-b from-teal-500/30 to-emerald-700/30 border-teal-400 text-white ring-2 ring-teal-400/50'
            : isLibero
            ? 'bg-gradient-to-b from-yellow-500/20 to-amber-600/20 border-yellow-400 text-yellow-200'
            : isTeamA
            ? 'bg-slate-900/90 border-blue-500/80 hover:border-blue-400 text-white'
            : 'bg-slate-900/90 border-red-500/80 hover:border-red-400 text-white'
        }`}
      >
        {/* Pos Badge & Serve indicator */}
        <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
          <span
            className={`px-1.5 py-0.5 rounded font-mono ${
              isFixedSetter
                ? 'bg-teal-500 text-slate-950 font-black'
                : isTeamA
                ? 'bg-blue-600/80 text-white'
                : 'bg-red-600/80 text-white'
            }`}
          >
            {posCode}
          </span>
          {isServer && (
            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black flex items-center gap-0.5 text-[9px]">
              🏐 SAQUE
            </span>
          )}
          {isFixedSetter && !isServer && (
            <span className="px-1.5 py-0.5 rounded bg-teal-400 text-slate-950 font-black text-[9px]">
              LEV. FIXO
            </span>
          )}
          {isLibero && !isServer && !isFixedSetter && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-black text-[9px]">
              LÍBERO
            </span>
          )}
        </div>

        {/* Player Jersey Number & Name */}
        {player ? (
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                isTeamA
                  ? 'bg-blue-600 border-blue-300 text-white'
                  : 'bg-red-600 border-red-300 text-white'
              }`}
            >
              #{player.number}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-black truncate text-white leading-tight">{player.name}</p>
              <span className="text-[9px] text-slate-300 block truncate font-medium">
                {player.position}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-1 text-slate-500">
            <span className="text-[11px] font-bold block">Sem Jogador</span>
            <span className="text-[9px] text-slate-600">Clique p/ definir</span>
          </div>
        )}
      </div>
    );
  };

  const swapInterval = match.config.swapSidesIntervalSets || 1;
  const isSwapped = Boolean(
    match.config.autoSwapSidesOnSetEnd &&
    Math.floor((match.currentSet - 1) / swapInterval) % 2 !== 0
  );
  const leftTeam = isSwapped ? match.teamB : match.teamA;
  const rightTeam = isSwapped ? match.teamA : match.teamB;
  const isLeftTeamA = leftTeam.id === match.teamA.id;

  const getNodeLayouts = (count: number) => {
    const isServingLeft = match.servingTeamId === leftTeam.id;
    const isServingRight = match.servingTeamId === rightTeam.id;

    if (count === 2) {
      return {
        left: [
          { index: 0, code: 'P1', style: { left: isServingLeft ? '5%' : '20%', top: '65%' } },
          { index: 1, code: 'P2', style: { left: '32%', top: '35%' } },
        ],
        right: [
          { index: 1, code: 'P2', style: { left: '68%', top: '65%' } },
          { index: 0, code: 'P1', style: { left: isServingRight ? '95%' : '80%', top: '35%' } },
        ],
      };
    }

    if (count === 3) {
      return {
        left: [
          { index: 0, code: 'P1', style: { left: isServingLeft ? '5%' : '18%', top: '70%' } },
          { index: 1, code: 'P2', style: { left: '38%', top: '50%' } },
          { index: 2, code: 'P3', style: { left: '18%', top: '30%' } },
        ],
        right: [
          { index: 1, code: 'P2', style: { left: '62%', top: '50%' } },
          { index: 0, code: 'P1', style: { left: isServingRight ? '95%' : '82%', top: '30%' } },
          { index: 2, code: 'P3', style: { left: '82%', top: '70%' } },
        ],
      };
    }

    if (count === 4) {
      return {
        left: [
          { index: 2, code: 'P3', style: { left: '38%', top: '30%' } },
          { index: 1, code: 'P2', style: { left: '38%', top: '70%' } },
          { index: 3, code: 'P4', style: { left: '18%', top: '30%' } },
          { index: 0, code: 'P1', style: { left: isServingLeft ? '5%' : '18%', top: '70%' } },
        ],
        right: [
          { index: 1, code: 'P2', style: { left: '62%', top: '30%' } },
          { index: 2, code: 'P3', style: { left: '62%', top: '70%' } },
          { index: 0, code: 'P1', style: { left: isServingRight ? '95%' : '82%', top: '30%' } },
          { index: 3, code: 'P4', style: { left: '82%', top: '70%' } },
        ],
      };
    }

    if (count === 5) {
      return {
        left: [
          { index: 3, code: 'P4', style: { left: '38%', top: '22%' } },
          { index: 2, code: 'P3', style: { left: '38%', top: '50%' } },
          { index: 1, code: 'P2', style: { left: '38%', top: '78%' } },
          { index: 4, code: 'P5', style: { left: '18%', top: '30%' } },
          { index: 0, code: 'P1', style: { left: isServingLeft ? '5%' : '18%', top: '70%' } },
        ],
        right: [
          { index: 1, code: 'P2', style: { left: '62%', top: '22%' } },
          { index: 2, code: 'P3', style: { left: '62%', top: '50%' } },
          { index: 3, code: 'P4', style: { left: '62%', top: '78%' } },
          { index: 0, code: 'P1', style: { left: isServingRight ? '95%' : '82%', top: '30%' } },
          { index: 4, code: 'P5', style: { left: '82%', top: '70%' } },
        ],
      };
    }

    return {
      left: [
        { index: 3, code: 'P4', style: { left: '40%', top: '18%' } },
        { index: 2, code: 'P3', style: { left: '40%', top: '50%' } },
        { index: 1, code: 'P2', style: { left: '40%', top: '82%' } },
        { index: 4, code: 'P5', style: { left: '18%', top: '18%' } },
        { index: 5, code: 'P6', style: { left: '18%', top: '50%' } },
        { index: 0, code: 'P1', style: { left: isServingLeft ? '5%' : '18%', top: '82%' } },
      ],
      right: [
        { index: 1, code: 'P2', style: { left: '60%', top: '18%' } },
        { index: 2, code: 'P3', style: { left: '60%', top: '50%' } },
        { index: 3, code: 'P4', style: { left: '60%', top: '82%' } },
        { index: 0, code: 'P1', style: { left: isServingRight ? '95%' : '82%', top: '18%' } },
        { index: 5, code: 'P6', style: { left: '82%', top: '50%' } },
        { index: 4, code: 'P5', style: { left: '82%', top: '82%' } },
      ],
    };
  };

  const renderRotationArrows = (count: number) => {
    if (!showRotationArrows) return null;

    if (count === 2) {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75">
          <defs>
            <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
            </marker>
            <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
            </marker>
          </defs>
          <line x1="30%" y1="40%" x2="22%" y2="60%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="22%" y1="65%" x2="30%" y2="45%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />

          <line x1="70%" y1="60%" x2="78%" y2="40%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="78%" y1="35%" x2="70%" y2="55%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        </svg>
      );
    }

    if (count === 3) {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75">
          <defs>
            <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
            </marker>
            <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
            </marker>
          </defs>
          <line x1="18%" y1="64%" x2="18%" y2="36%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="22%" y1="30%" x2="34%" y2="46%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="34%" y1="54%" x2="22%" y2="68%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />

          <line x1="82%" y1="36%" x2="82%" y2="64%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="78%" y1="70%" x2="66%" y2="54%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="66%" y1="46%" x2="78%" y2="30%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        </svg>
      );
    }

    if (count === 4) {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75">
          <defs>
            <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
            </marker>
            <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
            </marker>
          </defs>
          <line x1="18%" y1="64%" x2="18%" y2="36%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="24%" y1="30%" x2="32%" y2="30%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="38%" y1="36%" x2="38%" y2="64%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="32%" y1="70%" x2="24%" y2="70%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />

          <line x1="82%" y1="36%" x2="82%" y2="64%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="76%" y1="70%" x2="68%" y2="70%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="62%" y1="64%" x2="62%" y2="36%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="68%" y1="30%" x2="76%" y2="30%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        </svg>
      );
    }

    if (count === 5) {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75">
          <defs>
            <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
            </marker>
            <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
            </marker>
          </defs>
          <line x1="18%" y1="64%" x2="18%" y2="36%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="24%" y1="28%" x2="32%" y2="24%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="38%" y1="28%" x2="38%" y2="44%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="38%" y1="56%" x2="38%" y2="72%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
          <line x1="32%" y1="76%" x2="24%" y2="72%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />

          <line x1="82%" y1="36%" x2="82%" y2="64%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="76%" y1="72%" x2="68%" y2="76%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="62%" y1="72%" x2="62%" y2="56%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="62%" y1="44%" x2="62%" y2="28%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
          <line x1="68%" y1="24%" x2="76%" y2="28%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        </svg>
      );
    }

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
        <defs>
          <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
          </marker>
          <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
          </marker>
        </defs>
        <line x1="18%" y1="76%" x2="18%" y2="56%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
        <line x1="18%" y1="44%" x2="18%" y2="24%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
        <line x1="24%" y1="18%" x2="34%" y2="18%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
        <line x1="40%" y1="24%" x2="40%" y2="44%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
        <line x1="40%" y1="56%" x2="40%" y2="76%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />
        <line x1="34%" y1="82%" x2="24%" y2="82%" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowA)" />

        <line x1="82%" y1="24%" x2="82%" y2="44%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        <line x1="82%" y1="56%" x2="82%" y2="76%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        <line x1="76%" y1="82%" x2="66%" y2="82%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        <line x1="60%" y1="76%" x2="60%" y2="56%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        <line x1="60%" y1="44%" x2="60%" y2="24%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
        <line x1="66%" y1="18%" x2="76%" y2="18%" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,4" markerEnd="url(#arrowB)" />
      </svg>
    );
  };

  const nodeLayouts = getNodeLayouts(courtPlayerCount);

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Info & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1">
              🏐 Formato: {courtPlayerCount}v{courtPlayerCount} ({courtPlayerCount === 2 ? 'Dupla' : courtPlayerCount === 3 ? 'Trio' : courtPlayerCount === 4 ? 'Quarteto' : courtPlayerCount === 5 ? 'Quinteto' : 'Sexteto Oficial'})
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
              Giro do Rodízio em Quadra Real
            </span>
            {isSwapped && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30 flex items-center gap-1 animate-pulse">
                <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
                Lados Invertidos (Set {match.currentSet})
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Diagrama Real de Quadra & Rodízio de Vôlei
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Posicionamento oficial de {courtPlayerCount} jogadores por equipe, linhas de ataque de 3m, zona de saque e rotação em sentido horário.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Court Players Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-wider">
              Quadra:
            </span>
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSetCourtPlayerCount(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  courtPlayerCount === num
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`Mudar para formato de ${num} jogadores em quadra por equipe`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Rotation System Switcher (5x1 Levantador Fixo vs 6x0 Rodízio) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMatch({
                  ...match,
                  config: {
                    ...match.config,
                    rotationSystem: match.config.rotationSystem === '5x1_fixed_setter' ? '6x0' : '5x1_fixed_setter',
                  },
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                match.config.rotationSystem === '5x1_fixed_setter'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-1 ring-teal-400'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700'
              }`}
              title="Clique para alternar entre 5x1 (Levantador Fixo no P3) e 6x0 (Todos Rodam)"
            >
              <span>{match.config.rotationSystem === '5x1_fixed_setter' ? '⚡ 5x1 (Lev. Fixo P3)' : '🔄 6x0 (Todos Rodam)'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowRotationArrows(!showRotationArrows)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showRotationArrows
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {showRotationArrows ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showRotationArrows ? 'Setas: Visíveis' : 'Setas: Ocultas'}
          </button>
        </div>
      </div>

      {/* Banner de Pré-Jogo / Partida Não Iniciada */}
      {match.status === 'setup' ? (
        <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-purple-950/80 border-2 border-indigo-500/80 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black text-2xl shrink-0">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                  Pré-Jogo (Quadra Sem Jogadores)
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
                  {activeWaitingList.length} na Fila de Espera
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Partida Não Iniciada - Posições em Quadra Vazias
              </h3>
              <p className="text-xs text-slate-300">
                Os jogadores inscritos estão na Fila de Espera. Clique no botão para iniciar a partida e liberar a escalação em quadra.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartMatch}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all border border-emerald-400/30 active:scale-95"
          >
            🚀 Iniciar Partida
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={handleResetToSetup}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-md"
            title="Esvaziar posições na quadra e voltar para Pré-Jogo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Limpar Quadra (Voltar a Pré-Jogo)
          </button>
        </div>
      )}

      {/* REALISTIC VOLLEYBALL COURT CONTAINER */}
      <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl p-4 sm:p-6 overflow-x-auto shadow-2xl">
        {/* Court Canvas Area (Standard 2:1 Ratio, e.g. 1000px x 480px inside) */}
        <div className="min-w-[850px] relative bg-sky-950/60 rounded-2xl p-6 border-4 border-slate-800 select-none">
          {/* COURT SURFACE (WOOD / TERRACOTTA VOLLEYBALL COURT WITH BLUE FREE ZONE) */}
          <div className="relative w-full h-[460px] bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 border-[6px] border-white rounded-lg shadow-2xl overflow-hidden">
            {/* Wood Floor Grid Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

            {/* 1. OFFICIAL COURT LINES */}
            {/* Center Line (Linha Central sob a rede) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-white z-10"></div>

            {/* TEAM A (LEFT) 3M ATTACK LINE (Linha de Ataque dos 3m) */}
            <div className="absolute top-0 bottom-0 left-[33.3%] w-1 bg-white border-l border-dashed border-white/80 z-10"></div>
            {/* 3m Extension Ticks (Outside side boundaries) */}
            <div className="absolute -top-3 left-[33.3%] -translate-x-1/2 w-1 h-3 bg-white"></div>
            <div className="absolute -bottom-3 left-[33.3%] -translate-x-1/2 w-1 h-3 bg-white"></div>

            {/* TEAM B (RIGHT) 3M ATTACK LINE (Linha de Ataque dos 3m) */}
            <div className="absolute top-0 bottom-0 left-[66.7%] w-1 bg-white border-r border-dashed border-white/80 z-10"></div>
            {/* 3m Extension Ticks */}
            <div className="absolute -top-3 left-[66.7%] -translate-x-1/2 w-1 h-3 bg-white"></div>
            <div className="absolute -bottom-3 left-[66.7%] -translate-x-1/2 w-1 h-3 bg-white"></div>

            {/* Service Zone Ticks (Marcas da Zona de Saque) */}
            <div className="absolute top-0 left-0 w-3 h-1 bg-white"></div>
            <div className="absolute bottom-0 left-0 w-3 h-1 bg-white"></div>
            <div className="absolute top-0 right-0 w-3 h-1 bg-white"></div>
            <div className="absolute bottom-0 right-0 w-3 h-1 bg-white"></div>

            {/* Zone Labels overlay */}
            <div className="absolute top-2 left-[15%] text-[10px] font-black uppercase text-amber-200/50 tracking-widest pointer-events-none">
              Zona de Defesa (6m)
            </div>
            <div className="absolute top-2 left-[39%] text-[10px] font-black uppercase text-amber-200/50 tracking-widest pointer-events-none">
              Ataque (3m)
            </div>
            <div className="absolute top-2 right-[39%] text-[10px] font-black uppercase text-amber-200/50 tracking-widest pointer-events-none">
              Ataque (3m)
            </div>
            <div className="absolute top-2 right-[15%] text-[10px] font-black uppercase text-amber-200/50 tracking-widest pointer-events-none">
              Zona de Defesa (6m)
            </div>

            {/* 2. NET & ANTENNA STRUCTURE (REDE DE VÔLEI PROFISSIONAL) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 z-20 pointer-events-none flex flex-col justify-between">
              {/* Top Mesh Band */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2.5 bg-slate-900/60 border-x-2 border-slate-100 flex flex-col justify-between items-center py-1">
                <div className="w-full h-2 bg-white shadow-md"></div>
                <div className="w-full h-full bg-[linear-gradient(90deg,transparent_2px,#fff_2px)] bg-[size:4px_4px] opacity-70"></div>
                <div className="w-full h-2 bg-white shadow-md"></div>
              </div>

              {/* Antenna Top Pole Extension */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-[repeating-linear-gradient(0deg,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-t shadow-lg z-30"></div>
              {/* Antenna Bottom Pole Extension */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-[repeating-linear-gradient(0deg,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)] rounded-b shadow-lg z-30"></div>
            </div>

            {/* 3. ROTATION DIRECTIONAL SVG OVERLAY ARROWS */}
            {renderRotationArrows(courtPlayerCount)}

            {/* 4. LEFT HALF PLAYER NODES */}
            {nodeLayouts.left.map((item) =>
              renderPlayerNode(leftTeam, item.index, item.code, isLeftTeamA, item.style)
            )}

            {/* 5. RIGHT HALF PLAYER NODES */}
            {nodeLayouts.right.map((item) =>
              renderPlayerNode(rightTeam, item.index, item.code, !isLeftTeamA, item.style)
            )}
          </div>
        </div>

        {/* TEAM CONTROLS BELOW COURT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* TEAM A CONTROLS */}
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{match.teamA.logoEmoji || '🏐'}</span>
              <div>
                <h3 className="font-black text-blue-400 text-base">{match.teamA.name}</h3>
                <p className="text-[11px] text-slate-400">Rodízio e Posições em Quadra</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRotate(match.teamA.id, 'ccw')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                title="Voltar Rodízio (Anti-Horário)"
              >
                <RotateCcw className="w-3.5 h-3.5" /> ↺
              </button>
              <button
                onClick={() => handleRotate(match.teamA.id, 'cw')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> Girar Rodízio ↻
              </button>
            </div>
          </div>

          {/* TEAM B CONTROLS */}
          <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{match.teamB.logoEmoji || '🔥'}</span>
              <div>
                <h3 className="font-black text-red-400 text-base">{match.teamB.name}</h3>
                <p className="text-[11px] text-slate-400">Rodízio e Posições em Quadra</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRotate(match.teamB.id, 'ccw')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                title="Voltar Rodízio (Anti-Horário)"
              >
                <RotateCcw className="w-3.5 h-3.5" /> ↺
              </button>
              <button
                onClick={() => handleRotate(match.teamB.id, 'cw')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> Girar Rodízio ↻
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL WAITING LIST / FILA DE JOGADORES (SEÇÃO SOLICITADA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Fila de Espera / Próximos a Jogar
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-extrabold text-xs border ${
                    isWaitingListFull
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {activeWaitingList.length} {maxWaitingTeams > 0 ? `/ ${maxWaitingCapacity}` : ''} {activeWaitingList.length === 1 ? 'Jogador' : 'Jogadores'}
                </span>
                {maxWaitingTeams > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-extrabold text-[10px] border border-slate-700">
                    Limite: {maxWaitingTeams} {maxWaitingTeams === 1 ? 'Time' : 'Times'} (Até {maxPlayersPerWaitingTeam} jg/time)
                  </span>
                )}
                {isWaitingListFull && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase border border-red-400 animate-pulse">
                    Fila Cheia
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lista em ordem de chegada. Escale para os times ou entre na fila com o botão &quot;Quero Jogar&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              🙋‍♂️ Quero Jogar
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
              title="Enviar lista completa no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              {copiedSuccess ? 'Enviando p/ WhatsApp...' : 'Enviar Lista no WhatsApp'}
            </button>
          </div>
        </div>

        {/* WAITING LIST ROWS (GROUPS OF PLAYERS HORIZONTALLY) */}
        {activeWaitingList.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              Nenhum jogador na fila de espera no momento.
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Seja o primeiro a clicar em &quot;Quero Jogar&quot;
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from({ length: Math.ceil(waitingList.length / teamCapacity) }).map((_, groupIdx) => {
              const rawGroup = waitingList.slice(groupIdx * teamCapacity, groupIdx * teamCapacity + teamCapacity);
              const groupPlayers = rawGroup.filter((p): p is Player => p !== null && p !== undefined);

              if (groupPlayers.length === 0) return null;

              return (
                <div key={`waiting-group-${groupIdx}`} className="space-y-2">
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      Time {groupIdx + 1} de Espera ({groupPlayers.length}/{teamCapacity} Atletas)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Posições #{groupIdx * teamCapacity + 1} a #{groupIdx * teamCapacity + teamCapacity} na fila
                    </span>
                  </div>

                  {/* Responsive Grid based on teamCapacity */}
                  <div
                    className={`grid gap-2.5 ${
                      teamCapacity === 2
                        ? 'grid-cols-2 max-w-lg'
                        : teamCapacity === 3
                        ? 'grid-cols-1 sm:grid-cols-3 max-w-2xl'
                        : teamCapacity === 4
                        ? 'grid-cols-2 sm:grid-cols-4 max-w-4xl'
                        : teamCapacity === 5
                        ? 'grid-cols-2 sm:grid-cols-5 max-w-5xl'
                        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                    }`}
                  >
                    {groupPlayers.map((player) => {
                      const overallIndex = activeWaitingList.findIndex((p) => p.id === player.id);
                      return (
                        <div
                          key={player.id}
                          className="bg-slate-950 border-2 border-slate-800 hover:border-slate-700 rounded-2xl p-3 space-y-2.5 shadow-lg relative group transition-all flex flex-col justify-between"
                        >
                          {/* Header Badge */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase ${
                                overallIndex === 0
                                  ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                                  : overallIndex === 1
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {overallIndex === 0 ? '🔥 #1 PRÓX' : `#${overallIndex + 1} FILA`}
                            </span>

                            <button
                              onClick={() => handleRemoveFromWaitingList(player.id)}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Remover da Fila"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Player info */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs shrink-0">
                              #{player.number}
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <p className="font-extrabold text-xs text-white truncate">{player.name}</p>
                              <span className="text-[10px] text-slate-400 block truncate font-medium">
                                {player.position}
                              </span>
                            </div>
                          </div>

                          {/* Quick Promote Buttons */}
                          <div className="grid grid-cols-2 gap-1 pt-0.5">
                            <button
                              onClick={() => handlePromoteToTeam(player, match.teamA.id)}
                              className="px-1.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white font-extrabold text-[10px] flex items-center justify-center gap-0.5 transition-all cursor-pointer truncate"
                              title={`Escalar na ${match.teamA.name}`}
                            >
                              + {match.teamA.name.slice(0, 6)}
                            </button>

                            <button
                              onClick={() => handlePromoteToTeam(player, match.teamB.id)}
                              className="px-1.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white font-extrabold text-[10px] flex items-center justify-center gap-0.5 transition-all cursor-pointer truncate"
                              title={`Escalar na ${match.teamB.name}`}
                            >
                              + {match.teamB.name.slice(0, 6)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL "QUERO JOGAR" (INCLUSÃO DE JOGADOR NA LISTA) */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-white">Quero Jogar! (Entrar na Fila)</h3>
              </div>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isWaitingListFull && (
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold space-y-1">
                <div className="flex items-center gap-1.5 text-red-200">
                  <span className="text-base">⚠️</span>
                  <span>Fila de Espera Cheia!</span>
                </div>
                <p className="text-[11px] text-red-300/80 font-normal">
                  A fila atingiu o limite configurado de {maxWaitingTeams} {maxWaitingTeams === 1 ? 'time' : 'times'} de até {maxPlayersPerWaitingTeam} jogadores ({maxWaitingCapacity} no total).
                </p>
              </div>
            )}

            <form onSubmit={handleAddPlayerToWaitingList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Seu Nome / Apelido:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos, Renata, Beto..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Número da Camisa:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Posição Preferida:
                    </label>
                    <select
                      value={newPlayerPosition}
                      onChange={(e) => setNewPlayerPosition(e.target.value as PlayerPosition)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Ponteiro">Ponteiro</option>
                      <option value="Oposto">Oposto</option>
                      <option value="Central">Central</option>
                      <option value="Levantador">Levantador</option>
                      <option value="Líbero">Líbero</option>
                    </select>
                  </div>
                </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isWaitingListFull}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer ${
                    isWaitingListFull
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isWaitingListFull ? 'Fila Lotada' : 'Confirmar e Entrar na Fila'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAYER POSITIONS DETAILS & SUBSTITUTION MODAL */}
      {selectedPlayerPos && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-xs">
                  {selectedPlayerPos.posCode}
                </span>
                <h3 className="text-lg font-black text-white">
                  {positionDescriptions[selectedPlayerPos.posCode]?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlayerPos(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Position Details Info */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-300">
                <strong className="text-slate-100">Zona em Quadra:</strong>{' '}
                {positionDescriptions[selectedPlayerPos.posCode]?.zone}
              </p>
              <p className="text-slate-300">
                <strong className="text-slate-100">Função Tática Principal:</strong>{' '}
                {positionDescriptions[selectedPlayerPos.posCode]?.role}
              </p>
            </div>

            {/* Current Player Assigned */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-2">
                Jogador Atual na Posição {selectedPlayerPos.posCode}:
              </h4>
              {selectedPlayerPos.player ? (
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                      #{selectedPlayerPos.player.number}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">{selectedPlayerPos.player.name}</p>
                      <p className="text-xs text-slate-400">{selectedPlayerPos.player.position}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">
                    Titular em Quadra
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                  Nenhum jogador atribuído a esta posição no momento.
                </div>
              )}
            </div>

            {/* Substitution Selector from Bench Players */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Substituir / Trocar por Jogador do Elenco:
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {(selectedPlayerPos.teamId === match.teamA.id
                  ? match.teamA.players
                  : match.teamB.players
                ).map((p) => {
                  const isCurrentInThisPos = p.id === selectedPlayerPos.player?.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSubstitutePlayer(p.id)}
                      disabled={isCurrentInThisPos}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all text-left ${
                        isCurrentInThisPos
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-slate-200 text-xs">
                          #{p.number}
                        </span>
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <span className="text-[10px] text-slate-400">{p.position}</span>
                        </div>
                      </div>

                      {isCurrentInThisPos ? (
                        <span className="text-[10px] text-slate-500">Já está nesta posição</span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                          Escalar Aqui <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPlayerPos(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

