import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminUserClient {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUserClient | null;
  token: string | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; blockedSeconds?: number }>;
  logout: () => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'r3play_admin_auth_token';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState<AdminUserClient | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Valida a sessão ao carregar
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setAdminUser(data.user);
          } else {
            // Token inválido ou expirado
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      } catch (e) {
        console.warn('Erro ao validar sessão de admin:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const clearAuthData = () => {
    setToken(null);
    setAdminUser(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignora erro em ambientes restritos
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; remainingAttempts?: number; blockedSeconds?: number }> => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        setAdminUser(data.user);
        try {
          sessionStorage.setItem(TOKEN_KEY, data.token);
        } catch {
          // Ignora
        }
        setIsLoginModalOpen(false);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Credenciais de administrador inválidas',
        remainingAttempts: data.remainingAttempts,
        blockedSeconds: data.blockedSeconds,
      };
    } catch (e) {
      console.error('Erro de conexão ao realizar login de admin:', e);
      return { success: false, error: 'Falha de comunicação com o servidor' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('Erro ao notificar logout:', e);
      }
    }
    clearAuthData();
  };

  const changePassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Não autenticado' };

    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Erro ao alterar senha' };
    } catch {
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!adminUser,
        adminUser,
        token,
        isLoading,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider');
  }
  return context;
};
