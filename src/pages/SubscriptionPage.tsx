import { Link, Navigate } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { PLAN_PRICING } from '../config/planLimits';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export default function SubscriptionPage() {
  const { user, profile, loading, hasAccess, signOut } = useAuth();
  const { admin } = useAdminAuth();
  const checkout = useStripeCheckout();
  if (loading) return <p role="status" className="p-12 text-center">Loading your account...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (hasAccess) return <Navigate to="/app/dashboard" replace />;
  return <div className="min-h-screen bg-gray-50 px-4 py-10">
    <div className="max-w-4xl mx-auto"><div className="flex justify-center mb-8"><Logo size="lg" /></div>
      <div className="text-center mb-8"><h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Choose Your Subscription</h1>
        <p className="text-gray-600">{profile?.account_suspended?'Your account is suspended. Contact support to restore access.':'A paid subscription is required to use Email Wizard.'}</p><p className="text-sm text-gray-500 mt-2">{user.email}</p>
      </div>
      {checkout.error && <p role="alert" className="card mb-6 text-red-700">{checkout.error}</p>}
      {!profile?.account_suspended && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{(['pro','pro_plus'] as const).map(plan=><section key={plan} className={`card ${plan==='pro'?'ring-2 ring-gold':''}`}>
        <Crown size={24} className="text-gold mb-4" /><h2 className="text-2xl font-serif font-bold">{PLAN_PRICING[plan].name}</h2><p className="text-gray-600 my-2">{PLAN_PRICING[plan].description}</p><p className="my-5"><span className="text-4xl font-serif font-bold">${PLAN_PRICING[plan].price}</span><span className="text-gray-600">/month</span></p>
        <ul className="space-y-3 my-6">{(plan==='pro'?['25,000 emails per month','Up to 5,000 contacts','Advanced analytics and scheduling']:['Unlimited emails and contacts','Automations and API access','All templates and personalization']).map(feature=><li className="flex gap-2 text-sm" key={feature}><Check size={16} className="text-gold shrink-0" />{feature}</li>)}</ul>
        <Button fullWidth disabled={checkout.loading} loading={checkout.loading} onClick={()=>{localStorage.setItem('pending_plan',plan);void checkout.createCheckoutSession(plan);}}>Subscribe to {PLAN_PRICING[plan].name}</Button>
      </section>)}</div>}
      <div className="mt-8 text-center flex flex-wrap justify-center gap-5 text-sm"><Link className="text-purple hover:underline" to="/app/settings">Account & billing</Link>{admin&&<Link className="text-purple hover:underline" to="/admin/dashboard">Admin dashboard</Link>}<button className="text-gray-600 hover:underline" onClick={()=>void signOut()}>Sign out</button></div>
    </div>
  </div>;
}
