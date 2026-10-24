import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'mailwizard.email-verification.v1';
export const RESEND_COOLDOWN_SECONDS = 60;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function readPendingVerification(): { email: string; resendAfter: number } {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (typeof value?.email === 'string' && Number.isFinite(value.resendAfter)) {
      return { email: normalizeEmail(value.email), resendAfter: value.resendAfter };
    }
  } catch { /* Storage may be unavailable in private browsing. */ }
  return { email: '', resendAfter: 0 };
}

export function savePendingVerification(email: string, resendAfter = 0) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: normalizeEmail(email), resendAfter }));
  } catch { /* Navigation state remains available without browser storage. */ }
}

export function clearPendingVerification() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage unavailable. */ }
}

export function authErrorMessage(error: unknown): string {
  const failure = error as { code?: string; status?: number; message?: string } | null;
  if (failure?.code === 'over_email_send_rate_limit' || failure?.code === 'over_request_rate_limit' || failure?.status === 429) {
    return 'Too many email requests. Please wait before requesting another code.';
  }
  if (failure?.code === 'email_address_not_authorized') {
    return 'Email delivery is not configured for this address. Please contact support.';
  }
  if (/error sending (confirmation|recovery|magic link) email/i.test(failure?.message || '')) {
    return 'We could not send the email. Please try again later or contact support.';
  }
  if (failure?.code === 'otp_expired') return 'This code is invalid or has expired. Request a new code and use the latest email.';
  if (failure?.code === 'invalid_credentials') return 'Incorrect email or password. Please try again or reset your password.';
  return failure?.message || 'Something went wrong. Please try again.';
}

export async function resendVerification(client: SupabaseClient, email: string, origin: string) {
  const { error } = await client.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signUpWithEmail(client: SupabaseClient, email: string, password: string, fullName: string, origin: string) {
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(email), password,
    options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed. Please try again.');
  // Supabase can return an obfuscated user for a repeated confirmed signup.
  // That response creates no account/session and sends no confirmation email.
  if (!data.session && data.user.identities?.length === 0) {
    throw new Error('If you already have an account with this email, sign in or reset your password. Otherwise, check your inbox for an existing confirmation email.');
  }
  return { ...data, user: data.user };
}

export async function verifyEmailCode(client: SupabaseClient, email: string, code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error('Please enter a 6-digit code.');
  const { data, error } = await client.auth.verifyOtp({
    email: normalizeEmail(email), token: code, type: 'email',
  });
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Verification did not create a session. Please sign in again.');
  return { ...data, user: data.user, session: data.session };
}
