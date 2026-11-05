import React from 'react';
import {
  Trophy,
  Activity,
  Grid,
  Tv,
  FolderOpen,
  Zap,
  Users,
  FileText,
  Settings,
  Radio,
  Lock,
  Crown,
  Sparkles,
  UserCheck,
  Building2,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Match } from '../types/volleyball';
import { usePlanContext } from '../context/PlanContext';
import { useTenant } from '../context/TenantContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useArenaAuth } from '../context/ArenaAuthContext';

export type TabType =
  | 'scoreboard'
  | 'court'
  | 'participation'
  | 'stats'
  | 'teams'
  | 'tournaments'
  | 'sumula'
  | 'googlescript'
  | 'matches'
  | 'settings'
  | 'tv'
  | 'stream'
  | 'admin'
  | 'pelada'
  | 'organizer'
  | 'owner';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  match: Match;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  match,
  isSyncing,
}) => {
  const { planMode, hasStreamAddon, isTabAllowed, isFree, isLite, isPro, togglePlanMode } = usePlanContext();
  const { tenant } = useTenant();
  const { isAuthenticated, adminUser, openLoginModal } = useAdminAuth();
  const {
    role: arenaRole,
    user: arenaUser,
    quickSwitchRole,
    openLoginModal: openArenaLogin,
    isOwner: isArenaOwner,
    isOrganizer: isArenaOrganizer,
  } = useArenaAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo, White Label Partner & Plan Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-left group">
              <button
                type="button"
                onClick={() => setActiveTab('scoreboard')}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md group-hover:scale-105 transition-all cursor-pointer shrink-0 overflow-hidden border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                  boxShadow: `0 4px 14px ${tenant.primaryColor}33`,
                }}
              >
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>🏐</span>
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scoreboard')}
                    className="font-extrabold text-lg tracking-tight hover:opacity-90 transition-opacity cursor-pointer text-white flex items-center gap-2"
                  >
                    <span>{tenant.name}</span>
                  </button>

                  {/* Subdomain White Label Badge */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1"
                    style={{
                      backgroundColor: `${tenant.primaryColor}15`,
                      color: tenant.primaryColor,
                      borderColor: `${tenant.primaryColor}40`,
                    }}
                    title={`Ambiente White Label: ${tenant.subdomain}.r3play.com.br`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    {tenant.subdomain}
                  </span>
                  
                  {/* Plan Mode Badge Button */}
                  <button
                    type="button"
                    onClick={() => togglePlanMode()}
                    title="Clique para alternar entre Modo Free, Modo Lite e Modo Pro para testes"
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                      isPro
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : isFree
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                    }`}
                  >
                    {isPro ? (
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                    ) : isFree ? (
                      <Tv className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                    )}
                    MODO {planMode.toUpperCase()}
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate h-[17px] w-[300px]">
                  {tenant.description ? `${tenant.description} • ` : ''}{match.title}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Desktop Scrollable) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
            {/* Placar (Scoreboard) - Always Allowed */}
            {isTabAllowed('scoreboard') && (
              <button
                onClick={() => setActiveTab('scoreboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'scoreboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Placar
              </button>
            )}

            {/* Quadra (Rotation) - Always Allowed */}
            {isTabAllowed('court') && (
              <button
                onClick={() => setActiveTab('court')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'court'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-emerald-400" />
                Quadra
              </button>
            )}

            {/* Participação (Participation List) - Allowed in Lite & Pro */}
            {isTabAllowed('participation') && (
              <button
                onClick={() => setActiveTab('participation')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'participation'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Participação
              </button>
            )}

            {/* Estatísticas (Stats) - Pro Only */}
            {isTabAllowed('stats') && (
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Estatísticas
              </button>
            )}

            {/* Equipes (Teams) - Pro Only */}
            {isTabAllowed('teams') && (
              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'teams'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Equipes
              </button>
            )}

            {/* Torneios (Tournaments) - Pro Only */}
            {isTabAllowed('tournaments') && (
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'tournaments'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Torneios
              </button>
            )}

            {/* Súmula Eletrônica (Sumula) - Pro Only */}
            {isTabAllowed('sumula') && (
              <button
                onClick={() => setActiveTab('sumula')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'sumula'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                Súmula
              </button>
            )}

            {/* Partidas (Matches Manager) - Pro Only */}
            {isTabAllowed('matches') && (
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'matches'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                Partidas
              </button>
            )}

            {/* Transmissão Ao Vivo (Stream Overlay - Pacote Avulso) */}
            {isTabAllowed('stream') && (
              <button
                onClick={() => setActiveTab('stream')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'stream'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Transmissão
                {!hasStreamAddon && (
                  <span className="flex items-center text-[10px] bg-slate-900/90 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    <Lock className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                    Avulso
                  </span>
                )}
              </button>
            )}

            {/* Ajustes (Settings) */}
            {isTabAllowed('settings') && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Ajustes
              </button>
            )}

            {/* 1. JOGADOR COMUM (Role: 'PLAYER') - Rota pública /pelada/:id */}
            <button
              onClick={() => setActiveTab('pelada')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pelada'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-emerald-400 hover:text-white hover:bg-emerald-950/60'
              }`}
              title="Rota pública do jogador: placar ao vivo e botão Participar da Lista"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pelada (Jogador)</span>
            </button>

            {/* 2. ORGANIZADOR DE LISTA (Role: 'ORGANIZER') */}
            <button
              onClick={() => {
                if (isArenaOrganizer || isArenaOwner) {
                  setActiveTab('organizer');
                } else {
                  openArenaLogin('ORGANIZER');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'organizer'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : isArenaOrganizer
                  ? 'bg-blue-950/60 text-blue-300 border border-blue-500/40 hover:bg-blue-900/60'
                  : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
              }`}
              title="Dashboard do Organizador: Sorteio de times e controle touch do placar"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Organizador</span>
            </button>

            {/* 3. DONO DA QUADRA / ARENA (Role: 'OWNER') */}
            <button
              onClick={() => {
                if (isArenaOwner) {
                  setActiveTab('owner');
                } else {
                  openArenaLogin('OWNER');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'owner'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : isArenaOwner
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
              title="Painel do Dono da Arena: Gestão de organizadores e licenças avulsas de Overlay OBS"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Dono Arena</span>
            </button>

            {/* Painel de Admin (Exclusivo Superadmin com Login Banco de Dados) */}
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setActiveTab('admin');
                } else {
                  openLoginModal();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isAuthenticated
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60'
              }`}
              title={isAuthenticated ? `Painel Admin logado como ${adminUser?.name}` : 'Acesso Restrito Superadmin'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Superadmin</span>
              {isAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right Action: Fullscreen TV View & Silent Auto-Sync Indicator */}
          <div className="flex items-center gap-2">
            {/* Background Sync Status Indicator (Read-only, no popup button) */}
            {isSyncing && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Sync R3team
              </div>
            )}

            {/* Presentation TV Mode Button */}
            <button
              onClick={() => setActiveTab('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                activeTab === 'tv'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span className="hidden sm:inline">Modo</span> TV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Strip (Scrollable) */}
      <div className="lg:hidden flex items-center gap-2 bg-slate-950 border-t border-slate-800 px-3 py-2 text-xs font-semibold overflow-x-auto scrollbar-none">
        {isTabAllowed('scoreboard') && (
          <button
            onClick={() => setActiveTab('scoreboard')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'scoreboard' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Placar
          </button>
        )}

        {isTabAllowed('court') && (
          <button
            onClick={() => setActiveTab('court')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'court' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            Quadra
          </button>
        )}

        {isTabAllowed('participation') && (
          <button
            onClick={() => setActiveTab('participation')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'participation' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            Participação
          </button>
        )}

        {isTabAllowed('stats') && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'stats' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Stats
          </button>
        )}

        {isTabAllowed('teams') && (
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'teams' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Equipes
          </button>
        )}

        {isTabAllowed('tournaments') && (
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'tournaments' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Torneios
          </button>
        )}

        {isTabAllowed('sumula') && (
          <button
            onClick={() => setActiveTab('sumula')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'sumula' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            Súmula
          </button>
        )}

        {isTabAllowed('matches') && (
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'matches' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            Partidas
          </button>
        )}

        {isTabAllowed('stream') && (
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'stream' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            Transmissão
            {!hasStreamAddon && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
          </button>
        )}

        {isTabAllowed('settings') && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 bg-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Ajustes
          </button>
        )}

        {/* 1. Jogador */}
        <button
          onClick={() => setActiveTab('pelada')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
            activeTab === 'pelada' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Pelada
        </button>

        {/* 2. Organizador */}
        <button
          onClick={() => {
            if (isArenaOrganizer || isArenaOwner) {
              setActiveTab('organizer');
            } else {
              openArenaLogin('ORGANIZER');
            }
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
            activeTab === 'organizer' ? 'bg-blue-600 text-white font-bold' : 'text-blue-400 bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Organizador
        </button>

        {/* 3. Dono Arena */}
        <button
          onClick={() => {
            if (isArenaOwner) {
              setActiveTab('owner');
            } else {
              openArenaLogin('OWNER');
            }
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
            activeTab === 'owner' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 bg-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Dono Arena
        </button>

        <button
          onClick={() => {
            if (isAuthenticated) {
              setActiveTab('admin');
            } else {
              openLoginModal();
            }
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg whitespace-nowrap ${
            activeTab === 'admin'
              ? 'bg-indigo-600 text-white font-bold'
              : 'text-indigo-300 bg-indigo-950/60 border border-indigo-500/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Admin
          {isAuthenticated && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>

      {/* BARRA DE JORNADAS MULTI-TENANT (TESTE & NAVEGAÇÃO RÁPIDA) */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <span>Jornadas do Sistema:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. JOGADOR COMUM */}
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('PLAYER');
                setActiveTab('pelada');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pelada'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-slate-800'
              }`}
            >
              <span>👤 1. Jogador Comum (/pelada/:id)</span>
            </button>

            {/* 2. ORGANIZADOR */}
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('ORGANIZER');
                setActiveTab('organizer');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'organizer'
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-slate-900 text-blue-400 border border-blue-500/30 hover:bg-slate-800'
              }`}
            >
              <span>📋 2. Organizador (Sorteio & Placar Mobile)</span>
            </button>

            {/* 3. DONO DA ARENA */}
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('OWNER');
                setActiveTab('owner');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'owner'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-amber-400 border border-amber-500/30 hover:bg-slate-800'
              }`}
            >
              <span>🏟️ 3. Dono da Arena (Organizadores & OBS)</span>
            </button>

            {/* 4. SUPERADMIN R3TEAM */}
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  setActiveTab('admin');
                } else {
                  openLoginModal();
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-indigo-400 border border-indigo-500/30 hover:bg-slate-800'
              }`}
            >
              <span>👑 4. Superadmin R3team</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


