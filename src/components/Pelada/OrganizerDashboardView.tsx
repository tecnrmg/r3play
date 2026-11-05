import React, { useState, useEffect } from 'react';
import {
  Users,
  Dices,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  Share2,
  Trophy,
  Flame,
  Smartphone,
  Calendar,
  MapPin,
  Trash2,
  ArrowRight,
  Sparkles,
  Check,
  Radio,
  Clock,
  Tv,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useArenaAuth } from '../../context/ArenaAuthContext';

interface Participant {
  id: string;
  peladaId: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'waiting_list';
  position?: string;
  createdAt: string;
}

interface TeamSorted {
  name: string;
  color: string;
  badge: string;
  players: Array<{ id: string; name: string; phone?: string }>;
}

interface Pelada {
  id: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  gameMode: 'quartetos' | 'sextetos';
  status: 'open' | 'in_progress' | 'finished';
  streamOverlayEnabled: boolean;
  scoreboard: {
    teamAName: string;
    teamBName: string;
    scoreA: number;
    scoreB: number;
    setsA: number;
    setsB: number;
    currentSet: number;
    servingTeam: 'A' | 'B';
    setHistory: Array<{
      setNumber: number;
      scoreA: number;
      scoreB: number;
      winner: 'A' | 'B';
    }>;
  };
  teams: TeamSorted[];
}

export const OrganizerDashboardView: React.FC = () => {
  const { tenant } = useTenant();
  const { token, user, openLoginModal, isAuthenticated } = useArenaAuth();

  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [selectedPeladaId, setSelectedPeladaId] = useState<string>('pelada-arena1-01');
  const [activePelada, setActivePelada] = useState<Pelada | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);
  const [sortMode, setSortMode] = useState<'quartetos' | 'sextetos'>('quartetos');
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal de Nova Pelada
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('Quadra Principal');
  const [newMaxParticipants, setNewMaxParticipants] = useState(16);
  const [newGameMode, setNewGameMode] = useState<'quartetos' | 'sextetos'>('quartetos');
  const [isCreating, setIsCreating] = useState(false);

  // Carrega lista de peladas do organizador
  const fetchPeladas = async () => {
    try {
      const res = await fetch('/api/organizer/peladas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPeladas(data.data);
        if (data.data.length > 0 && !selectedPeladaId) {
          setSelectedPeladaId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar peladas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega detalhes da pelada selecionada
  const fetchPeladaDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/organizer/peladas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivePelada(data.data.pelada);
        setParticipants(data.data.participants);
        setSortMode(data.data.pelada.gameMode);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPeladas();
    }
  }, [token, tenant.id]);

  useEffect(() => {
    if (token && selectedPeladaId) {
      fetchPeladaDetails(selectedPeladaId);
    }
  }, [token, selectedPeladaId]);

  // Função de Pontuação da Quadra pelo Celular
  const handleScoreAction = async (action: 'point_a' | 'point_b' | 'undo_a' | 'undo_b' | 'switch_serve' | 'finish_set' | 'reset') => {
    if (!selectedPeladaId) return;

    try {
      const res = await fetch(`/api/organizer/peladas/${selectedPeladaId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActivePelada((prev) => (prev ? { ...prev, scoreboard: data.data } : null));
      }
    } catch (err) {
      console.error('Erro ao atualizar placar:', err);
    }
  };

  // Sorteio Justo de Times (Quartetos ou Sextetos)
  const handleSortTeams = async () => {
    if (!selectedPeladaId) return;
    setIsSorting(true);

    try {
      const res = await fetch(`/api/organizer/peladas/${selectedPeladaId}/sort-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({ mode: sortMode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActivePelada((prev) => (prev ? { ...prev, teams: data.data } : null));
        setToastMessage(data.message || 'Times sorteados com sucesso!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Erro ao sortear:', err);
    } finally {
      setIsSorting(false);
    }
  };

  // Criar Nova Lista de Pelada
  const handleCreatePelada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/organizer/peladas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          date: newDate.trim() || 'Hoje às 19:30',
          location: newLocation.trim(),
          maxParticipants: newMaxParticipants,
          gameMode: newGameMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsNewModalOpen(false);
        setNewTitle('');
        setNewDate('');
        await fetchPeladas();
        setSelectedPeladaId(data.data.id);
        setToastMessage('Nova lista de pelada criada com sucesso!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Erro ao criar pelada:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Remover participante faltoso
  const handleRemoveParticipant = async (participantId: string) => {
    if (!window.confirm('Deseja remover este jogador da lista?')) return;

    try {
      const res = await fetch(
        `/api/organizer/peladas/${selectedPeladaId}/participant/${participantId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenant.id,
          },
        }
      );
      if (res.ok) {
        await fetchPeladaDetails(selectedPeladaId);
      }
    } catch (err) {
      console.error('Erro ao remover participante:', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pelada/${selectedPeladaId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-white">Painel do Organizador de Peladas</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Faça login como Organizador parceiro da arena para gerenciar listas, sortear times e controlar o placar no celular.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openLoginModal('ORGANIZER')}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Entrar como Organizador
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-semibold">{toastMessage}</div>
        </div>
      )}

      {/* Top Banner do Organizador */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              📋 Painel do Organizador
            </span>
            {user?.canUseStreamOverlay && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                Overlay OBS Liberado pelo Dono
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão de Peladas & Placar da Quadra
          </h1>
          <p className="text-xs text-slate-400">
            Organizador autenticado: <strong className="text-slate-200">{user?.name}</strong> • Arena: <strong className="text-slate-200">{tenant.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Peladas */}
          <select
            value={selectedPeladaId}
            onChange={(e) => setSelectedPeladaId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {peladas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.gameMode})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Lista</span>
          </button>
        </div>
      </div>

      {/* Grid: Lado Esquerdo = Controle do Placar Mobile / Lado Direito = Sorteio e Presença */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            TELA DE CONTROLE DO PLACAR (OTIMIZADA PARA CELULAR)
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Controle do Placar na Beira da Quadra
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-300 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
                  SET {activePelada?.scoreboard.currentSet || 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleScoreAction('reset')}
                  title="Resetar placar do jogo"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* BOTÕES TOUCH GIGANTES PARA PONTUAÇÃO */}
            <div className="grid grid-cols-2 gap-4">
              {/* TIME A TOUCH CONTROLLER */}
              <div
                className={`p-5 rounded-3xl border text-center space-y-3 transition-all ${
                  activePelada?.scoreboard.servingTeam === 'A'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-xl shadow-amber-500/10'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 truncate">
                    {activePelada?.scoreboard.teamAName || 'Time A'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleScoreAction('switch_serve')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                      activePelada?.scoreboard.servingTeam === 'A'
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    SAQUE
                  </button>
                </div>

                <div className="text-6xl sm:text-7xl font-mono font-black text-amber-400 tracking-tight my-2">
                  {activePelada?.scoreboard.scoreA || 0}
                </div>

                <div className="text-[11px] text-slate-400 font-bold">
                  Sets Vencidos: <span className="text-white">{activePelada?.scoreboard.setsA || 0}</span>
                </div>

                {/* BOTÃO GRANDE DE +1 PONTO */}
                <button
                  type="button"
                  onClick={() => handleScoreAction('point_a')}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-lg uppercase tracking-wider shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>+1 Ponto</span>
                </button>

                {/* Botão de Correção -1 */}
                <button
                  type="button"
                  onClick={() => handleScoreAction('undo_a')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold cursor-pointer"
                >
                  -1 Corrigir
                </button>
              </div>

              {/* TIME B TOUCH CONTROLLER */}
              <div
                className={`p-5 rounded-3xl border text-center space-y-3 transition-all ${
                  activePelada?.scoreboard.servingTeam === 'B'
                    ? 'bg-blue-500/15 border-blue-500/50 shadow-xl shadow-blue-500/10'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-300 truncate">
                    {activePelada?.scoreboard.teamBName || 'Time B'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleScoreAction('switch_serve')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                      activePelada?.scoreboard.servingTeam === 'B'
                        ? 'bg-blue-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    SAQUE
                  </button>
                </div>

                <div className="text-6xl sm:text-7xl font-mono font-black text-blue-400 tracking-tight my-2">
                  {activePelada?.scoreboard.scoreB || 0}
                </div>

                <div className="text-[11px] text-slate-400 font-bold">
                  Sets Vencidos: <span className="text-white">{activePelada?.scoreboard.setsB || 0}</span>
                </div>

                {/* BOTÃO GRANDE DE +1 PONTO */}
                <button
                  type="button"
                  onClick={() => handleScoreAction('point_b')}
                  className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-400 active:scale-95 text-white font-black text-lg uppercase tracking-wider shadow-xl shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>+1 Ponto</span>
                </button>

                {/* Botão de Correção -1 */}
                <button
                  type="button"
                  onClick={() => handleScoreAction('undo_b')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold cursor-pointer"
                >
                  -1 Corrigir
                </button>
              </div>
            </div>

            {/* Ações de Set: Fechar Set e Histórico */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleScoreAction('finish_set')}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-xs uppercase tracking-wider border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Encerrar Este Set & Avançar</span>
              </button>

              {activePelada?.scoreboard.setHistory && activePelada.scoreboard.setHistory.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Histórico de Sets:
                  </span>
                  {activePelada.scoreboard.setHistory.map((s) => (
                    <span
                      key={s.setNumber}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-200"
                    >
                      {s.setNumber}º Set: {s.scoreA}x{s.scoreB} (Vencedor {s.winner})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            LADO DIREITO: SORTEIO DE TIMES & LISTA DE PARTICIPANTES
           ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card de Sorteio Justo dos Times */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Dices className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Sorteio Justo de Times (Vôlei)
                </h2>
              </div>

              {/* Toggle Quartetos vs Sextetos */}
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSortMode('quartetos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    sortMode === 'quartetos'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  4x4 (Quartetos)
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('sextetos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    sortMode === 'sextetos'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  6x6 (Sextetos)
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O algoritmo Fisher-Yates distribui os {participants.filter((p) => p.status === 'confirmed').length} jogadores confirmados de forma equilibrada entre as equipes da quadra.
            </p>

            <button
              type="button"
              onClick={handleSortTeams}
              disabled={isSorting || participants.filter((p) => p.status === 'confirmed').length < 4}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40"
            >
              <Dices className="w-5 h-5" />
              <span>{isSorting ? 'Sorteando...' : `Sortear Times (${sortMode === 'quartetos' ? 'Quartetos 4x4' : 'Sextetos 6x6'})`}</span>
            </button>

            {/* Times Sorteados */}
            {activePelada?.teams && activePelada.teams.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Times Formados ({activePelada.teams.length} Equipes)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePelada.teams.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                        <span className="text-lg">{t.badge}</span>
                        <span className="text-xs font-black text-white">{t.name}</span>
                        <span className="ml-auto text-[10px] text-slate-400 font-bold">
                          {t.players.length} atletas
                        </span>
                      </div>

                      <ul className="space-y-1">
                        {t.players.map((p, pIdx) => (
                          <li
                            key={p.id || pIdx}
                            className="text-xs text-slate-300 flex items-center gap-1.5"
                          >
                            <span className="text-[10px] text-slate-500 font-mono">
                              #{pIdx + 1}
                            </span>
                            <span>{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Participantes Inscritos & Link de Compartilhamento */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Lista de Presença ({participants.filter((p) => p.status === 'confirmed').length} / {activePelada?.maxParticipants || 16})
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-500 text-[11px]">#{idx + 1}</span>
                    <span className="font-bold text-slate-200">{p.name}</span>
                    <span className="text-slate-400 text-[11px]">({p.phone})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {p.status === 'confirmed' ? 'Confirmado' : 'Espera'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      title="Remover participante"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {participants.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Nenhum participante na lista ainda. Compartilhe o link com os atletas!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CRIAR NOVA LISTA DE PELADA */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 text-slate-100">
            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-white">Criar Nova Lista de Pelada</h3>
              <p className="text-xs text-slate-400">
                Configure os detalhes da sessão na arena {tenant.name}.
              </p>
            </div>

            <form onSubmit={handleCreatePelada} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Título da Pelada</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: Pelada de Quarta 20h - Areia Quadra 2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Data e Horário</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="ex: Hoje às 20h"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Limite de Vagas</label>
                  <input
                    type="number"
                    value={newMaxParticipants}
                    onChange={(e) => setNewMaxParticipants(Number(e.target.value))}
                    min={4}
                    max={48}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Modo de Jogo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGameMode('quartetos')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newGameMode === 'quartetos'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    4x4 (Quartetos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGameMode('sextetos')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newGameMode === 'sextetos'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    6x6 (Sextetos)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {isCreating ? 'Criando...' : 'Abrir Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
