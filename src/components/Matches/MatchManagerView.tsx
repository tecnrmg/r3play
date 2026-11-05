import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Trash2,
  Trophy,
  Users,
  Settings,
  Sparkles,
  FolderOpen,
  Calendar,
  MapPin,
  Check,
} from 'lucide-react';
import { Match, Player, Team, PlayerPosition } from '../../types/volleyball';
import { DEMO_MATCH, DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '../../data/mockMatches';

interface MatchManagerViewProps {
  currentMatch: Match;
  setMatch: React.Dispatch<React.SetStateAction<Match>>;
  setActiveTab: (tab: any) => void;
}

export const MatchManagerView: React.FC<MatchManagerViewProps> = ({
  currentMatch,
  setMatch,
  setActiveTab,
}) => {
  const [savedMatches, setSavedMatches] = useState<Match[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New Match Form State
  const [title, setTitle] = useState<string>('Nova Partida R3Play');
  const [location, setLocation] = useState<string>('Ginásio Principal');
  const [setsToWin, setSetsToWin] = useState<number>(3); // Best of 5 (3 sets)
  const [pointsPerSet, setPointsPerSet] = useState<number>(25);
  const [tieBreakPoints, setTieBreakPoints] = useState<number>(15);

  const [teamAName, setTeamAName] = useState<string>('Equipe Azul');
  const [teamAEmoji, setTeamAEmoji] = useState<string>('⚡');
  const [teamBName, setTeamBName] = useState<string>('Equipe Vermelha');
  const [teamBEmoji, setTeamBEmoji] = useState<string>('🔥');

  // Load matches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('r3play_matches') || localStorage.getItem('volei_pro_matches');
    if (stored) {
      try {
        setSavedMatches(JSON.parse(stored));
      } catch (e) {
        console.error('Error reading saved matches', e);
      }
    } else {
      // Save demo match if none exist
      setSavedMatches([DEMO_MATCH]);
      localStorage.setItem('r3play_matches', JSON.stringify([DEMO_MATCH]));
    }
  }, []);

  const saveMatchesList = (list: Match[]) => {
    setSavedMatches(list);
    localStorage.setItem('r3play_matches', JSON.stringify(list));
  };

  const handleSelectMatch = (m: Match) => {
    setMatch(m);
    setActiveTab('scoreboard');
  };

  const handleDeleteMatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta partida?')) {
      const updated = savedMatches.filter((m) => m.id !== id);
      saveMatchesList(updated);
    }
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const teamA: Team = {
      id: `team-a-${Date.now()}`,
      name: teamAName.trim() || 'Equipe A',
      color: '#2563eb',
      logoEmoji: teamAEmoji,
      players: DEFAULT_TEAM_A.players.map((p, idx) => ({ ...p, id: `pa-${Date.now()}-${idx}` })),
      rotation: [],
    };
    teamA.rotation = teamA.players.slice(0, 6).map((p) => p.id);

    const teamB: Team = {
      id: `team-b-${Date.now()}`,
      name: teamBName.trim() || 'Equipe B',
      color: '#dc2626',
      logoEmoji: teamBEmoji,
      players: DEFAULT_TEAM_B.players.map((p, idx) => ({ ...p, id: `pb-${Date.now()}-${idx}` })),
      rotation: [],
    };
    teamB.rotation = teamB.players.slice(0, 6).map((p) => p.id);

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      title: title.trim() || 'Partida Vôlei Pro',
      location: location.trim() || 'Quadra',
      date: new Date().toISOString().split('T')[0],
      status: 'setup',
      config: {
        setsToWin,
        pointsPerSet,
        tieBreakPoints,
        minPointDiff: 2,
        maxSubstitutionsPerSet: 6,
        maxTimeoutsPerSet: 2,
      },
      teamA,
      teamB,
      currentSet: 1,
      currentScoreA: 0,
      currentScoreB: 0,
      setsWonA: 0,
      setsWonB: 0,
      setHistory: [],
      servingTeamId: teamA.id,
      playByPlay: [],
      timeouts: [],
      substitutions: [],
    };

    const updated = [newMatch, ...savedMatches];
    saveMatchesList(updated);
    setMatch(newMatch);
    setIsCreatingNew(false);
    setActiveTab('scoreboard');
  };

  const handleLoadDemo = () => {
    setMatch(DEMO_MATCH);
    setActiveTab('scoreboard');
  };

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-purple-400" />
            Gerenciador de Partidas Salvas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crie novos jogos, altere regras e mantenha o histórico completo das suas partidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs text-white shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isCreatingNew ? 'Ver Partidas' : 'Criar Nova Partida'}
          </button>

          <button
            onClick={handleLoadDemo}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Carregar Partida Exemplo
          </button>
        </div>
      </div>

      {/* CREATE NEW MATCH FORM */}
      {isCreatingNew ? (
        <form
          onSubmit={handleCreateMatch}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in"
        >
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-amber-400">Configuração da Nova Partida</h3>
            <p className="text-xs text-slate-400 mt-1">
              Defina o nome das equipes, regulamento de sets e pontuação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
                Título / Nome da Partida:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
                Local do Jogo / Ginásio:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Rules Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Formato do Jogo:</label>
              <select
                value={setsToWin}
                onChange={(e) => setSetsToWin(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
              >
                <option value={3}>Melhor de 5 Sets (Vence 3)</option>
                <option value={2}>Melhor de 3 Sets (Vence 2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Pontos nos Sets Regulares:</label>
              <input
                type="number"
                value={pointsPerSet}
                onChange={(e) => setPointsPerSet(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Pontos no Tie-Break:</label>
              <input
                type="number"
                value={tieBreakPoints}
                onChange={(e) => setTieBreakPoints(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
              />
            </div>
          </div>

          {/* Teams Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Team A */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-3">
              <h4 className="font-extrabold text-sm text-blue-400 uppercase">Equipe A (Casa)</h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nome do Time:</label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Emoji / Mascote:</label>
                <input
                  type="text"
                  value={teamAEmoji}
                  onChange={(e) => setTeamAEmoji(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-center text-white"
                />
              </div>
            </div>

            {/* Team B */}
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-3">
              <h4 className="font-extrabold text-sm text-red-400 uppercase">Equipe B (Visitante)</h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nome do Time:</label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Emoji / Mascote:</label>
                <input
                  type="text"
                  value={teamBEmoji}
                  onChange={(e) => setTeamBEmoji(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-center text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Partida Agora
            </button>
          </div>
        </form>
      ) : (
        /* SAVED MATCHES LIST */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedMatches.map((m) => {
            const isCurrent = m.id === currentMatch.id;

            return (
              <div
                key={m.id}
                onClick={() => handleSelectMatch(m)}
                className={`bg-slate-900 border-2 rounded-3xl p-6 cursor-pointer transition-all shadow-xl hover:scale-[1.01] flex flex-col justify-between relative overflow-hidden ${
                  isCurrent
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-4 right-4 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Ativa no Momento
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-black text-white">{m.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 my-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {m.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {m.location || 'Ginásio'}
                    </span>
                  </div>

                  {/* Match Teams Score Card */}
                  <div className="my-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-blue-400">
                        {m.teamA.logoEmoji} {m.teamA.name}
                      </span>
                      <span className="font-black text-white">{m.setsWonA} sets ({m.currentScoreA} pts)</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-red-400">
                        {m.teamB.logoEmoji} {m.teamB.name}
                      </span>
                      <span className="font-black text-white">{m.setsWonB} sets ({m.currentScoreB} pts)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 font-bold">
                    Lances Registrados: {m.playByPlay.length}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteMatch(m.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Excluir partida"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Continuar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
