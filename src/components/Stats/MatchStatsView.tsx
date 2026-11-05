import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Activity,
  BarChart2,
  Search,
  Filter,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Match, PlayerStats } from '../../types/volleyball';
import { computePlayerStats } from '../../utils/volleyballUtils';

interface MatchStatsViewProps {
  match: Match;
}

export const MatchStatsView: React.FC<MatchStatsViewProps> = ({ match }) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const allPlayerStats = computePlayerStats(match);

  // Filter player stats
  const filteredPlayerStats = allPlayerStats.filter((st) => {
    const matchesTeam = selectedTeamFilter === 'all' || st.teamId === selectedTeamFilter;
    const matchesSearch =
      st.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.playerNumber.toString().includes(searchTerm);
    return matchesTeam && matchesSearch;
  });

  // Calculate team level totals
  const getTeamStat = (teamId: string, type: 'attack' | 'ace' | 'block' | 'opponent_error') => {
    return match.playByPlay.filter((pt) => pt.teamId === teamId && pt.pointType === type).length;
  };

  const teamAAttacks = getTeamStat(match.teamA.id, 'attack');
  const teamBAttacks = getTeamStat(match.teamB.id, 'attack');

  const teamAAces = getTeamStat(match.teamA.id, 'ace');
  const teamBAces = getTeamStat(match.teamB.id, 'ace');

  const teamABlocks = getTeamStat(match.teamA.id, 'block');
  const teamBBlocks = getTeamStat(match.teamB.id, 'block');

  const teamAErrors = getTeamStat(match.teamA.id, 'opponent_error');
  const teamBErrors = getTeamStat(match.teamB.id, 'opponent_error');

  const totalPointsA = match.playByPlay.filter((pt) => pt.teamId === match.teamA.id).length;
  const totalPointsB = match.playByPlay.filter((pt) => pt.teamId === match.teamB.id).length;

  const topScorer = allPlayerStats.length > 0 ? allPlayerStats[0] : null;

  // Filter play by play
  const filteredPlayByPlay = match.playByPlay.filter((pt) => {
    if (selectedSetFilter === 'all') return true;
    return pt.setNumber === Number(selectedSetFilter);
  });

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Estatísticas Avançadas da Partida
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Análise em tempo real de eficiência de ataque, bloqueio, saques e desempenho individual.
          </p>
        </div>

        {/* Top Scorer Spotlight */}
        {topScorer && topScorer.totalPoints > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-blue-500/20 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider block">
                Maior Pontuador
              </span>
              <p className="text-sm font-black text-white">
                #{topScorer.playerNumber} {topScorer.playerName}
              </p>
              <span className="text-xs text-amber-200 font-extrabold">
                {topScorer.totalPoints} Pontos ({topScorer.attacks} atq, {topScorer.aces} aces,{' '}
                {topScorer.blocks} blq)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TEAM COMPARISON METRICS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <h3 className="text-lg font-black flex items-center gap-2 border-b border-slate-800 pb-3">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          Comparativo por Fundamento ({match.teamA.name} vs {match.teamB.name})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attack Bar */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-400">{match.teamA.name}: {teamAAttacks}</span>
              <span className="uppercase text-slate-400">💥 Ataques Eficientes</span>
              <span className="text-red-400">{match.teamB.name}: {teamBAttacks}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    teamAAttacks + teamBAttacks > 0
                      ? (teamAAttacks / (teamAAttacks + teamBAttacks)) * 100
                      : 50
                  }%`,
                }}
                className="bg-blue-500 h-full transition-all"
              ></div>
              <div
                style={{
                  width: `${
                    teamAAttacks + teamBAttacks > 0
                      ? (teamBAttacks / (teamAAttacks + teamBAttacks)) * 100
                      : 50
                  }%`,
                }}
                className="bg-red-500 h-full transition-all"
              ></div>
            </div>
          </div>

          {/* Aces Bar */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-400">{match.teamA.name}: {teamAAces}</span>
              <span className="uppercase text-slate-400">🎯 Aces de Saque</span>
              <span className="text-red-400">{match.teamB.name}: {teamBAces}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    teamAAces + teamBAces > 0
                      ? (teamAAces / (teamAAces + teamBAces)) * 100
                      : 50
                  }%`,
                }}
                className="bg-blue-500 h-full transition-all"
              ></div>
              <div
                style={{
                  width: `${
                    teamAAces + teamBAces > 0
                      ? (teamBAces / (teamAAces + teamBAces)) * 100
                      : 50
                  }%`,
                }}
                className="bg-red-500 h-full transition-all"
              ></div>
            </div>
          </div>

          {/* Block Bar */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-400">{match.teamA.name}: {teamABlocks}</span>
              <span className="uppercase text-slate-400">🛡️ Bloqueios Pontonto</span>
              <span className="text-red-400">{match.teamB.name}: {teamBBlocks}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    teamABlocks + teamBBlocks > 0
                      ? (teamABlocks / (teamABlocks + teamBBlocks)) * 100
                      : 50
                  }%`,
                }}
                className="bg-blue-500 h-full transition-all"
              ></div>
              <div
                style={{
                  width: `${
                    teamABlocks + teamBBlocks > 0
                      ? (teamBBlocks / (teamABlocks + teamBBlocks)) * 100
                      : 50
                  }%`,
                }}
                className="bg-red-500 h-full transition-all"
              ></div>
            </div>
          </div>

          {/* Errors Conceded Bar */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-400">{match.teamA.name}: {teamAErrors}</span>
              <span className="uppercase text-slate-400">⚠️ Pontos de Erro Adversário</span>
              <span className="text-red-400">{match.teamB.name}: {teamBErrors}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    teamAErrors + teamBErrors > 0
                      ? (teamAErrors / (teamAErrors + teamBErrors)) * 100
                      : 50
                  }%`,
                }}
                className="bg-blue-500 h-full transition-all"
              ></div>
              <div
                style={{
                  width: `${
                    teamAErrors + teamBErrors > 0
                      ? (teamBErrors / (teamAErrors + teamBErrors)) * 100
                      : 50
                  }%`,
                }}
                className="bg-red-500 h-full transition-all"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PLAYER STATS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Desempenho Individual dos Jogadores
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Team Filter */}
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="all">Todas as Equipes</option>
              <option value={match.teamA.id}>{match.teamA.name}</option>
              <option value={match.teamB.id}>{match.teamB.name}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-extrabold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4"># / Jogador</th>
                <th className="py-3 px-4">Posição</th>
                <th className="py-3 px-4">Equipe</th>
                <th className="py-3 px-4 text-center">Ataques</th>
                <th className="py-3 px-4 text-center">Aces</th>
                <th className="py-3 px-4 text-center">Bloqueios</th>
                <th className="py-3 px-4 text-center text-amber-400">Total Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {filteredPlayerStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                    Nenhum ponto individual registrado até o momento.
                  </td>
                </tr>
              ) : (
                filteredPlayerStats.map((st) => {
                  const isTeamA = st.teamId === match.teamA.id;
                  const teamName = isTeamA ? match.teamA.name : match.teamB.name;

                  return (
                    <tr key={st.playerId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-black text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] text-amber-400">
                          #{st.playerNumber}
                        </span>
                        {st.playerName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{st.playerPosition}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTeamA
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {teamName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">{st.attacks}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{st.aces}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{st.blocks}</td>
                      <td className="py-3 px-4 text-center font-black text-amber-400 text-sm">
                        {st.totalPoints}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLAY BY PLAY TIMELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Histórico Lance a Lance da Partida
          </h3>

          <select
            value={selectedSetFilter}
            onChange={(e) => setSelectedSetFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="all">Todos os Sets</option>
            <option value="1">Set 1</option>
            <option value="2">Set 2</option>
            <option value="3">Set 3</option>
            <option value="4">Set 4</option>
            <option value="5">Set 5</option>
          </select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {filteredPlayByPlay.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500 italic">
              Nenhum lance registrado neste filtro.
            </p>
          ) : (
            filteredPlayByPlay.map((pt) => {
              const isTeamA = pt.teamId === match.teamA.id;
              const teamName = isTeamA ? match.teamA.name : match.teamB.name;
              const allPlayers = [...match.teamA.players, ...match.teamB.players];
              const player = allPlayers.find((p) => p.id === pt.playerId);

              return (
                <div
                  key={pt.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-extrabold">
                      Set {pt.setNumber}
                    </span>
                    <span className="text-slate-500 font-mono">{pt.timestamp}</span>

                    <span
                      className={`font-black ${isTeamA ? 'text-blue-400' : 'text-red-400'}`}
                    >
                      {teamName}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold uppercase text-[10px]">
                      {pt.pointType === 'attack'
                        ? '💥 Ataque'
                        : pt.pointType === 'ace'
                        ? '🎯 Ace'
                        : pt.pointType === 'block'
                        ? '🛡️ Bloqueio'
                        : pt.pointType === 'opponent_error'
                        ? '⚠️ Erro Adversário'
                        : 'Outro'}
                    </span>

                    {player && (
                      <span className="text-slate-300 font-semibold">
                        (#{player.number} {player.name})
                      </span>
                    )}

                    {pt.notes && <span className="text-slate-400 italic font-normal">"{pt.notes}"</span>}
                  </div>

                  <div className="font-black text-amber-300 text-sm bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    {pt.scoreA} x {pt.scoreB}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
