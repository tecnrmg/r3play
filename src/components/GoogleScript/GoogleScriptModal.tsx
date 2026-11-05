import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  Globe,
  Download,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Match } from '../../types/volleyball';
import { exportMatchToCSV, generateGoogleAppsScriptCode } from '../../utils/volleyballUtils';

interface GoogleScriptModalProps {
  match: Match;
  setMatch: React.Dispatch<React.SetStateAction<Match>>;
  setIsSyncing?: (syncing: boolean) => void;
}

export const GoogleScriptModal: React.FC<GoogleScriptModalProps> = ({
  match,
  setMatch,
  setIsSyncing,
}) => {
  // Admin authentication state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return (
      sessionStorage.getItem('r3play_admin_unlocked') === 'true' ||
      sessionStorage.getItem('volei_pro_admin_unlocked') === 'true'
    );
  });
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [savedPin, setSavedPin] = useState<string>(() => {
    return (
      localStorage.getItem('r3play_admin_pin') ||
      localStorage.getItem('volei_pro_admin_pin') ||
      '1234'
    );
  });
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');

  const [webhookUrl, setWebhookUrl] = useState<string>(match.googleScriptWebhookUrl || '');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const scriptCode = generateGoogleAppsScriptCode();

  // Unlock Admin Access
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === savedPin) {
      setIsAdminUnlocked(true);
      sessionStorage.setItem('r3play_admin_unlocked', 'true');
      setPinError('');
      setAdminPinInput('');
    } else {
      setPinError('Senha do Administrador incorreta! Tente novamente.');
    }
  };

  // Lock Admin Access
  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    sessionStorage.removeItem('r3play_admin_unlocked');
    sessionStorage.removeItem('volei_pro_admin_unlocked');
  };

  // Change Admin PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length < 4) {
      setPinError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    const cleanPin = newPinInput.trim();
    localStorage.setItem('r3play_admin_pin', cleanPin);
    setSavedPin(cleanPin);
    setIsChangingPin(false);
    setNewPinInput('');
    setPinChangeSuccess('Senha do administrador alterada com sucesso!');
    setTimeout(() => setPinChangeSuccess(''), 4000);
  };

  // Copy Code.gs
  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Save Webhook URL
  const handleSaveWebhook = (urlToSave: string) => {
    setMatch((prev) => ({
      ...prev,
      googleScriptWebhookUrl: urlToSave.trim(),
    }));
  };

  // Test / Sync Now to Google Sheets
  const handleSyncToGoogleSheets = async () => {
    if (!webhookUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Por favor, insira a URL do seu Google Apps Script Web App.',
      });
      return;
    }

    setSyncStatus({ type: 'loading', message: 'Sincronizando partida com o Google Sheets...' });
    if (setIsSyncing) setIsSyncing(true);

    try {
      const payload = {
        action: 'FULL_SYNC',
        matchTitle: match.title,
        date: match.date,
        currentSet: match.currentSet,
        scoreA: match.currentScoreA,
        scoreB: match.currentScoreB,
        setsWonA: match.setsWonA,
        setsWonB: match.setsWonB,
        playByPlay: match.playByPlay.map((pt) => {
          const isTeamA = pt.teamId === match.teamA.id;
          const scoringTeamName = isTeamA ? match.teamA.name : match.teamB.name;
          const allPlayers = [...match.teamA.players, ...match.teamB.players];
          const player = allPlayers.find((p) => p.id === pt.playerId);

          const typeLabelMap: Record<string, string> = {
            attack: 'Ataque',
            ace: 'Ace (Saque)',
            block: 'Bloqueio',
            opponent_error: 'Erro Adversário',
            other: 'Outro',
          };

          return {
            setNumber: pt.setNumber,
            timestamp: pt.timestamp,
            scoreA: pt.scoreA,
            scoreB: pt.scoreB,
            scoringTeamName,
            pointTypeLabel: typeLabelMap[pt.pointType] || pt.pointType,
            playerName: player ? `#${player.number} ${player.name}` : '-',
            notes: pt.notes || '',
          };
        }),
      };

      // Google Apps Script requires text/plain or json
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      handleSaveWebhook(webhookUrl);
      setSyncStatus({
        type: 'success',
        message: 'Sincronização concluída com sucesso! Os dados foram gravados na sua Planilha Google.',
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: `Falha na conexão: ${err.message || 'Verifique se a URL da implantação está como "Qualquer Pessoa".'}`,
      });
    } finally {
      if (setIsSyncing) setIsSyncing(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csvData = exportMatchToCSV(match);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `volei_pro_${match.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Tabular Data for direct Excel / Google Sheets paste
  const handleCopyTabular = () => {
    const rows = match.playByPlay.map((pt) => {
      const isTeamA = pt.teamId === match.teamA.id;
      const teamName = isTeamA ? match.teamA.name : match.teamB.name;
      const allPlayers = [...match.teamA.players, ...match.teamB.players];
      const player = allPlayers.find((p) => p.id === pt.playerId);

      return [
        `Set ${pt.setNumber}`,
        pt.timestamp,
        `${pt.scoreA} x ${pt.scoreB}`,
        teamName,
        pt.pointType,
        player ? `#${player.number} ${player.name}` : '-',
        pt.notes || '',
      ].join('\t');
    });

    const header = ['Set\tHorário\tPlacar\tEquipe\tTipo\tJogador\tNotas'];
    const tabText = [header, ...rows].join('\n');

    navigator.clipboard.writeText(tabText);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 3000);
  };

  // IF ADMIN ACCESS IS LOCKED, DISPLAY ADMIN LOCK SCREEN
  if (!isAdminUnlocked) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
          <Lock className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
            Acesso Restrito
          </span>
          <h2 className="text-2xl font-black text-white">Área do Administrador do Sistema</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            A configuração de integração com o Google Sheets e sincronização de dados é restrita exclusivamente ao Administrador do Sistema.
          </p>
        </div>

        <form onSubmit={handleUnlockAdmin} className="space-y-4 max-w-sm mx-auto text-left">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Senha do Administrador:
            </label>
            <input
              type="password"
              placeholder="Digite a senha do admin..."
              value={adminPinInput}
              onChange={(e) => {
                setAdminPinInput(e.target.value);
                setPinError('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-center tracking-widest"
              autoFocus
            />
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            Desbloquear Painel do Admin
          </button>

          <p className="text-[11px] text-slate-500 text-center pt-2">
            Senha padrão de fábrica: <strong className="text-amber-400">1234</strong>
          </p>
        </form>
      </div>
    );
  }

  // IF ADMIN IS UNLOCKED, DISPLAY FULL GOOGLE SHEETS MANAGEMENT
  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Header Banner with Admin Status & Lock Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Administrador Autenticado
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
              Gratuito & Sem Limites
            </span>
          </div>
          <h2 className="text-2xl font-black mt-2 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-green-400" />
            Integração Google Sheets & Apps Script
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sincronize todos os pontos e estatísticas em tempo real diretamente para a sua planilha do Google de forma 100% gratuita.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChangingPin(!isChangingPin)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            Alterar Senha
          </button>
          <button
            onClick={handleLockAdmin}
            className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold text-red-300 flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Bloquear Acesso
          </button>
        </div>
      </div>

      {/* Change Admin PIN Modal / Section */}
      {isChangingPin && (
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl max-w-md mx-auto space-y-4">
          <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Alterar Senha do Administrador
          </h3>
          <form onSubmit={handleChangePin} className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-1">
                Nova Senha Admin:
              </label>
              <input
                type="password"
                placeholder="Mínimo 4 caracteres..."
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
              >
                Salvar Nova Senha
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {pinChangeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{pinChangeSuccess}</span>
        </div>
      )}

      {/* STEP BY STEP SETUP GUIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Webhook URL Connector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black flex items-center gap-2 text-emerald-400">
              <Globe className="w-5 h-5" />
              1. Conectar URL do Webhook do Google Apps Script
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cole abaixo a URL gerada no Google Apps Script para sincronização automática.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-300 mb-2">
                URL da Implantação (Web App URL):
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  handleSaveWebhook(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={handleSyncToGoogleSheets}
              disabled={syncStatus.type === 'loading'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Sincronizar com Google Sheets Agora
            </button>

            {/* Sync Feedback Message */}
            {syncStatus.message && (
              <div
                className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : syncStatus.type === 'error'
                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : syncStatus.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* Tutorial Steps */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-amber-400">
              📋 Como criar sua planilha em 2 minutos:
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>
                Abra uma nova planilha no{' '}
                <a
                  href="https://sheets.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center gap-1"
                >
                  Google Sheets <ExternalLink className="w-3 h-3" />
                </a>
                .
              </li>
              <li>
                No menu superior, clique em <strong>Extensões &gt; Apps Script</strong>.
              </li>
              <li>
                Apague todo o código padrão e cole o código ao lado (botão{' '}
                <strong className="text-amber-300">Copiar Código</strong>).
              </li>
              <li>
                Clique no botão superior direito <strong>Implantar &gt; Nova Implantação</strong>.
              </li>
              <li>
                Em <em>Tipo</em> escolha <strong>App da Web</strong> e em <em>Quem pode acessar</em>{' '}
                escolha <strong>Qualquer pessoa</strong>.
              </li>
              <li>Copie a URL do Web App gerada e cole no campo acima!</li>
            </ol>
          </div>
        </div>

        {/* Step 2: Google Apps Script Code View & Copy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-indigo-400">
                <Code2 className="w-5 h-5" />
                2. Código do Google Script (Code.gs)
              </h3>

              <button
                onClick={handleCopyScriptCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" /> Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Código
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Este script cria automaticamente as colunas da planilha e grava cada ponto com a equipe,
              jogador, tipo de lance e horário.
            </p>

            {/* Code Snippet Display Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-80 overflow-y-auto font-mono text-[11px] text-indigo-300 leading-relaxed select-all">
              <pre>{scriptCode}</pre>
            </div>
          </div>

          {/* Quick Manual Export Options */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-400">
              📥 Outras Opções de Exportação Manual:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadCSV}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-green-400" />
                Baixar Arquivo CSV
              </button>

              <button
                onClick={handleCopyTabular}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedTable ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    Copiar Tabela (Ctrl+V)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

