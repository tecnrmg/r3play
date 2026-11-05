import { Match, Player, PlayerStats, PointDetail, Team } from '../types/volleyball';

/**
 * Rotates player positions clockwise according to court player count (2 to 6):
 * Position 2 (Index 1) rotates to Position 1 (Index 0 - Server).
 */
export function rotateTeamClockwise(rotation: string[], count?: number): string[] {
  if (!rotation || rotation.length === 0) return [];
  const num = Math.min(count || 6, rotation.length);
  if (num < 2) return [...rotation];

  const active = rotation.slice(0, num);
  const bench = rotation.slice(num);
  const rotatedActive = [active[1], ...active.slice(2), active[0]];
  return [...rotatedActive, ...bench];
}

export function rotateTeamCounterClockwise(rotation: string[], count?: number): string[] {
  if (!rotation || rotation.length === 0) return [];
  const num = Math.min(count || 6, rotation.length);
  if (num < 2) return [...rotation];

  const active = rotation.slice(0, num);
  const bench = rotation.slice(num);
  const lastIdx = active.length - 1;
  const rotatedActive = [active[lastIdx], active[0], ...active.slice(1, lastIdx)];
  return [...rotatedActive, ...bench];
}

/**
 * Checks if current set is finished based on match rules.
 */
export function checkSetWinner(
  scoreA: number,
  scoreB: number,
  currentSet: number,
  match: Match
): { isSetOver: boolean; winnerTeamId?: string } {
  const isTieBreak = currentSet === (match.config.setsToWin * 2 - 1);
  const targetPoints = isTieBreak ? match.config.tieBreakPoints : match.config.pointsPerSet;
  const minDiff = match.config.minPointDiff;

  if (scoreA >= targetPoints && (scoreA - scoreB) >= minDiff) {
    return { isSetOver: true, winnerTeamId: match.teamA.id };
  }
  if (scoreB >= targetPoints && (scoreB - scoreA) >= minDiff) {
    return { isSetOver: true, winnerTeamId: match.teamB.id };
  }

  return { isSetOver: false };
}

/**
 * Calculates aggregated statistics for all players in the match.
 */
export function computePlayerStats(match: Match): PlayerStats[] {
  const statsMap: Record<string, PlayerStats> = {};

  const registerPlayer = (team: Team, teamId: string) => {
    team.players.forEach((p) => {
      statsMap[p.id] = {
        playerId: p.id,
        playerName: p.name,
        playerNumber: p.number,
        playerPosition: p.position,
        teamId: teamId,
        totalPoints: 0,
        attacks: 0,
        aces: 0,
        blocks: 0,
        opponentErrors: 0,
        otherPoints: 0,
      };
    });
  };

  registerPlayer(match.teamA, match.teamA.id);
  registerPlayer(match.teamB, match.teamB.id);

  match.playByPlay.forEach((pt: PointDetail) => {
    if (pt.playerId && statsMap[pt.playerId]) {
      const st = statsMap[pt.playerId];
      st.totalPoints += 1;
      if (pt.pointType === 'attack') st.attacks += 1;
      else if (pt.pointType === 'ace') st.aces += 1;
      else if (pt.pointType === 'block') st.blocks += 1;
      else if (pt.pointType === 'opponent_error') st.opponentErrors += 1;
      else st.otherPoints += 1;
    }
  });

  return Object.values(statsMap).sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Export match to CSV format
 */
export function exportMatchToCSV(match: Match): string {
  const headers = ['Set', 'Horário', 'Equipe Pontuadora', 'Placar', 'Tipo de Ponto', 'Jogador', 'Notas'];
  const rows = match.playByPlay.map((pt) => {
    const teamName = pt.teamId === match.teamA.id ? match.teamA.name : match.teamB.name;
    const allPlayers = [...match.teamA.players, ...match.teamB.players];
    const player = allPlayers.find((p) => p.id === pt.playerId);
    const playerName = player ? `#${player.number} ${player.name}` : '-';

    const typeLabelMap: Record<string, string> = {
      attack: 'Ataque',
      ace: 'Ace (Saque)',
      block: 'Bloqueio',
      opponent_error: 'Erro Adversário',
      other: 'Outro',
    };

    return [
      `Set ${pt.setNumber}`,
      pt.timestamp,
      `"${teamName}"`,
      `${pt.scoreA} x ${pt.scoreB}`,
      `"${typeLabelMap[pt.pointType] || pt.pointType}"`,
      `"${playerName}"`,
      `"${pt.notes || ''}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Code snippet generator for Google Apps Script Code.gs
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * Vôlei Pro - Código de Integração Automática com o Google Sheets
 * 
 * Instruções:
 * 1. Abra sua Planilha no Google Sheets
 * 2. Acesse: Extensões > Apps Script
 * 3. Apague qualquer código existente e Cole todo este script abaixo.
 * 4. Clique no botão "Implantar" (Deploy) > "Nova implantação"
 * 5. Escolha o tipo: "App da Web" (Web App)
 * 6. Em "Quem pode acessar", selecione "Qualquer pessoa" (Anyone)
 * 7. Clique em "Implantar", copie a URL gerada e cole no aplicativo Vôlei Pro!
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Se a planilha estiver vazia, adiciona o cabeçalho
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Partida",
        "Data/Hora",
        "Set",
        "Placar A",
        "Placar B",
        "Equipe Pontuadora",
        "Tipo de Ponto",
        "Jogador",
        "Observações"
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    }
    
    // Adiciona o novo ponto registrado em tempo real
    if (data.action === "NEW_POINT") {
      sheet.appendRow([
        data.matchTitle || "Partida R3Play",
        data.timestamp || new Date().toLocaleString("pt-BR"),
        "Set " + (data.setNumber || 1),
        data.scoreA,
        data.scoreB,
        data.scoringTeamName,
        data.pointTypeLabel || data.pointType,
        data.playerName || "-",
        data.notes || ""
      ]);
    } else if (data.action === "FULL_SYNC") {
      // Sincronização completa da partida
      sheet.clear();
      sheet.appendRow([
        "Partida",
        "Data/Hora",
        "Set",
        "Placar A",
        "Placar B",
        "Equipe Pontuadora",
        "Tipo de Ponto",
        "Jogador",
        "Observações"
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
      
      var playByPlay = data.playByPlay || [];
      for (var i = 0; i < playByPlay.length; i++) {
        var pt = playByPlay[i];
        sheet.appendRow([
          data.matchTitle || "Partida R3Play",
          pt.timestamp || "-",
          "Set " + pt.setNumber,
          pt.scoreA,
          pt.scoreB,
          pt.scoringTeamName,
          pt.pointTypeLabel,
          pt.playerName || "-",
          pt.notes || ""
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Dados recebidos com sucesso!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("R3Play Google Apps Script Webhook Ativo!");
}
`;
}

/**
 * Adds a player to the waiting list array, distributing "Levantadores" (setters)
 * evenly so that each waiting team gets one setter before any team gets a second setter.
 */
export function addPlayerToWaitingList(
  currentList: (Player | null)[],
  newPlayer: Player,
  teamCapacity: number = 6,
  maxWaitingTeams: number = 0
): (Player | null)[] {
  const list = [...currentList];
  const isLevantador = newPlayer.position === 'Levantador';

  // Helper to get non-null players in team `tIndex`
  const getTeamPlayers = (tIndex: number) => {
    const start = tIndex * teamCapacity;
    const end = start + teamCapacity;
    const slice = list.slice(start, end);
    return slice.filter((p): p is Player => p !== null && p !== undefined);
  };

  // Helper to count setters in team `tIndex`
  const getTeamLevCount = (tIndex: number) => {
    return getTeamPlayers(tIndex).filter((p) => p.position === 'Levantador').length;
  };

  let targetTeamIndex = -1;

  if (isLevantador) {
    const numTeamsSoFar = Math.max(1, Math.ceil(list.length / teamCapacity));

    // 1. Look for an existing team that has space (< teamCapacity) AND 0 Levantadores
    for (let t = 0; t < numTeamsSoFar; t++) {
      const players = getTeamPlayers(t);
      if (players.length < teamCapacity && getTeamLevCount(t) === 0) {
        targetTeamIndex = t;
        break;
      }
    }

    // 2. If no existing team has 0 Levantadores and space, try to start a new team
    if (targetTeamIndex === -1) {
      if (maxWaitingTeams === 0 || numTeamsSoFar < maxWaitingTeams) {
        targetTeamIndex = numTeamsSoFar;
      }
    }

    // 3. If max teams reached, put in the team with space that has the fewest Levantadores
    if (targetTeamIndex === -1) {
      let minLevs = Infinity;
      for (let t = 0; t < numTeamsSoFar; t++) {
        const players = getTeamPlayers(t);
        if (players.length < teamCapacity) {
          const levCount = getTeamLevCount(t);
          if (levCount < minLevs) {
            minLevs = levCount;
            targetTeamIndex = t;
          }
        }
      }
    }

    if (targetTeamIndex === -1) {
      targetTeamIndex = numTeamsSoFar;
    }
  } else {
    // Non-Levantador (Atacante, etc.): fill first team with space
    const numTeamsSoFar = Math.max(1, Math.ceil(list.length / teamCapacity));
    for (let t = 0; t < numTeamsSoFar; t++) {
      const players = getTeamPlayers(t);
      if (players.length < teamCapacity) {
        targetTeamIndex = t;
        break;
      }
    }

    if (targetTeamIndex === -1) {
      targetTeamIndex = numTeamsSoFar;
    }
  }

  // Ensure list has allocated capacity up to targetTeamIndex
  const startIdx = targetTeamIndex * teamCapacity;
  while (list.length < startIdx + teamCapacity) {
    list.push(null);
  }

  // Find first null slot in targetTeamIndex's range
  let placed = false;
  for (let i = startIdx; i < startIdx + teamCapacity; i++) {
    if (!list[i]) {
      list[i] = newPlayer;
      placed = true;
      break;
    }
  }

  if (!placed) {
    list.push(newPlayer);
  }

  // Clean trailing nulls at the end of array
  while (list.length > 0 && list[list.length - 1] === null) {
    list.pop();
  }

  return list;
}

