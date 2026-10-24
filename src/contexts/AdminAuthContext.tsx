import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AdminUser {
  id: string;
  email: string;
  adminRole: 'super_admin' | 'support_admin' | 'finance_admin' | 'readonly_admin';
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);


export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    localStorage.removeItem('adminToken');
    if (!user) { setAdmin(null); setLoading(false); return; }
    const check = async (initial = false) => {
      if (initial) setLoading(true);
      const { data, error } = await supabase.rpc('is_platform_admin');
      if (active) {
        setAdmin(!error && data === true ? { id: user.id, email: user.email || '', adminRole: 'super_admin' } : null);
        setLoading(false);
      }
    };
    void check(true);
    const interval = window.setInterval(() => { void check(); }, 60000);
    return () => { active = false; window.clearInterval(interval); };
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    const { data: allowed, error: accessError } = await supabase.rpc('is_platform_admin');
    if (accessError) throw accessError;
    if (allowed !== true || !data.user.email_confirmed_at) throw new Error('This account does not have administrator access.');
    setAdmin({ id: data.user.id, email: data.user.email || '', adminRole: 'super_admin' });
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading: authLoading || loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
