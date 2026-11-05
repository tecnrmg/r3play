import React, { useState, useEffect } from 'react';
import { Match } from './types/volleyball';
import { DEMO_MATCH } from './data/mockMatches';
import { Navbar, TabType } from './components/Navbar';
import { LiveScoreboard } from './components/Scoreboard/LiveScoreboard';
import { CourtRotationView } from './components/Court/CourtRotationView';
import { MatchStatsView } from './components/Stats/MatchStatsView';
import { GoogleScriptModal } from './components/GoogleScript/GoogleScriptModal';
import { MatchManagerView } from './components/Matches/MatchManagerView';
import { PresentationScoreboard } from './components/Scoreboard/PresentationScoreboard';
import { TeamsManagerView } from './components/Teams/TeamsManagerView';
import { TournamentsView } from './components/Tournaments/TournamentsView';
import { SumulaView } from './components/Sumula/SumulaView';
import { SettingsView } from './components/Settings/SettingsView';
import { StreamOverlayView } from './components/Stream/StreamOverlayView';
import { ParticipationView } from './components/Participation/ParticipationView';
import { AdminView } from './components/Admin/AdminView';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { PlayerPeladaPublicView } from './components/Pelada/PlayerPeladaPublicView';
import { OrganizerDashboardView } from './components/Pelada/OrganizerDashboardView';
import { ArenaOwnerDashboardView } from './components/ArenaOwner/ArenaOwnerDashboardView';
import { ArenaLoginModal } from './components/ArenaOwner/ArenaLoginModal';
import { PlanProvider, usePlanContext } from './context/PlanContext';
import { TenantProvider } from './context/TenantContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ArenaAuthProvider, useArenaAuth } from './context/ArenaAuthContext';
import { ShieldCheck, Lock } from 'lucide-react';

function MainAppContent() {
  const { isTabAllowed } = usePlanContext();
  const { isAuthenticated, isLoginModalOpen, openLoginModal, closeLoginModal } = useAdminAuth();
  const { isLoginModalOpen: isArenaLoginModalOpen, closeLoginModal: closeArenaLoginModal } = useArenaAuth();

  const [peladaRouteId, setPeladaRouteId] = useState<string>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path.startsWith('/pelada/')) {
      const id = path.replace('/pelada/', '').split('/')[0];
      return id || 'pelada-arena1-01';
    }
    return 'pelada-arena1-01';
  });

  const [match, setMatch] = useState<Match>(() => {
    const saved = localStorage.getItem('r3play_active_match') || localStorage.getItem('volei_pro_active_match');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved active match', e);
      }
    }
    return DEMO_MATCH;
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path.startsWith('/pelada/')) {
      return 'pelada';
    }
    return 'scoreboard';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Auto-redirect if activeTab is not allowed in current plan mode (e.g. Lite mode)
  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      setActiveTab('scoreboard');
    }
  }, [activeTab, isTabAllowed]);

  // Save active match state changes to localStorage
  useEffect(() => {
    localStorage.setItem('r3play_active_match', JSON.stringify(match));

    // Also update in list of matches
    const storedList = localStorage.getItem('r3play_matches') || localStorage.getItem('volei_pro_matches');
    if (storedList) {
      try {
        const matchesList: Match[] = JSON.parse(storedList);
        const updatedList = matchesList.map((m) => (m.id === match.id ? match : m));
        // If not in list, add it
        if (!matchesList.some((m) => m.id === match.id)) {
          updatedList.unshift(match);
        }
        localStorage.setItem('r3play_matches', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error syncing match list', e);
      }
    } else {
      localStorage.setItem('r3play_matches', JSON.stringify([match]));
    }
  }, [match]);

  // Handle Point Added & Silent Auto-Sync to R3team Central Webhook
  const handlePointAdded = async (updatedMatch: Match) => {
    // R3team Central Webhook URL or configured match webhook
    const targetWebhookUrl = updatedMatch.googleScriptWebhookUrl || 'https://script.google.com/macros/s/AKfycbyR3teamCentral/exec';
    if (!targetWebhookUrl) return;

    setIsSyncing(true);
    try {
      const lastPt = updatedMatch.playByPlay[0];
      if (!lastPt) return;

      const isTeamA = lastPt.teamId === updatedMatch.teamA.id;
      const scoringTeamName = isTeamA ? updatedMatch.teamA.name : updatedMatch.teamB.name;
      const allPlayers = [...updatedMatch.teamA.players, ...updatedMatch.teamB.players];
      const player = allPlayers.find((p) => p.id === lastPt.playerId);

      const typeLabelMap: Record<string, string> = {
        attack: 'Ataque',
        ace: 'Ace (Saque)',
        block: 'Bloqueio',
        opponent_error: 'Erro Adversário',
        other: 'Outro',
      };

      const payload = {
        action: 'NEW_POINT',
        matchTitle: updatedMatch.title,
        timestamp: lastPt.timestamp,
        setNumber: lastPt.setNumber,
        scoreA: lastPt.scoreA,
        scoreB: lastPt.scoreB,
        scoringTeamName,
        pointType: lastPt.pointType,
        pointTypeLabel: typeLabelMap[lastPt.pointType] || lastPt.pointType,
        playerName: player ? `#${player.number} ${player.name}` : '-',
        notes: lastPt.notes || '',
      };

      await fetch(targetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Background auto-sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // If Fullscreen TV Presentation view is selected
  if (activeTab === 'tv') {
    return (
      <PresentationScoreboard
        match={match}
        onExit={() => setActiveTab('scoreboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        match={match}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'scoreboard' && (
          <LiveScoreboard
            match={match}
            setMatch={setMatch}
            onPointAdded={handlePointAdded}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'court' && (
          <CourtRotationView match={match} setMatch={setMatch} />
        )}

        {activeTab === 'participation' && (
          <ParticipationView onNavigateToCourt={() => setActiveTab('court')} />
        )}

        {activeTab === 'stats' && <MatchStatsView match={match} />}

        {activeTab === 'teams' && (
          <TeamsManagerView
            currentMatch={match}
            setMatch={setMatch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentsView
            currentMatch={match}
            setMatch={setMatch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'sumula' && (
          <SumulaView match={match} setMatch={setMatch} />
        )}

        {activeTab === 'matches' && (
          <MatchManagerView
            currentMatch={match}
            setMatch={setMatch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            match={match}
            setMatch={setMatch}
            onNavigateToAdmin={() => {
              if (isAuthenticated) {
                setActiveTab('admin');
              } else {
                openLoginModal();
              }
            }}
          />
        )}

        {activeTab === 'admin' && (
          isAuthenticated ? (
            <AdminView />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Acesso Restrito ao Administrador</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Esta área é exclusiva para a equipe R3team gerenciar licenças comerciais no pós-venda e subdomínios White Label.
                </p>
              </div>
              <button
                onClick={openLoginModal}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Fazer Login de Superadmin
              </button>
            </div>
          )
        )}

        {activeTab === 'stream' && (
          <StreamOverlayView match={match} setMatch={setMatch} />
        )}

        {/* 1. JOGADOR COMUM: Rota pública /pelada/:id */}
        {activeTab === 'pelada' && (
          <PlayerPeladaPublicView
            peladaId={peladaRouteId}
            onNavigateToOrganizer={() => setActiveTab('organizer')}
          />
        )}

        {/* 2. ORGANIZADOR DE LISTA: Dashboard, Sorteio & Placar Mobile */}
        {activeTab === 'organizer' && (
          <OrganizerDashboardView />
        )}

        {/* 3. DONO DA QUADRA / ARENA: Painel de Parcerias e Subvenda */}
        {activeTab === 'owner' && (
          <ArenaOwnerDashboardView />
        )}
      </main>

      {/* Modal de Autenticação Segura do Superadmin Master */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSuccess={() => {
          closeLoginModal();
          setActiveTab('admin');
        }}
      />

      {/* Modal de Autenticação para Organizador e Dono da Arena */}
      <ArenaLoginModal
        isOpen={isArenaLoginModalOpen}
        onClose={closeArenaLoginModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <PlanProvider>
        <AdminAuthProvider>
          <ArenaAuthProvider>
            <MainAppContent />
          </ArenaAuthProvider>
        </AdminAuthProvider>
      </PlanProvider>
    </TenantProvider>
  );
}

