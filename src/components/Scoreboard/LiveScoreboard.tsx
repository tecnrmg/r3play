import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Undo2,
  Clock,
  RotateCw,
  RotateCcw,
  Users,
  Trophy,
  CheckCircle2,
  X,
  Sparkles,
  Flame,
  Volume2,
  ArrowRightLeft,
} from 'lucide-react';
import { Match, PointType, Player } from '../../types/volleyball';
import { checkSetWinner, rotateTeamClockwise } from '../../utils/volleyballUtils';
import { usePlanContext } from '../../context/PlanContext';
import { PresentationScoreboard } from './PresentationScoreboard';

interface LiveScoreboardProps {
  match: Match;
  setMatch: React.Dispatch<React.SetStateAction<Match>>;
  onPointAdded?: (updatedMatch: Match) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  match,
  setMatch,
  onPointAdded,
  onNavigateToTab,
}) => {
  const { isFree, isLite } = usePlanContext();

  if (isFree) {
    return <PresentationScoreboard match={match} onExit={() => {}} onNavigateToTab={onNavigateToTab} />;
  }

  // Modal for adding a detailed point
  const [scoringTeamId, setScoringTeamId] = useState<string | null>(null);
  const [pointType, setPointType] = useState<PointType>('attack');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [pointNotes, setPointNotes] = useState<string>('');

  // Modal for resetting scoreboard
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Timeout Countdown Timer State
  const [activeTimeout, setActiveTimeout] = useState<{
    teamId: string;
    teamName: string;
    timeLeft: number;
  } | null>(null);

  // Substitution Modal State
  const [subModalTeamId, setSubModalTeamId] = useState<string | null>(null);
  const [subPlayerOutId, setSubPlayerOutId] = useState<string>('');
  const [subPlayerInId, setSubPlayerInId] = useState<string>('');

  // Set Winner Modal
  const [setWinnerModal, setSetWinnerModal] = useState<{
    winnerTeamId: string;
    isMatchOver: boolean;
  } | null>(null);

  // Active Timeout Timer countdown effect
  useEffect(() => {
    if (!activeTimeout) return;
    if (activeTimeout.timeLeft <= 0) return;

    const timer = setInterval(() => {
      setActiveTimeout((prev) => (prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTimeout]);

  // Web Audio API VNL Referee Whistle Simulator
  const playVnlWhistle = (type: 'long' | 'short') => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playBlast = (startTime: number, duration: number) => {
        // High frequency dual-tone for authentic pealess whistle sound (e.g. Fox 40 2850Hz & 3250Hz)
        const f1 = 2850;
        const f2 = 3250;

        [f1, f2].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
          osc.frequency.linearRampToValueAtTime(freq + 50, ctx.currentTime + startTime + duration);

          // Envelope
          gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startTime + 0.02);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + startTime + duration - 0.03);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        });
      };

      if (type === 'long') {
        // Saque: Long whistle blast (~1.1s)
        playBlast(0, 1.1);
      } else {
        // Ponto / Fim de Rali: Double short blast (~0.22s each)
        playBlast(0, 0.22);
        playBlast(0.28, 0.22);
      }
    } catch (err) {
      console.error('Whistle audio error:', err);
    }
  };

  const scoringTeam = scoringTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Execute point addition logic
  const executeAddPoint = (
    teamId: string,
    pType: PointType = 'attack',
    pPlayerId?: string,
    pNotes?: string
  ) => {
    const isTeamA = teamId === match.teamA.id;
    const newScoreA = isTeamA ? match.currentScoreA + 1 : match.currentScoreA;
    const newScoreB = !isTeamA ? match.currentScoreB + 1 : match.currentScoreB;

    const nowStr = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newPointDetail = {
      id: `pt-${Date.now()}`,
      timestamp: nowStr,
      setNumber: match.currentSet,
      teamId,
      pointType: pType,
      playerId: pPlayerId || undefined,
      scoreA: newScoreA,
      scoreB: newScoreB,
      notes: pNotes?.trim() || undefined,
    };

    let updatedTeamA = { ...match.teamA };
    let updatedTeamB = { ...match.teamB };

    // Rotation logic: If the team winning the point was NOT the serving team, they gain serve AND rotate!
    let nextServingTeamId = match.servingTeamId;
    if (match.servingTeamId !== teamId) {
      nextServingTeamId = teamId;
      if (isTeamA) {
        updatedTeamA.rotation = rotateTeamClockwise(updatedTeamA.rotation, match.config.courtPlayersPerTeam);
      } else {
        updatedTeamB.rotation = rotateTeamClockwise(updatedTeamB.rotation, match.config.courtPlayersPerTeam);
      }
    }

    // Check if Set is Won
    const { isSetOver, winnerTeamId } = checkSetWinner(
      newScoreA,
      newScoreB,
      match.currentSet,
      match
    );

    let updatedSetsWonA = match.setsWonA;
    let updatedSetsWonB = match.setsWonB;
    let updatedSetHistory = [...match.setHistory];
    let updatedCurrentSet = match.currentSet;
    let nextScoreA = newScoreA;
    let nextScoreB = newScoreB;
    let updatedMatchStatus = match.status;

    if (isSetOver && winnerTeamId) {
      const winnerIsA = winnerTeamId === match.teamA.id;
      if (winnerIsA) updatedSetsWonA += 1;
      else updatedSetsWonB += 1;

      updatedSetHistory.push({
        setNumber: match.currentSet,
        scoreA: newScoreA,
        scoreB: newScoreB,
        winnerTeamId,
        durationMinutes: 20, // estimated
      });

      const setsNeeded = match.config.setsToWin;
      const isMatchFinished = updatedSetsWonA >= setsNeeded || updatedSetsWonB >= setsNeeded;

      if (isMatchFinished) {
        updatedMatchStatus = 'finished';
        setSetWinnerModal({ winnerTeamId, isMatchOver: true });
      } else {
        // Advance to next set
        updatedCurrentSet += 1;
        nextScoreA = 0;
        nextScoreB = 0;
        setSetWinnerModal({ winnerTeamId, isMatchOver: false });
      }
    }

    const updatedMatch: Match = {
      ...match,
      teamA: updatedTeamA,
      teamB: updatedTeamB,
      currentScoreA: nextScoreA,
      currentScoreB: nextScoreB,
      currentSet: updatedCurrentSet,
      setsWonA: updatedSetsWonA,
      setsWonB: updatedSetsWonB,
      setHistory: updatedSetHistory,
      status: updatedMatchStatus,
      servingTeamId: nextServingTeamId,
      playByPlay: [newPointDetail, ...match.playByPlay],
    };

    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);

    // Close modal
    setScoringTeamId(null);
  };

  // Open modal when user clicks +1 Point (or add instantly in Lite mode)
  const handleOpenPointModal = (teamId: string) => {
    if (isLite) {
      executeAddPoint(teamId, 'attack');
      return;
    }
    setScoringTeamId(teamId);
    setPointType('attack');
    setSelectedPlayerId('');
    setPointNotes('');
  };

  // Confirm Point addition (from Modal in Pro mode)
  const handleConfirmPoint = () => {
    if (!scoringTeamId) return;
    executeAddPoint(scoringTeamId, pointType, selectedPlayerId, pointNotes);
  };

  // Undo Last Point
  const handleUndoPoint = () => {
    if (match.playByPlay.length === 0) return;

    const [lastPoint, ...remainingPlayByPlay] = match.playByPlay;
    const isTeamA = lastPoint.teamId === match.teamA.id;

    let newScoreA = match.currentScoreA;
    let newScoreB = match.currentScoreB;

    if (isTeamA && newScoreA > 0) newScoreA -= 1;
    if (!isTeamA && newScoreB > 0) newScoreB -= 1;

    const updatedMatch: Match = {
      ...match,
      currentScoreA: newScoreA,
      currentScoreB: newScoreB,
      playByPlay: remainingPlayByPlay,
    };

    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);
  };

  // Decrement Point directly (for Modo Lite -1 button)
  const handleDecrementPoint = (teamId: string) => {
    const isTeamA = teamId === match.teamA.id;
    const currentScore = isTeamA ? match.currentScoreA : match.currentScoreB;
    if (currentScore <= 0) return;

    const newScoreA = isTeamA ? match.currentScoreA - 1 : match.currentScoreA;
    const newScoreB = !isTeamA ? match.currentScoreB - 1 : match.currentScoreB;

    const updatedMatch: Match = {
      ...match,
      currentScoreA: newScoreA,
      currentScoreB: newScoreB,
    };

    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);
  };

  // Reset Scoreboard (Zerar Placar)
  const handleResetScoreboard = () => {
    setShowResetModal(true);
  };

  // Zerar Toda a Partida (Reset Total: Placar 0x0, Sets 0x0, Set 1, Status Ativo)
  const handleConfirmReset = () => {
    const updatedMatch: Match = {
      ...match,
      currentScoreA: 0,
      currentScoreB: 0,
      setsWonA: 0,
      setsWonB: 0,
      currentSet: 1,
      setHistory: [],
      playByPlay: [],
      timeouts: [],
      substitutions: [],
      sanctions: [],
      status: 'live',
    };
    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);
    setShowResetModal(false);
  };

  // Zerar Apenas o Set Atual (0 x 0)
  const handleResetCurrentSetOnly = () => {
    const updatedMatch: Match = {
      ...match,
      currentScoreA: 0,
      currentScoreB: 0,
      status: match.status === 'finished' ? 'live' : match.status,
    };
    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);
    setShowResetModal(false);
  };

  // Request Timeout (Pedir Tempo)
  const handleRequestTimeout = (teamId: string) => {
    const teamName = teamId === match.teamA.id ? match.teamA.name : match.teamB.name;
    const currentSetTimeouts = match.timeouts.filter(
      (t) => t.setNumber === match.currentSet && t.teamId === teamId
    );

    if (currentSetTimeouts.length >= match.config.maxTimeoutsPerSet) {
      alert(`A equipe ${teamName} já utilizou os ${match.config.maxTimeoutsPerSet} tempos deste set!`);
      return;
    }

    const newTimeoutRecord = {
      id: `to-${Date.now()}`,
      setNumber: match.currentSet,
      teamId,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      scoreA: match.currentScoreA,
      scoreB: match.currentScoreB,
    };

    const updatedMatch: Match = {
      ...match,
      timeouts: [...match.timeouts, newTimeoutRecord],
    };

    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);

    setActiveTimeout({
      teamId,
      teamName,
      timeLeft: 30, // 30 seconds official timeout
    });
  };

  // Substitution Action
  const handleConfirmSub = () => {
    if (!subModalTeamId || !subPlayerOutId || !subPlayerInId) return;

    const team = subModalTeamId === match.teamA.id ? match.teamA : match.teamB;
    const playerOut = team.players.find((p) => p.id === subPlayerOutId);
    const playerIn = team.players.find((p) => p.id === subPlayerInId);

    if (!playerOut || !playerIn) return;

    // Swap in rotation
    const newRotation = team.rotation.map((id) => (id === subPlayerOutId ? subPlayerInId : id));

    const updatedTeam = {
      ...team,
      rotation: newRotation,
    };

    const newSubRecord = {
      id: `sub-${Date.now()}`,
      setNumber: match.currentSet,
      teamId: subModalTeamId,
      playerOutId: subPlayerOutId,
      playerInId: subPlayerInId,
      scoreA: match.currentScoreA,
      scoreB: match.currentScoreB,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };

    const updatedMatch: Match = {
      ...match,
      teamA: subModalTeamId === match.teamA.id ? updatedTeam : match.teamA,
      teamB: subModalTeamId === match.teamB.id ? updatedTeam : match.teamB,
      substitutions: [...match.substitutions, newSubRecord],
    };

    setMatch(updatedMatch);
    if (onPointAdded) onPointAdded(updatedMatch);

    setSubModalTeamId(null);
    setSubPlayerOutId('');
    setSubPlayerInId('');
  };

  const currentSetTimeoutsA = match.timeouts.filter(
    (t) => t.setNumber === match.currentSet && t.teamId === match.teamA.id
  ).length;

  const currentSetTimeoutsB = match.timeouts.filter(
    (t) => t.setNumber === match.currentSet && t.teamId === match.teamB.id
  ).length;

  const winnerTeam = setWinnerModal?.winnerTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Side Swap (Inversão de Quadra conforme intervalo de sets)
  const swapInterval = match.config.swapSidesIntervalSets || 1;
  const isSwapped = Boolean(
    match.config.autoSwapSidesOnSetEnd &&
    Math.floor((match.currentSet - 1) / swapInterval) % 2 !== 0
  );

  const leftTeam = isSwapped ? match.teamB : match.teamA;
  const rightTeam = isSwapped ? match.teamA : match.teamB;
  const leftScore = isSwapped ? match.currentScoreB : match.currentScoreA;
  const rightScore = isSwapped ? match.currentScoreA : match.currentScoreB;
  const leftSetsWon = isSwapped ? match.setsWonB : match.setsWonA;
  const rightSetsWon = isSwapped ? match.setsWonA : match.setsWonB;
  const leftTimeouts = isSwapped ? currentSetTimeoutsB : currentSetTimeoutsA;
  const rightTimeouts = isSwapped ? currentSetTimeoutsA : currentSetTimeoutsB;
  const isLeftTeamA = leftTeam.id === match.teamA.id;

  return (
    <div className="space-y-6 pb-12">
      {/* Setup Match Banner */}
      {match.status === 'setup' && (
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border-2 border-indigo-500/80 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-black text-2xl shrink-0">
              ⏳
            </div>
            <div>
              <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">
                Partida em Pré-Jogo
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Escalação em Aberto
              </h2>
              <p className="text-xs text-slate-300">
                A partida está pronta para começar. Clique para iniciar o jogo no placar ao vivo.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMatch({ ...match, status: 'live' })}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all active:scale-95 border border-emerald-400/30"
          >
            🚀 Iniciar Partida
          </button>
        </div>
      )}

      {/* Finished Match Banner */}
      {match.status === 'finished' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                  Partida Encerrada
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  Ajustes Salvos Mantidos
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {(() => {
                  const winnerTeam = match.setsWonA > match.setsWonB ? match.teamA : match.teamB;
                  const winnerSets = Math.max(match.setsWonA, match.setsWonB);
                  const loserSets = Math.min(match.setsWonA, match.setsWonB);
                  return `Vitória de ${winnerTeam.name}! (${winnerSets} x ${loserSets} Sets)`;
                })()}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Clique para zerar a pontuação e iniciar uma nova partida com as configurações atuais.
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirmReset}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all active:scale-95 border border-emerald-400/30"
          >
            <RotateCcw className="w-5 h-5" />
            Zerar Placar e Iniciar Nova Partida
          </button>
        </div>
      )}

      {/* Top Set Status Header (Hidden in Lite Mode) */}
      {!isLite && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Set {match.currentSet} em Andamento
              </span>
              {isSwapped && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                  Troca de Lado Ativa
                </span>
              )}
              <span className="text-xs text-slate-400">
                Regra: Melhor de {match.config.setsToWin * 2 - 1} Sets (até{' '}
                {match.currentSet === match.config.setsToWin * 2 - 1
                  ? match.config.tieBreakPoints
                  : match.config.pointsPerSet}{' '}
                pts)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">{match.title}</h2>
          </div>

          {/* Set History Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-2 uppercase">Sets Anteriores:</span>
            {match.setHistory.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Primeiro Set</span>
            ) : (
              match.setHistory.map((s, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold"
                >
                  Set {s.setNumber}:{' '}
                  <span className={s.winnerTeamId === match.teamA.id ? 'text-blue-400' : 'text-slate-400'}>
                    {s.scoreA}
                  </span>{' '}
                  x{' '}
                  <span className={s.winnerTeamId === match.teamB.id ? 'text-red-400' : 'text-slate-400'}>
                    {s.scoreB}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Dual Scoreboard Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT SIDE SCOREBOARD CARD */}
        <div
          className={`bg-slate-900 border-2 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between ${
            isLeftTeamA ? 'border-blue-600/40' : 'border-red-600/40'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
              isLeftTeamA ? 'bg-blue-600/10' : 'bg-red-600/10'
            }`}
          ></div>

          <div>
            {/* Team Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg text-white ${
                    isLeftTeamA ? 'bg-blue-600 shadow-blue-500/30' : 'bg-red-600 shadow-red-500/30'
                  }`}
                >
                  {leftTeam.logoEmoji || (isLeftTeamA ? '🏐' : '🔥')}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    {leftTeam.name}
                    {isSwapped && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        Lado Esquerdo
                      </span>
                    )}
                  </h3>
                  <p
                    className={`text-xs font-semibold ${
                      isLeftTeamA ? 'text-blue-300' : 'text-red-300'
                    }`}
                  >
                    Sets Vencidos: <span className="text-lg font-black">{leftSetsWon}</span>
                  </p>
                </div>
              </div>

              {/* Serving Indicator */}
              <button
                onClick={() => setMatch({ ...match, servingTeamId: leftTeam.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                  match.servingTeamId === leftTeam.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <span>🏐</span>
                {match.servingTeamId === leftTeam.id ? 'SAQUE ATUAL' : 'Sacar'}
              </button>
            </div>

            {/* Score Digit - Auto-adjustable & Enlarged in Lite Mode */}
            <div
              className={`text-center ${
                isLite
                  ? `my-4 sm:my-6 py-6 sm:py-10 bg-slate-950/70 rounded-3xl border shadow-inner flex flex-col items-center justify-center transition-all ${
                      isLeftTeamA ? 'border-blue-500/20' : 'border-red-500/20'
                    }`
                  : 'my-8'
              }`}
            >
              <div className="inline-block relative">
                <span
                  className={`font-black tracking-tighter leading-none ${
                    isLeftTeamA
                      ? 'text-blue-400 drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)]'
                      : 'text-red-400 drop-shadow-[0_10px_25px_rgba(220,38,38,0.4)]'
                  } ${
                    isLite
                      ? 'text-9xl sm:text-[11rem] md:text-[13rem]'
                      : 'text-8xl sm:text-9xl'
                  }`}
                >
                  {leftScore}
                </span>
                <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                  Pontos no Set
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Left Team */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {isLite ? (
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={() => handleDecrementPoint(leftTeam.id)}
                  disabled={match.status === 'finished' || leftScore <= 0}
                  className="col-span-1 py-4 px-2 rounded-2xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-500/50 active:scale-95 border-2 border-slate-700 text-rose-400 font-black text-lg flex items-center justify-center gap-1 shadow-md transition-all disabled:opacity-30 cursor-pointer"
                  title="Subtrair 1 Ponto"
                >
                  <Minus className="w-6 h-6 text-rose-400 stroke-[3]" />
                  <span className="text-xs font-black hidden sm:inline">-1</span>
                </button>
                <button
                  onClick={() => handleOpenPointModal(leftTeam.id)}
                  disabled={match.status === 'finished'}
                  className={`col-span-3 py-4 px-4 rounded-2xl active:scale-95 text-white font-black text-xl shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer border ${
                    isLeftTeamA
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 border-blue-400/30'
                      : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-500 hover:from-red-500 hover:to-orange-500 shadow-red-600/30 border-red-400/30'
                  }`}
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                  +1 PONTO
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenPointModal(leftTeam.id)}
                disabled={match.status === 'finished'}
                className={`w-full py-4 rounded-2xl active:scale-[0.98] text-white font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer ${
                  isLeftTeamA
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-600/30'
                }`}
              >
                <Plus className="w-7 h-7 stroke-[3]" />
                +1 PONTO ({leftTeam.name})
              </button>
            )}

            {!isLite && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRequestTimeout(leftTeam.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Tempo ({leftTimeouts}/2)
                </button>

                <button
                  onClick={() => setSubModalTeamId(leftTeam.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  Substituição
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE SCOREBOARD CARD */}
        <div
          className={`bg-slate-900 border-2 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between ${
            !isLeftTeamA ? 'border-blue-600/40' : 'border-red-600/40'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
              !isLeftTeamA ? 'bg-blue-600/10' : 'bg-red-600/10'
            }`}
          ></div>

          <div>
            {/* Team Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg text-white ${
                    !isLeftTeamA ? 'bg-blue-600 shadow-blue-500/30' : 'bg-red-600 shadow-red-500/30'
                  }`}
                >
                  {rightTeam.logoEmoji || (!isLeftTeamA ? '🏐' : '🔥')}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    {rightTeam.name}
                    {isSwapped && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        Lado Direito
                      </span>
                    )}
                  </h3>
                  <p
                    className={`text-xs font-semibold ${
                      !isLeftTeamA ? 'text-blue-300' : 'text-red-300'
                    }`}
                  >
                    Sets Vencidos: <span className="text-lg font-black">{rightSetsWon}</span>
                  </p>
                </div>
              </div>

              {/* Serving Indicator */}
              <button
                onClick={() => setMatch({ ...match, servingTeamId: rightTeam.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                  match.servingTeamId === rightTeam.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <span>🏐</span>
                {match.servingTeamId === rightTeam.id ? 'SAQUE ATUAL' : 'Sacar'}
              </button>
            </div>

            {/* Score Digit */}
            <div
              className={`text-center ${
                isLite
                  ? `my-4 sm:my-6 py-6 sm:py-10 bg-slate-950/70 rounded-3xl border shadow-inner flex flex-col items-center justify-center transition-all ${
                      !isLeftTeamA ? 'border-blue-500/20' : 'border-red-500/20'
                    }`
                  : 'my-8'
              }`}
            >
              <div className="inline-block relative">
                <span
                  className={`font-black tracking-tighter leading-none ${
                    !isLeftTeamA
                      ? 'text-blue-400 drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)]'
                      : 'text-red-400 drop-shadow-[0_10px_25px_rgba(220,38,38,0.4)]'
                  } ${
                    isLite
                      ? 'text-9xl sm:text-[11rem] md:text-[13rem]'
                      : 'text-8xl sm:text-9xl'
                  }`}
                >
                  {rightScore}
                </span>
                <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                  Pontos no Set
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Right Team */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {isLite ? (
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={() => handleDecrementPoint(rightTeam.id)}
                  disabled={match.status === 'finished' || rightScore <= 0}
                  className="col-span-1 py-4 px-2 rounded-2xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-500/50 active:scale-95 border-2 border-slate-700 text-rose-400 font-black text-lg flex items-center justify-center gap-1 shadow-md transition-all disabled:opacity-30 cursor-pointer"
                  title="Subtrair 1 Ponto"
                >
                  <Minus className="w-6 h-6 text-rose-400 stroke-[3]" />
                  <span className="text-xs font-black hidden sm:inline">-1</span>
                </button>
                <button
                  onClick={() => handleOpenPointModal(rightTeam.id)}
                  disabled={match.status === 'finished'}
                  className={`col-span-3 py-4 px-4 rounded-2xl active:scale-95 text-white font-black text-xl shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer border ${
                    !isLeftTeamA
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 border-blue-400/30'
                      : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-500 hover:from-red-500 hover:to-orange-500 shadow-red-600/30 border-red-400/30'
                  }`}
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                  +1 PONTO
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenPointModal(rightTeam.id)}
                disabled={match.status === 'finished'}
                className={`w-full py-4 rounded-2xl active:scale-[0.98] text-white font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer ${
                  !isLeftTeamA
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-600/30'
                }`}
              >
                <Plus className="w-7 h-7 stroke-[3]" />
                +1 PONTO ({rightTeam.name})
              </button>
            )}

            {!isLite && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRequestTimeout(rightTeam.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Tempo ({rightTimeouts}/2)
                </button>

                <button
                  onClick={() => setSubModalTeamId(rightTeam.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  Substituição
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VNL Official Whistle Audio & Reset Scoreboard Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Reset Scoreboard Button */}
        <button
          onClick={handleResetScoreboard}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600 border border-rose-500/40 text-rose-400 hover:text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          title="Zerar a pontuação do set atual para 0 x 0"
        >
          <RotateCcw className="w-4 h-4 text-rose-400 group-hover:text-white transition-colors" />
          🔄 Zerar Placar (0 x 0)
        </button>

        {/* Whistle Sound Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => playVnlWhistle('long')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            title="Tocar apito longo (autorização de saque)"
          >
            <Volume2 className="w-4 h-4" />
            📣 Apito Saque (Longo)
          </button>

          <button
            onClick={() => playVnlWhistle('short')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            title="Tocar apito duplo curto (marcação de ponto / rali)"
          >
            <Volume2 className="w-4 h-4" />
            📣 Apito Ponto / Rali (Curto)
          </button>
        </div>
      </div>

      {/* Control Bar: Undo last point & Play-by-play summary (Hidden in Lite Mode) */}
      {!isLite && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white">
          <button
            onClick={handleUndoPoint}
            disabled={match.playByPlay.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-4 h-4 text-amber-400" />
            Desfazer Último Ponto
          </button>

          {/* Last Point Log Preview */}
          {match.playByPlay.length > 0 && (
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="font-bold text-amber-400">Último Lance:</span>
              <span>
                {match.playByPlay[0].teamId === match.teamA.id ? match.teamA.name : match.teamB.name}{' '}
                marcou por{' '}
                <strong className="text-white uppercase">{match.playByPlay[0].pointType}</strong> (
                {match.playByPlay[0].scoreA} x {match.playByPlay[0].scoreB})
              </span>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD POINT BREAKDOWN */}
      {scoringTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black">
                  Registrar Ponto - {scoringTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setScoringTeamId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 my-5">
              {/* Type of Point */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-400 mb-2">
                  Tipo de Ponto:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'attack', label: '💥 Ataque' },
                    { id: 'ace', label: '🎯 Ace (Saque)' },
                    { id: 'block', label: '🛡️ Bloqueio' },
                    { id: 'opponent_error', label: '⚠️ Erro Adversário' },
                    { id: 'other', label: '🏐 Outro' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPointType(t.id as PointType)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        pointType === t.id
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Responsible */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-400 mb-2">
                  Jogador Pontuador (Opcional):
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Selecione o Jogador --</option>
                  {scoringTeam.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">
                  Observação do Lance (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Saque forte na diagonal, bola fora..."
                  value={pointNotes}
                  onChange={(e) => setPointNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setScoringTeamId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPoint}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-black text-white shadow-lg shadow-blue-600/30"
              >
                Confirmar Ponto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMEOUT OVERLAY TIMER MODAL */}
      {activeTimeout && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4 border border-amber-500/40">
              <Clock className="w-8 h-8 animate-spin" />
            </div>

            <h3 className="text-xl font-black uppercase text-amber-300">Tempo Solicitado</h3>
            <p className="text-2xl font-extrabold text-white mt-1">{activeTimeout.teamName}</p>

            <div className="my-6">
              <div className="text-7xl font-black text-amber-400 tracking-tighter">
                {activeTimeout.timeLeft}s
              </div>
              <p className="text-xs text-slate-400 mt-2">Duração oficial de 30 segundos</p>
            </div>

            <button
              onClick={() => setActiveTimeout(null)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Encerrar Tempo
            </button>
          </div>
        </div>
      )}

      {/* SUBSTITUTION MODAL */}
      {subModalTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Substituição de Jogador
              </h3>
              <button
                onClick={() => setSubModalTeamId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">
                  Jogador a Sair (Quadra):
                </label>
                <select
                  value={subPlayerOutId}
                  onChange={(e) => setSubPlayerOutId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="">-- Selecione o jogador que sai --</option>
                  {(subModalTeamId === match.teamA.id ? match.teamA : match.teamB).players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-400 mb-1">
                  Jogador a Entrar (Reserva):
                </label>
                <select
                  value={subPlayerInId}
                  onChange={(e) => setSubPlayerInId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="">-- Selecione o jogador que entra --</option>
                  {(subModalTeamId === match.teamA.id ? match.teamA : match.teamB).players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSubModalTeamId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSub}
                disabled={!subPlayerOutId || !subPlayerInId}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm text-white disabled:opacity-40"
              >
                Confirmar Troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET WINNER CELEBRATION MODAL */}
      {setWinnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center text-white shadow-2xl relative animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-amber-400/20 text-amber-400 mx-auto flex items-center justify-center mb-4 border-2 border-amber-400">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <h3 className="text-2xl font-black uppercase tracking-wider text-amber-300">
              {setWinnerModal.isMatchOver ? '🎉 FIM DE JOGO - VITÓRIA!' : 'FIM DO SET!'}
            </h3>

            <p className="text-3xl font-black text-white mt-2">{winnerTeam.name}</p>
            {(() => {
              const lastSet = match.setHistory[match.setHistory.length - 1];
              const isWinnerA = setWinnerModal.winnerTeamId === match.teamA.id;
              const winnerPoints = lastSet
                ? (lastSet.winnerTeamId === match.teamA.id ? lastSet.scoreA : lastSet.scoreB)
                : Math.max(match.currentScoreA, match.currentScoreB);
              const loserPoints = lastSet
                ? (lastSet.winnerTeamId === match.teamA.id ? lastSet.scoreB : lastSet.scoreA)
                : Math.min(match.currentScoreA, match.currentScoreB);

              if (setWinnerModal.isMatchOver) {
                const winnerSets = Math.max(match.setsWonA, match.setsWonB);
                const loserSets = Math.min(match.setsWonA, match.setsWonB);
                return (
                  <div>
                    <p className="text-lg font-black text-amber-400 mt-1">
                      Venceu a partida por {winnerSets} x {loserSets} Sets!
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      (Placar do set final: {winnerPoints} x {loserPoints} pts)
                    </p>
                  </div>
                );
              }

              return (
                <p className="text-sm text-slate-300 mt-1">
                  Venceu o set por{' '}
                  <span className="font-extrabold text-amber-400">
                    {winnerPoints} x {loserPoints}
                  </span>{' '}
                  pts
                </p>
              );
            })()}

            <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white uppercase mb-2">Placar Geral dos Sets:</p>
              <p className="text-lg font-black text-blue-400">
                {match.teamA.name}: {match.setsWonA} sets
              </p>
              <p className="text-lg font-black text-red-400">
                {match.teamB.name}: {match.setsWonB} sets
              </p>
            </div>

            {setWinnerModal.isMatchOver ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleConfirmReset();
                    setSetWinnerModal(null);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-500/30 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/30"
                >
                  <RotateCcw className="w-5 h-5" />
                  Iniciar Nova Partida (Zerar Placar)
                </button>
                <button
                  onClick={() => setSetWinnerModal(null)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-sm border border-slate-700 cursor-pointer"
                >
                  Ver Relatório / Manter Histórico
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSetWinnerModal(null)}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/20 uppercase tracking-wider cursor-pointer"
              >
                Iniciar Próximo Set
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESET SCOREBOARD CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">Zerar e Reiniciar Partida</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Escolha como deseja resetar a partida:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="w-full p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-left font-black text-sm text-white shadow-lg shadow-rose-600/30 flex items-center justify-between cursor-pointer border border-rose-400/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Zerar Partida Inteira (0x0 e Sets 0x0)</span>
                  </div>
                  <p className="text-xs font-normal text-rose-100/80 mt-0.5">
                    Reseta placar de pontos, placar de sets e histórico para um novo jogo.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetCurrentSetOnly}
                className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-left font-bold text-sm text-slate-200 border border-slate-700 flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-100">
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Zerar Apenas Set Atual (0 x 0)</span>
                  </div>
                  <p className="text-xs font-normal text-slate-400 mt-0.5">
                    Mantém os sets já vencidos e reseta somente os pontos do set atual.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
