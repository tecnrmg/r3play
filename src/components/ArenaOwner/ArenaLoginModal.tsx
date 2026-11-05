import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Key, User, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useArenaAuth, ArenaRole } from '../../context/ArenaAuthContext';
import { useTenant } from '../../context/TenantContext';

interface ArenaLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: ArenaRole;
}

export const ArenaLoginModal: React.FC<ArenaLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login, quickSwitchRole } = useArenaAuth();
  const { tenant } = useTenant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const res = await login(email, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Falha ao autenticar.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
            }}
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Acesso Restrito da Arena
          </h2>
          <p className="text-xs text-slate-400">
            Ambiente: <strong className="text-slate-200">{tenant.name}</strong> ({tenant.subdomain}.r3play.com.br)
          </p>
        </div>

        {/* Demo Fast Switch Buttons */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Atalhos para Demonstração Rápida:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('OWNER');
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🏟️ Dono da Arena</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await quickSwitchRole('ORGANIZER');
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>📋 Organizador</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              E-mail Cadastrado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: dono.arena1@r3play.com.br"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
            }}
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
