/**
 * AUTH CALLBACK PAGE
 * 
 * Handles email verification callback from Supabase.
 * Automatically logs user in and redirects to checkout if they selected a paid plan.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle } from 'lucide-react';
import { authErrorMessage, clearPendingVerification } from '../../lib/emailVerification';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const callbackError = params.get('error_description') || hash.get('error_description');
      if (callbackError) throw new Error(callbackError);
      // Support custom confirmation links containing a token hash. Standard
      // ConfirmationURL links are processed by the Supabase client's URL flow.
      const tokenHash = params.get('token_hash');
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
        if (error) throw error;
        window.history.replaceState(null, '', window.location.pathname);
      }
      // Get the session after email verification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session || !session.user.email_confirmed_at) {
        throw new Error('No session found after verification');
      }

      setStatus('success');
      clearPendingVerification();
      setMessage('Email verified successfully!');

      // Check if there's a pending plan
      const pendingPlan = localStorage.getItem('pending_plan');

      if (pendingPlan === 'pro' || pendingPlan === 'pro_plus') {
        // Paid plan: redirect to checkout
        setMessage('Redirecting to checkout...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          'stripe-checkout',
          {
            body: {
              plan: pendingPlan,
              user_id: session.user.id,
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
      } else {
        // The route guard checks server-side entitlement before app access.
        localStorage.removeItem('pending_plan');
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/app/dashboard');
      }
    } catch (error: any) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage(authErrorMessage(error));
      
      // Redirect to login after error
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-gold" size={64} />
            <h1 className="text-2xl font-serif font-bold mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h1 className="text-2xl font-serif font-bold mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-3xl">✕</span>
            </div>
            <h1 className="text-2xl font-serif font-bold mb-2 text-red-600">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
