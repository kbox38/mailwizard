import { Check } from 'lucide-react';
import { Button } from '../ui/Button';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for getting started',
    features: [
      '500 emails per month',
      'Up to 500 contacts',
      'Basic email templates',
      'Shared sending domain',
      'Basic analytics',
      'Email support',
    ],
    limitations: [
      'No custom templates',
      'No merge tags',
      'No automations',
    ],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'For growing businesses',
    features: [
      '25,000 emails per month',
      'Up to 5,000 contacts',
      'All templates unlocked',
      'Custom or shared domain',
      'Advanced analytics',
      'A/B testing',
      'Campaign scheduling',
      'Priority support',
    ],
    limitations: [
      'No automations',
      'No API access',
    ],
    cta: 'Start Pro Trial',
    featured: true,
  },
  {
    name: 'Pro Plus',
    price: '99',
    description: 'For scaling companies',
    features: [
      'Unlimited emails',
      'Unlimited contacts',
      'All templates + custom',
      'Custom domain required',
      'Full analytics suite',
      'Marketing automations',
      'Advanced segmentation',
      'Merge tag personalization',
      'API access',
      'Dedicated support',
    ],
    limitations: [],
    cta: 'Start Pro Plus Trial',
    featured: false,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-700">
            Choose the plan that fits your business. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card relative ${
                plan.featured
                  ? 'ring-2 ring-gold shadow-xl scale-105'
                  : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black text-sm font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-serif font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-serif font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <Button
                variant={plan.featured ? 'primary' : 'secondary'}
                size="md"
                fullWidth
                className="mb-6"
              >
                {plan.cta}
              </Button>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check size={20} className="text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.limitations.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Not included:</p>
                  {plan.limitations.map((limitation, index) => (
                    <p key={index} className="text-xs text-gray-500 mb-1">
                      • {limitation}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 mt-12">
          All plans include SSL encryption, GDPR compliance, and our commitment to your success.
        </p>
      </div>
    </section>
  );
};
