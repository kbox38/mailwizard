/**
 * ============================================================================
 * Unsubscribe Page — Result Display
 * ============================================================================
 *
 * ARCHITECTURE:
 * The Edge Function processes the unsubscribe and redirects here with:
 *   /unsubscribe?result=success&email=user@example.com
 *   /unsubscribe?result=already&email=user@example.com
 *   /unsubscribe?result=error
 *
 * This page reads those params and renders the appropriate UI.
 * No fetch() calls, no CORS headers, no API keys needed.
 *
 * Legacy fallback: if a ?token= param arrives (old email links),
 * we redirect the browser to the Edge Function directly.
 *
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Status = 'loading' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const result = searchParams.get('result');
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');

    // ------------------------------------------------------------------
    // Case 1: Redirected back from Edge Function with ?result=
    // ------------------------------------------------------------------
    if (result) {
      setEmail(emailParam);
      setStatus(result === 'success' || result === 'already' ? 'success' : 'error');
      return;
    }

    // ------------------------------------------------------------------
    // Case 2: Direct ?token= link (legacy / someone copied the raw URL)
    // Redirect browser to Edge Function — it processes and redirects back
    // ------------------------------------------------------------------
    if (token && SUPABASE_URL) {
      window.location.href =
        `${SUPABASE_URL}/functions/v1/unsubscribe?token=${encodeURIComponent(token)}`;
      return;
    }

    // ------------------------------------------------------------------
    // Case 3: No params — invalid direct navigation
    // ------------------------------------------------------------------
    setStatus('error');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading spinner (brief, only visible during Case 2 redirect)
  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Processing your request...</p>
        </div>
      </div>
    );
  }

  // Success page
  if (status === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">

          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#f3ba42' }}
          >
            <CheckCircle2 size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You've Been Unsubscribed
          </h1>

          <p className="text-gray-600 leading-relaxed mb-4">
            You will no longer receive marketing emails from us.
            This change is effective immediately.
          </p>

          {email && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-center gap-2">
              <Mail size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 font-medium text-sm">{email}</span>
            </div>
          )}

          <p className="text-gray-500 text-sm mb-4">Changed your mind?</p>

          <Link
            to="/resubscribe"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#f3ba42' }}
          >
            Re-subscribe
          </Link>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              If you believe this was done in error, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error page
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">

        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Unsubscribe Failed
        </h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          This link is invalid or has expired. Please use the link directly
          from your email, or contact our support team for assistance.
        </p>

        <Link
          to="/"
          className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
        >
          Go Home
        </Link>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            If you continue to experience issues, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}