/**
 * RESUBSCRIBE PAGE
 * 
 * Public page allowing previously unsubscribed contacts to opt back in.
 * 
 * Features:
 * - Email input form with validation
 * - Success/error messaging
 * - Platform design consistency
 * - No authentication required
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function Resubscribe() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email address is required' });
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    // Submit resubscribe request
    setState('submitting');
    
    try {
      const { data, error } = await supabase.functions.invoke('resubscribe', {
        body: { email: email.trim().toLowerCase() }
      });
      
      if (error) throw error;
      
      if (data.success) {
        setState('success');
        setMessage(data.message);
      } else {
        setState('error');
        setMessage(data.error || 'Failed to resubscribe');
      }
    } catch (error: any) {
      console.error('Resubscribe error:', error);
      setState('error');
      setMessage(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple to-purple/80 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">
            Enter your email to start receiving our emails again.
          </p>
        </div>

        {/* Form */}
        {state !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={state === 'submitting'}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-yellow'
                } focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {state === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="w-full bg-yellow text-white py-3 rounded-lg font-semibold hover:bg-yellow/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
              {state === 'submitting' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Re-subscribe'
              )}
            </button>
          </form>
        ) : (
          // Success state
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're All Set!
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>

            <Link
              to="/"
              className="inline-block bg-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple/90 transition-all duration-200"
            >
              Go to Homepage
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="/contact" className="text-yellow hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
