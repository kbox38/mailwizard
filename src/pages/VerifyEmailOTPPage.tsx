/**
 * Email Verification with OTP Code
 * FIXED: Redirects to dashboard after verification and handles pending plan checkout
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import OTPInput from '../components/OTPInput';
import { authErrorMessage, clearPendingVerification, normalizeEmail, readPendingVerification, RESEND_COOLDOWN_SECONDS, resendVerification, savePendingVerification, verifyEmailCode } from '../lib/emailVerification';

export default function VerifyEmailOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState(() => normalizeEmail(location.state?.email || new URLSearchParams(location.search).get('email') || readPendingVerification().email));
  const [resendAfter, setResendAfter] = useState(() => {
    const pending = readPendingVerification();
    const routeEmail = normalizeEmail(location.state?.email || new URLSearchParams(location.search).get('email') || pending.email);
    return location.state?.resendAfter || (pending.email === routeEmail ? pending.resendAfter : 0);
  });
  const [now, setNow] = useState(Date.now);
  const [errorMessage, setErrorMessage] = useState('');
  const [codeRequested, setCodeRequested] = useState(resendAfter > 0);
  const [verified, setVerified] = useState(false);
  const verifyingRef = useRef(false);
  const resendingRef = useRef(false);
  const cooldown = Math.max(0, Math.ceil((resendAfter - now) / 1000));

  useEffect(() => {
    if (resendAfter <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAfter]);

  const handleVerify = async (code: string) => {
    if (verifyingRef.current || resendingRef.current || verified || loading) {
      return;
    }

    if (!email || !/^\d{6}$/.test(code)) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    setErrorMessage('');

    try {
      const data = await verifyEmailCode(supabase, email, code);
      clearPendingVerification();

      if (data.user) {
        const verifiedUserId = data.user.id;
        setVerified(true);
        toast.success('Email verified successfully! 🎉', {
          duration: 4000,
        });
        
        // Check if there's a pending plan
        const pendingPlan = localStorage.getItem('pending_plan');
        
        if (pendingPlan === 'pro' || pendingPlan === 'pro_plus') {
          // User selected paid plan - redirect to checkout
          toast.loading('Redirecting to checkout...', { duration: 2000 });
          
          setTimeout(async () => {
            try {
              const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
                'stripe-checkout',
                {
                  body: {
                    plan: pendingPlan,
                    user_id: verifiedUserId,
                  },
                }
              );

              if (checkoutError) throw checkoutError;

              if (checkoutData?.url) {
                localStorage.removeItem('pending_plan');
                window.location.href = checkoutData.url;
              } else {
                throw new Error('Failed to create checkout session');
              }
            } catch (error) {
              console.error('Checkout error:', error);
              localStorage.removeItem('pending_plan');
              toast.error('Failed to start checkout. Redirecting to dashboard...');
              setTimeout(() => navigate('/app/dashboard'), 1000);
            }
          }, 1000);
        } else {
          // Accounts without a selected plan choose a subscription next.
          localStorage.removeItem('pending_plan');
          setTimeout(() => {
            navigate('/subscribe');
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      setErrorMessage(authErrorMessage(error));
      
      setOtp('');
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleResendCode = async () => {
    if (resendingRef.current || verifyingRef.current || verified || Date.now() < resendAfter) return;
    if (!email) {
      toast.error('Email address not found');
      return;
    }

    resendingRef.current = true;
    setResending(true);
    setErrorMessage('');

    try {
      await resendVerification(supabase, email, window.location.origin);
      const nextResend = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      setNow(Date.now());
      setResendAfter(nextResend);
      savePendingVerification(email, nextResend);
      setCodeRequested(true);

      toast.success('If this address has an unverified account, a confirmation email has been requested. Check your inbox and spam folder.', {
        duration: 5000,
      });
      
      setVerified(false);
      setOtp('');
    } catch (error: any) {
      console.error('Resend error:', error);
      setErrorMessage(authErrorMessage(error));
      if (error?.status === 429) {
        const nextResend = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
        setNow(Date.now());
        setResendAfter(nextResend);
        savePendingVerification(email, nextResend);
      }
    } finally {
      resendingRef.current = false;
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            {codeRequested ? 'Check your confirmation email for the code:' : 'Enter the email address you used to sign up.'}<br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {errorMessage && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
          {!codeRequested && (
            <form className="mb-6 space-y-3" onSubmit={(event) => { event.preventDefault(); void handleResendCode(); }}>
              <label htmlFor="verification-email" className="block text-sm font-semibold">Email address</label>
              <input id="verification-email" type="email" autoComplete="email" required value={email}
                disabled={resending || loading} onChange={(event) => setEmail(normalizeEmail(event.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2" />
              <button type="submit" disabled={resending || loading || cooldown > 0}
                className="w-full rounded-md bg-yellow-400 px-4 py-3 font-semibold disabled:opacity-50">
                {resending ? 'Sending...' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Send verification code'}
              </button>
            </form>
          )}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
              disabled={loading || resending || verified || !email}
            />
          </div>

          <button
            onClick={() => handleVerify(otp)}
            disabled={loading || resending || !email || otp.length !== 6 || verified}
            className="w-full bg-yellow-400 text-black font-semibold py-3 px-4 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : verified ? (
              'Verified! Redirecting...'
            ) : (
              'Verify Email'
            )}
          </button>

          {!verified && codeRequested && (
            <div className="text-center">
              <button
                onClick={handleResendCode}
                disabled={resending || loading || cooldown > 0}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive the code? Resend"}
              </button>
            </div>
          )}
          {!verified && codeRequested && (
            <button className="mt-4 w-full text-sm text-gray-600 hover:underline" disabled={loading || resending}
              onClick={() => { setCodeRequested(false); setOtp(''); setErrorMessage(''); }}>
              Use a different email address
            </button>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">💡 Tip:</span> Check your spam folder if you don't see the email within a few minutes.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
