/**
 * STRIPE PORTAL HOOK
 * 
 * Custom hook for opening Stripe Customer Portal.
 * Allows users to manage their subscription, payment methods, and billing history.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useStripePortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Customer Portal
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message || 'Failed to open billing portal');
      setLoading(false);
    }
  };

  return { openPortal, loading, error };
};
