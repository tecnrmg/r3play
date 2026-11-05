import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldAlert,
  Users,
  Plus,
  X,
} from 'lucide-react';
import { Match, RefereeInfo, SanctionRecord, SanctionType } from '../../types/volleyball';

interface SumulaViewProps {
  match: Match;
  setMatch: (match: Match) => void;
}

export const SumulaView: React.FC<SumulaViewProps> = ({ match, setMatch }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingReferees, setIsEditingReferees] = useState<boolean>(false);

  // Referee credentials
  const [firstRef, setFirstRef] = useState<string>(match.referees?.firstReferee || '');
  const [secondRef, setSecondRef] = useState<string>(match.referees?.secondReferee || '');
  const [scorekeeper, setScorekeeper] = useState<string>(match.referees?.scorekeeper || '');
  const [gymnasium, setGymnasium] = useState<string>(match.referees?.gymnasium || match.location || '');

  // Modal to apply Sanction / Card
  const [isAddingSanction, setIsAddingSanction] = useState<boolean>(false);
  const [sanctionTeamId, setSanctionTeamId] = useState<string>(match.teamA.id);
  const [sanctionPlayerId, setSanctionPlayerId] = useState<string>('');
  const [sanctionType, setSanctionType] = useState<SanctionType>('yellow_warning');
  const [sanctionNotes, setSanctionNotes] = useState<string>('');

  // Save Referees
  const handleSaveReferees = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedReferees: RefereeInfo = {
      firstReferee: firstRef,
      secondReferee: secondRef,
      scorekeeper: scorekeeper,
      gymnasium: gymnasium,
    };

    setMatch({
      ...match,
      referees: updatedReferees,
    });
    setIsEditingReferees(false);
  };

  // Add Sanction
  const handleAddSanction = (e: React.FormEvent) => {
    e.preventDefault();
    const newSanction: SanctionRecord = {
      id: `sanc-${Date.now()}`,
      setNumber: match.currentSet,
      teamId: sanctionTeamId,
      playerId: sanctionPlayerId || undefined,
      type: sanctionType,
      scoreA: match.currentScoreA,
      scoreB: match.currentScoreB,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      notes: sanctionNotes.trim() || undefined,
    };

    // If Red Card / Penalty, award 1 point to opponent team per FIVB rule!
    let updatedMatch = { ...match };

    if (sanctionType === 'red_penalty' || sanctionType === 'expulsion' || sanctionType === 'disqualification') {
      const isTeamA = sanctionTeamId === match.teamA.id;
      if (isTeamA) {
        updatedMatch.currentScoreB += 1;
      } else {
        updatedMatch.currentScoreA += 1;
      }
    }

    const currentSanctions = updatedMatch.sanctions || [];
    updatedMatch.sanctions = [...currentSanctions, newSanction];

    setMatch(updatedMatch);
    setIsAddingSanction(false);
    setSanctionNotes('');
  };

  // Print Súmula
  const handlePrint = () => {
    window.print();
  };

  // Copy Text Summary
  const handleCopySummary = () => {
    const text = `
=== SÚMULA ELETRÔNICA OFICIAL DE VÔLEI ===
Partida: ${match.title}
Data: ${match.date} | Local: ${match.location || 'Ginásio'}
Status: ${match.status === 'finished' ? 'ENCERRADA' : 'EM ANDAMENTO'}

PLACAR GERAL (SETS):
${match.teamA.name}: ${match.setsWonA} sets
${match.teamB.name}: ${match.setsWonB} sets

HISTÓRICO DOS SETS:
${match.setHistory
  .map(
    (s) =>
      `Set ${s.setNumber}: ${match.teamA.name} ${s.scoreA} x ${s.scoreB} ${match.teamB.name}`
  )
  .join('\n')}

ÁRBITROS:
1º Árbitro: ${match.referees?.firstReferee || 'Não informado'}
2º Árbitro: ${match.referees?.secondReferee || 'Não informado'}
Apontador: ${match.referees?.scorekeeper || 'Não informado'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 text-white print:p-0 print:bg-white print:text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Documento Oficial da Partida
            </span>
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase border border-emerald-500/30">
              Súmula FIVB
            </span>
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Súmula Oficial Eletrônica de Vôlei
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Relatório oficial da partida com equipe de arbitragem, tempos de jogo, histórico de substituições e aplicação de sanções/cartões.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddingSanction(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Aplicar Cartão / Sanção
          </button>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Súmula
          </button>
        </div>
      </div>

      {/* SÚMULA PRINTABLE FORM PAPER SHEET */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:bg-white">
        {/* Paper Header */}
        <div className="border-b-2 border-slate-700 pb-4 text-center space-y-1 print:border-slate-300">
          <h1 className="text-2xl font-black tracking-tight text-white print:text-slate-900">
            FEDERAÇÃO DE VOLEIBOL — SÚMULA OFICIAL DE JOGO
          </h1>
          <p className="text-xs text-slate-400 font-bold print:text-slate-600">
            {match.title} • {match.date} • {match.location || 'Ginásio Principal'}
          </p>
        </div>

        {/* Referee & Officials Section */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 print:bg-slate-100 print:border-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-slate-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              Equipe de Arbitragem Oficial
            </h3>

            <button
              onClick={() => setIsEditingReferees(true)}
              className="text-[11px] text-blue-400 font-bold hover:underline print:hidden"
            >
              Editar Árbitros
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">1º Árbitro:</span>
              <strong className="text-white print:text-slate-900">
                {match.referees?.firstReferee || 'Não preenchido'}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">2º Árbitro:</span>
              <strong className="text-white print:text-slate-900">
                {match.referees?.secondReferee || 'Não preenchido'}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Apontador:</span>
              <strong className="text-white print:text-slate-900">
                {match.referees?.scorekeeper || 'Não preenchido'}
              </strong>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Ginásio:</span>
              <strong className="text-white print:text-slate-900">
                {match.referees?.gymnasium || match.location || 'Ginásio'}
              </strong>
            </div>
          </div>
        </div>

        {/* Teams Match Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-blue-950/40 border-2 border-blue-500/40 print:border-slate-400">
            <span className="text-3xl">{match.teamA.logoEmoji || '⚡'}</span>
            <h3 className="text-lg font-black text-blue-300 mt-1 print:text-slate-900">{match.teamA.name}</h3>
            <p className="text-3xl font-black text-white mt-1 print:text-slate-900">{match.setsWonA} SETS</p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/40 border-2 border-red-500/40 print:border-slate-400">
            <span className="text-3xl">{match.teamB.logoEmoji || '🔥'}</span>
            <h3 className="text-lg font-black text-red-300 mt-1 print:text-slate-900">{match.teamB.name}</h3>
            <p className="text-3xl font-black text-white mt-1 print:text-slate-900">{match.setsWonB} SETS</p>
          </div>
        </div>

        {/* Sets History & Stats Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Detalhamento de Sets & Pontuação Parcial
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-black text-[10px] uppercase border-b border-slate-800 print:bg-slate-200 print:text-slate-900">
                <tr>
                  <th className="py-3 px-4">Set</th>
                  <th className="py-3 px-4 text-center">{match.teamA.name}</th>
                  <th className="py-3 px-4 text-center">Placar Parcial</th>
                  <th className="py-3 px-4 text-center">{match.teamB.name}</th>
                  <th className="py-3 px-4 text-center">Vencedor</th>
                  <th className="py-3 px-4 text-right">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 print:bg-white print:divide-slate-300">
                {match.setHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">
                      Set 1 em andamento ({match.currentScoreA} x {match.currentScoreB})
                    </td>
                  </tr>
                ) : (
                  match.setHistory.map((s) => {
                    const winner = s.winnerTeamId === match.teamA.id ? match.teamA.name : match.teamB.name;
                    return (
                      <tr key={s.setNumber}>
                        <td className="py-3 px-4 font-black">Set {s.setNumber}</td>
                        <td className="py-3 px-4 text-center font-bold text-blue-400">{s.scoreA}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          {s.scoreA} - {s.scoreB}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-red-400">{s.scoreB}</td>
                        <td className="py-3 px-4 text-center font-black text-amber-300">{winner}</td>
                        <td className="py-3 px-4 text-right text-slate-400">{s.durationMinutes} min</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeouts & Substitutions Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeouts Log */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 print:border-slate-300">
            <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Registro de Tempos Solicitados ({match.timeouts.length})
            </h4>

            {match.timeouts.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum tempo solicitado até o momento.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {match.timeouts.map((t) => {
                  const teamName = t.teamId === match.teamA.id ? match.teamA.name : match.teamB.name;
                  return (
                    <li key={t.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span>
                        Set {t.setNumber} — <strong>{teamName}</strong>
                      </span>
                      <span className="font-mono text-slate-400">
                        {t.scoreA} x {t.scoreB} ({t.timestamp})
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Sanctions / Cards Log */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 print:border-slate-300">
            <h4 className="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Registro de Sanções & Cartões ({match.sanctions?.length || 0})
            </h4>

            {!match.sanctions || match.sanctions.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum cartão ou sanção disciplinar aplicada.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-300">
                {match.sanctions.map((s) => {
                  const team = s.teamId === match.teamA.id ? match.teamA : match.teamB;
                  const player = team.players.find((p) => p.id === s.playerId);
                  return (
                    <li key={s.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {s.type === 'yellow_warning' ? (
                          <span className="w-3 h-4 bg-yellow-400 rounded-sm inline-block" title="Cartão Amarelo"></span>
                        ) : (
                          <span className="w-3 h-4 bg-red-600 rounded-sm inline-block" title="Cartão Vermelho"></span>
                        )}
                        <span>
                          Set {s.setNumber} — <strong>{team.name}</strong> {player ? `(#${player.number} ${player.name})` : ''}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400">({s.timestamp})</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Editing Referees */}
      {isEditingReferees && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">Editar Equipe de Arbitragem</h3>
              <button
                onClick={() => setIsEditingReferees(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReferees} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  1º Árbitro:
                </label>
                <input
                  type="text"
                  placeholder="Nome do 1º Árbitro..."
                  value={firstRef}
                  onChange={(e) => setFirstRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  2º Árbitro:
                </label>
                <input
                  type="text"
                  placeholder="Nome do 2º Árbitro..."
                  value={secondRef}
                  onChange={(e) => setSecondRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Apontador de Mesa:
                </label>
                <input
                  type="text"
                  placeholder="Nome do Apontador..."
                  value={scorekeeper}
                  onChange={(e) => setScorekeeper(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Ginásio / Quadra:
                </label>
                <input
                  type="text"
                  placeholder="Nome do Ginásio..."
                  value={gymnasium}
                  onChange={(e) => setGymnasium(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingReferees(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/30"
                >
                  Salvar Árbitros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Adding Sanction / Card */}
      {isAddingSanction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Aplicar Sanção / Cartão Disciplinar
              </h3>
              <button
                onClick={() => setIsAddingSanction(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSanction} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Equipe Sancionada:
                </label>
                <select
                  value={sanctionTeamId}
                  onChange={(e) => setSanctionTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value={match.teamA.id}>{match.teamA.name}</option>
                  <option value={match.teamB.id}>{match.teamB.name}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Tipo de Sanção Oficial FIVB:
                </label>
                <select
                  value={sanctionType}
                  onChange={(e) => setSanctionType(e.target.value as SanctionType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="yellow_warning">🟨 Cartão Amarelo — Advertência</option>
                  <option value="red_penalty">🟥 Cartão Vermelho — Penalidade (+1 Ponto p/ Adversário)</option>
                  <option value="expulsion">🟨🟥 Expulsão do Set</option>
                  <option value="disqualification">🟨+🟥 Desqualificação da Partida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Jogador Penalizado (Opcional):
                </label>
                <select
                  value={sanctionPlayerId}
                  onChange={(e) => setSanctionPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Equipe / Comissão Técnica Geral</option>
                  {(sanctionTeamId === match.teamA.id ? match.teamA.players : match.teamB.players).map(
                    (p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} {p.name} ({p.position})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Motivo / Observações:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reclamação excessiva com o 1º Árbitro"
                  value={sanctionNotes}
                  onChange={(e) => setSanctionNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingSanction(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  Confirmar Sanção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
