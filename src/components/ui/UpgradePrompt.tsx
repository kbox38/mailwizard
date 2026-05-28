import { Crown } from 'lucide-react';
import { Button } from './Button';

interface UpgradePromptProps {
  feature: string;
  plan: 'pro' | 'pro_plus';
  description?: string;
}

export const UpgradePrompt = ({ feature, plan, description }: UpgradePromptProps) => {
  const planName = plan === 'pro_plus' ? 'Pro Plus' : 'Pro';
  const planPrice = plan === 'pro_plus' ? '$99' : '$29';

  return (
    <div className="card max-w-md mx-auto text-center border-2 border-gold">
      <div className="inline-block p-4 bg-gold/10 rounded-full mb-4">
        <Crown size={32} className="text-gold" />
      </div>
      <h3 className="text-xl font-serif font-bold mb-2">Unlock {feature}</h3>
      <p className="text-gray-600 mb-4">
        {description || `This feature is available on the ${planName} plan.`}
      </p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">{planName} Plan</p>
        <p className="text-2xl font-serif font-bold mb-1">{planPrice}/month</p>
        <p className="text-xs text-gray-600">Cancel anytime</p>
      </div>
      <Button variant="primary" size="lg" fullWidth icon={Crown}>
        Upgrade to {planName}
      </Button>
    </div>
  );
};
