/**
 * Authentication Context - OTP Email Verification
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { normalizeEmail, savePendingVerification, clearPendingVerification, RESEND_COOLDOWN_SECONDS, signUpWithEmail } from '../lib/emailVerification';
import type { Profile } from '../lib/supabase';


interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasAccess: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  validatePasswordStrength: (password: string) => PasswordRequirements;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const activeUserId = useRef<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      activeUserId.current = session?.user.id ?? null;
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => { setUser(null); setLoading(false); });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      activeUserId.current = session?.user.id ?? null;
      if (session?.user) {
        // Run outside the Auth lock held while listeners are notified.
        const userId = session.user.id;
        window.setTimeout(() => { void fetchProfile(userId); }, 0);
      } else {
        setProfile(null);
        setHasAccess(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const refresh = () => { void fetchProfile(user.id); };
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [user?.id]);

  const fetchProfile = async (userId: string) => {
    try {
      const [{ data, error }, access] = await Promise.all([supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(), supabase.rpc('has_platform_access')]);

      if (activeUserId.current !== userId) return;

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setProfile(data);
      setHasAccess(!access.error && access.data === true);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (activeUserId.current === userId) setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await signUpWithEmail(supabase, email, password, fullName, window.location.origin);

      if (data.user && !data.session) {
        const resendAfter = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
        savePendingVerification(email, resendAfter);
        toast.success('Check your inbox for your confirmation email.', {
          duration: 5000,
        });
        
        navigate('/verify-email-otp', { 
          state: { email: normalizeEmail(email), resendAfter },
          replace: true 
        });
      } else {
        clearPendingVerification();
        toast.success('Account created! Logging you in...');
        
        setUser(data.user);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        }
        
        navigate('/app/dashboard');
      }
      return data.session?.user ?? null;
      
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error) {
        if (error.code === 'email_not_confirmed') {
          savePendingVerification(email);
          navigate('/verify-email-otp', { state: { email: normalizeEmail(email) } });
          throw new Error('Please verify your email before signing in. Check your inbox for the verification code.');
        }
        throw error;
      }

      setUser(data.user);
      clearPendingVerification();
      activeUserId.current = data.user.id;
      await fetchProfile(data.user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      toast.success('Welcome back!');
      const adminAccess = await supabase.rpc('is_platform_admin');
      navigate(!adminAccess.error && adminAccess.data === true ? '/admin/dashboard' : '/app/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setHasAccess(false);
      toast.success('Logged out successfully');
      navigate('/login');
      
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  const resetPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  };

  const validatePasswordStrength = (password: string): PasswordRequirements => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
    };
  };

  const value = {
    user,
    profile,
    loading,
    hasAccess,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    requestPasswordReset,
    resetPassword,
    validatePasswordStrength,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
