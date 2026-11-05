import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTenant } from './TenantContext';

export type ArenaRole = 'OWNER' | 'ORGANIZER' | 'PLAYER';

export interface ArenaAuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: ArenaRole;
  canUseStreamOverlay?: boolean;
}

interface ArenaAuthContextValue {
  token: string | null;
  user: ArenaAuthUser | null;
  role: ArenaRole;
  isAuthenticated: boolean;
  isOwner: boolean;
  isOrganizer: boolean;
  isPlayer: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  quickSwitchRole: (targetRole: ArenaRole) => Promise<void>;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: (defaultRole?: ArenaRole) => void;
  closeLoginModal: () => void;
}

const ArenaAuthContext = createContext<ArenaAuthContextValue | undefined>(undefined);

export const ArenaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('r3play_arena_token');
  });

  const [user, setUser] = useState<ArenaAuthUser | null>(() => {
    const saved = localStorage.getItem('r3play_arena_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Deriva o papel atual; se não estiver logado, assume 'PLAYER' por padrão
  const role: ArenaRole = user ? user.role : 'PLAYER';
  const isOwner = role === 'OWNER';
  const isOrganizer = role === 'ORGANIZER';
  const isPlayer = role === 'PLAYER';
  const isAuthenticated = !!user && !!token;

  // Atualiza headers / localStorage ao mudar
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('r3play_arena_token', token);
      localStorage.setItem('r3play_arena_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('r3play_arena_token');
      localStorage.removeItem('r3play_arena_user');
    }
  }, [token, user]);

  const login = async (email: string, password = 'Organizador2025!'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Falha ao autenticar.' };
      }

      setToken(data.data.token);
      setUser(data.data.user);
      setIsLoginModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com o servidor.' };
    }
  };

  /**
   * Alterna rapidamente de papel para testes e demonstrações instantâneas
   */
  const quickSwitchRole = async (targetRole: ArenaRole) => {
    if (targetRole === 'PLAYER') {
      logout();
      return;
    }

    try {
      const res = await fetch(`/api/auth/demo-accounts?tenant=${tenant.subdomain}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const matched = data.data.find((a: any) => a.role === targetRole);
          if (matched) {
            await login(matched.email, matched.defaultPassword);
            return;
          }
        }
      }

      // Fallbacks padrões
      if (targetRole === 'OWNER') {
        await login('dono.arena1@r3play.com.br', 'ArenaOwner2025!');
      } else if (targetRole === 'ORGANIZER') {
        await login('organizador.lucas@r3play.com.br', 'Organizador2025!');
      }
    } catch (err) {
      console.error('Erro na troca rápida de papel:', err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const openLoginModal = (_defaultRole?: ArenaRole) => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <ArenaAuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        isOwner,
        isOrganizer,
        isPlayer,
        login,
        quickSwitchRole,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </ArenaAuthContext.Provider>
  );
};

export const useArenaAuth = () => {
  const context = useContext(ArenaAuthContext);
  if (!context) {
    throw new Error('useArenaAuth deve ser usado dentro de um ArenaAuthProvider');
  }
  return context;
};
