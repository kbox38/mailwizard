/**
 * CHECKOUT SUCCESS PAGE
 * 
 * Displayed after successful Stripe checkout completion.
 * Confirms payment and redirects to dashboard.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState<string>('');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch updated profile
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type, subscription_status')
            .eq('id', user.id)
            .single();

          if (profile) {
            setPlanType(profile.plan_type);
            setLoading(false);

            // Auto-redirect after 3 seconds
            setTimeout(() => {
              navigate('/app/dashboard');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setLoading(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {loading ? (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-gold" size={48} />
            <h1 className="text-2xl font-serif font-bold mb-2">
              Processing Your Payment...
            </h1>
            <p className="text-gray-600">
              Please wait while we set up your account.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h1 className="text-2xl font-serif font-bold mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome to Email Wizard{' '}
              <span className="font-semibold text-gold">
                {planType === 'pro' ? 'Pro' : 'Pro Plus'}
              </span>
              ! Your account is now active.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                You now have access to all premium features. Redirecting to your dashboard...
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/app/dashboard')}
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
