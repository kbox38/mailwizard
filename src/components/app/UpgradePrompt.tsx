/**
 * UPGRADE PROMPT COMPONENT
 * 
 * Modal/card that prompts users to upgrade when they attempt to access
 * features that are not available on their current plan.
 */

import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { getPlanDisplayName } from '../../config/planLimits';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'pro' | 'pro_plus';
  description?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredPlan,
  description,
  isModal = false,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/app/settings?tab=billing');
    onClose?.();
  };

  const content = (
    <div className="relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold/10 rounded-lg">
            <Sparkles className="text-gold" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold">Upgrade to unlock {feature}</h3>
            <p className="text-sm text-gray-600">
              This feature requires {getPlanDisplayName(requiredPlan)} plan
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-700 mb-6">
          {description}
        </p>
      )}

      {/* Plan Comparison */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold mb-3">
          {getPlanDisplayName(requiredPlan)} includes:
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {requiredPlan === 'pro' ? (
            <>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                25,000 emails per month
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Up to 5,000 contacts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Custom templates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                A/B testing & scheduling
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Advanced analytics
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Unlimited emails & contacts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Marketing automations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Merge tag personalization
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                API access
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                Dedicated support
              </li>
            </>
          )}
        </ul>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={handleUpgrade}
          className="flex-1"
        >
          Upgrade Now
          <ArrowRight size={16} className="ml-2" />
        </Button>
        {isModal && onClose && (
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <>
        {/* Modal Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            {content}
          </div>
        </div>
      </>
    );
  }

  // Card version (inline)
  return (
    <div className="bg-white border-2 border-gold/30 rounded-xl shadow-lg p-6">
      {content}
    </div>
  );
};
