/**
 * PLAN LIMITS CONFIGURATION
 * 
 * Defines feature access and usage limits for each subscription tier.
 * Used for both frontend UI gating and backend enforcement.
 */

export interface PlanFeatures {
  emails_per_month: number; // -1 = unlimited
  max_contacts: number; // -1 = unlimited
  max_groups: number; // -1 = unlimited
  custom_templates: boolean;
  merge_tags: boolean;
  automations: boolean;
  custom_domain: boolean;
  api_access: boolean;
  ab_testing: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
}

export const PLAN_LIMITS: Record<'free' | 'pro' | 'pro_plus', PlanFeatures> = {
  free: {
    emails_per_month: 500,
    max_contacts: 500,
    max_groups: 1,
    custom_templates: false,
    merge_tags: false,
    automations: false,
    custom_domain: false,
    api_access: false,
    ab_testing: false,
    advanced_analytics: false,
    priority_support: false,
  },
  pro: {
    emails_per_month: 25000,
    max_contacts: 5000,
    max_groups: 10,
    custom_templates: true,
    merge_tags: false,
    automations: false,
    custom_domain: true,
    api_access: false,
    ab_testing: true,
    advanced_analytics: true,
    priority_support: true,
  },
  pro_plus: {
    emails_per_month: -1, // unlimited
    max_contacts: -1, // unlimited
    max_groups: -1, // unlimited
    custom_templates: true,
    merge_tags: true,
    automations: true,
    custom_domain: true,
    api_access: true,
    ab_testing: true,
    advanced_analytics: true,
    priority_support: true,
  }
};

/**
 * Plan pricing information
 */
export const PLAN_PRICING = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
  },
  pro: {
    name: 'Pro',
    price: 29,
    description: 'For growing businesses',
  },
  pro_plus: {
    name: 'Pro Plus',
    price: 99,
    description: 'For scaling companies',
  }
} as const;

/**
 * Get minimum plan required for a specific feature
 */
export function getMinimumPlanForFeature(feature: keyof PlanFeatures): 'pro' | 'pro_plus' {
  if (PLAN_LIMITS.pro[feature]) {
    return 'pro';
  }
  return 'pro_plus';
}

/**
 * Check if a plan has access to a feature
 */
export function planHasFeature(plan: 'free' | 'pro' | 'pro_plus', feature: keyof PlanFeatures): boolean {
  const limit = PLAN_LIMITS[plan][feature];
  return typeof limit === 'boolean' ? limit : limit !== 0;
}

/**
 * Get human-readable plan name
 */
export function getPlanDisplayName(plan: 'free' | 'pro' | 'pro_plus'): string {
  return PLAN_PRICING[plan].name;
}
