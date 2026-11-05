import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  UserPlus,
  Check,
  X,
  Upload,
  Download,
  Award,
  ChevronRight,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { Match, ManagedTeam, Player, PlayerPosition, Team } from '../../types/volleyball';
import { DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '../../data/mockMatches';

interface TeamsManagerViewProps {
  currentMatch: Match;
  setMatch: (match: Match) => void;
  setActiveTab: (tab: any) => void;
}

export const TeamsManagerView: React.FC<TeamsManagerViewProps> = ({
  currentMatch,
  setMatch,
  setActiveTab,
}) => {
  const [teams, setTeams] = useState<ManagedTeam[]>(() => {
    const saved = localStorage.getItem('r3play_teams_database') || localStorage.getItem('volei_pro_teams_database');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load teams database', e);
      }
    }
    return [
      { ...DEFAULT_TEAM_A, category: 'Adulto', city: 'São Paulo', coachName: 'Sérgio Santos' },
      { ...DEFAULT_TEAM_B, category: 'Adulto', city: 'Rio de Janeiro', coachName: 'Bernardo Rezende' },
    ];
  });

  const [selectedTeam, setSelectedTeam] = useState<ManagedTeam | null>(() => teams[0] || null);
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);
  const [isEditingTeam, setIsEditingTeam] = useState<boolean>(false);

  // Form state for team editing
  const [teamName, setTeamName] = useState<string>('');
  const [teamCategory, setTeamCategory] = useState<ManagedTeam['category']>('Adulto');
  const [teamCity, setTeamCity] = useState<string>('');
  const [teamCoach, setTeamCoach] = useState<string>('');
  const [teamEmoji, setTeamEmoji] = useState<string>('🏐');
  const [teamColor, setTeamColor] = useState<string>('#2563eb');

  // New Player state
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<string>('');
  const [newPlayerPos, setNewPlayerPos] = useState<PlayerPosition>('Ponteiro');
  const [isCaptain, setIsCaptain] = useState<boolean>(false);

  // Save teams to localStorage
  useEffect(() => {
    localStorage.setItem('r3play_teams_database', JSON.stringify(teams));
  }, [teams]);

  // Open Edit modal
  const openEditTeam = (team: ManagedTeam) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamCategory(team.category || 'Adulto');
    setTeamCity(team.city || '');
    setTeamCoach(team.coachName || '');
    setTeamEmoji(team.logoEmoji || '🏐');
    setTeamColor(team.color || '#2563eb');
    setIsEditingTeam(true);
    setIsCreatingTeam(false);
  };

  // Save Created or Edited Team
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    if (isCreatingTeam) {
      const newTeam: ManagedTeam = {
        id: `team-${Date.now()}`,
        name: teamName.trim(),
        category: teamCategory,
        city: teamCity.trim(),
        coachName: teamCoach.trim(),
        logoEmoji: teamEmoji,
        color: teamColor,
        players: [],
        rotation: [],
      };
      setTeams([...teams, newTeam]);
      setSelectedTeam(newTeam);
    } else if (isEditingTeam && selectedTeam) {
      const updatedTeams = teams.map((t) =>
        t.id === selectedTeam.id
          ? {
              ...t,
              name: teamName.trim(),
              category: teamCategory,
              city: teamCity.trim(),
              coachName: teamCoach.trim(),
              logoEmoji: teamEmoji,
              color: teamColor,
            }
          : t
      );
      setTeams(updatedTeams);
      setSelectedTeam({
        ...selectedTeam,
        name: teamName.trim(),
        category: teamCategory,
        city: teamCity.trim(),
        coachName: teamCoach.trim(),
        logoEmoji: teamEmoji,
        color: teamColor,
      });
    }

    setIsCreatingTeam(false);
    setIsEditingTeam(false);
  };

  // Delete team
  const handleDeleteTeam = (teamId: string) => {
    if (teams.length <= 1) {
      alert('É necessário ter ao menos 1 equipe cadastrada no sistema.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta equipe?')) {
      const filtered = teams.filter((t) => t.id !== teamId);
      setTeams(filtered);
      setSelectedTeam(filtered[0] || null);
    }
  };

  // Add player to selected team
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !newPlayerName.trim() || !newPlayerNumber) return;

    const num = parseInt(newPlayerNumber, 10);
    if (isNaN(num)) return;

    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      number: num,
      position: newPlayerPos,
      isCaptain: isCaptain,
    };

    const updatedPlayers = [...selectedTeam.players, newPlayer];
    // If rotation has less than 6 players, auto add ID to rotation
    let updatedRotation = [...selectedTeam.rotation];
    if (updatedRotation.length < 6 && newPlayerPos !== 'Líbero') {
      updatedRotation.push(newPlayer.id);
    }

    const updatedTeam: ManagedTeam = {
      ...selectedTeam,
      players: updatedPlayers,
      rotation: updatedRotation,
      liberoId: newPlayerPos === 'Líbero' ? newPlayer.id : selectedTeam.liberoId,
    };

    setTeams(teams.map((t) => (t.id === selectedTeam.id ? updatedTeam : t)));
    setSelectedTeam(updatedTeam);

    // Reset inputs
    setNewPlayerName('');
    setNewPlayerNumber('');
    setIsCaptain(false);
  };

  // Remove player from team
  const handleRemovePlayer = (playerId: string) => {
    if (!selectedTeam) return;
    const updatedPlayers = selectedTeam.players.filter((p) => p.id !== playerId);
    const updatedRotation = selectedTeam.rotation.filter((id) => id !== playerId);

    const updatedTeam: ManagedTeam = {
      ...selectedTeam,
      players: updatedPlayers,
      rotation: updatedRotation,
      liberoId: selectedTeam.liberoId === playerId ? undefined : selectedTeam.liberoId,
    };

    setTeams(teams.map((t) => (t.id === selectedTeam.id ? updatedTeam : t)));
    setSelectedTeam(updatedTeam);
  };

  // Load team into active match as Team A or Team B
  const handleLoadToActiveMatch = (asTeam: 'A' | 'B') => {
    if (!selectedTeam) return;

    const teamToLoad: Team = {
      id: selectedTeam.id,
      name: selectedTeam.name,
      color: selectedTeam.color,
      logoEmoji: selectedTeam.logoEmoji,
      players: selectedTeam.players,
      rotation:
        selectedTeam.rotation.length >= 6
          ? selectedTeam.rotation.slice(0, 6)
          : selectedTeam.players.slice(0, 6).map((p) => p.id),
      liberoId: selectedTeam.liberoId,
    };

    const updatedMatch: Match = {
      ...currentMatch,
      teamA: asTeam === 'A' ? teamToLoad : currentMatch.teamA,
      teamB: asTeam === 'B' ? teamToLoad : currentMatch.teamB,
      servingTeamId: asTeam === 'A' ? teamToLoad.id : currentMatch.servingTeamId,
    };

    setMatch(updatedMatch);
    alert(`Equipe "${selectedTeam.name}" escalada com sucesso como Equipe ${asTeam}!`);
    setActiveTab('scoreboard');
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Banco de Dados de Clubes
            </span>
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30">
              Gestão Completa de Elencos
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-400" />
            Gestão de Equipes & Jogadores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre clubes, defina categorias, monte os elencos por posição e escala-os diretamente nas partidas.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreatingTeam(true);
            setIsEditingTeam(false);
            setTeamName('');
            setTeamCategory('Adulto');
            setTeamCity('');
            setTeamCoach('');
            setTeamEmoji('🏐');
            setTeamColor('#2563eb');
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Equipe
        </button>
      </div>

      {/* Main Grid: Teams Selector + Team Details & Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team List Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>Equipes Cadastradas ({teams.length})</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {teams.map((t) => {
              const isSelected = selectedTeam?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeam(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1 rounded-lg bg-slate-800">
                      {t.logoEmoji || '🏐'}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-white group-hover:text-blue-300 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{t.category || 'Adulto'}</span>
                        {t.city && <span>• {t.city}</span>}
                        <span>• {t.players.length} atletas</span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-blue-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Team Details & Roster Management */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Team Info Header Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl shadow-lg">
                    {selectedTeam.logoEmoji || '🏐'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
                        {selectedTeam.category || 'Adulto'}
                      </span>
                      {selectedTeam.city && (
                        <span className="text-xs text-slate-400 font-medium">
                          📍 {selectedTeam.city}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">{selectedTeam.name}</h3>
                    {selectedTeam.coachName && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Técnico: <strong className="text-slate-200">{selectedTeam.coachName}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Team Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleLoadToActiveMatch('A')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    Escalar p/ Equipe A
                  </button>
                  <button
                    onClick={() => handleLoadToActiveMatch('B')}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    Escalar p/ Equipe B
                  </button>
                  <button
                    onClick={() => openEditTeam(selectedTeam)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Editar Equipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors"
                    title="Excluir Equipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add New Player Form */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Adicionar Novo Atleta ao Elenco
                </h4>

                <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nome do Jogador..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Nº da Camisa"
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                      min={1}
                      max={99}
                    />
                  </div>

                  <div>
                    <select
                      value={newPlayerPos}
                      onChange={(e) => setNewPlayerPos(e.target.value as PlayerPosition)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Ponteiro">Ponteiro / Passador</option>
                      <option value="Oposto">Oposto</option>
                      <option value="Central">Central</option>
                      <option value="Levantador">Levantador</option>
                      <option value="Líbero">Líbero</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCaptain}
                        onChange={(e) => setIsCaptain(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Capitão da Equipe (C)</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Atleta
                    </button>
                  </div>
                </form>
              </div>

              {/* Roster Table */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                  Atletas Cadastrados ({selectedTeam.players.length})
                </h4>

                {selectedTeam.players.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                    Nenhum jogador cadastrado nesta equipe. Adicione atletas acima.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Nº</th>
                          <th className="py-3 px-4">Nome do Jogador</th>
                          <th className="py-3 px-4">Posição</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                        {selectedTeam.players.map((p) => {
                          const isLibero = p.position === 'Líbero';
                          return (
                            <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="py-3 px-4 font-black">
                                <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-blue-300">
                                  #{p.number}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.isCaptain && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black">
                                    CAPITÃO
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-300 font-medium">
                                {p.position}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isLibero ? (
                                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold text-[10px]">
                                    LÍBERO
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                                    LINHA
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleRemovePlayer(p.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                  title="Remover Jogador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              Selecione uma equipe ao lado para visualizar e gerenciar seu elenco.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating or Editing Team */}
      {(isCreatingTeam || isEditingTeam) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {isCreatingTeam ? 'Cadastrar Nova Equipe' : 'Editar Dados da Equipe'}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingTeam(false);
                  setIsEditingTeam(false);
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Nome da Equipe / Clube:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vôlei Taubaté..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={teamCategory}
                    onChange={(e) => setTeamCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Adulto">Adulto</option>
                    <option value="Sub-21">Sub-21</option>
                    <option value="Sub-19">Sub-19</option>
                    <option value="Sub-17">Sub-17</option>
                    <option value="Master">Master</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Misto">Misto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Emoji / Escudo:
                  </label>
                  <input
                    type="text"
                    placeholder="⚡ 🏐 🔥"
                    value={teamEmoji}
                    onChange={(e) => setTeamEmoji(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Cidade / Origem:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={teamCity}
                    onChange={(e) => setTeamCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Nome do Técnico:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bernardinho"
                    value={teamCoach}
                    onChange={(e) => setTeamCoach(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTeam(false);
                    setIsEditingTeam(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/30"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
