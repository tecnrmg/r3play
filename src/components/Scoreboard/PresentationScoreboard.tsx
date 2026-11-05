import React from 'react';
import { Match } from '../../types/volleyball';
import { Minimize2, Flame, Trophy, Volume2, Tv, UserCheck, Settings } from 'lucide-react';
import { usePlanContext } from '../../context/PlanContext';

interface PresentationScoreboardProps {
  match: Match;
  onExit: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const PresentationScoreboard: React.FC<PresentationScoreboardProps> = ({
  match,
  onExit,
  onNavigateToTab,
}) => {
  const { isFree } = usePlanContext();
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
  const isLeftTeamA = leftTeam.id === match.teamA.id;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none">
      {/* Background Neon Accent Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 z-10 gap-3">
        <div>
          <span className={`text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
            isFree
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
              : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
          }`}>
            {isFree ? <Tv className="w-3.5 h-3.5 text-emerald-400" /> : <Flame className="w-3.5 h-3.5 text-amber-400" />}
            {isFree ? 'Modo TV (Modo Free) • Placar + Inscrições' : 'Modo Transmissão Placar Ao Vivo'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">{match.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {isFree && onNavigateToTab && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl">
              <button
                onClick={() => onNavigateToTab('participation')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all transform hover:scale-105"
              >
                <UserCheck className="w-4 h-4 text-slate-950" />
                <span>Lista de Participação (Quero Jogar!)</span>
              </button>

              <button
                onClick={() => onNavigateToTab('settings')}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
                title="Ajustes e Troca de Plano"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Ajustes</span>
              </button>
            </div>
          )}

          {!isFree && (
            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" /> Sair do Modo TV
            </button>
          )}
        </div>
      </div>

      {/* MAIN SCOREBOARD ARENA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto z-10">
        {/* LEFT TEAM */}
        <div
          className={`bg-slate-900/90 border-4 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden flex flex-col justify-between h-[380px] sm:h-[420px] ${
            isLeftTeamA ? 'border-blue-600' : 'border-red-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{leftTeam.logoEmoji || (isLeftTeamA ? '🏐' : '🔥')}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white text-left">
                {leftTeam.name}
              </h2>
            </div>

            {match.servingTeamId === leftTeam.id && (
              <span className="px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase animate-bounce shadow-lg shadow-amber-400/20">
                🏐 SAQUE
              </span>
            )}
          </div>

          {/* Giant Score */}
          <div className="my-auto">
            <span
              className={`text-9xl sm:text-[160px] font-black leading-none tracking-tighter ${
                isLeftTeamA
                  ? 'text-blue-400 drop-shadow-[0_15px_30px_rgba(37,99,235,0.4)]'
                  : 'text-red-400 drop-shadow-[0_15px_30px_rgba(220,38,38,0.4)]'
              }`}
            >
              {leftScore}
            </span>
          </div>

          <div
            className={`flex justify-between items-center text-sm font-black pt-4 border-t border-slate-800 ${
              isLeftTeamA ? 'text-blue-300' : 'text-red-300'
            }`}
          >
            <span>SETS VENCIDOS: {leftSetsWon}</span>
            <span>SET ATUAL: {match.currentSet}</span>
          </div>
        </div>

        {/* RIGHT TEAM */}
        <div
          className={`bg-slate-900/90 border-4 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden flex flex-col justify-between h-[380px] sm:h-[420px] ${
            !isLeftTeamA ? 'border-blue-600' : 'border-red-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{rightTeam.logoEmoji || (!isLeftTeamA ? '🏐' : '🔥')}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white text-left">
                {rightTeam.name}
              </h2>
            </div>

            {match.servingTeamId === rightTeam.id && (
              <span className="px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase animate-bounce shadow-lg shadow-amber-400/20">
                🏐 SAQUE
              </span>
            )}
          </div>

          {/* Giant Score */}
          <div className="my-auto">
            <span
              className={`text-9xl sm:text-[160px] font-black leading-none tracking-tighter ${
                !isLeftTeamA
                  ? 'text-blue-400 drop-shadow-[0_15px_30px_rgba(37,99,235,0.4)]'
                  : 'text-red-400 drop-shadow-[0_15px_30px_rgba(220,38,38,0.4)]'
              }`}
            >
              {rightScore}
            </span>
          </div>

          <div
            className={`flex justify-between items-center text-sm font-black pt-4 border-t border-slate-800 ${
              !isLeftTeamA ? 'text-blue-300' : 'text-red-300'
            }`}
          >
            <span>SETS VENCIDOS: {rightSetsWon}</span>
            <span>SET ATUAL: {match.currentSet}</span>
          </div>
        </div>
      </div>

      {/* Bottom Set History Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 z-10 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-extrabold uppercase">Histórico de Sets:</span>
          {match.setHistory.length === 0 ? (
            <span className="text-slate-500 italic">Primeiro Set</span>
          ) : (
            match.setHistory.map((s, idx) => (
              <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                Set {s.setNumber}: {s.scoreA} x {s.scoreB}
              </span>
            ))
          )}
        </div>

        <div className="text-slate-400 font-mono">
          Vôlei Pro - Sistema de Placar e Estatísticas em Tempo Real
        </div>
      </div>
    </div>
  );
};
