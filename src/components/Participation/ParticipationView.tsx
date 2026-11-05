import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Copy,
  Check,
  Share2,
  Trash2,
  Edit2,
  Grid,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Phone,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Participant, AttendanceStatus, PaymentStatus, PlayerPosition, Player } from '../../types/volleyball';
import { usePlanContext } from '../../context/PlanContext';
import { addPlayerToWaitingList } from '../../utils/volleyballUtils';

// Default initial participants for demo
const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: 'Rodrigo Silva',
    number: 10,
    position: 'Levantador',
    phone: '(11) 98765-4321',
    attendance: 'confirmed',
    payment: 'paid',
    paidAmount: 15,
    notes: 'Organizador',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-2',
    name: 'Carlos Eduardo',
    number: 7,
    position: 'Ponteiro',
    phone: '(11) 97654-3210',
    attendance: 'confirmed',
    payment: 'paid',
    paidAmount: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-3',
    name: 'Ana Paula Costa',
    number: 12,
    position: 'Central',
    phone: '(11) 96543-2109',
    attendance: 'confirmed',
    payment: 'pending',
    paidAmount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-4',
    name: 'Lucas Martins',
    number: 9,
    position: 'Oposto',
    phone: '(11) 95432-1098',
    attendance: 'confirmed',
    payment: 'paid',
    paidAmount: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-5',
    name: 'Fernanda Lima',
    number: 5,
    position: 'Líbero',
    phone: '(11) 94321-0987',
    attendance: 'pending',
    payment: 'pending',
    paidAmount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-6',
    name: 'Gabriel Souza',
    number: 14,
    position: 'Ponteiro',
    phone: '(11) 93210-9876',
    attendance: 'confirmed',
    payment: 'paid',
    paidAmount: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-7',
    name: 'Beatriz Santos',
    number: 3,
    position: 'Central',
    phone: '(11) 92109-8765',
    attendance: 'waitlist',
    payment: 'pending',
    paidAmount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-8',
    name: 'Mateus Oliveira',
    number: 11,
    position: 'Levantador',
    phone: '(11) 91098-7654',
    attendance: 'absent',
    payment: 'pending',
    paidAmount: 0,
    notes: 'Avisou que vai se atrasar',
    createdAt: new Date().toISOString(),
  },
];

interface ParticipationViewProps {
  onNavigateToCourt?: () => void;
}

export const ParticipationView: React.FC<ParticipationViewProps> = ({ onNavigateToCourt }) => {
  const { planMode, isTabAllowed, isFree } = usePlanContext();
  const isLite = planMode === 'lite';

  // My Participant IDs (for Free mode self-identification "dele mesmo")
  const [myParticipantIds, setMyParticipantIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r3play_my_participant_ids');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('r3play_my_participant_ids', JSON.stringify(myParticipantIds));
  }, [myParticipantIds]);

  // Quero Jogar Modal State
  const [showQueroJogarModal, setShowQueroJogarModal] = useState<boolean>(false);
  const [qjName, setQjName] = useState<string>('');
  const [qjPhone, setQjPhone] = useState<string>('');
  const [qjPosition, setQjPosition] = useState<PlayerPosition>('Ponteiro');

  // Load participants from localStorage
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('r3play_participation_list');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading participation list', e);
      }
    }
    return INITIAL_PARTICIPANTS;
  });

  // Event config (Price per athlete & Max capacity)
  const [pricePerAthlete, setPricePerAthlete] = useState<number>(() => {
    const saved = localStorage.getItem('r3play_event_price');
    return saved ? Number(saved) : 15;
  });

  const [maxCapacity, setMaxCapacity] = useState<number>(() => {
    const saved = localStorage.getItem('r3play_event_capacity');
    return saved ? Number(saved) : 18;
  });

  // UI Filters and Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Add/Edit Form state
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPosition, setFormPosition] = useState<PlayerPosition>('Ponteiro');
  const [formAttendance, setFormAttendance] = useState<AttendanceStatus>('confirmed');
  const [formPayment, setFormPayment] = useState<PaymentStatus>('pending');
  const [formNotes, setFormNotes] = useState<string>('');

  // Batch paste state
  const [batchText, setBatchText] = useState<string>('');

  // Toast feedback
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [courtSyncSuccess, setCourtSyncSuccess] = useState<string | null>(null);

  // Sync participants & settings to localStorage
  useEffect(() => {
    localStorage.setItem('r3play_participation_list', JSON.stringify(participants));
  }, [participants]);

  // Re-sync on mount or storage event
  useEffect(() => {
    const loadParticipants = () => {
      const saved = localStorage.getItem('r3play_participation_list');
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setParticipants(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadParticipants();

    window.addEventListener('storage', loadParticipants);
    return () => window.removeEventListener('storage', loadParticipants);
  }, []);

  useEffect(() => {
    localStorage.setItem('r3play_event_price', String(pricePerAthlete));
  }, [pricePerAthlete]);

  useEffect(() => {
    localStorage.setItem('r3play_event_capacity', String(maxCapacity));
  }, [maxCapacity]);

  // Derived Statistics (Contabilização)
  const totalInscritos = participants.length;
  const totalConfirmados = participants.filter((p) => p.attendance === 'confirmed').length;
  const totalPendentes = participants.filter((p) => p.attendance === 'pending').length;
  const totalFila = participants.filter((p) => p.attendance === 'waitlist').length;
  const totalAusentes = participants.filter((p) => p.attendance === 'absent').length;

  const totalPagos = participants.filter((p) => p.payment === 'paid').length;
  const totalIsentos = participants.filter((p) => p.payment === 'exempt').length;

  const totalArrecadado = participants.reduce((sum, p) => {
    if (p.payment === 'paid') {
      return sum + (p.paidAmount !== undefined ? p.paidAmount : pricePerAthlete);
    }
    return sum;
  }, 0);

  const totalAReceber = (totalConfirmados - totalPagos - totalIsentos) * pricePerAthlete;

  // Filtered Participants List
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm)) ||
      (p.position && p.position.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAttendance =
      attendanceFilter === 'all' ? true : p.attendance === attendanceFilter;

    const matchesPayment =
      paymentFilter === 'all' ? true : p.payment === paymentFilter;

    return matchesSearch && matchesAttendance && matchesPayment;
  });

  // Toggle Attendance Status
  const handleToggleAttendance = (id: string, current: AttendanceStatus) => {
    const nextMap: Record<AttendanceStatus, AttendanceStatus> = {
      confirmed: 'pending',
      pending: 'waitlist',
      waitlist: 'absent',
      absent: 'confirmed',
    };
    const nextStatus = nextMap[current];

    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, attendance: nextStatus } : p
      )
    );
  };

  // Toggle Payment Status
  const handleTogglePayment = (id: string, current: PaymentStatus) => {
    const nextMap: Record<PaymentStatus, PaymentStatus> = {
      pending: 'paid',
      paid: 'exempt',
      exempt: 'pending',
    };
    const nextStatus = nextMap[current];
    const newAmount = nextStatus === 'paid' ? pricePerAthlete : 0;

    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, payment: nextStatus, paidAmount: newAmount } : p
      )
    );
  };

  // Add or Update Participant
  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingParticipant) {
      setParticipants(
        participants.map((p) =>
          p.id === editingParticipant.id
            ? {
                ...p,
                name: formName.trim(),
                phone: formPhone.trim(),
                position: formPosition,
                attendance: formAttendance,
                payment: formPayment,
                paidAmount: formPayment === 'paid' ? (p.paidAmount || pricePerAthlete) : 0,
                notes: formNotes.trim(),
              }
            : p
        )
      );
    } else {
      const newPart: Participant = {
        id: `part-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: formName.trim(),
        number: participants.length + 1,
        phone: formPhone.trim(),
        position: formPosition,
        attendance: formAttendance,
        payment: formPayment,
        paidAmount: formPayment === 'paid' ? pricePerAthlete : 0,
        notes: formNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      setParticipants([...participants, newPart]);
    }

    closeModal();
  };

  const openEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormName(p.name);
    setFormPhone(p.phone || '');
    setFormPosition(p.position || 'Ponteiro');
    setFormAttendance(p.attendance);
    setFormPayment(p.payment);
    setFormNotes(p.notes || '');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setEditingParticipant(null);
    setFormName('');
    setFormPhone('');
    setFormPosition(isLite ? 'Atacante' : 'Ponteiro');
    setFormAttendance('confirmed');
    setFormPayment('pending');
    setFormNotes('');
    setShowAddModal(false);
  };

  // Delete participant
  const handleDeleteParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  // Batch import from text (e.g. copied from WhatsApp group)
  const handleImportBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) return;

    const lines = batchText.split('\n');
    const newItems: Participant[] = [];

    lines.forEach((line, idx) => {
      let clean = line.trim();
      if (!clean) return;

      // Clean leading numbers or list bullets like "1. ", "1 - ", "* "
      clean = clean.replace(/^[\d\.\-\*\)]+\s*/, '').trim();
      if (!clean) return;

      // Check if line contains "(pago)" or "(confirmado)"
      const lower = clean.toLowerCase();
      const isPaid = lower.includes('pago') || lower.includes('pix') || lower.includes('paga');
      const isAbsent = lower.includes('falta') || lower.includes('ausente') || lower.includes('cancel');
      const isWait = lower.includes('fila') || lower.includes('espera');

      // Strip tags out of name
      let nameOnly = clean
        .replace(/\(pago\)/gi, '')
        .replace(/\(pix\)/gi, '')
        .replace(/\(confirmado\)/gi, '')
        .replace(/\(fila\)/gi, '')
        .trim();

      if (!nameOnly) nameOnly = clean;

      newItems.push({
        id: `batch-${Date.now()}-${idx}`,
        name: nameOnly,
        number: participants.length + idx + 1,
        position: isLite ? 'Atacante' : 'Ponteiro',
        attendance: isAbsent ? 'absent' : isWait ? 'waitlist' : 'confirmed',
        payment: isPaid ? 'paid' : 'pending',
        paidAmount: isPaid ? pricePerAthlete : 0,
        createdAt: new Date().toISOString(),
      });
    });

    if (newItems.length > 0) {
      setParticipants([...participants, ...newItems]);
      setBatchText('');
      setShowBatchModal(false);
    }
  };

  // Send confirmed participants directly to Quadra's Waiting List (r3play_waiting_list)
  const handleSendToCourtWaitingList = (specificParticipant?: Participant) => {
    const savedWaitingList = localStorage.getItem('r3play_waiting_list');
    let currentWaitingList: (Player | null)[] = [];
    if (savedWaitingList) {
      try {
        currentWaitingList = JSON.parse(savedWaitingList);
      } catch (e) {
        console.error(e);
      }
    }

    const savedCourtConfig = localStorage.getItem('r3play_match_config');
    let teamCap = 6;
    let maxWaitTeams = 0;
    if (savedCourtConfig) {
      try {
        const parsedCfg = JSON.parse(savedCourtConfig);
        if (parsedCfg.maxPlayersPerWaitingTeam) teamCap = parsedCfg.maxPlayersPerWaitingTeam;
        else if (parsedCfg.courtPlayersPerTeam) teamCap = parsedCfg.courtPlayersPerTeam;
        if (parsedCfg.maxWaitingTeams) maxWaitTeams = parsedCfg.maxWaitingTeams;
      } catch (e) {}
    }

    const targets = specificParticipant
      ? [specificParticipant]
      : participants.filter((p) => p.attendance === 'confirmed');

    if (targets.length === 0) {
      setCourtSyncSuccess('⚠️ Nenhum participante confirmado encontrado para enviar à fila da quadra.');
      setTimeout(() => setCourtSyncSuccess(null), 4000);
      return;
    }

    let addedCount = 0;
    let updatedWaitingList = [...currentWaitingList];

    targets.forEach((p) => {
      const activePlayers = updatedWaitingList.filter((w): w is Player => w !== null && w !== undefined);
      const alreadyInList = activePlayers.some(
        (w) => w.name.toLowerCase().trim() === p.name.toLowerCase().trim()
      );
      if (!alreadyInList) {
        const newP: Player = {
          id: `wait-sync-${p.id}-${Date.now()}`,
          name: p.name,
          number: p.number || activePlayers.length + 1,
          position: p.position || (isLite ? 'Atacante' : 'Ponteiro'),
        };
        updatedWaitingList = addPlayerToWaitingList(updatedWaitingList, newP, teamCap, maxWaitTeams);
        addedCount++;
      }
    });

    localStorage.setItem('r3play_waiting_list', JSON.stringify(updatedWaitingList));

    const msg = addedCount > 0
      ? `✅ ${addedCount} participante(s) enviado(s) para a Fila da Quadra com sucesso!`
      : `ℹ️ Todos os participantes confirmados já estavam na Fila da Quadra.`;

    setCourtSyncSuccess(msg);
    setTimeout(() => setCourtSyncSuccess(null), 4000);
  };

  // Copy WhatsApp formatted report
  const handleCopyWhatsAppReport = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    let report = `📋 *LISTA DE PARTICIPAÇÃO - VÔLEI R3PLAY*\n`;
    report += `🗓️ *Data:* ${todayStr}\n`;
    report += `💰 *Valor por Atleta:* R$ ${pricePerAthlete.toFixed(2).replace('.', ',')}\n`;
    report += `👥 *Vagas:* ${totalConfirmados}/${maxCapacity > 0 ? maxCapacity : 'Ilimitado'}\n\n`;

    const confirmados = participants.filter((p) => p.attendance === 'confirmed');
    report += `✅ *CONFIRMADOS (${confirmados.length}):*\n`;
    confirmados.forEach((p, idx) => {
      const payIcon = p.payment === 'paid' ? '💵 Pago' : p.payment === 'exempt' ? '🎁 Isento' : '⏳ A Pagar';
      report += `${idx + 1}. ${p.name} (${p.position || 'Geral'}) - ${payIcon}\n`;
    });

    const pendentes = participants.filter((p) => p.attendance === 'pending' || p.attendance === 'waitlist');
    if (pendentes.length > 0) {
      report += `\n⏳ *PENDENTES / FILA DE ESPERA (${pendentes.length}):*\n`;
      pendentes.forEach((p, idx) => {
        report += `${idx + 1}. ${p.name} (${p.attendance === 'waitlist' ? 'Na Fila' : 'Aguardando'})\n`;
      });
    }

    report += `\n📊 *RESUMO:* Total Pago: R$ ${totalArrecadado.toFixed(2).replace('.', ',')} | A Receber: R$ ${totalAReceber > 0 ? totalAReceber.toFixed(2).replace('.', ',') : '0,00'}\n`;
    report += `\n🏐 *R3Play - Organização de Vôlei*`;

    navigator.clipboard.writeText(report);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Random test names pool
  const RANDOM_NAMES = [
    'Gabi Guimarães', 'Bruninho Rezende', 'Thaisa Daher', 'Wallace de Souza',
    'Yoandy Leal', 'Carol Ana', 'Fabiana Claudino', 'Douglas Souza',
    'Rosamaria Montibeller', 'Maurício Borges', 'Jaqueline Carvalho', 'Serginho Escadinha',
    'Felipe Roque', 'Maique Nascimento', 'Natinha Araujo', 'Alan Souza',
    'Honorato Henrique', 'Darlan Souza', 'Kisy Nascimento', 'Julia Bergmann'
  ];

  const POSITIONS: PlayerPosition[] = isLite
    ? ['Atacante', 'Levantador']
    : ['Ponteiro', 'Levantador', 'Central', 'Oposto', 'Líbero'];

  // Test 1: Generate random participants respecting maxCapacity
  const handleGenerateRandomParticipants = () => {
    const currentCount = participants.length;
    const targetCount = maxCapacity > 0 ? maxCapacity : currentCount + 6;
    const availableSlots = targetCount - currentCount;

    if (maxCapacity > 0 && availableSlots <= 0) {
      setCourtSyncSuccess(`⚠️ A capacidade máxima de ${maxCapacity} participantes já foi atingida!`);
      setTimeout(() => setCourtSyncSuccess(null), 4000);
      return;
    }

    const countToAdd = Math.min(availableSlots, 6);
    const newParticipants: Participant[] = [];

    const existingNames = new Set(participants.map((p) => p.name.toLowerCase()));
    const availableNames = RANDOM_NAMES.filter((n) => !existingNames.has(n.toLowerCase()));

    for (let i = 0; i < countToAdd; i++) {
      const name = availableNames.length > 0
        ? availableNames.splice(Math.floor(Math.random() * availableNames.length), 1)[0]
        : `Atleta Teste ${currentCount + i + 1}`;

      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
      const isPaid = Math.random() > 0.3; // 70% chance of paid
      const ddd = 11;
      const phoneNum = `(${ddd}) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

      newParticipants.push({
        id: `rand-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        name,
        number: currentCount + i + 1,
        position: pos,
        phone: phoneNum,
        attendance: 'confirmed',
        payment: isPaid ? 'paid' : 'pending',
        paidAmount: isPaid ? pricePerAthlete : 0,
        createdAt: new Date().toISOString(),
      });
    }

    setParticipants((prev) => [...prev, ...newParticipants]);
    setCourtSyncSuccess(`✨ ${newParticipants.length} participante(s) aleatório(s) inscrito(s) com sucesso!`);
    setTimeout(() => setCourtSyncSuccess(null), 4000);
  };

  // Test 2: Reset all participants & court lists
  const handleResetAllLists = () => {
    setShowResetModal(true);
  };

  // Execute reset action when confirmed in modal
  const executeResetAllLists = () => {
    setParticipants([]);
    localStorage.setItem('r3play_participation_list', JSON.stringify([]));
    localStorage.setItem('r3play_waiting_list', JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));

    setCourtSyncSuccess('🗑️ Todas as listas de participantes e fila da quadra foram zeradas com sucesso!');
    setTimeout(() => setCourtSyncSuccess(null), 4000);
    setShowResetModal(false);
  };

  // Reset list only
  const handleResetList = () => {
    setShowResetModal(true);
  };

  // Handler for Quero Jogar submission (Free mode self registration)
  const handleQueroJogarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qjName.trim()) return;

    const isWaitlist = maxCapacity > 0 && totalConfirmados >= maxCapacity;
    const newPartId = `qj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newPart: Participant = {
      id: newPartId,
      name: qjName.trim(),
      number: participants.length + 1,
      phone: qjPhone.trim(),
      position: qjPosition,
      attendance: isWaitlist ? 'waitlist' : 'confirmed',
      payment: 'pending',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };

    setParticipants((prev) => [...prev, newPart]);
    setMyParticipantIds((prev) => [...prev, newPartId]);

    setCourtSyncSuccess(
      isWaitlist
        ? `🕒 Vagas esgotadas! ${qjName.trim()} foi adicionado(a) à Fila de Espera.`
        : `✨ ${qjName.trim()} foi inscrito(a) com sucesso na lista de presença!`
    );
    setTimeout(() => setCourtSyncSuccess(null), 4000);

    setQjName('');
    setQjPhone('');
    setQjPosition(isLite ? 'Atacante' : 'Ponteiro');
    setShowQueroJogarModal(false);
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-400" />
              Gestão de Presença & Pelada
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
              Disponível Modo {planMode.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Lista de Participação & Contabilização
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie chamadas, confirme quem pagou a quadra e envie os atletas diretamente para a Fila da Quadra.
          </p>
        </div>

        {/* Header Config Quick Inputs */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          {!isFree && (
            <>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400">R$/Atleta:</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={pricePerAthlete}
                  onChange={(e) => setPricePerAthlete(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-black text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            </>
          )}

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-400">Vagas Totais:</span>
            {isFree ? (
              <span className="text-xs font-black text-white bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
                {maxCapacity > 0 ? `${maxCapacity}` : 'Ilimitado'}
              </span>
            ) : (
              <input
                type="number"
                min={0}
                step={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-black text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Sync Success Feedback Toast */}
      {courtSyncSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <span>{courtSyncSuccess}</span>
          {onNavigateToCourt && isTabAllowed('court') && (
            <button
              onClick={onNavigateToCourt}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <Grid className="w-3 h-3" /> Ver Quadra
            </button>
          )}
        </div>
      )}

      {/* KPI Cards / Contabilizador */}
      <div className={`grid gap-3 ${isFree ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {/* Total Confirmados */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Confirmados</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalConfirmados}</span>
            <span className="text-[10px] text-slate-400">
              {maxCapacity > 0 ? `/ ${maxCapacity} Vagas` : 'sem limite'}
            </span>
          </div>
          {maxCapacity > 0 && (
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalConfirmados / maxCapacity) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Pendentes / Fila */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Aguardando / Fila</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalPendentes + totalFila}</span>
            <span className="text-[10px] text-amber-300">{totalFila} na Fila</span>
          </div>
        </div>

        {!isFree && (
          <>
            {/* Total Arrecadado */}
            <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Arrecadado</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white">
                  R$ {totalArrecadado.toFixed(2).replace('.', ',')}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{totalPagos} pagos • {totalIsentos} isentos</p>
              </div>
            </div>

            {/* A Receber */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">A Receber</span>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white">
                  R$ {totalAReceber > 0 ? totalAReceber.toFixed(2).replace('.', ',') : '0,00'}
                </span>
                <p className="text-[10px] text-rose-300 mt-0.5">
                  {Math.max(0, totalConfirmados - totalPagos - totalIsentos)} atletas pendentes
                </p>
              </div>
            </div>
          </>
        )}

        {/* Total Inscritos */}
        <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between ${isFree ? '' : 'col-span-2 sm:col-span-1'}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Inscritos</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{totalInscritos}</span>
            <span className="text-[10px] text-slate-400">{totalAusentes} faltas</span>
          </div>
        </div>
      </div>

      {/* Test Buttons Toolbar */}
      {!isFree && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-[10px] uppercase border border-purple-500/40 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Modo Teste & Atalhos
            </span>
            <p className="text-xs text-slate-400 hidden sm:block">
              Simule inscrições em lote para testar o sistema rapidamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Button 1: Inscrever Nomes Aleatórios */}
            <button
              onClick={handleGenerateRandomParticipants}
              className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Adiciona atletas aleatórios respeitando a quantidade total de vagas"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Inscrever Nomes Aleatoriamente
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        {isFree ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQjName('');
                  setQjPhone('');
                  setQjPosition(isLite ? 'Atacante' : 'Ponteiro');
                  setShowQueroJogarModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <UserCheck className="w-5 h-5 text-slate-950" />
                🏐 Quero Jogar!
              </button>
              <p className="text-xs text-slate-400 hidden sm:block">
                Inscreva-se na lista da pelada com seu nome e posição.
              </p>
            </div>

            {myParticipantIds.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Você possui {myParticipantIds.length} inscrição(ões) nesta lista
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {/* Add Single Participant */}
              <button
                onClick={() => {
                  setEditingParticipant(null);
                  setFormName('');
                  setFormPhone('');
                  setFormPosition(isLite ? 'Atacante' : 'Ponteiro');
                  setFormAttendance('confirmed');
                  setFormPayment('pending');
                  setFormNotes('');
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                + Adicionar Participante
              </button>

              {/* Import Batch */}
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Importar Lista (WhatsApp)
              </button>

              {/* Send to Court */}
              <button
                onClick={() => handleSendToCourtWaitingList()}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                title="Envia todos os participantes confirmados diretamente para a fila de espera da quadra"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                Enviar Confirmados p/ Quadra
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy WhatsApp Report */}
              <button
                onClick={handleCopyWhatsAppReport}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copySuccess
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copySuccess ? 'Copiado para o WhatsApp!' : 'Copiar Relatório WhatsApp'}
              </button>

              {/* Reset All Lists */}
              <button
                onClick={handleResetAllLists}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                title="Zerar lista de participantes e fila da quadra"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Zerar Todas as Listas
              </button>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou posição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
            <span className="text-slate-500 text-[10px] uppercase mr-1">Filtro:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'confirmed', label: 'Confirmados ✅' },
              { id: 'pending', label: 'Pendentes ⏳' },
              { id: 'waitlist', label: 'Fila de Espera 🕒' },
              { id: 'absent', label: 'Ausentes ❌' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setAttendanceFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  attendanceFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Payment Filter */}
        {!isFree && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 font-bold">Pagamento:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'paid', label: 'Pago 💵' },
              { id: 'pending', label: 'A Pagar ⏳' },
              { id: 'exempt', label: 'Isento 🎁' },
            ].map((pf) => (
              <button
                key={pf.id}
                onClick={() => setPaymentFilter(pf.id)}
                className={`px-2 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  paymentFilter === pf.id
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Participants Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredParticipants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">
              Nenhum participante encontrado na lista.
            </p>
            <p className="text-xs text-slate-500">
              Adicione individualmente ou cole a lista recebida no WhatsApp.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4"># / Atleta</th>
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Status Presença</th>
                  {!isFree && <th className="py-3 px-4">Pagamento</th>}
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredParticipants.map((p, idx) => {
                  const isMyEntry = myParticipantIds.includes(p.id);

                  const attendanceBadgeMap = {
                    confirmed: { label: 'Confirmado', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
                    pending: { label: 'Pendente', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Clock },
                    waitlist: { label: 'Fila de Espera', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Clock },
                    absent: { label: 'Ausente', bg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: XCircle },
                  };

                  const paymentBadgeMap = {
                    paid: { label: `Pago (R$ ${p.paidAmount || pricePerAthlete})`, bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: DollarSign },
                    pending: { label: `A Pagar (R$ ${pricePerAthlete})`, bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Clock },
                    exempt: { label: 'Isento', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: Sparkles },
                  };

                  const attConfig = attendanceBadgeMap[p.attendance] || attendanceBadgeMap.pending;
                  const payConfig = paymentBadgeMap[p.payment] || paymentBadgeMap.pending;

                  const AttIcon = attConfig.icon;
                  const PayIcon = payConfig.icon;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${
                            isMyEntry
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-blue-400'
                          }`}>
                            {p.number || idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white flex items-center gap-1.5">
                              {p.name}
                              {isMyEntry && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/40">
                                  Você
                                </span>
                              )}
                              {p.notes && (
                                <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded" title={p.notes}>
                                  📝
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                          {p.position || 'Ponteiro'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-slate-400">
                        {p.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{p.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Attendance Toggle */}
                      <td className="py-3 px-4">
                        {isFree && !isMyEntry ? (
                          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${attConfig.bg}`}>
                            <AttIcon className="w-3.5 h-3.5" />
                            {attConfig.label}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleAttendance(p.id, p.attendance)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${attConfig.bg}`}
                            title="Clique para alterar status de presença"
                          >
                            <AttIcon className="w-3.5 h-3.5" />
                            {attConfig.label}
                          </button>
                        )}
                      </td>

                      {/* Payment Toggle */}
                      {!isFree && (
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePayment(p.id, p.payment)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${payConfig.bg}`}
                            title="Clique para alterar status de pagamento"
                          >
                            <PayIcon className="w-3.5 h-3.5" />
                            {payConfig.label}
                          </button>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isFree ? (
                          isMyEntry ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2"
                                title="Editar minha inscrição"
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2"
                                title="Cancelar minha inscrição"
                              >
                                <Trash2 className="w-3 h-3" /> Sair
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold italic">Inscrito</span>
                          )
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Send to Court */}
                            <button
                              onClick={() => handleSendToCourtWaitingList(p)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                              title="Enviar este atleta para a Fila da Quadra"
                            >
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                              title="Editar Atleta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
                              title="Remover Atleta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Add or Edit Participant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                {editingParticipant ? 'Editar Participante' : 'Novo Participante'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nome do Atleta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Posição
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value as PlayerPosition)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isLite ? (
                      <>
                        <option value="Atacante">Atacante</option>
                        <option value="Levantador">Levantador</option>
                      </>
                    ) : (
                      <>
                        <option value="Ponteiro">Ponteiro</option>
                        <option value="Levantador">Levantador</option>
                        <option value="Central">Central</option>
                        <option value="Oposto">Oposto</option>
                        <option value="Líbero">Líbero</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Status Presença
                  </label>
                  <select
                    value={formAttendance}
                    onChange={(e) => setFormAttendance(e.target.value as AttendanceStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="confirmed">Confirmado ✅</option>
                    <option value="pending">Pendente ⏳</option>
                    <option value="waitlist">Fila de Espera 🕒</option>
                    <option value="absent">Ausente ❌</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Pagamento
                  </label>
                  <select
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value as PaymentStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="paid">Pago 💵</option>
                    <option value="pending">A Pagar ⏳</option>
                    <option value="exempt">Isento 🎁</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paga no PIX, chega às 19:30"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Import from WhatsApp */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Importar Lista do WhatsApp
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Cole abaixo a lista de nomes do grupo de WhatsApp (um nome por linha). O sistema irá extrair os atletas automaticamente!
            </p>

            <form onSubmit={handleImportBatch} className="space-y-4">
              <textarea
                rows={8}
                placeholder={`Cole a lista aqui. Exemplo:\n1. Rodrigo Silva\n2. Carlos Eduardo (pago)\n3. Ana Paula\n4. Lucas`}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Dica: Se contiver &quot;(pago)&quot; na linha, o pagamento já vem marcado.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30"
                  >
                    Processar Lista
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Zerar Listas do Evento
              </h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300">
              Tem certeza de que deseja zerar a <strong className="text-white">Lista de Participantes</strong> e a <strong className="text-white">Fila da Quadra</strong>?
            </p>
            <p className="text-xs text-slate-400">
              Esta ação removerá todos os inscritos, zerando as estatísticas financeiras (valores pagos/a receber) e limpando a fila de espera para um novo jogo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeResetAllLists}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sim, Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Quero Jogar Modal (Free Mode) */}
      {showQueroJogarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Quero Jogar! - Inscrição Rápida
              </h3>
              <button
                type="button"
                onClick={() => setShowQueroJogarModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Preencha seus dados abaixo para se inscrever diretamente na lista de presença do evento.
            </p>

            <form onSubmit={handleQueroJogarSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={qjName}
                  onChange={(e) => setQjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-8888"
                  value={qjPhone}
                  onChange={(e) => setQjPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Posição Preferida
                </label>
                <select
                  value={qjPosition}
                  onChange={(e) => setQjPosition(e.target.value as PlayerPosition)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Ponteiro">Ponteiro(a)</option>
                  <option value="Levantador">Levantador(a)</option>
                  <option value="Central">Central</option>
                  <option value="Oposto">Oposto(a)</option>
                  <option value="Líbero">Líbero</option>
                  <option value="Atacante">Atacante Geral</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQueroJogarModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Confirmar Inscrição 🏐
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
