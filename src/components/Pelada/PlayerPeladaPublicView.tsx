import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  User,
  Radio,
  Trophy,
  Share2,
  Check,
  Flame,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface Participant {
  id: string;
  peladaId: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'waiting_list';
  position?: string;
  createdAt: string;
}

interface PeladaData {
  id: string;
  title: string;
  date: string;
  location: string;
  maxParticipants: number;
  gameMode: 'quartetos' | 'sextetos';
  status: 'open' | 'in_progress' | 'finished';
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
  teams: Array<{
    name: string;
    color: string;
    badge: string;
    players: Array<{ id: string; name: string }>;
  }>;
}

interface PlayerPeladaPublicViewProps {
  peladaId?: string;
  onNavigateToOrganizer?: () => void;
}

export const PlayerPeladaPublicView: React.FC<PlayerPeladaPublicViewProps> = ({
  peladaId = 'pelada-arena1-01',
  onNavigateToOrganizer,
}) => {
  const { tenant } = useTenant();

  const [pelada, setPelada] = useState<PeladaData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal de Inscrição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Carrega dados da pelada
  const fetchPelada = async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const res = await fetch(`/api/pelada/${peladaId}`, {
        headers: {
          'x-tenant-id': tenant.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPelada(data.data.pelada);
        setParticipants(data.data.participants || []);
      } else {
        setErrorMessage(data.error || 'Pelada não encontrada.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao carregar a pelada.');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPelada(true);
    // Polling leve a cada 3 segundos para placar ao vivo da quadra
    const interval = setInterval(() => {
      fetchPelada(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [peladaId, tenant.id]);

  // Formata telefone no padrão brasileiro (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPlayerPhone(value);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !playerPhone.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/pelada/${peladaId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          name: playerName.trim(),
          phone: playerPhone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || 'Presença confirmada!');
        setPlayerName('');
        setPlayerPhone('');
        setIsModalOpen(false);
        await fetchPelada(false);
        setTimeout(() => setSuccessToast(''), 6000);
      } else {
        setErrorMessage(data.error || 'Falha ao se cadastrar na pelada.');
      }
    } catch (err: any) {
      setErrorMessage('Erro ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/pelada/${peladaId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const confirmedList = participants.filter((p) => p.status === 'confirmed');
  const waitingList = participants.filter((p) => p.status === 'waiting_list');
  const maxSpots = pelada?.maxParticipants || 16;
  const progressPercent = Math.min(100, Math.round((confirmedList.length / maxSpots) * 100));

  if (isLoading && !pelada) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 shadow-xl animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-semibold">{successToast}</div>
        </div>
      )}

      {/* Header Público da Arena e Pelada */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: tenant.primaryColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: `${tenant.primaryColor}20`,
                  color: tenant.primaryColor,
                  border: `1px solid ${tenant.primaryColor}40`,
                }}
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                AO VIVO NA ARENA
              </span>

              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                {pelada?.gameMode === 'quartetos' ? '🏐 Vôlei 4x4 (Quartetos)' : '🏐 Vôlei 6x6 (Sextetos)'}
              </span>

              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {pelada?.date}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {pelada?.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{pelada?.location}</span>
              <span>•</span>
              <span>Arena: <strong className="text-slate-200">{tenant.name}</strong></span>
            </div>
          </div>

          {/* Botões de Ação do Jogador */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Compartilhar Pelada</span>
                </>
              )}
            </button>

            {/* BOTÃO PRINCIPAL: PARTICIPAR DA LISTA */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
              }}
            >
              <Users className="w-5 h-5" />
              <span>Participar da Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* PLACAR AO VIVO DO VÔLEI NA QUADRA */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Placar da Quadra em Tempo Real
            </h2>
          </div>

          <div className="text-xs font-black text-slate-400 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
            SET {pelada?.scoreboard.currentSet || 1}
          </div>
        </div>

        {/* Confronto e Pontuação dos Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time A */}
          <div
            className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${
              pelada?.scoreboard.servingTeam === 'A'
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">
                  {pelada?.scoreboard.teamAName || 'Time A'}
                </span>
                {pelada?.scoreboard.servingTeam === 'A' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                    SAQUE
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Sets Vencidos: <strong className="text-white text-sm">{pelada?.scoreboard.setsA || 0}</strong>
              </div>
            </div>

            <div className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight font-mono">
              {pelada?.scoreboard.scoreA || 0}
            </div>
          </div>

          {/* Time B */}
          <div
            className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${
              pelada?.scoreboard.servingTeam === 'B'
                ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">
                  {pelada?.scoreboard.teamBName || 'Time B'}
                </span>
                {pelada?.scoreboard.servingTeam === 'B' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black border border-blue-500/40">
                    SAQUE
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Sets Vencidos: <strong className="text-white text-sm">{pelada?.scoreboard.setsB || 0}</strong>
              </div>
            </div>

            <div className="text-5xl sm:text-6xl font-black text-blue-400 tracking-tight font-mono">
              {pelada?.scoreboard.scoreB || 0}
            </div>
          </div>
        </div>

        {/* Histórico de Sets Anteriores */}
        {pelada?.scoreboard.setHistory && pelada.scoreboard.setHistory.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Histórico de Sets:
            </span>
            {pelada.scoreboard.setHistory.map((set) => (
              <span
                key={set.setNumber}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-200"
              >
                {set.setNumber}º Set: {set.scoreA} x {set.scoreB}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LISTA DE PRESENÇA DA PELADA */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-indigo-400" />
              Lista de Presença dos Jogadores
            </h2>
            <p className="text-xs text-slate-400">
              Vagas preenchidas em tempo real. Garanta seu nome antes do encerramento da lista.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-black text-white">
                {confirmedList.length} / {maxSpots}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Confirmados</div>
            </div>
            <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent >= 100 ? '#ef4444' : tenant.primaryColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Grade de Participantes Confirmados */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Jogadores Confirmados ({confirmedList.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {confirmedList.map((player, idx) => (
              <div
                key={player.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {player.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {player.position || 'Atleta'}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Confirmado
                </span>
              </div>
            ))}

            {confirmedList.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs">
                Nenhum jogador confirmado ainda. Seja o primeiro da lista!
              </div>
            )}
          </div>
        </div>

        {/* Lista de Espera (se houver) */}
        {waitingList.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lista de Espera ({waitingList.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {waitingList.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-300">
                      {player.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                    Na fila
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL SIMPLES: PARTICIPAR DA LISTA (NOME E WHATSAPP) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100">
            <div className="text-center space-y-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                }}
              >
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Participar da Pelada
              </h2>
              <p className="text-xs text-slate-400">
                Confirme seu nome e WhatsApp para ser incluído na lista oficial de presença da arena.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="ex: Carlos Eduardo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  WhatsApp para Confirmação
                </label>
                <input
                  type="tel"
                  value={playerPhone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Seu número fica protegido e isolado sob a governança desta arena.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:opacity-95 active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                  }}
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Presença'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
