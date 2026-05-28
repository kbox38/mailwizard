import { User, Globe, CreditCard, Shield } from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useStripeCheckout } from '../../hooks/useStripeCheckout';
import { useStripePortal } from '../../hooks/useStripePortal';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import DomainsContent from '../../components/settings/DomainsContent';
import SecurityContent from '../../components/settings/SecurityContent';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'domains', label: 'Sending Domains', icon: Globe },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
];

export const Settings = () => {
  const { profile, setProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const { createCheckoutSession, loading: checkoutLoading } = useStripeCheckout();
  const { openPortal, loading: portalLoading, error: portalError } = useStripePortal();
  const { currentPlan } = usePlanLimits();
  
  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [saving, setSaving] = useState(false);

  const handleUpgrade = (plan: 'pro' | 'pro_plus') => {
    createCheckoutSession(plan);
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Show success message
      toast.success('Profile updated successfully!');
      
      // Refresh profile data to show updated values
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedProfile && setProfile) {
        setProfile(updatedProfile);
        // Update local state to match
        setFullName(updatedProfile.full_name || '');
        setCompanyName(updatedProfile.company_name || '');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout currentPath="/app/settings">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>

        <div className="flex gap-8">
          <div className="w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-250 ${
                      activeTab === tab.id
                        ? 'bg-gold text-black font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="card max-w-2xl">
                <h2 className="text-xl font-serif font-bold mb-6">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input
                    type="text"
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                  <Input
                    type="email"
                    label="Email"
                    value={profile?.email || ''}
                    disabled
                  />
                  <Input
                    type="text"
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company"
                  />
                  <div className="pt-4">
                    <Button 
                      type="submit"
                      variant="primary" 
                      size="md"
                      loading={saving}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'domains' && <DomainsContent />}

            {activeTab === 'billing' && (
              <div className="card max-w-2xl">
                <h2 className="text-xl font-serif font-bold mb-6">Billing & Subscription</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                      <p className="text-2xl font-serif font-bold">
                        {profile?.plan_type.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    {profile?.plan_type === 'free' && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpgrade('pro')}
                          loading={checkoutLoading}
                        >
                          Upgrade to Pro
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpgrade('pro_plus')}
                          loading={checkoutLoading}
                        >
                          Upgrade to Pro Plus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {profile?.plan_type !== 'free' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Subscription Details</h3>
                      <p className="text-sm text-gray-600">
                        Your {profile?.plan_type.replace('_', ' ')} subscription is active.
                      </p>
                    </div>
                    
                    {portalError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {portalError}
                      </div>
                    )}
                    
                    <Button 
                      variant="secondary" 
                      size="md"
                      onClick={openPortal}
                      loading={portalLoading}
                      disabled={portalLoading}
                    >
                      {portalLoading ? 'Opening Portal...' : 'Manage Subscription'}
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && <SecurityContent />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};