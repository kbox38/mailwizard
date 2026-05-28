import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/ui/Logo';
import { PLAN_PRICING } from '../config/planLimits';

type PlanType = 'free' | 'pro' | 'pro_plus';

const planFeatures = {
  free: [
    '500 emails per month',
    'Up to 500 contacts',
    'Basic email templates',
    'Basic analytics',
  ],
  pro: [
    '25,000 emails per month',
    'Up to 5,000 contacts',
    'All templates unlocked',
    'Advanced analytics',
    'A/B testing',
    'Campaign scheduling',
  ],
  pro_plus: [
    'Unlimited emails',
    'Unlimited contacts',
    'All templates + custom',
    'Marketing automations',
    'Merge tag personalization',
    'API access',
  ],
};

export const SignupPage = () => {
  const [step, setStep] = useState<'plan' | 'details'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Store selected plan in localStorage before signup
      if (selectedPlan !== 'free') {
        localStorage.setItem('pending_plan', selectedPlan);
      }

      // Create account with signUp from AuthContext
      await signUp(email, password, fullName);
      
      // If email verification is required, user will be redirected to verify email
      // The selected plan is stored and will be processed after login
      
      // If no email verification required (auto-confirm), process immediately
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email_confirmed_at) {
        // Email already confirmed, process checkout immediately
        if (selectedPlan === 'free') {
          localStorage.removeItem('pending_plan');
          navigate('/app/dashboard');
        } else {
          // Create Stripe checkout session
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            'stripe-checkout',
            {
              body: {
                plan: selectedPlan,
                user_id: user.id,
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
        }
      }
      // If user exists but email not confirmed, they'll be redirected by AuthContext
      // and pending_plan will be processed after they verify and login
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  // Step 1: Plan Selection
  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <Logo variant="full" size="md" onClick={() => navigate('/')} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
                Choose Your Plan
              </h1>
              <p className="text-gray-600">
                Select the plan that fits your needs. You can change it later.
              </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(['free', 'pro', 'pro_plus'] as PlanType[]).map((plan) => (
                <button
                  key={plan}
                  onClick={() => handlePlanSelect(plan)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left bg-white hover:border-gold hover:shadow-lg ${
                    plan === 'pro' ? 'border-gold shadow-lg' : 'border-gray-200'
                  }`}
                >
                  {plan === 'pro' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  {/* Plan Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-serif font-bold mb-1">
                      {PLAN_PRICING[plan].name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold">${PLAN_PRICING[plan].price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {PLAN_PRICING[plan].description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {planFeatures[plan].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className={`text-sm font-medium text-center ${
                      plan === 'pro' ? 'text-gold' : 'text-gray-600'
                    }`}>
                      Select {PLAN_PRICING[plan].name}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Already have account */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-gold hover:text-yellow-600 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Account Details
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo 
              variant="full" 
              size="lg"
              onClick={() => navigate('/')}
            />
          </div>
          
          {/* Back button and selected plan indicator */}
          <button
            onClick={() => setStep('plan')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} />
            Change plan
          </button>
          
          <div className="inline-block bg-gold/10 border border-gold/30 rounded-lg px-4 py-2 mb-4">
            <div className="text-xs text-gray-600 mb-0.5">Selected Plan</div>
            <div className="font-serif font-bold text-lg">
              {PLAN_PRICING[selectedPlan].name} - ${PLAN_PRICING[selectedPlan].price}/mo
            </div>
          </div>

          <h1 className="text-3xl font-serif font-bold mb-2">Create Your Account</h1>
          <p className="text-gray-600">Just a few details to get started</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-600 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 
                selectedPlan === 'free' ? 'Create Free Account' : 
                `Continue to Payment • $${PLAN_PRICING[selectedPlan].price}/mo`
              }
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-gold hover:text-yellow-600 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            By signing up, you agree to our{' '}
            <Link to="/terms-of-service" className="text-gold hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-gold hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};