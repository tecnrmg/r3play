import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Check,
  Zap,
  Sliders,
  Database,
  Info,
  Crown,
  Sparkles,
  Lock,
  Radio,
  CheckCircle2,
  Users,
  UserPlus,
  Tv,
  Palette,
  Building2,
  Globe,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Match, MatchConfig } from '../../types/volleyball';
import { usePlanContext } from '../../context/PlanContext';
import { useTenant } from '../../context/TenantContext';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface SettingsViewProps {
  match: Match;
  setMatch: (match: Match) => void;
  onNavigateToAdmin?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ match, setMatch, onNavigateToAdmin }) => {
  const { planMode, hasStreamAddon } = usePlanContext();
  const { tenant } = useTenant();
  const { isAuthenticated, openLoginModal } = useAdminAuth();

  const [setsToWin, setSetsToWin] = useState<number>(match.config.setsToWin || 3);
  const [pointsPerSet, setPointsPerSet] = useState<number>(match.config.pointsPerSet || 25);
  const [tieBreakPoints, setTieBreakPoints] = useState<number>(match.config.tieBreakPoints || 15);
  const [maxTimeouts, setMaxTimeouts] = useState<number>(match.config.maxTimeoutsPerSet || 2);
  const [maxSubs, setMaxSubs] = useState<number>(match.config.maxSubstitutionsPerSet || 6);
  const [courtPlayersPerTeam, setCourtPlayersPerTeam] = useState<number>(match.config.courtPlayersPerTeam || 6);
  const [rotationSystem, setRotationSystem] = useState<'6x0' | '5x1_fixed_setter'>(match.config.rotationSystem || '6x0');
  const [maxWaitingTeams, setMaxWaitingTeams] = useState<number>(match.config.maxWaitingTeams ?? 0);
  const [maxPlayersPerWaitingTeam, setMaxPlayersPerWaitingTeam] = useState<number>(match.config.maxPlayersPerWaitingTeam ?? 6);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(match.config.soundEffectsEnabled ?? true);
  const [autoSwapSides, setAutoSwapSides] = useState<boolean>(match.config.autoSwapSidesOnSetEnd ?? true);
  const [swapSidesInterval, setSwapSidesInterval] = useState<number>(match.config.swapSidesIntervalSets || 1);
  const [autoResetOnMatchEnd, setAutoResetOnMatchEnd] = useState<boolean>(match.config.autoResetOnMatchEnd ?? true);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Play a Web Audio API synthesized referee whistle sound for test!
  const playWhistleSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Referee whistle dual frequency (~2800 Hz and ~2950 Hz)
      osc1.frequency.setValueAtTime(2800, ctx.currentTime);
      osc2.frequency.setValueAtTime(2950, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked by browser gesture', e);
    }
  };

  // Save Settings to active match
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const newConfig: MatchConfig = {
      setsToWin,
      pointsPerSet,
      tieBreakPoints,
      minPointDiff: 2,
      maxTimeoutsPerSet: maxTimeouts,
      maxSubstitutionsPerSet: maxSubs,
      courtPlayersPerTeam,
      rotationSystem,
      maxWaitingTeams,
      maxPlayersPerWaitingTeam,
      soundEffectsEnabled: soundEnabled,
      autoSwapSidesOnSetEnd: autoSwapSides,
      swapSidesIntervalSets: swapSidesInterval,
      autoResetOnMatchEnd: autoResetOnMatchEnd,
    };

    setMatch({
      ...match,
      config: newConfig,
    });

    if (soundEnabled) {
      playWhistleSound();
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export full app backup
  const handleExportBackup = () => {
    const backupData = {
      version: '2.5',
      exportedAt: new Date().toISOString(),
      activeMatch: match,
      matches: localStorage.getItem('r3play_matches') || localStorage.getItem('volei_pro_matches'),
      teams: localStorage.getItem('r3play_teams_database') || localStorage.getItem('volei_pro_teams_database'),
      tournaments: localStorage.getItem('r3play_tournaments') || localStorage.getItem('volei_pro_tournaments'),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `r3play_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import app backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.activeMatch) {
          setMatch(json.activeMatch);
        }
        if (json.matches) {
          localStorage.setItem('r3play_matches', typeof json.matches === 'string' ? json.matches : JSON.stringify(json.matches));
        }
        if (json.teams) {
          localStorage.setItem('r3play_teams_database', typeof json.teams === 'string' ? json.teams : JSON.stringify(json.teams));
        }
        if (json.tournaments) {
          localStorage.setItem('r3play_tournaments', typeof json.tournaments === 'string' ? json.tournaments : JSON.stringify(json.tournaments));
        }
        alert('Backup do R3Play restaurado com sucesso!');
        window.location.reload();
      } catch (err) {
        alert('Erro ao carregar o arquivo de backup. Verifique se o JSON é válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Preferências Globais
            </span>
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
              Regras do Apito
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-400" />
            Configurações da Partida & Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ajuste as regras de sets, limites de substituição e tempo, efeitos sonoros de apito e backup dos dados.
          </p>
        </div>
      </div>

      {/* Notificação de Realocação para o Painel de Administração Master */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> Painel de Controle Master
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase border border-amber-500/30">
                Pós-Venda Seguro
              </span>
            </div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Gestão de Licenças & Identidade Visual White Label
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Os módulos de <strong>liberação de licenças pós-venda (Free, Lite, Pro e Addon Stream)</strong> e{' '}
              <strong>customização visual por subdomínio (White Label)</strong> foram realocados com autenticação segura
              PBKDF2 e isolamento no banco de dados na <strong>Central de Administração R3team</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToAdmin) {
                onNavigateToAdmin();
              } else if (!isAuthenticated) {
                openLoginModal();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Acessar Painel Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo em tempo real do ambiente atual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden shadow"
              style={{
                background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
              }}
            >
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span>🏐</span>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Empresa / White Label</div>
              <div className="text-xs font-black text-white">{tenant.name}</div>
              <div className="text-[10px] font-mono text-indigo-300">{tenant.subdomain}.r3play.com.br</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Plano Comercial Ativo</div>
              <div className="text-xs font-black text-amber-300">
                {planMode === 'pro' && 'Modo Pro (Completo)'}
                {planMode === 'lite' && 'Modo Lite (Peladas & Rachas)'}
                {planMode === 'free' && 'Modo Free (Placar TV & Inscrição)'}
              </div>
              <div className="text-[10px] text-slate-400">Gerenciado pelo Admin</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Pacote Transmissão</div>
              <div className="text-xs font-black text-purple-300">
                {hasStreamAddon ? 'Overlay Ativo (OBS / Prism)' : 'Módulo Não Contratado'}
              </div>
              <div className="text-[10px] text-slate-400">Liberação via Admin</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Match Rules Config */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Regras de Jogo & Formato da Partida
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* Formato de Jogadores em Quadra & Rodízio Oficial (Mínimo 2) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="font-black text-sm text-white flex items-center gap-2">
                    🏐 Jogadores em Quadra por Equipe (Rodízio & Formato)
                  </label>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Quantidade de jogadores em quadra (Mínimo de 2). A quadra aplicará o rodízio oficial da modalidade escolhida.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400">Qtd (Min 2):</span>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={courtPlayersPerTeam}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 2;
                      const clamped = Math.min(6, Math.max(2, val));
                      setCourtPlayersPerTeam(clamped);
                      setMaxPlayersPerWaitingTeam(clamped);
                    }}
                    className="w-20 bg-slate-900 border border-indigo-500/60 rounded-xl px-3 py-2 text-white font-black text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Presets rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {[
                  { count: 2, label: 'Dupla (2v2)', desc: 'Praia / Dupla' },
                  { count: 3, label: 'Trio (3v3)', desc: '3 Jogadores' },
                  { count: 4, label: 'Quarteto (4v4)', desc: '4 Jogadores' },
                  { count: 5, label: 'Quinteto (5v5)', desc: '5 Jogadores' },
                  { count: 6, label: 'Sexteto (6v6)', desc: 'Oficial Quadra' },
                ].map((preset) => (
                  <button
                    key={preset.count}
                    type="button"
                    onClick={() => {
                      setCourtPlayersPerTeam(preset.count);
                      setMaxPlayersPerWaitingTeam(preset.count);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      courtPlayersPerTeam === preset.count
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-700 border-indigo-400 text-white font-black shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{preset.label}</div>
                    <div className="text-[10px] text-slate-300 opacity-80 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* SISTEMA DE RODÍZIO EM QUADRA: 5x1 (Levantador Fixo P3) vs 6x0 (Todos Rodam) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/40 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <label className="font-black text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    Sistema de Rodízio em Quadra (Qualquer Quantidade de Jogadores)
                  </label>
                  <p className="text-xs text-slate-300">
                    Escolha a mecânica de rotação tática adotada pelas equipes durante a partida:
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                  rotationSystem === '5x1_fixed_setter'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {rotationSystem === '5x1_fixed_setter' ? '⚡ 5x1 (Levantador Fixo)' : '🔄 6x0 (Rodízio Completo)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opção 1: 5x1 com Levantador Fixo no P3 */}
                <button
                  type="button"
                  onClick={() => setRotationSystem('5x1_fixed_setter')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    rotationSystem === '5x1_fixed_setter'
                      ? 'bg-gradient-to-br from-teal-950/80 to-slate-900 border-teal-400 text-white shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-teal-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      1. Levantador Fixo no P3 (5x1)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      Tático
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O <strong>Levantador permanece fixo no P3</strong> (Central de Rede). Quando a equipe ganha o saque, <strong>somente os outros jogadores realizam o rodízio</strong> entre as posições de saque, defesa e ataque.
                  </p>
                  <div className="text-[10px] text-teal-400/90 font-semibold pt-1 border-t border-slate-800/60 flex items-center gap-1">
                    ✓ Aplicável a Quartetos, Quintetos e Sextetos
                  </div>
                </button>

                {/* Opção 2: 6x0 - Todos Rodam em Todas as Posições */}
                <button
                  type="button"
                  onClick={() => setRotationSystem('6x0')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    rotationSystem === '6x0'
                      ? 'bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-400 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-blue-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      2. Rodízio Completo (6x0)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      Oficial / Geral
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>Todos os jogadores rodam</strong> ciclicamente por todas as posições da quadra (P1 ao P6), alternando sacador, rede e defesas a cada troca de posse de saque.
                  </p>
                  <div className="text-[10px] text-blue-400/90 font-semibold pt-1 border-t border-slate-800/60 flex items-center gap-1">
                    ✓ Todos passam pelo saque e pela rede
                  </div>
                </button>
              </div>
            </div>

            {/* Limite de Times na Lista de Espera / Fila de Espera */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="font-black text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Fila de Espera: Limite de Times (de até 6 Jogadores)
                  </label>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Defina quantos times de até no máximo 6 jogadores podem aguardar na lista de espera.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">Times Max:</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={maxWaitingTeams}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setMaxWaitingTeams(isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className="w-16 bg-slate-900 border border-amber-500/60 rounded-xl px-2.5 py-1.5 text-white font-black text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">Jogadores/Time:</span>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={maxPlayersPerWaitingTeam}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 6;
                        setMaxPlayersPerWaitingTeam(Math.min(6, Math.max(2, val)));
                      }}
                      className="w-16 bg-slate-900 border border-amber-500/60 rounded-xl px-2.5 py-1.5 text-white font-black text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons for waiting teams */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                {[
                  { count: 0, label: 'Sem Limite', desc: 'Fila Aberta' },
                  { count: 1, label: '1 Time', desc: `${1 * maxPlayersPerWaitingTeam} Jogadores` },
                  { count: 2, label: '2 Times', desc: `${2 * maxPlayersPerWaitingTeam} Jogadores` },
                  { count: 3, label: '3 Times', desc: `${3 * maxPlayersPerWaitingTeam} Jogadores` },
                  { count: 4, label: '4 Times', desc: `${4 * maxPlayersPerWaitingTeam} Jogadores` },
                  { count: 5, label: '5 Times', desc: `${5 * maxPlayersPerWaitingTeam} Jogadores` },
                ].map((preset) => (
                  <button
                    key={preset.count}
                    type="button"
                    onClick={() => setMaxWaitingTeams(preset.count)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      maxWaitingTeams === preset.count
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{preset.label}</div>
                    <div className="text-[10px] text-slate-300 opacity-80 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-amber-300/90 font-medium bg-amber-500/10 rounded-xl px-3 py-1.5 border border-amber-500/20">
                <span>
                  <strong>Capacidade Máxima da Fila:</strong>{' '}
                  {maxWaitingTeams > 0
                    ? `${maxWaitingTeams * maxPlayersPerWaitingTeam} jogadores no total (${maxWaitingTeams} ${maxWaitingTeams === 1 ? 'time' : 'times'} de até ${maxPlayersPerWaitingTeam} jogadores)`
                    : 'Fila com capacidade ilimitada de times/jogadores.'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Formatos de Sets para Vitória:
                </label>
                <select
                  value={setsToWin}
                  onChange={(e) => setSetsToWin(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={3}>Melhor de 5 Sets (Vence quem fizer 3)</option>
                  <option value={2}>Melhor de 3 Sets (Vence quem fizer 2)</option>
                  <option value={1}>Set Único / Festival (1 Set)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Efeitos Sonoros de Apito:
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      if (!soundEnabled) playWhistleSound();
                    }}
                    className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                      soundEnabled
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {soundEnabled ? 'Apito Ativado' : 'Apito Desativado'}
                  </button>

                  <button
                    type="button"
                    onClick={playWhistleSound}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700"
                    title="Testar som do apito"
                  >
                    Testar Apito 🔊
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Pontos por Set Normal:
                </label>
                <input
                  type="number"
                  value={pointsPerSet}
                  onChange={(e) => setPointsPerSet(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min={10}
                  max={50}
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Padrão oficial FIVB: 25 pontos com diferença mínima de 2 pontos.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Pontos do Set Desempate (Tie-Break):
                </label>
                <input
                  type="number"
                  value={tieBreakPoints}
                  onChange={(e) => setTieBreakPoints(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min={5}
                  max={30}
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Padrão oficial FIVB: 15 pontos no 5º Set (ou 3º Set em M de 3).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Limite de Pedidos de Tempo por Set:
                </label>
                <input
                  type="number"
                  value={maxTimeouts}
                  onChange={(e) => setMaxTimeouts(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min={1}
                  max={5}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Limite de Substituições por Set:
                </label>
                <input
                  type="number"
                  value={maxSubs}
                  onChange={(e) => setMaxSubs(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min={1}
                  max={12}
                />
              </div>
            </div>

            {/* Troca de Lados de Quadra (Side Swap) Toggle & Interval */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="font-extrabold text-sm text-white flex items-center gap-2">
                    🔄 Troca de Lados de Quadra
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quando ativado, os times invertem de lado automaticamente na tela do placar e da quadra conforme a quantidade de sets configurada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoSwapSides(!autoSwapSides)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                    autoSwapSides
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${autoSwapSides ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  {autoSwapSides ? 'Inversão Habilitada (Ativo)' : 'Manter Lados Fixos (Desativado)'}
                </button>
              </div>

              {autoSwapSides && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div>
                    <span className="text-xs font-extrabold text-slate-200 block">
                      Frequência de Troca (Quantidade de Sets):
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Ex: 1 = Trocar a cada 1 set (Sets 2, 4...). Ex: 2 = Trocar a cada 2 sets (Sets 3, 5...).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSwapSidesInterval(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          swapSidesInterval === num
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        A cada {num} {num === 1 ? 'Set' : 'Sets'}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={swapSidesInterval}
                        onChange={(e) => setSwapSidesInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-10 bg-transparent text-xs font-bold text-center text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">set(s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Zerar Placar ao Fim da Partida (Reset on Match End) Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="font-extrabold text-sm text-white flex items-center gap-2">
                    🏆 Início de Nova Partida ao Fim do Jogo
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Oferece opção imediata de zerar o placar e iniciar um novo jogo mantendo todas as regras, nomes e ajustes salvos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoResetOnMatchEnd(!autoResetOnMatchEnd)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                    autoResetOnMatchEnd
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${autoResetOnMatchEnd ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                  {autoResetOnMatchEnd ? 'Reinício Habilitado (Ativo)' : 'Desativado'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">
                  As alterações serão aplicadas instantaneamente à partida ativa.
                </span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                Salvar Regras da Partida
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Backup, Restore & App Metadata */}
        <div className="space-y-6">
          {/* Backup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Backup & Restauração
            </h3>

            <p className="text-xs text-slate-400">
              Exporte todo o histórico de partidas, bancos de equipes e torneios em um único arquivo JSON para segurança.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Exportar Backup (.json)
              </button>

              <label className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Restaurar de Arquivo</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* App Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              Sobre o R3Play
            </h3>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <strong>Versão:</strong> 2.5.0 Pro (Edição Gratuita Completa)
              </p>
              <p>
                <strong>Recursos:</strong> Placar Ao Vivo, Rodízio em Quadra 3D/2D, Estatísticas Avançadas, Súmula Oficial FIVB, Banco de Equipes, Torneios e Sincronização Google Sheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
