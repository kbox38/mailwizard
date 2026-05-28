/**
 * CHECKOUT CANCEL PAGE
 * 
 * Displayed when user cancels Stripe checkout.
 * Explains they still have free access and provides options to retry or continue.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleRetryPayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Navigate to settings billing tab where they can upgrade
      navigate('/app/settings?tab=billing');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <XCircle className="mx-auto mb-4 text-yellow-500" size={64} />
        
        <h1 className="text-2xl font-serif font-bold mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          No worries! You can still use Email Wizard with our free plan.
        </p>

        {/* Free Plan Features */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold mb-3">Your Free Plan Includes:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              500 emails per month
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              Up to 500 contacts
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              Basic email templates
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              Basic analytics
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/app/dashboard')}
          >
            Continue with Free Plan
            <ArrowRight size={18} className="ml-2" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleRetryPayment}
          >
            Choose a Different Plan
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-6">
          You can upgrade to a paid plan anytime from your account settings.
        </p>
      </div>
    </div>
  );
};
