export type PaidPlan = 'pro' | 'pro_plus';
export type AccountPlan = 'none' | PaidPlan;
export interface AccessProfile {
  plan_type: string;
  subscription_status: string;
  admin_plan_override?: string | null;
  account_suspended?: boolean;
}
export function effectivePlan(profile: AccessProfile | null | undefined): AccountPlan {
  const value = profile?.admin_plan_override ?? profile?.plan_type;
  return value === 'pro' || value === 'pro_plus' ? value : 'none';
}
export function hasPaidAccess(profile: AccessProfile | null | undefined): boolean {
  if (!profile || profile.account_suspended || effectivePlan(profile) === 'none') return false;
  return profile.admin_plan_override === 'pro' || profile.admin_plan_override === 'pro_plus'
    || ['active', 'trialing'].includes(profile.subscription_status);
}
