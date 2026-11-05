import React, { useState } from 'react';
import {
  Video,
  Copy,
  CheckCircle2,
  Maximize2,
  Zap,
  Sliders,
  Palette,
  Eye,
  Radio,
  Share2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Volume2,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  Lock,
  Crown,
} from 'lucide-react';
import { Match } from '../../types/volleyball';
import { usePlanContext } from '../../context/PlanContext';

interface StreamOverlayViewProps {
  match: Match;
  setMatch: (match: Match) => void;
}

export const StreamOverlayView: React.FC<StreamOverlayViewProps> = ({ match, setMatch }) => {
  const { hasStreamAddon, setHasStreamAddon } = usePlanContext();

  // Settings for Overlay customization
  const [bgType, setBgType] = useState<'transparent' | 'chroma-green' | 'chroma-blue' | 'dark-preview'>('dark-preview');
  const [position, setPosition] = useState<'top' | 'bottom' | 'minimal-pill'>('bottom');
  const [scale, setScale] = useState<'normal' | 'large' | 'compact'>('normal');
  const [showSponsor, setShowSponsor] = useState<boolean>(true);
  const [sponsorText, setSponsorText] = useState<string>('TRANSMISSÃO AO VIVO • R3PLAY');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Quick Score Handler
  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    let updatedScoreA = match.currentScoreA;
    let updatedScoreB = match.currentScoreB;

    if (team === 'A') {
      updatedScoreA = Math.max(0, updatedScoreA + delta);
    } else {
      updatedScoreB = Math.max(0, updatedScoreB + delta);
    }

    setMatch({
      ...match,
      currentScoreA: updatedScoreA,
      currentScoreB: updatedScoreB,
      servingTeamId: delta > 0 ? (team === 'A' ? match.teamA.id : match.teamB.id) : match.servingTeamId,
    });
  };

  // Toggle Serving Team
  const toggleServe = () => {
    const nextServe = match.servingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;
    setMatch({ ...match, servingTeamId: nextServe });
  };

  // Copy Browser Source URL guide for Prism Live / OBS
  const copyObsGuide = () => {
    if (!hasStreamAddon) {
      alert('O Módulo Avulso de Transmissão Ao Vivo precisa estar ativo para copiar o link do overlay.');
      return;
    }
    const guideText = window.location.href;
    navigator.clipboard.writeText(guideText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Background style helper
  const getBgStyle = () => {
    switch (bgType) {
      case 'chroma-green':
        return 'bg-[#00FF00]';
      case 'chroma-blue':
        return 'bg-[#0000FF]';
      case 'transparent':
        return 'bg-transparent';
      case 'dark-preview':
      default:
        return 'bg-slate-950/90 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black';
    }
  };

  // Scale class helper
  const getScaleClass = () => {
    switch (scale) {
      case 'compact':
        return 'scale-90';
      case 'large':
        return 'scale-110';
      case 'normal':
      default:
        return 'scale-100';
    }
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-500/30 flex items-center gap-1">
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
              Transmissão Ao Vivo (Stream Overlay)
            </span>
            <span className="px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
              Prism Live Studio / OBS / vMix
            </span>
            {!hasStreamAddon && (
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Pacote Avulso
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Video className="w-7 h-7 text-rose-400" />
            Placar para Transmissão Ao Vivo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Placar em estilo TV / Lower Third otimizado para Chroma Key (Fundo Verde/Azul) ou Transparente em softwares de live stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasStreamAddon && (
            <button
              onClick={() => setShowControls(!showControls)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showControls
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              {showControls ? 'Ocultar Painel do Operador' : 'Mostrar Painel do Operador'}
            </button>
          )}

          <button
            onClick={copyObsGuide}
            className={`px-4 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              hasStreamAddon
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-amber-500/30'
            }`}
          >
            {hasStreamAddon ? (
              copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            {hasStreamAddon ? (copied ? 'URL Copiada!' : 'Copiar URL p/ Prism/OBS') : 'Overlay Bloqueado'}
          </button>
        </div>
      </div>

      {/* Paywall Banner / Screen if stream addon is not active */}
      {!hasStreamAddon && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl pointer-events-none rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 blur-3xl pointer-events-none rounded-full"></div>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-amber-400" />
              Módulo Avulso de Transmissão • R3 Play
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Transmita Suas Partidas com Placar Profissional de TV
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              O <strong className="text-amber-300">Pacote de Transmissão Ao Vivo (Stream Overlay)</strong> é um produto avulso da R3team que permite integrar o placar oficial do jogo em tempo real no <strong className="text-white">Prism Live Studio, OBS Studio ou vMix</strong> para transmissões no YouTube e redes sociais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto relative z-10">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Chroma Key & Transparência</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Suporte nativo a fundo transparente ou Chroma Key Verde (#00FF00) e Azul (#0000FF).
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Sincronia Sem Latência</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada ponto alterado na beira da quadra é atualizado na tela da live instantaneamente.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Patrocinadores & Arena</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exiba marcas de patrocinadores, nome do campeonato e indicadores de saque ao vivo.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setHasStreamAddon(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              Ativar Pacote de Transmissão (Licença R3 Play)
            </button>

            <a
              href="https://wa.me/?text=Olá!%20Gostaria%20de%20adquirir%20o%20Módulo%20de%20Transmissão%20do%20R3%20Play"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              Falar com Consultor R3team
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      )}

      {/* Operator Live Control Panel (Optional Top Panel) */}
      {showControls && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Mesa de Controle do Operador da Live
            </h3>

            {/* Config Selectors */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Fundo:</span>
                <select
                  value={bgType}
                  onChange={(e) => setBgType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                >
                  <option value="dark-preview">Escuro (Pré-visualização)</option>
                  <option value="chroma-green">🟩 Chroma Key Verde (#00FF00)</option>
                  <option value="chroma-blue">🟦 Chroma Key Azul (#0000FF)</option>
                  <option value="transparent">✨ Transparente</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Posição:</span>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                >
                  <option value="bottom">Lower Third (Inferior)</option>
                  <option value="top">Barra Superior (Topo)</option>
                  <option value="minimal-pill">Pill Minimalista (Canto)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Tamanho:</span>
                <select
                  value={scale}
                  onChange={(e) => setScale(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none"
                >
                  <option value="normal">Normal (100%)</option>
                  <option value="compact">Compacto (90%)</option>
                  <option value="large">Grande (110%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Direct Score Buttons for Stream Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Team A Quick Buttons */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase block">
                  {match.teamA.name}
                </span>
                <span className="text-2xl font-black text-white">{match.currentScoreA}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScoreChange('A', -1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                >
                  -1
                </button>
                <button
                  onClick={() => handleScoreChange('A', 1)}
                  className="px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center shadow cursor-pointer"
                >
                  +1 PONTO
                </button>
              </div>
            </div>

            {/* Team B Quick Buttons */}
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-red-300 uppercase block">
                  {match.teamB.name}
                </span>
                <span className="text-2xl font-black text-white">{match.currentScoreB}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScoreChange('B', -1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                >
                  -1
                </button>
                <button
                  onClick={() => handleScoreChange('B', 1)}
                  className="px-3 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center shadow cursor-pointer"
                >
                  +1 PONTO
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-around gap-2">
              <button
                onClick={toggleServe}
                className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Alternar Saque
              </button>
            </div>

            {/* Ticker / Sponsor Input */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Texto do Banner / Patrocinador..."
                value={sponsorText}
                onChange={(e) => setSponsorText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <button
                onClick={() => setShowSponsor(!showSponsor)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  showSponsor ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showSponsor ? 'Exibindo' : 'Oculto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE OVERLAY PREVIEW CANVAS */}
      <div
        className={`relative min-h-[480px] rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-6 transition-colors duration-300 ${getBgStyle()}`}
      >
        {/* Top Watermark Tag */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 opacity-70">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            OVERLAY DE TRANSMISSÃO AO VIVO
          </span>

          <span className="px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md font-mono text-[11px]">
            {position.toUpperCase()} • {scale.toUpperCase()}
          </span>
        </div>

        {/* OVERLAY GRAPHIC DISPLAY COMPONENT */}
        <div className={`transition-all duration-300 my-auto ${getScaleClass()}`}>
          {/* LOWER THIRD POSITION OR TOP BANNER */}
          {position === 'bottom' || position === 'top' ? (
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Main TV Lower-Third Scorebar */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-wrap items-stretch justify-between">
                {/* Team A Side */}
                <div className="flex-1 flex items-center justify-between px-5 py-3.5 border-r border-slate-800 bg-gradient-to-r from-blue-950/60 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl filter drop-shadow-md">{match.teamA.logoEmoji || '🏐'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight text-white uppercase drop-shadow">
                          {match.teamA.name}
                        </h3>
                        {match.servingTeamId === match.teamA.id && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase shadow animate-bounce">
                            🏐 SAQUE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-blue-300 tracking-wider uppercase">
                        {match.setsWonA} SETS VENCIDOS
                      </span>
                    </div>
                  </div>

                  <span className="text-4xl font-black text-amber-400 font-mono tracking-tight bg-slate-950/80 px-4 py-1 rounded-xl border border-slate-800 shadow-inner">
                    {match.currentScoreA}
                  </span>
                </div>

                {/* Match Status Center Pill */}
                <div className="bg-slate-950 px-5 py-3 flex flex-col items-center justify-center border-x border-slate-800 min-w-[130px]">
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    {match.currentSet === 5 ? 'TIE-BREAK' : `${match.currentSet}º SET`}
                  </span>
                  <span className="text-lg font-black text-white font-mono mt-0.5">
                    {match.setsWonA} - {match.setsWonB}
                  </span>
                </div>

                {/* Team B Side */}
                <div className="flex-1 flex items-center justify-between px-5 py-3.5 border-l border-slate-800 bg-gradient-to-l from-red-950/60 to-transparent">
                  <span className="text-4xl font-black text-amber-400 font-mono tracking-tight bg-slate-950/80 px-4 py-1 rounded-xl border border-slate-800 shadow-inner">
                    {match.currentScoreB}
                  </span>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-2">
                        {match.servingTeamId === match.teamB.id && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase shadow animate-bounce">
                            🏐 SAQUE
                          </span>
                        )}
                        <h3 className="text-xl font-black tracking-tight text-white uppercase drop-shadow">
                          {match.teamB.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-red-300 tracking-wider uppercase">
                        {match.setsWonB} SETS VENCIDOS
                      </span>
                    </div>
                    <span className="text-3xl filter drop-shadow-md">{match.teamB.logoEmoji || '🔥'}</span>
                  </div>
                </div>
              </div>

              {/* Ticker / Sponsor Bar Below Scorebar */}
              {showSponsor && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 font-bold backdrop-blur-md shadow-lg">
                  <span className="text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {sponsorText}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {match.title} • {match.location || 'AO VIVO'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* MINIMALIST PILL OVERLAY (TOP CORNER) */
            <div className="max-w-xs ml-auto bg-slate-950/90 border-2 border-slate-700 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-1">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> AO VIVO
                </span>
                <span>{match.currentSet}º SET</span>
              </div>

              <div className="flex items-center justify-between font-black text-sm">
                <div className="flex items-center gap-2">
                  <span>{match.teamA.logoEmoji || '🏐'}</span>
                  <span className="text-white uppercase">{match.teamA.name.slice(0, 10)}</span>
                </div>
                <span className="text-amber-400 font-mono text-lg">{match.currentScoreA}</span>
              </div>

              <div className="flex items-center justify-between font-black text-sm">
                <div className="flex items-center gap-2">
                  <span>{match.teamB.logoEmoji || '🔥'}</span>
                  <span className="text-white uppercase">{match.teamB.name.slice(0, 10)}</span>
                </div>
                <span className="text-amber-400 font-mono text-lg">{match.currentScoreB}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Instructions Footer */}
        <div className="text-center text-[11px] text-slate-400 font-medium bg-black/60 py-2 px-4 rounded-xl backdrop-blur-md max-w-2xl mx-auto">
          💡 <strong>Dica de Integração com Prism Live Studio / OBS:</strong> Adicione uma fonte do tipo <em>"Navegador (Browser Source)"</em> apontando para esta URL e selecione a opção de transparência ou aplique o filtro de Chroma Key na cor verde/azul.
        </div>
      </div>
    </div>
  );
};
