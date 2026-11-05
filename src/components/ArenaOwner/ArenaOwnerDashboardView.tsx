import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Tv,
  Radio,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Key,
  Plus,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useArenaAuth } from '../../context/ArenaAuthContext';

interface Organizer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  canUseStreamOverlay: boolean;
  isActive: boolean;
  createdAt: string;
}

interface StreamLicenseStatus {
  tenantHasStreamLicense: boolean;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
}

interface OwnerOverview {
  arena: {
    id: string;
    name: string;
    subdomain: string;
    planMode: string;
    hasStreamAddon: boolean;
    licenseStatus: string;
  };
  streamLicense: StreamLicenseStatus;
  totalOrganizers: number;
  totalPeladas: number;
  organizers: Organizer[];
}

export const ArenaOwnerDashboardView: React.FC = () => {
  const { tenant } = useTenant();
  const { token, user, openLoginModal, isAuthenticated } = useArenaAuth();

  const [overview, setOverview] = useState<OwnerOverview | null>(null);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form de Novo Organizador
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgPassword, setOrgPassword] = useState('Organizador2025!');
  const [orgAllowStream, setOrgAllowStream] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega Visão Geral do Dono da Arena
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/owner/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOverview(data.data);
        setOrganizers(data.data.organizers || []);
      } else {
        setErrorMessage(data.error || 'Erro ao carregar dados da arena.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOverview();
    }
  }, [token, tenant.id]);

  // Toggle do Overlay de Transmissão (OBS) para um organizador parceiro
  const handleToggleStreamPermission = async (organizerId: string, currentStatus: boolean) => {
    const targetStatus = !currentStatus;

    try {
      const res = await fetch(`/api/owner/organizers/${organizerId}/stream-permission`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({ canUseStreamOverlay: targetStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(''), 4000);
        await fetchOverview();
      } else {
        alert(data.error || 'Não foi possível alterar a permissão de transmissão.');
      }
    } catch (err) {
      console.error('Erro ao alternar permissão:', err);
    }
  };

  // Cadastro de Novo Organizador vinculado ao Tenant
  const handleCreateOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgEmail.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/owner/organizers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          name: orgName.trim(),
          email: orgEmail.trim(),
          phone: orgPhone.trim(),
          password: orgPassword.trim(),
          canUseStreamOverlay: orgAllowStream,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Organizador ${orgName} cadastrado com sucesso!`);
        setIsFormOpen(false);
        setOrgName('');
        setOrgEmail('');
        setOrgPhone('');
        setOrgAllowStream(false);
        setTimeout(() => setToastMessage(''), 4000);
        await fetchOverview();
      } else {
        setErrorMessage(data.error || 'Erro ao cadastrar organizador.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-white">Painel do Dono da Arena</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Área de parcerias e subvenda. Gerencie os organizadores das suas quadras e controle a distribuição de licenças de Transmissão (OBS).
          </p>
        </div>
        <button
          type="button"
          onClick={() => openLoginModal('OWNER')}
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
        >
          Entrar como Dono da Arena
        </button>
      </div>
    );
  }

  const stream = overview?.streamLicense;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm font-semibold">{toastMessage}</div>
        </div>
      )}

      {/* Top Banner da Arena */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              🏟️ Painel de Parcerias & Subvenda
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
              Subdomínio: {tenant.subdomain}.r3play.com.br
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão de Organizadores & Licenças OBS
          </h1>
          <p className="text-xs text-slate-400">
            Dono da Arena: <strong className="text-slate-200">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Organizador</span>
        </button>
      </div>

      {/* CARDS DE LICENÇAS E SUBVENDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Status do Plano da Arena */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Plano Comercial da Arena
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
              {tenant.planMode}
            </span>
          </div>
          <div className="text-2xl font-black text-white">{tenant.name}</div>
          <div className="text-xs text-slate-400">
            Status da Licença Master: <strong className="text-emerald-400">Ativa & Vitalícia</strong>
          </div>
        </div>

        {/* Card 2: Módulo de Transmissão (Overlay OBS) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Módulo Overlay OBS
            </span>
            <Tv className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {stream?.usedSlots || 0}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              / {stream?.totalSlots || 0} licenças em uso
            </span>
          </div>

          <div className="text-xs text-slate-400">
            {stream?.tenantHasStreamLicense ? (
              <span className="text-emerald-400 font-semibold">
                ✓ Pacote de Transmissão Contratado ({stream.availableSlots} vagas restantes)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">
                ⚠️ Transmissão não inclusa no plano básico
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Total de Organizadores Parceiros */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Organizadores Ativos
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>

          <div className="text-3xl font-black text-white">
            {organizers.length}
          </div>

          <div className="text-xs text-slate-400">
            Peladas registradas nas quadras: <strong className="text-white">{overview?.totalPeladas || 0}</strong>
          </div>
        </div>
      </div>

      {/* TABELA / CARDS DE GESTÃO DE ORGANIZADORES */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <Users className="w-5 h-5 text-amber-400" />
              Organizadores Parceiros Vinculados à Arena
            </h2>
            <p className="text-xs text-slate-400">
              Controle quem pode abrir listas e ative/desative a licença de Transmissão (Overlay OBS) individualmente.
            </p>
          </div>

          <div className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            Tenant ID: {tenant.id.slice(0, 8)}...
          </div>
        </div>

        {/* Grade de Organizadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {organizers.map((org) => (
            <div
              key={org.id}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{org.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      Organizador
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{org.email}</span>
                  </div>
                  {org.phone && (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{org.phone}</span>
                    </div>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Ativo
                </span>
              </div>

              {/* TOGGLE VISUAL: OVERLAY DE TRANSMISSÃO (OBS) */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-indigo-400" />
                    Overlay de Transmissão (OBS)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {org.canUseStreamOverlay
                      ? 'Licença ativa: placar compatível com OBS Studio'
                      : 'Sem acesso ao overlay de stream'}
                  </div>
                </div>

                {/* Botão de Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleStreamPermission(org.id, org.canUseStreamOverlay)}
                  className={`p-1 rounded-full transition-all cursor-pointer flex items-center ${
                    org.canUseStreamOverlay
                      ? 'bg-indigo-600 text-white pl-3 pr-1.5'
                      : 'bg-slate-800 text-slate-400 pl-1.5 pr-3'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase mr-1.5">
                    {org.canUseStreamOverlay ? 'ON' : 'OFF'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all shadow-md ${
                      org.canUseStreamOverlay ? 'translate-x-0' : '-translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}

          {organizers.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 text-xs">
              Nenhum organizador cadastrado ainda. Clique em "Cadastrar Novo Organizador" acima.
            </div>
          )}
        </div>
      </div>

      {/* MODAL / FORMULÁRIO DE CADASTRO DE NOVO ORGANIZADOR */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 text-slate-100">
            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-white">Novo Organizador Parceiro</h3>
              <p className="text-xs text-slate-400">
                Gere o acesso do organizador vinculado exclusivamente à arena {tenant.name}.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateOrganizer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="ex: Gabriel Nogueira"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="ex: gabriel@arena.com.br"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  WhatsApp / Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  Senha Inicial Provisória
                </label>
                <input
                  type="text"
                  value={orgPassword}
                  onChange={(e) => setOrgPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Checkbox de Licença OBS */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgAllowStream}
                    onChange={(e) => setOrgAllowStream(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Liberar Licença de Overlay de Transmissão (OBS)</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6">
                  {stream?.tenantHasStreamLicense
                    ? `Sua arena possui ${stream.availableSlots} licenças OBS disponíveis para delegar.`
                    : 'Aviso: Sua arena precisará ter o Módulo Stream contratado para que o organizador utilize.'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Criar Organizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
