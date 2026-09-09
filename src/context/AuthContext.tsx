import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  saveLoginArtToIndexedDB,
  loadLoginArtFromIndexedDB,
  deleteLoginArtFromIndexedDB,
} from '../lib/indexedDbStorage';

export interface CurrentUserType {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: 'admin' | 'employee';
  avatarUrl?: string;
  initials: string;
  department?: string;
  needsPasswordChange?: boolean;
  employeeId?: string;
  username?: string;
  [key: string]: any;
}

export interface AuthContextType {
  currentUser: CurrentUserType | null;
  isAuthChecking: boolean;
  pendingPasswordChangeUser: any | null;
  setPendingPasswordChangeUser: (user: any | null) => void;
  setCurrentUser: (user: any) => void;
  logout: () => Promise<void>;
  isManagerOrAdmin: (user?: any) => boolean;
  loginArtUrl: string;
  updateLoginArtUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  LOGIN_ART_URL: 'spine_login_art_url_v1',
  LOGIN_DATE: 'spine_login_date_v1',
};

const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current Authenticated User sincronizado com Supabase Auth
  const [pendingPasswordChangeUser, setPendingPasswordChangeUser] = useState<any | null>(null);

  const [currentUser, setCurrentUserState] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('spine_logged_user');
      const loginDate = localStorage.getItem(STORAGE_KEYS.LOGIN_DATE);
      const today = getTodayDateStr();

      if (saved) {
        if (loginDate && loginDate !== today) {
          localStorage.removeItem('spine_logged_user');
          localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
          return null;
        }
        const parsed = JSON.parse(saved);
        if (parsed?.needsPasswordChange) {
          localStorage.removeItem('spine_logged_user');
          localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
          return null;
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  });

  // Se já temos o usuário hidratado do cache, isAuthChecking é false imediatamente.
  // Caso contrário, é true até o Supabase resolver getSession().
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('spine_logged_user');
      return !saved;
    } catch {
      return true;
    }
  });

  const fetchProfileForAuthUser = async (authUser: any) => {
    if (!authUser) return null;
    try {
      let profile: any = null;

      // 1. Tenta buscar por auth_user_id
      const { data: byAuthId, error: authIdErr } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (!authIdErr && byAuthId) {
        profile = byAuthId;
      }

      // 2. Fallback por email e vinculação automática
      if (!profile && authUser.email) {
        const { data: byEmail, error: emailErr } = await supabase
          .from('employees')
          .select('*')
          .ilike('email', authUser.email.trim())
          .maybeSingle();

        if (!emailErr && byEmail) {
          profile = byEmail;
          if (!byEmail.auth_user_id) {
            await supabase
              .from('employees')
              .update({ auth_user_id: authUser.id })
              .eq('id', byEmail.id);
          }
        }
      }

      const isUserAdmin =
        profile?.role_type === 'admin' ||
        profile?.role?.toLowerCase() === 'admin' ||
        profile?.role?.toLowerCase() === 'administrador' ||
        authUser.email === 'admin@empresa.com' ||
        authUser.user_metadata?.role === 'admin' ||
        authUser.app_metadata?.role === 'admin';

      const userRole = profile?.role || (isUserAdmin ? 'Administrador' : 'Colaborador');
      const userName =
        profile?.name ||
        authUser.user_metadata?.name ||
        (isUserAdmin ? 'Administrador Geral' : authUser.email?.split('@')[0] || 'Usuário');

      const hasAlreadyChangedPassword = authUser.user_metadata?.needs_password_change === false;
      const needsChange =
        !hasAlreadyChangedPassword &&
        (Boolean(profile?.needs_password_change) || Boolean(authUser.user_metadata?.needs_password_change));

      return {
        id: profile?.id || authUser.id,
        authUserId: authUser.id,
        name: userName,
        email: authUser.email || profile?.email || '',
        role: userRole,
        roleType: isUserAdmin ? ('admin' as const) : ('employee' as const),
        avatarUrl: profile?.avatar_url || profile?.avatarUrl || '',
        initials: profile?.initials || (isUserAdmin ? 'AD' : 'CB'),
        department: profile?.department,
        needsPasswordChange: needsChange,
        profile,
      };
    } catch (err) {
      console.warn('[Supabase Auth] Falha ao carregar perfil do usuário:', err);
      return null;
    }
  };

  // Sincronização em tempo real de sessão do Supabase Auth
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      try {
        if (session?.user) {
          const appUser = await fetchProfileForAuthUser(session.user);
          if (isMounted && appUser) {
            if (appUser.needsPasswordChange) {
              setCurrentUserState(null);
              setPendingPasswordChangeUser(appUser);
            } else {
              setCurrentUserState(appUser);
              setPendingPasswordChangeUser(null);
              try {
                localStorage.setItem('spine_logged_user', JSON.stringify(appUser));
                localStorage.setItem(STORAGE_KEYS.LOGIN_DATE, getTodayDateStr());
              } catch {}
            }
          }
        } else if (!localStorage.getItem('spine_logged_user')) {
          setCurrentUserState(null);
          setPendingPasswordChangeUser(null);
        }
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const appUser = await fetchProfileForAuthUser(session.user);
            if (isMounted && appUser) {
              if (appUser.needsPasswordChange) {
                setCurrentUserState(null);
                setPendingPasswordChangeUser(appUser);
              } else {
                setCurrentUserState(appUser);
                setPendingPasswordChangeUser(null);
                try {
                  localStorage.setItem('spine_logged_user', JSON.stringify(appUser));
                  localStorage.setItem(STORAGE_KEYS.LOGIN_DATE, getTodayDateStr());
                } catch {}
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setCurrentUserState(null);
            setPendingPasswordChangeUser(null);
            localStorage.removeItem('spine_logged_user');
            localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
          }
        }
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setCurrentUser = (user: any) => {
    if (user && !user.needsPasswordChange) {
      try {
        localStorage.setItem(STORAGE_KEYS.LOGIN_DATE, getTodayDateStr());
        localStorage.setItem('spine_logged_user', JSON.stringify(user));
      } catch {}
      setCurrentUserState(user);
      setPendingPasswordChangeUser(null);
    } else if (user && user.needsPasswordChange) {
      localStorage.removeItem('spine_logged_user');
      localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
      setCurrentUserState(null);
      setPendingPasswordChangeUser(user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
      setCurrentUserState(null);
      setPendingPasswordChangeUser(null);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao encerrar sessão no Supabase Auth:', err);
    }
    localStorage.removeItem('spine_logged_user');
    localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
    setCurrentUserState(null);
    setPendingPasswordChangeUser(null);
  };

  // Login Art Customization with Persistent IndexedDB + LocalStorage Sync
  const [loginArtUrl, setLoginArtUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LOGIN_ART_URL) || '';
  });

  // Load from IndexedDB on startup (overcomes 5MB localStorage limit)
  useEffect(() => {
    loadLoginArtFromIndexedDB().then((storedArt) => {
      if (storedArt) {
        setLoginArtUrl(storedArt);
        try {
          localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, storedArt);
        } catch {
          // Ignore quota error in localStorage as IndexedDB holds it
        }
      }
    });
  }, []);

  const updateLoginArtUrl = async (url: string) => {
    const cleanUrl = url ? url.trim() : '';
    setLoginArtUrl(cleanUrl);

    if (cleanUrl) {
      saveLoginArtToIndexedDB(cleanUrl);
      try {
        localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, cleanUrl);
      } catch {
        // Handled via IndexedDB
      }
    } else {
      deleteLoginArtFromIndexedDB();
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ART_URL);
    }

    // Persist globally in Supabase so EVERY user sees the wallpaper
    try {
      if (cleanUrl) {
        await supabase.from('projects').upsert({
          id: 'system-settings',
          name: 'Configurações Globais do Sistema',
          category: 'System',
          description: cleanUrl,
          logo_url: cleanUrl,
          status: 'system',
        });
      } else {
        await supabase.from('projects').delete().eq('id', 'system-settings');
      }
    } catch (err) {
      console.warn('Error saving login art to Supabase:', err);
    }
  };

  // Auto-logout at 00:00 (Midnight daily reset for all users)
  useEffect(() => {
    if (!currentUser) return;

    const performMidnightLogout = () => {
      logout();
    };

    const checkMidnightExpiry = () => {
      const loginDate = localStorage.getItem(STORAGE_KEYS.LOGIN_DATE);
      const today = getTodayDateStr();
      if (loginDate && loginDate !== today) {
        performMidnightLogout();
      }
    };

    // 1. Calculate time until next midnight (00:00:00)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

    const midnightTimer = setTimeout(() => {
      performMidnightLogout();
    }, msUntilMidnight);

    // 2. Periodic safety check every 10 seconds (handles system sleep, tab throttling)
    const interval = setInterval(checkMidnightExpiry, 10000);

    // 3. Multi-tab synchronization (if one tab logs out or hits midnight, logout everywhere)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spine_logged_user' && !e.newValue) {
        setCurrentUserState(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  // Helper: check if a user is Admin or Gestor
  const checkIsManagerOrAdmin = (userToCheck: any): boolean => {
    if (!userToCheck) return false;
    if (
      userToCheck.roleType === 'admin' ||
      userToCheck.id === 'usr-admin' ||
      (userToCheck.role && (userToCheck.role.toLowerCase() === 'admin' || userToCheck.role.toLowerCase() === 'administrador'))
    ) {
      return true;
    }
    const r = (userToCheck.role || '').toLowerCase().trim();
    const dept = (userToCheck.department || '').toLowerCase().trim();
    return (
      r.includes('gestor') ||
      r.includes('gerente') ||
      r.includes('manager') ||
      r.includes('gestão') ||
      r.includes('gestao') ||
      dept.includes('gest') ||
      dept.includes('geren')
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthChecking,
        setCurrentUser,
        pendingPasswordChangeUser,
        setPendingPasswordChangeUser,
        logout,
        isManagerOrAdmin: (u?: any) => checkIsManagerOrAdmin(u !== undefined ? u : currentUser),
        loginArtUrl,
        updateLoginArtUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
