import { Lock, Zap, Plus } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const Automations = () => {
  const { profile } = useAuth();
  const isLocked = profile?.plan_type !== 'pro_plus';

  if (isLocked) {
    return (
      <AppLayout currentPath="/app/automations">
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-block p-6 bg-purple/10 rounded-full mb-6">
              <Lock size={48} className="text-purple" />
            </div>
            <h1 className="text-4xl font-serif font-bold mb-4">Unlock Marketing Automations</h1>
            <p className="text-xl text-gray-600 mb-8">
              Create powerful automated email journeys with visual workflows, triggers, and
              conditional logic. Available on Pro Plus plan.
            </p>
            <div className="card mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-3">Automation features include:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Zap size={20} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Visual journey builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={20} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Multiple trigger types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={20} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Time delays and conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap size={20} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>A/B testing in workflows</span>
                </li>
              </ul>
            </div>
            <Button variant="primary" size="lg">
              Upgrade to Pro Plus
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPath="/app/automations">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Automations</h1>
            <p className="text-gray-600">Build automated email journeys.</p>
          </div>
          <Button variant="primary" size="md" icon={Plus}>
            Create Automation
          </Button>
        </div>

        <div className="text-center py-20">
          <Zap size={48} className="text-gold mx-auto mb-4" />
          <p className="text-gray-600">No automations yet. Create your first automation to get started.</p>
        </div>
      </div>
    </AppLayout>
  );
};
