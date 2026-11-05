import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Clock,
  Server,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('tecn.rodrigo@gmail.com');
  const [password, setPassword] = useState('R3teamAdmin2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [blockedSeconds, setBlockedSeconds] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Preencha seu e-mail e senha de administrador.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Falha na autenticação');
      if (typeof res.remainingAttempts === 'number') {
        setRemainingAttempts(res.remainingAttempts);
      }
      if (typeof res.blockedSeconds === 'number') {
        setBlockedSeconds(res.blockedSeconds);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com gradiente sutil */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Superadmin
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Criptografia PBKDF2
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">Central Admin • R3team</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações de escopo */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Área restrita para controle de clientes parceiros, liberação de planos comerciais no pós-venda e configuração de subdomínios White Label.
          </p>
        </div>

        {/* Mensagem de Erro / Bloqueio */}
        {errorMessage && (
          <div className="mx-6 my-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">{errorMessage}</div>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div className="text-[11px] text-rose-200/80">
                  Tentativas restantes antes do bloqueio temporário: <strong>{remainingAttempts}</strong>
                </div>
              )}
              {blockedSeconds !== null && blockedSeconds > 0 && (
                <div className="text-[11px] text-rose-200/80 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-400" /> Aguarde {blockedSeconds} segundos para tentar novamente.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> E-mail Cadastrado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: tecn.rodrigo@gmail.com"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Senha de Segurança
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dica de Primeiro Acesso com credenciais seguras do banco */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Usuário Master Cadastrado no Banco:
            </div>
            <div className="font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 text-[10px]">
              <div>Email: <strong className="text-white">tecn.rodrigo@gmail.com</strong></div>
              <div>Senha inicial: <strong className="text-indigo-300">R3teamAdmin2025!</strong></div>
            </div>
            <div className="text-[10px] text-slate-500">
              * A senha pode ser alterada a qualquer momento na aba de Segurança do painel.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Acessar Painel Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
