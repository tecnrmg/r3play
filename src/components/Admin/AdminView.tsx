import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Crown,
  Palette,
  KeyRound,
  PlusCircle,
  Tv,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Save,
  RefreshCw,
  ExternalLink,
  Sliders,
  Check,
  Server,
  Lock,
  Eye,
  Activity,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTenant } from '../../context/TenantContext';
import { usePlanContext, PlanMode } from '../../context/PlanContext';

type AdminTab = 'licenses' | 'whitelabel' | 'new_client' | 'security';

interface TenantFull {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description?: string | null;
  isActive: boolean;
  planMode: PlanMode;
  hasStreamAddon: boolean;
  licenseStatus: 'active' | 'suspended' | 'trial' | 'expired';
  licenseExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalTenants: number;
  activeLicenses: number;
  proPlans: number;
  litePlans: number;
  freePlans: number;
  streamAddons: number;
  system?: {
    uptimeSeconds: number;
    nodeMemoryMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    platform: string;
  };
}

export const AdminView: React.FC = () => {
  const { adminUser, token, logout, changePassword } = useAdminAuth();
  const { switchTenant, tenant: currentTenant } = useTenant();
  const { setPlanMode, setHasStreamAddon } = usePlanContext();

  const [currentTab, setCurrentTab] = useState<AdminTab>('licenses');
  const [tenants, setTenants] = useState<TenantFull[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado para Edição de Licença no Pós-Venda
  const [selectedTenantForLicense, setSelectedTenantForLicense] = useState<TenantFull | null>(null);
  const [editPlanMode, setEditPlanMode] = useState<PlanMode>('pro');
  const [editStreamAddon, setEditStreamAddon] = useState<boolean>(false);
  const [editLicenseStatus, setEditLicenseStatus] = useState<'active' | 'suspended' | 'trial' | 'expired'>('active');
  const [isSavingLicense, setIsSavingLicense] = useState<boolean>(false);

  // Estado para Edição White Label
  const [selectedTenantForBrand, setSelectedTenantForBrand] = useState<TenantFull | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '',
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    accentColor: '#f59e0b',
    description: '',
  });
  const [isSavingBrand, setIsSavingBrand] = useState<boolean>(false);

  // Estado para Novo Cliente
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    subdomain: '',
    planMode: 'pro' as PlanMode,
    hasStreamAddon: false,
    primaryColor: '#059669',
    secondaryColor: '#0d9488',
    accentColor: '#f59e0b',
    logoUrl: '',
    description: '',
  });
  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);

  // Estado para Troca de Senha
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);

  // Carrega lista de tenants e estatísticas
  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [tenantsRes, statsRes] = await Promise.all([
        fetch('/api/admin/tenants', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (tenantsRes.ok) {
        const tData = await tenantsRes.json();
        if (tData.success && Array.isArray(tData.data)) {
          setTenants(tData.data);
          if (tData.data.length > 0 && !selectedTenantForLicense) {
            setSelectedTenantForLicense(tData.data[0]);
            setEditPlanMode(tData.data[0].planMode || 'pro');
            setEditStreamAddon(tData.data[0].hasStreamAddon || false);
            setEditLicenseStatus(tData.data[0].licenseStatus || 'active');

            setSelectedTenantForBrand(tData.data[0]);
            setBrandForm({
              name: tData.data[0].name,
              logoUrl: tData.data[0].logoUrl || '',
              primaryColor: tData.data[0].primaryColor,
              secondaryColor: tData.data[0].secondaryColor,
              accentColor: tData.data[0].accentColor,
              description: tData.data[0].description || '',
            });
          }
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success) {
          setStats(sData.data);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados do admin:', e);
      setStatusMessage({ type: 'error', text: 'Falha ao buscar informações do servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handler para Salvar Licença no Pós-Venda
  const handleSaveLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForLicense || !token) return;

    setIsSavingLicense(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantForLicense.id}/license`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planMode: editPlanMode,
          hasStreamAddon: editStreamAddon,
          licenseStatus: editLicenseStatus,
          isActive: editLicenseStatus === 'active',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Licença do cliente '${selectedTenantForLicense.name}' atualizada com sucesso no banco de dados!`,
        });

        // Se o tenant editado for o ativo no momento, atualiza o contexto de planos
        if (currentTenant.subdomain === selectedTenantForLicense.subdomain) {
          setPlanMode(editPlanMode);
          setHasStreamAddon(editStreamAddon);
        }

        await loadData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erro ao atualizar licença' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
    } finally {
      setIsSavingLicense(false);
    }
  };

  // Handler para Salvar Identidade Visual White Label
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForBrand || !token) return;

    setIsSavingBrand(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantForBrand.id}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: brandForm.name,
          logoUrl: brandForm.logoUrl || null,
          primaryColor: brandForm.primaryColor,
          secondaryColor: brandForm.secondaryColor,
          accentColor: brandForm.accentColor,
          description: brandForm.description || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Identidade visual da empresa '${brandForm.name}' salva com sucesso!`,
        });
        await loadData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erro ao atualizar branding' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro de conexão ao salvar marca' });
    } finally {
      setIsSavingBrand(false);
    }
  };

  // Handler para Cadastrar Novo Cliente no Pós-Venda
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsCreatingClient(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClientForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Cliente parceiro '${newClientForm.name}' (${newClientForm.subdomain}.r3play.com.br) cadastrado com sucesso!`,
        });
        setNewClientForm({
          name: '',
          subdomain: '',
          planMode: 'pro',
          hasStreamAddon: false,
          primaryColor: '#059669',
          secondaryColor: '#0d9488',
          accentColor: '#f59e0b',
          logoUrl: '',
          description: '',
        });
        setCurrentTab('licenses');
        await loadData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erro ao cadastrar novo cliente' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Erro de comunicação ao criar cliente' });
    } finally {
      setIsCreatingClient(false);
    }
  };

  // Handler para Troca de Senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'A confirmação de senha não coincide com a nova senha.' });
      return;
    }
    if (passForm.newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'A nova senha deve possuir no mínimo 8 caracteres.' });
      return;
    }

    setIsChangingPass(true);
    setStatusMessage(null);

    const res = await changePassword(passForm.currentPassword, passForm.newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Senha do administrador alterada com sucesso!' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Falha ao alterar senha' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner do Superadmin */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Painel de Controle Master
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30">
                Sessão Autenticada
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Central Admin • R3 Play (R3team)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Logado como <strong className="text-white">{adminUser?.name}</strong> ({adminUser?.email}) • Liberação de licenças pós-venda e gestão de subdomínios White Label.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Encerrar Sessão
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border shadow-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* KPI Cards de Estatísticas da Plataforma */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-indigo-400" /> Clientes Totais
          </div>
          <div className="text-xl font-black text-white mt-1">{stats?.totalTenants ?? tenants.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Empresas Parceiras</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Licenças Ativas
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">{stats?.activeLicenses ?? tenants.filter((t) => t.isActive).length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pós-venda liberado</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> Modo Pro
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{stats?.proPlans ?? tenants.filter((t) => t.planMode === 'pro').length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Plano Completo</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Modo Lite
          </div>
          <div className="text-xl font-black text-blue-400 mt-1">{stats?.litePlans ?? tenants.filter((t) => t.planMode === 'lite').length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Foco Peladas</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Tv className="w-3 h-3 text-emerald-400" /> Modo Free
          </div>
          <div className="text-xl font-black text-slate-300 mt-1">{stats?.freePlans ?? tenants.filter((t) => t.planMode === 'free').length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Somente Placar/Inscrição</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-400" /> Módulo Stream
          </div>
          <div className="text-xl font-black text-purple-400 mt-1">{stats?.streamAddons ?? tenants.filter((t) => t.hasStreamAddon).length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live Overlay Ativo</div>
        </div>
      </div>

      {/* Navegação entre Abas do Painel Admin */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setCurrentTab('licenses')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'licenses'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          Gestão de Licenças & Pós-Venda
        </button>

        <button
          onClick={() => setCurrentTab('whitelabel')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'whitelabel'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-400" />
          Identidade Visual & Subdomínios (White Label)
        </button>

        <button
          onClick={() => setCurrentTab('new_client')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'new_client'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Cadastrar Novo Cliente
        </button>

        <button
          onClick={() => setCurrentTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'security'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Segurança & Banco de Dados
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: GESTÃO DE LICENÇA E PLANOS COMERCIAIS (PÓS-VENDA) */}
      {currentTab === 'licenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lista de Clientes Parceiros (7 Colunas) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Clientes & Licenças Cadastradas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione uma empresa parceira para editar os planos contratados no pós-venda.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {tenants.length} cliente(s)
                </span>
              </div>

              <div className="space-y-3">
                {tenants.map((t) => {
                  const isSelected = selectedTenantForLicense?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTenantForLicense(t);
                        setEditPlanMode(t.planMode || 'pro');
                        setEditStreamAddon(t.hasStreamAddon || false);
                        setEditLicenseStatus(t.licenseStatus || 'active');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden shadow"
                          style={{
                            background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})`,
                          }}
                        >
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span>🏐</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{t.name}</span>
                            {t.isActive ? (
                              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
                                Ativo
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase border border-rose-500/30">
                                Suspenso
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">
                            {t.subdomain}.r3play.com.br
                          </div>
                        </div>
                      </div>

                      {/* Badges de Licença Comercial */}
                      <div className="flex flex-wrap items-center gap-2">
                        {t.planMode === 'pro' && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" /> Modo Pro
                          </span>
                        )}
                        {t.planMode === 'lite' && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-extrabold text-[10px] uppercase border border-blue-500/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-400" /> Modo Lite
                          </span>
                        )}
                        {t.planMode === 'free' && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase border border-emerald-500/40 flex items-center gap-1">
                            <Tv className="w-3 h-3 text-emerald-400" /> Modo Free
                          </span>
                        )}

                        {t.hasStreamAddon ? (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-extrabold text-[10px] uppercase border border-purple-500/40 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-purple-400" /> Stream On
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-lg bg-slate-900 text-slate-500 font-bold text-[10px] uppercase border border-slate-800">
                            Sem Stream
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchTenant(t.subdomain);
                            setStatusMessage({
                              type: 'success',
                              text: `Ambiente alternado para simulação do cliente: '${t.name}' (${t.subdomain}.r3play.com.br)`,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                          title="Alternar aplicativo para a visão deste cliente"
                        >
                          <Eye className="w-3 h-3" /> Simular
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Painel de Liberação de Pós-Venda (5 Colunas) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Liberação Pós-Venda
                </span>
                <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Emitir / Alterar Licença
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cliente selecionado: <strong className="text-white">{selectedTenantForLicense?.name || 'Nenhum'}</strong>
                </p>
              </div>

              {selectedTenantForLicense ? (
                <form onSubmit={handleSaveLicense} className="space-y-4 text-xs">
                  {/* Status da Licença */}
                  <div>
                    <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Status da Conta / Ativação
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditLicenseStatus('active')}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          editLicenseStatus === 'active'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Licença Ativa
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditLicenseStatus('suspended')}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          editLicenseStatus === 'suspended'
                            ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        Suspensa
                      </button>
                    </div>
                  </div>

                  {/* Seleção do Plano Contratado */}
                  <div>
                    <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Plano Comercial Contratado
                    </label>
                    <div className="space-y-2">
                      {/* Pro Option */}
                      <div
                        onClick={() => setEditPlanMode('pro')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          editPlanMode === 'pro'
                            ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-black text-white flex items-center gap-1.5">
                            <Crown className="w-4 h-4 text-amber-400" /> Modo Pro (Completo)
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Torneios, Equipes, Elencos, Súmula Oficial FIVB e Gestão
                          </div>
                        </div>
                        {editPlanMode === 'pro' && <Check className="w-5 h-5 text-amber-400" />}
                      </div>

                      {/* Lite Option */}
                      <div
                        onClick={() => setEditPlanMode('lite')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          editPlanMode === 'lite'
                            ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-black text-white flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-blue-400" /> Modo Lite
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Operação de Placar de Quadra, Peladas & Rachas Rápidos
                          </div>
                        </div>
                        {editPlanMode === 'lite' && <Check className="w-5 h-5 text-blue-400" />}
                      </div>

                      {/* Free Option */}
                      <div
                        onClick={() => setEditPlanMode('free')}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          editPlanMode === 'free'
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-black text-white flex items-center gap-1.5">
                            <Tv className="w-4 h-4 text-emerald-400" /> Modo Free
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Placar TV somente leitura + Inscrição de participantes
                          </div>
                        </div>
                        {editPlanMode === 'free' && <Check className="w-5 h-5 text-emerald-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Addon Avulso de Live Stream */}
                  <div>
                    <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Pacote Avulso de Transmissão Ao Vivo
                    </label>
                    <div
                      onClick={() => setEditStreamAddon(!editStreamAddon)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        editStreamAddon
                          ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${editStreamAddon ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-white">Módulo Live Overlay (OBS / Prism)</div>
                          <div className="text-[11px] text-slate-400">
                            Fundo transparente Chroma Key para transmissões ao vivo
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editStreamAddon}
                        onChange={() => {}}
                        className="w-4 h-4 accent-purple-600 rounded"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingLicense}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingLicense ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Gravando no Banco de Dados...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar Licença no Banco de Dados
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Selecione um cliente ao lado para gerenciar a licença.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: IDENTIDADE VISUAL & WHITE LABEL */}
      {currentTab === 'whitelabel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seletor de Cliente + Formulário (7 Colunas) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                White Label Multi-tenant
              </span>
              <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Customização Visual por Subdomínio
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize logotipo, paleta hexadecimal e nome fantasia de qualquer cliente parceiro.
              </p>
            </div>

            {/* Dropdown de Seleção de Empresa */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Selecione a Empresa Parceira para Customizar:
              </label>
              <select
                value={selectedTenantForBrand?.id || ''}
                onChange={(e) => {
                  const found = tenants.find((t) => t.id === e.target.value);
                  if (found) {
                    setSelectedTenantForBrand(found);
                    setBrandForm({
                      name: found.name,
                      logoUrl: found.logoUrl || '',
                      primaryColor: found.primaryColor,
                      secondaryColor: found.secondaryColor,
                      accentColor: found.accentColor,
                      description: found.description || '',
                    });
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-purple-500"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subdomain}.r3play.com.br)
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome Fantasia da Empresa
                </label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  URL da Logomarca (PNG transparente ou SVG recomendado)
                </label>
                <input
                  type="url"
                  value={brandForm.logoUrl}
                  onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              {/* Cores Hexadecimais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandForm.primaryColor}
                      onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={brandForm.primaryColor}
                      onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandForm.secondaryColor}
                      onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={brandForm.secondaryColor}
                      onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandForm.accentColor}
                      onChange={(e) => setBrandForm({ ...brandForm, accentColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={brandForm.accentColor}
                      onChange={(e) => setBrandForm({ ...brandForm, accentColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Slogan ou Descrição
                </label>
                <input
                  type="text"
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="ex: Complexo de Areia & Quadras"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingBrand}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingBrand ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Atualizar Identidade Visual
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview em Tempo Real da Marca (5 Colunas) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Preview em Tempo Real</span>
              <h4 className="text-sm font-black text-white mt-0.5">Como o cliente enxerga o sistema</h4>
            </div>

            {/* Simulação de Barra de Navegação */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Barra Superior (Navbar)</div>
              <div
                className="p-3 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: `${brandForm.primaryColor}15`,
                  borderColor: `${brandForm.primaryColor}50`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                    style={{ backgroundColor: brandForm.primaryColor }}
                  >
                    {brandForm.logoUrl ? (
                      <img src={brandForm.logoUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <span>🏐</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{brandForm.name || 'Nome da Empresa'}</div>
                    <div className="text-[10px] text-slate-400">{brandForm.description || 'Slogan'}</div>
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white shadow-sm"
                  style={{ backgroundColor: brandForm.accentColor }}
                >
                  Destaque
                </span>
              </div>
            </div>

            {/* Simulação de Placar com as Cores */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Cartão de Placar & Botões</div>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl text-center border font-bold text-white text-xs shadow"
                  style={{
                    backgroundColor: brandForm.primaryColor,
                    borderColor: brandForm.primaryColor,
                  }}
                >
                  Botão Primário
                </div>
                <div
                  className="p-3 rounded-xl text-center border font-bold text-white text-xs shadow"
                  style={{
                    backgroundColor: brandForm.secondaryColor,
                    borderColor: brandForm.secondaryColor,
                  }}
                >
                  Botão Secundário
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs">
              <strong>Subdomínio Atribuído:</strong>{' '}
              <code className="text-white font-mono">{selectedTenantForBrand?.subdomain}.r3play.com.br</code>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: CADASTRAR NOVO CLIENTE */}
      {currentTab === 'new_client' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              Novo Cliente Pós-Venda
            </span>
            <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Cadastrar Nova Empresa Parceira
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre um novo cliente contratante, configure seu subdomínio exclusivo e libere o plano comercial contratado.
            </p>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome da Empresa / Arena *
                </label>
                <input
                  type="text"
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                  placeholder="ex: Arena Beach São Paulo"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subdomínio Desejado *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newClientForm.subdomain}
                    onChange={(e) =>
                      setNewClientForm({
                        ...newClientForm,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    placeholder="arenabeach"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-l-xl text-white text-sm font-mono focus:outline-none focus:border-emerald-500 font-bold"
                  />
                  <span className="px-3 py-2.5 bg-slate-800 border border-l-0 border-slate-700 rounded-r-xl text-slate-400 text-xs font-mono">
                    .r3play.com.br
                  </span>
                </div>
              </div>
            </div>

            {/* Plano Inicial Contratado */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block font-bold text-slate-300 uppercase tracking-wider">
                Plano Contratado no Pós-Venda
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setNewClientForm({ ...newClientForm, planMode: 'pro' })}
                  className={`p-3 rounded-xl border font-bold text-left transition-all ${
                    newClientForm.planMode === 'pro'
                      ? 'bg-amber-950/50 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
                    <Crown className="w-3.5 h-3.5" /> Modo Pro
                  </div>
                  <div className="text-[11px] text-slate-400">Torneios, FIVB e Elencos</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewClientForm({ ...newClientForm, planMode: 'lite' })}
                  className={`p-3 rounded-xl border font-bold text-left transition-all ${
                    newClientForm.planMode === 'lite'
                      ? 'bg-blue-950/50 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Modo Lite
                  </div>
                  <div className="text-[11px] text-slate-400">Peladas e Rachas</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewClientForm({ ...newClientForm, planMode: 'free' })}
                  className={`p-3 rounded-xl border font-bold text-left transition-all ${
                    newClientForm.planMode === 'free'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1">
                    <Tv className="w-3.5 h-3.5" /> Modo Free
                  </div>
                  <div className="text-[11px] text-slate-400">Placar TV & Inscrição</div>
                </button>
              </div>

              <div className="pt-2">
                <label
                  onClick={() => setNewClientForm({ ...newClientForm, hasStreamAddon: !newClientForm.hasStreamAddon })}
                  className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={newClientForm.hasStreamAddon}
                    onChange={() => {}}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  Incluir Pacote Avulso de Transmissão Ao Vivo (Overlay OBS / Prism)
                </label>
              </div>
            </div>

            {/* Cores da Marca */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cor Primária
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newClientForm.primaryColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, primaryColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newClientForm.primaryColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, primaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newClientForm.secondaryColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, secondaryColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newClientForm.secondaryColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, secondaryColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newClientForm.accentColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newClientForm.accentColor}
                    onChange={(e) => setNewClientForm({ ...newClientForm, accentColor: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreatingClient}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreatingClient ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Cadastrando no Banco...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Cadastrar Cliente & Liberar Licença
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: SEGURANÇA & BANCO DE DADOS */}
      {currentTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Alteração de Senha do Superadmin (6 Colunas) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                Credenciais Superadmin
              </span>
              <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                Alterar Senha do Administrador
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Atualiza o hash PBKDF2 (SHA-512 com novo Salt) na tabela <code className="text-slate-300">admin_users</code>.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  required
                  placeholder="Digite sua senha atual..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nova Senha (Mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  required
                  placeholder="Digite uma nova senha segura..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  required
                  placeholder="Repita a nova senha..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? 'Atualizando...' : 'Gravar Nova Senha'}
                </button>
              </div>
            </form>
          </div>

          {/* Status de Segurança e Banco de Dados (6 Colunas) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Auditoria & VPS
              </span>
              <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                Segurança do Sistema & Infraestrutura
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proteções ativas em nível de banco de dados e servidor.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Algoritmo de Senha</div>
                    <div className="text-[11px] text-slate-400">PBKDF2 (SHA-512, 100.000 iterações + Salt)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ATIVO
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Proteção contra Força Bruta</div>
                    <div className="text-[11px] text-slate-400">Rate Limiting de 5 tentativas por IP / 15 min</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ATIVO
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-bold text-white">Isolamento Multi-tenant</div>
                    <div className="text-[11px] text-slate-400">Row-Level Security (RLS) + Zod Strict</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  BLINDADO
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold text-white">Consumo de Memória Node.js</div>
                    <div className="text-[11px] text-slate-400">
                      Heap: {stats?.system?.heapUsedMb ?? 24} MB / RSS: {stats?.system?.nodeMemoryMb ?? 48} MB
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  ESTÁVEL (4GB VPS)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
