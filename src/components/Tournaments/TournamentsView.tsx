import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  Shield,
  Trash2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Match, ManagedTeam, Tournament, TournamentMatch } from '../../types/volleyball';
import { DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '../../data/mockMatches';

interface TournamentsViewProps {
  currentMatch: Match;
  setMatch: (match: Match) => void;
  setActiveTab: (tab: any) => void;
}

interface TeamStanding {
  team: ManagedTeam;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setRatio: number;
  pointsWon: number;
  pointsLost: number;
  pointRatio: number;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  currentMatch,
  setMatch,
  setActiveTab,
}) => {
  // Tournaments database in localStorage
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('r3play_tournaments') || localStorage.getItem('volei_pro_tournaments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tournaments', e);
      }
    }

    // Default demo tournament
    const teamA: ManagedTeam = { ...DEFAULT_TEAM_A, category: 'Adulto', city: 'São Paulo' };
    const teamB: ManagedTeam = { ...DEFAULT_TEAM_B, category: 'Adulto', city: 'Rio de Janeiro' };
    const teamC: ManagedTeam = {
      id: 'team-c-voley',
      name: 'Vôlei Sesi Verde',
      color: '#16a34a',
      logoEmoji: '🟢',
      players: [],
      rotation: [],
      category: 'Adulto',
      city: 'Campinas',
    };
    const teamD: ManagedTeam = {
      id: 'team-d-voley',
      name: 'Vôlei Cruzeiro Amarelo',
      color: '#eab308',
      logoEmoji: '⚡',
      players: [],
      rotation: [],
      category: 'Adulto',
      city: 'Belo Horizonte',
    };

    return [
      {
        id: 'tourn-2026-001',
        name: 'Liga Nacional R3Play 2026',
        category: 'Adulto Masculino',
        season: '2026',
        location: 'Ginásio Municipal de Esportes',
        teams: [teamA, teamB, teamC, teamD],
        matches: [
          {
            id: 'tm-1',
            roundName: 'Rodada 1',
            teamAId: teamA.id,
            teamBId: teamB.id,
            scoreA: 78,
            scoreB: 72,
            setsWonA: 3,
            setsWonB: 1,
            winnerTeamId: teamA.id,
            status: 'finished',
          },
          {
            id: 'tm-2',
            roundName: 'Rodada 1',
            teamAId: teamC.id,
            teamBId: teamD.id,
            scoreA: 85,
            scoreB: 88,
            setsWonA: 2,
            setsWonB: 3,
            winnerTeamId: teamD.id,
            status: 'finished',
          },
          {
            id: 'tm-3',
            roundName: 'Rodada 2 (Final)',
            teamAId: teamA.id,
            teamBId: teamD.id,
            status: 'scheduled',
          },
        ],
        createdDate: new Date().toISOString().split('T')[0],
      },
    ];
  });

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(
    () => tournaments[0] || null
  );

  const [isCreatingTourn, setIsCreatingTourn] = useState<boolean>(false);
  const [tournName, setTournName] = useState<string>('');
  const [tournCategory, setTournCategory] = useState<string>('Adulto Masculino');
  const [tournLocation, setTournLocation] = useState<string>('');

  // Save tournaments to localStorage
  useEffect(() => {
    localStorage.setItem('r3play_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  // Create new tournament
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournName.trim()) return;

    // Fetch teams from teams database or default
    const savedTeams = localStorage.getItem('r3play_teams_database') || localStorage.getItem('volei_pro_teams_database');
    let dbTeams: ManagedTeam[] = [];
    if (savedTeams) {
      try {
        dbTeams = JSON.parse(savedTeams);
      } catch (err) {}
    }
    if (dbTeams.length < 2) {
      dbTeams = [
        { ...DEFAULT_TEAM_A, category: 'Adulto', city: 'São Paulo' },
        { ...DEFAULT_TEAM_B, category: 'Adulto', city: 'Rio de Janeiro' },
      ];
    }

    const newTourn: Tournament = {
      id: `tourn-${Date.now()}`,
      name: tournName.trim(),
      category: tournCategory,
      season: new Date().getFullYear().toString(),
      location: tournLocation.trim() || 'Ginásio Municipal',
      teams: dbTeams,
      matches: [
        {
          id: `tm-${Date.now()}-1`,
          roundName: 'Rodada 1 - Abertura',
          teamAId: dbTeams[0].id,
          teamBId: dbTeams[1].id,
          status: 'scheduled',
        },
      ],
      createdDate: new Date().toISOString().split('T')[0],
    };

    setTournaments([...tournaments, newTourn]);
    setSelectedTournament(newTourn);
    setIsCreatingTourn(false);
    setTournName('');
    setTournLocation('');
  };

  // Delete Tournament
  const handleDeleteTournament = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este torneio?')) {
      const filtered = tournaments.filter((t) => t.id !== id);
      setTournaments(filtered);
      setSelectedTournament(filtered[0] || null);
    }
  };

  // Calculate FIVB Standings for Selected Tournament
  const calculateStandings = (tournament: Tournament): TeamStanding[] => {
    const standingsMap: Record<string, TeamStanding> = {};

    tournament.teams.forEach((t) => {
      standingsMap[t.id] = {
        team: t,
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        setRatio: 0,
        pointsWon: 0,
        pointsLost: 0,
        pointRatio: 0,
      };
    });

    tournament.matches.forEach((m) => {
      if (m.status !== 'finished' || m.setsWonA === undefined || m.setsWonB === undefined) return;

      const teamA = standingsMap[m.teamAId];
      const teamB = standingsMap[m.teamBId];

      if (!teamA || !teamB) return;

      teamA.played += 1;
      teamB.played += 1;

      teamA.setsWon += m.setsWonA;
      teamA.setsLost += m.setsWonB;
      teamB.setsWon += m.setsWonB;
      teamB.setsLost += m.setsWonA;

      teamA.pointsWon += m.scoreA || 0;
      teamA.pointsLost += m.scoreB || 0;
      teamB.pointsWon += m.scoreB || 0;
      teamB.pointsLost += m.scoreA || 0;

      // FIVB Official Volleyball Points System:
      // 3-0 or 3-1: Winner 3 pts, Loser 0 pts
      // 3-2: Winner 2 pts, Loser 1 pt
      if (m.setsWonA > m.setsWonB) {
        teamA.won += 1;
        teamB.lost += 1;
        if (m.setsWonA - m.setsWonB >= 2) {
          teamA.points += 3;
        } else {
          teamA.points += 2;
          teamB.points += 1;
        }
      } else {
        teamB.won += 1;
        teamA.lost += 1;
        if (m.setsWonB - m.setsWonA >= 2) {
          teamB.points += 3;
        } else {
          teamB.points += 2;
          teamA.points += 1;
        }
      }
    });

    // Calculate set ratios and point ratios
    return Object.values(standingsMap)
      .map((st) => {
        const setRatio = st.setsLost === 0 ? st.setsWon : st.setsWon / st.setsLost;
        const pointRatio = st.pointsLost === 0 ? st.pointsWon : st.pointsWon / st.pointsLost;
        return {
          ...st,
          setRatio: parseFloat(setRatio.toFixed(3)),
          pointRatio: parseFloat(pointRatio.toFixed(3)),
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.won !== a.won) return b.won - a.won;
        if (b.setRatio !== a.setRatio) return b.setRatio - a.setRatio;
        return b.pointRatio - a.pointRatio;
      });
  };

  // Launch a Tournament Match in Active Scoreboard
  const handleLaunchMatch = (tournMatch: TournamentMatch) => {
    if (!selectedTournament) return;

    const teamA = selectedTournament.teams.find((t) => t.id === tournMatch.teamAId) || DEFAULT_TEAM_A;
    const teamB = selectedTournament.teams.find((t) => t.id === tournMatch.teamBId) || DEFAULT_TEAM_B;

    const newMatch: Match = {
      ...currentMatch,
      id: `match-${tournMatch.id}`,
      title: `${selectedTournament.name} - ${tournMatch.roundName}`,
      location: selectedTournament.location,
      teamA,
      teamB,
      currentSet: 1,
      currentScoreA: 0,
      currentScoreB: 0,
      setsWonA: 0,
      setsWonB: 0,
      setHistory: [],
      playByPlay: [],
      timeouts: [],
      substitutions: [],
      status: 'live',
    };

    setMatch(newMatch);
    alert(`Partida "${tournMatch.roundName}" iniciada no Placar Ao Vivo!`);
    setActiveTab('scoreboard');
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
              Sistema de Torneios FIVB
            </span>
            <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Pontuação Oficial
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            Gestão de Torneios & Tabela de Classificação
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crie campeonatos, acompanhe a tabela de pontos corridos (regra 3/2/1/0 pts) e gerencie a tabela de jogos.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingTourn(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Criar Novo Torneio
        </button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Tournaments Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Campeonatos ({tournaments.length})
          </h3>

          <div className="space-y-2">
            {tournaments.map((t) => {
              const isSelected = selectedTournament?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                      : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-black text-sm text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.category} • {t.teams.length} equipes
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      isSelected ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content: Selected Tournament Standings & Schedule */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTournament ? (
            <div className="space-y-6">
              {/* Tournament Title Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                    {selectedTournament.category}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    {selectedTournament.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {selectedTournament.location} • Temporada {selectedTournament.season}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteTournament(selectedTournament.id)}
                  className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors"
                  title="Excluir Torneio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* FIVB OFFICIAL STANDINGS TABLE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Tabela de Classificação Oficial (Regra de Pontos FIVB)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    3-0/3-1: 3pts | 3-2: 2pts/1pt | 0-3/1-3: 0pt
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3 text-center">Pos</th>
                        <th className="py-3 px-3">Equipe / Clube</th>
                        <th className="py-3 px-2 text-center" title="Jogos Disputados">J</th>
                        <th className="py-3 px-2 text-center text-emerald-400" title="Vitórias">V</th>
                        <th className="py-3 px-2 text-center text-red-400" title="Derrotas">D</th>
                        <th className="py-3 px-3 text-center text-amber-300 font-black" title="Pontos">PTS</th>
                        <th className="py-3 px-2 text-center" title="Sets Pró">SP</th>
                        <th className="py-3 px-2 text-center" title="Sets Contra">SC</th>
                        <th className="py-3 px-2 text-center" title="Razão de Sets (SP/SC)">SR</th>
                        <th className="py-3 px-2 text-center" title="Pontos Pró">PP</th>
                        <th className="py-3 px-2 text-center" title="Pontos Contra">PC</th>
                        <th className="py-3 px-2 text-center" title="Razão de Pontos (PP/PC)">PR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-medium">
                      {calculateStandings(selectedTournament).map((st, idx) => (
                        <tr
                          key={st.team.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            idx === 0 ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-black">
                            {idx === 0 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center font-black text-xs shadow">
                                🥇
                              </span>
                            ) : idx === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 inline-flex items-center justify-center font-black text-xs">
                                🥈
                              </span>
                            ) : idx === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center font-black text-xs">
                                🥉
                              </span>
                            ) : (
                              `${idx + 1}º`
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <span className="text-base">{st.team.logoEmoji || '🏐'}</span>
                            <span>{st.team.name}</span>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">{st.played}</td>
                          <td className="py-3 px-2 text-center font-black text-emerald-400">{st.won}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{st.lost}</td>
                          <td className="py-3 px-3 text-center font-black text-amber-300 text-sm bg-slate-950/40">
                            {st.points}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">{st.setsWon}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{st.setsLost}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono text-[11px]">{st.setRatio}</td>
                          <td className="py-3 px-2 text-center text-slate-300">{st.pointsWon}</td>
                          <td className="py-3 px-2 text-center text-slate-400">{st.pointsLost}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono text-[11px]">{st.pointRatio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOURNAMENT FIXTURES & MATCH SCHEDULE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tabela de Jogos & Rodadas
                </h4>

                <div className="space-y-3">
                  {selectedTournament.matches.map((m) => {
                    const teamA = selectedTournament.teams.find((t) => t.id === m.teamAId);
                    const teamB = selectedTournament.teams.find((t) => t.id === m.teamBId);

                    return (
                      <div
                        key={m.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                            {m.roundName}
                          </span>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2 font-black text-sm text-white">
                              <span>{teamA?.logoEmoji || '🏐'}</span>
                              <span>{teamA?.name || 'Equipe A'}</span>
                            </div>

                            <span className="px-3 py-1 rounded-lg bg-slate-800 text-amber-400 font-black text-xs">
                              {m.status === 'finished'
                                ? `${m.setsWonA} x ${m.setsWonB}`
                                : 'VS'}
                            </span>

                            <div className="flex items-center gap-2 font-black text-sm text-white">
                              <span>{teamB?.name || 'Equipe B'}</span>
                              <span>{teamB?.logoEmoji || '🔥'}</span>
                            </div>
                          </div>
                        </div>

                        {m.status === 'scheduled' ? (
                          <button
                            onClick={() => handleLaunchMatch(m)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar Partida
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Encerrada
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              Selecione um torneio para visualizar a tabela de classificação e jogos.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating New Tournament */}
      {isCreatingTourn && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">Criar Novo Torneio / Liga</h3>
              <button
                onClick={() => setIsCreatingTourn(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Nome do Torneio:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Copa Estadual Vôlei Pro 2026..."
                  value={tournName}
                  onChange={(e) => setTournName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Categoria:
                </label>
                <select
                  value={tournCategory}
                  onChange={(e) => setTournCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Adulto Masculino">Adulto Masculino</option>
                  <option value="Adulto Feminino">Adulto Feminino</option>
                  <option value="Sub-21 Masculino">Sub-21 Masculino</option>
                  <option value="Sub-21 Feminino">Sub-21 Feminino</option>
                  <option value="Master (+35)">Master (+35)</option>
                  <option value="Misto">Misto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Ginásio / Local Principal:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ginásio Poliesportivo Municipal"
                  value={tournLocation}
                  onChange={(e) => setTournLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingTourn(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  Criar Campeonato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
