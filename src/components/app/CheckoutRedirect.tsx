/**
 * CHECKOUT REDIRECT COMPONENT
 * 
 * Checks for pending plan selection after user verifies email and logs in.
 * Automatically redirects to Stripe checkout if a paid plan was selected during signup.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export const CheckoutRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handlePendingCheckout = async () => {
      // Check if there's a pending plan selection
      const pendingPlan = localStorage.getItem('pending_plan');
      
      if (!pendingPlan || pendingPlan === 'free') {
        // No pending checkout, proceed normally
        return;
      }

      if (processing) return; // Prevent double-processing
      
      setProcessing(true);

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          localStorage.removeItem('pending_plan');
          return;
        }

        // Check if user already has a paid plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_type')
          .eq('id', user.id)
          .single();

        if (profile && profile.plan_type !== 'free') {
          // User already has paid plan, clear pending
          localStorage.removeItem('pending_plan');
          return;
        }

        // Create Stripe checkout session
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          'stripe-checkout',
          {
            body: {
              plan: pendingPlan,
              user_id: user.id,
            },
          }
        );

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          localStorage.removeItem('pending_plan');
          return;
        }

        if (checkoutData?.url) {
          // Clear pending plan before redirect
          localStorage.removeItem('pending_plan');
          
          // Redirect to Stripe checkout
          window.location.href = checkoutData.url;
        }
      } catch (error) {
        console.error('Error processing pending checkout:', error);
        localStorage.removeItem('pending_plan');
        setProcessing(false);
      }
    };

    // Run after a short delay to ensure user is fully authenticated
    const timer = setTimeout(handlePendingCheckout, 1000);

    return () => clearTimeout(timer);
  }, [navigate, processing]);

  // Show loading indicator while processing
  if (processing) {
    return (
      <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-gold" size={48} />
          <h2 className="text-xl font-serif font-bold mb-2">Processing your subscription...</h2>
          <p className="text-gray-600">Redirecting to checkout...</p>
        </div>
      </div>
    );
  }

  return null;
};
